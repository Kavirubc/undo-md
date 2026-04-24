"""MCP tool-list extractor for the forward-inverse coverage audit.

For each server in `servers.yaml`, this script clones the repo at the pinned
commit, walks the source tree, and extracts the tool registrations it can
detect with simple static patterns. The output is a seed CSV with one row per
extracted tool; the human auditor then fills in the classification columns
using the rubric.

This does NOT classify tools itself. All semantic judgements belong to the
auditor. The script's only job is to shrink the transcription workload.

Supported tool-declaration patterns (covers the common cases):

    TypeScript / JavaScript:
        server.registerTool({ name: "create_issue", ... })
        server.addTool({ name: "upload_file", ... })
        server.tool("delete_file", ..., async (...) => {...})

    Python:
        @mcp.tool()
        def create_issue(...): ...
        @server.tool(name="delete_file")
        def ...: ...

Tools declared via code generation or dynamic registration will be missed;
the rubric says "read the main server file end-to-end" for those. The script
flags repos where <3 tools were auto-detected so the auditor knows to do a
manual pass.

Usage:
    pip install PyYAML
    python extract.py servers.yaml --out seed.csv
"""
from __future__ import annotations
import argparse
import csv
import pathlib
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from typing import Iterable

try:
    import yaml
except ImportError:
    print("install PyYAML first: pip install PyYAML", file=sys.stderr)
    sys.exit(1)


# --------------------------------------------------------------------------- #
# Tool-declaration patterns
# --------------------------------------------------------------------------- #

# TS/JS: server.registerTool / server.addTool / server.tool
# Captures both positional form   `server.registerTool("name", {...}, handler)`
# and object form                  `server.registerTool({ name: "name", ... })`.
TS_PATTERNS = [
    # Positional: `registerTool("name"`  /  `addTool("name"`  /  `tool("name"`
    re.compile(r"""\b(?:registerTool|addTool|tool)\s*\(\s*["']([a-zA-Z0-9_\-]+)["']"""),
    # Object form: `{...name: "name"...}` passed to registerTool/addTool
    re.compile(r"""(?:registerTool|addTool)\s*\(\s*\{\s*(?:[^{}]|\{[^{}]*\})*?name\s*:\s*["']([a-zA-Z0-9_\-]+)["']""", re.DOTALL),
    # Older pattern: CallToolRequestSchema dispatch by name
    re.compile(r"""name\s*===\s*["']([a-zA-Z0-9_\-]+)["']"""),
]

# Python: @mcp.tool() or @server.tool(name=...) followed by `def name(...)`
PY_DECORATOR_RE = re.compile(
    r"""@\s*(?:[a-zA-Z_][a-zA-Z_0-9]*\.)?tool\s*\([^)]*\)\s*\n\s*def\s+([a-zA-Z_][a-zA-Z_0-9]*)""",
    re.MULTILINE,
)
# @server.tool(name="explicit_name")
PY_EXPLICIT_NAME_RE = re.compile(
    r"""@\s*(?:[a-zA-Z_][a-zA-Z_0-9]*\.)?tool\s*\(\s*(?:[^)]*?\bname\s*=\s*["']([a-zA-Z0-9_\-]+)["'])"""
)

SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".mjs", ".py"}
IGNORE_DIRS = {"node_modules", "dist", "build", ".git", "__pycache__", ".venv", "venv", "target"}


# --------------------------------------------------------------------------- #
# Verb classification (seed only — the auditor may override)
# --------------------------------------------------------------------------- #

VERB_PREFIXES = {
    "create": ("create_", "new_", "add_", "register_", "provision_", "insert_", "upload_", "post_"),
    "update": ("update_", "edit_", "modify_", "set_", "patch_", "configure_"),
    "delete": ("delete_", "remove_", "destroy_", "deprovision_", "purge_", "unregister_", "uninstall_"),
    "send":   ("send_", "notify_", "publish_", "broadcast_", "email_", "dispatch_"),
    "read":   ("read_", "list_", "get_", "search_", "query_", "fetch_", "describe_", "find_", "view_", "show_"),
}


def classify_verb(tool_name: str) -> str:
    """Best-effort verb class from the tool name. The auditor may override."""
    norm = tool_name.lower().replace("-", "_")
    # Collapse common MCP conventions: createX / CreateX -> create_x
    snake = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", norm).lower()
    for cls, prefixes in VERB_PREFIXES.items():
        if any(snake.startswith(p) for p in prefixes):
            return cls
    return "other"


def seed_mutates_state(verb_class: str) -> str:
    """Seed guess only. Auditor confirms against the rubric."""
    if verb_class == "read":
        return "no"
    if verb_class in {"create", "update", "delete", "send"}:
        return "yes"
    return "?"


# --------------------------------------------------------------------------- #
# Extraction
# --------------------------------------------------------------------------- #

@dataclass
class Tool:
    server_id: str
    server_name: str
    tool_name: str
    file_path: str
    verb_class_seed: str
    mutates_state_seed: str


def extract_from_file(path: pathlib.Path) -> list[str]:
    try:
        text = path.read_text(errors="ignore")
    except Exception:  # noqa: BLE001
        return []
    hits: set[str] = set()
    if path.suffix in {".ts", ".tsx", ".js", ".mjs"}:
        for pat in TS_PATTERNS:
            hits.update(m.group(1) for m in pat.finditer(text))
    elif path.suffix == ".py":
        # Prefer explicit name if present; fall back to the decorated fn name.
        explicit = {m.group(1) for m in PY_EXPLICIT_NAME_RE.finditer(text)}
        decorated = {m.group(1) for m in PY_DECORATOR_RE.finditer(text)}
        hits.update(explicit)
        # Only add decorated names when the decorator didn't specify `name=`.
        # We accept both; auditor will dedupe based on the final surface.
        hits.update(decorated)
    return sorted(hits)


def walk_repo(root: pathlib.Path) -> Iterable[pathlib.Path]:
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix not in SOURCE_SUFFIXES:
            continue
        parts = set(p.parts)
        if parts & IGNORE_DIRS:
            continue
        yield p


def clone(url: str, sha: str | None, dest: pathlib.Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    # Shallow clone is fine if we don't need a specific SHA.
    subprocess.run(
        ["git", "clone", "--depth", "50", "--quiet", url, str(dest)],
        check=True,
    )
    if sha:
        subprocess.run(
            ["git", "-C", str(dest), "checkout", "--quiet", sha],
            check=True,
        )


def resolve_subpath(root: pathlib.Path, subpath: str | None) -> pathlib.Path:
    if subpath is None:
        return root
    sub = root / subpath
    if not sub.exists():
        print(f"  warn: subpath {subpath!r} not found; falling back to repo root", file=sys.stderr)
        return root
    return sub


# --------------------------------------------------------------------------- #
# Driver
# --------------------------------------------------------------------------- #

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("servers_yaml", type=pathlib.Path)
    ap.add_argument("--out", type=pathlib.Path, default=pathlib.Path("seed.csv"))
    ap.add_argument("--workdir", type=pathlib.Path, default=pathlib.Path("./_audit_checkouts"))
    args = ap.parse_args()

    with open(args.servers_yaml) as f:
        servers = yaml.safe_load(f)

    args.workdir.mkdir(parents=True, exist_ok=True)

    all_tools: list[Tool] = []
    low_detection_warnings: list[str] = []

    for entry in servers["servers"]:
        sid = entry["id"]
        name = entry["name"]
        url = entry["url"]
        sha = entry.get("sha")
        subpath = entry.get("subpath")
        print(f"[{sid}] {name}: cloning...")
        dest = args.workdir / sid
        try:
            clone(url, sha, dest)
        except subprocess.CalledProcessError as e:
            print(f"  !! clone failed: {e}", file=sys.stderr)
            continue

        scan_root = resolve_subpath(dest, subpath)
        tools_in_server: set[str] = set()
        for f in walk_repo(scan_root):
            for tn in extract_from_file(f):
                tools_in_server.add(tn)

        if len(tools_in_server) < 3:
            low_detection_warnings.append(f"{sid} ({len(tools_in_server)} tools)")

        for tn in sorted(tools_in_server):
            vc = classify_verb(tn)
            all_tools.append(Tool(
                server_id=sid, server_name=name,
                tool_name=tn, file_path=str(scan_root.relative_to(dest)),
                verb_class_seed=vc,
                mutates_state_seed=seed_mutates_state(vc),
            ))
        print(f"  found {len(tools_in_server)} tools")

    # Write seed CSV. Seeds go in <col>_seed columns; auditor fills the
    # authoritative columns (without the suffix) and the rubric columns.
    fields = [
        "server_id", "server_name", "tool_name",
        "file_path",
        # seeds (overwritten by auditor if wrong)
        "verb_class_seed", "mutates_state_seed",
        # auditor-completed columns
        "verb_class", "mutates_state",
        "semantically_irreversible",
        "inverse_tool", "inverse_type", "scope_gated",
        "notes",
    ]
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for t in all_tools:
            w.writerow({
                "server_id": t.server_id,
                "server_name": t.server_name,
                "tool_name": t.tool_name,
                "file_path": t.file_path,
                "verb_class_seed": t.verb_class_seed,
                "mutates_state_seed": t.mutates_state_seed,
            })

    print()
    print(f"wrote {len(all_tools)} tool rows to {args.out}")
    if low_detection_warnings:
        print()
        print("SERVERS THAT NEED A MANUAL READ (fewer than 3 tools auto-detected):")
        for w in low_detection_warnings:
            print(f"  - {w}")
        print("For these, read the main server file end-to-end and add rows by hand.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
