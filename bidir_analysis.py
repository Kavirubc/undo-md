#!/usr/bin/env python3
"""
bidir_analysis.py — Bidirectional tool-pair analysis.

For every mutating tool A that names an inverse_tool B, check whether B
also names A as its inverse.  Reports:
  - N bidirectional pairs (A→B and B→A)
  - N unidirectional pairs (A→B but B does not name A back)
  - Asymmetries: cases where A says inverse=B but B says inverse=C≠A
  - Summary per server and per verb-class

Outputs:
  bidir_report.md
"""

import csv
import sys
from collections import defaultdict

INPUT  = 'audit.csv'
OUTPUT = 'bidir_report.md'


def load(path: str) -> list[dict]:
    with open(path, newline='') as f:
        return list(csv.DictReader(f))


def main():
    rows = load(INPUT)

    # Index: (server_id, tool_name) → row
    idx: dict[tuple[str, str], dict] = {}
    for r in rows:
        idx[(r['server_id'], r['tool_name'])] = r

    # Gather all claimed inverse edges from mutating tools
    edges: list[tuple[str, str, str]] = []   # (server_id, tool_a, tool_b)
    for r in rows:
        if r['mutates_state'] != 'yes':
            continue
        inv = r['inverse_tool'].strip()
        if not inv:
            continue
        edges.append((r['server_id'], r['tool_name'], inv))

    # Classify each edge
    bidir       = []   # A→B and B→A both declared
    unidir      = []   # A→B declared; B exists but does not name A back
    asymmetric  = []   # A→B declared; B exists and names C≠A as its inverse
    dangling    = []   # A→B declared; B not found in the index

    for sid, a, b in edges:
        key_b = (sid, b)
        if key_b not in idx:
            dangling.append((sid, a, b))
            continue
        row_b = idx[key_b]
        inv_b = row_b['inverse_tool'].strip()
        if inv_b == a:
            bidir.append((sid, a, b))
        elif inv_b and inv_b != a:
            asymmetric.append((sid, a, b, inv_b))
        else:
            unidir.append((sid, a, b))

    total_edges = len(edges)
    n_bidir      = len(bidir)
    n_unidir     = len(unidir)
    n_asymmetric = len(asymmetric)
    n_dangling   = len(dangling)

    # ── Per-server breakdown ────────────────────────────────────────────────
    server_stats: dict[str, dict] = defaultdict(lambda: dict(
        bidir=0, unidir=0, asymmetric=0, dangling=0))
    for sid, a, b in bidir:
        server_stats[sid]['bidir'] += 1
    for sid, a, b in unidir:
        server_stats[sid]['unidir'] += 1
    for sid, a, b, c in asymmetric:
        server_stats[sid]['asymmetric'] += 1
    for sid, a, b in dangling:
        server_stats[sid]['dangling'] += 1

    # ── Per-verb-class breakdown ────────────────────────────────────────────
    vc_stats: dict[str, dict] = defaultdict(lambda: dict(bidir=0, unidir=0))
    for sid, a, b in bidir:
        vc = idx[(sid, a)]['verb_class']
        vc_stats[vc]['bidir'] += 1
    for sid, a, b in unidir:
        vc = idx[(sid, a)]['verb_class']
        vc_stats[vc]['unidir'] += 1

    # ── stdout ───────────────────────────────────────────────────────────────
    print(f"Bidirectional analysis over {total_edges} inverse-tool declarations\n")
    print(f"  Bidirectional (A→B and B→A):   {n_bidir}")
    print(f"  Unidirectional (A→B, B silent): {n_unidir}")
    print(f"  Asymmetric (A→B, B→C≠A):       {n_asymmetric}")
    print(f"  Dangling (B not in server):     {n_dangling}")

    if asymmetric:
        print("\nAsymmetric cases:")
        for sid, a, b, c in asymmetric:
            print(f"  [{sid}]  {a} → {b}  but  {b} → {c}")

    # ── Markdown report ───────────────────────────────────────────────────────
    lines = []
    w = lines.append

    w("# Bidirectional Tool-Pair Analysis\n")
    w(f"Source: `{INPUT}` — {total_edges} inverse-tool declarations across "
      f"{len({sid for sid,_,_ in edges})} servers.\n")

    w("## Summary\n")
    w("| Category | N | % of declarations |")
    w("|---|---|---|")
    def pct(n): return f"{n/total_edges:.1%}" if total_edges else "—"
    w(f"| Bidirectional (A→B **and** B→A) | {n_bidir} | {pct(n_bidir)} |")
    w(f"| Unidirectional (A→B, B silent) | {n_unidir} | {pct(n_unidir)} |")
    w(f"| Asymmetric (A→B, B→C≠A) | {n_asymmetric} | {pct(n_asymmetric)} |")
    w(f"| Dangling (B not found in server) | {n_dangling} | {pct(n_dangling)} |")
    w(f"| **Total** | **{total_edges}** | 100% |")
    w("")

    bidir_rate = n_bidir / total_edges if total_edges else 0
    w(f"**Bidirectionality rate: {bidir_rate:.1%}** of declared inverse relationships "
      f"are reciprocally declared by the target tool.\n")

    w("## Per-Server Breakdown\n")
    w("| Server | Bidir | Unidir | Asymm | Dangling |")
    w("|---|---|---|---|---|")
    for sid in sorted(server_stats):
        ss = server_stats[sid]
        w(f"| {sid} | {ss['bidir']} | {ss['unidir']} | "
          f"{ss['asymmetric']} | {ss['dangling']} |")
    w("")

    w("## Per-Verb-Class Breakdown\n")
    w("| Verb class | Bidir | Unidir |")
    w("|---|---|---|")
    for vc in ['create', 'update', 'delete', 'send', 'other']:
        vs = vc_stats.get(vc, {})
        b = vs.get('bidir', 0)
        u = vs.get('unidir', 0)
        if b + u == 0:
            continue
        w(f"| {vc} | {b} | {u} |")
    w("")

    if asymmetric:
        w("## Asymmetric Pairs\n")
        w("A claims B as its inverse, but B names a different tool C.\n")
        w("| Server | Tool A | Tool B (claimed) | Tool C (B's declared inverse) |")
        w("|---|---|---|---|")
        for sid, a, b, c in asymmetric:
            w(f"| {sid} | {a} | {b} | {c} |")
        w("")

    if bidir:
        w("## Bidirectional Pairs (complete list)\n")
        w("| Server | Tool A | Tool B |")
        w("|---|---|---|")
        seen = set()
        for sid, a, b in bidir:
            key = (sid, min(a, b), max(a, b))
            if key not in seen:
                seen.add(key)
                w(f"| {sid} | {a} | {b} |")
        w("")

    w("## Notes\n")
    w("- A 'bidirectional' pair requires both A→B **and** B→A in the `inverse_tool` column.\n")
    w("- Only state-mutating tools with a non-blank `inverse_tool` field are analysed.\n")
    w("- A 'dangling' edge means the named inverse does not appear as a tool in the same server.\n")

    with open(OUTPUT, 'w') as f:
        f.write("\n".join(lines))
    print(f"\n→ {OUTPUT} written")


if __name__ == '__main__':
    main()
