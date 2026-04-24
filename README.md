# mcp-reversibility-audit

Supplementary material for:

> **Undo.md: Benchmarking and Closing the Reversibility Gap in Agent Skills**
> Agent Skills Workshop, ICSE 2026 (non-archival)

This repository contains the full audit dataset, classification rubric, extraction and analysis scripts, and per-server commit provenance used to produce the empirical results in Section 4 of the paper.

---

## Overview

We audited 30 production Model Context Protocol (MCP) servers across three source buckets — official reference servers, top community servers, and enterprise-vendor servers — and classified every exposed tool by whether it mutates durable state and, if so, whether a same-server inverse exists. The audit covers 478 tools, of which 237 are state-mutating.

**Headline results:**

| Metric | Value |
|---|---|
| Total tools surveyed | 478 |
| State-mutating tools | 237 |
| Semantically irreversible (expected absent) | 22 |
| Same-server inverse: Exact | 50 (21%) |
| Same-server inverse: Partial / Lossy | 88 (37%) |
| Same-server inverse: Absent | 77 (33%) |
| Scope-gated inverses | 0 |
| Raw coverage | 58.2% |
| Structural coverage | 64.2% |

Coverage by bucket:

| Bucket | N\_mut | Structural Coverage |
|---|---|---|
| Official reference | 46 | 46.2% |
| Community | 97 | 78.2% |
| Enterprise | 94 | 58.4% |

---

## Repository Structure

```
servers.yaml        Server registry: 30 MCP servers with URLs and subpaths.
                    SHA fields should be pinned to the commit audited before
                    publication (see Reproducibility below).

RUBRIC.md           Human annotation rubric. Defines the six classification
                    columns, their allowed values, decision rules for borderline
                    cases, and the inter-rater protocol.

extract.py          Static extraction script. Clones each server listed in
                    servers.yaml, walks the source for tool-registration
                    patterns, and writes seed.csv. Requires PyYAML.

audit.csv           Primary artifact. 478 rows, one per tool. Each row carries
                    the full classification (verb_class, mutates_state,
                    semantically_irreversible, inverse_tool, inverse_type,
                    scope_gated, notes).

analyze.py          Analysis script. Reads audit.csv and writes report.md
                    containing the headline table, per-bucket breakdown,
                    verb-class cross-tabulation, and per-server summary.

report.md           Generated output of analyze.py against the current audit.csv.

MCP_SERVERS.md      Extended notes on the 30 servers: why each was selected,
                    bucket assignment, and any manual supplementation performed
                    during extraction.
```

---

## Audit Schema

`audit.csv` columns:

| Column | Values | Description |
|---|---|---|
| `server_id` | string | Stable identifier matching `servers.yaml` |
| `server_name` | string | Human-readable server name |
| `tool_name` | string | Tool name as registered in the server |
| `file_path` | string | Source subpath where the tool was located |
| `verb_class` | create / update / delete / send / read / other | Dominant verb inferred from name and description |
| `mutates_state` | yes / no | Whether the tool produces durable side effects |
| `semantically_irreversible` | yes / (blank) | External side effects that cannot be programmatically recalled |
| `inverse_tool` | string | Name of the same-server inverse, if any |
| `inverse_type` | exact / partial / absent / (blank) | Quality of the inverse |
| `scope_gated` | yes / no / unknown / (blank) | Whether inverse requires a stricter permission scope |
| `notes` | string | Justification for borderline calls; sampling notes |

Full definitions and decision rules are in `RUBRIC.md`.

---

## Reproducing the Results

**Step 1 — Extract**

```bash
pip install PyYAML
python extract.py servers.yaml --out seed.csv --workdir _audit_checkouts
```

This clones all 30 servers and writes `seed.csv`. Servers whose subpaths were not auto-detected by the extractor are listed at the end of the run under `SERVERS THAT NEED A MANUAL READ`. Those rows were added by hand; see `MCP_SERVERS.md` for the per-server notes.

**Step 2 — Inspect audit.csv**

`audit.csv` is the human-completed classification. It supersedes `seed.csv`. To verify any individual classification, locate the tool in the source at the commit recorded in `servers.yaml` and apply `RUBRIC.md`.

**Step 3 — Analyse**

```bash
python analyze.py audit.csv --out report.md
```

Produces `report.md` with all tables from Section 4 of the paper.

---

## Sampling Policy

Servers with more than 50 tools were sampled to 20 tools. Sampled rows carry the token `sampled` in the `notes` column. Servers affected:

- `com-terraform` (31 tools total, 20 sampled)
- `com-atlassian` (70 tools total, 20 sampled)
- `com-playwright` (65 tools total, 20 sampled)
- `ent-grafana` (80+ tools total, 20 sampled)

Sampling was stratified by verb class to preserve the distribution of mutation types.

---

## Reproducibility and Commit Provenance

The `sha` fields in `servers.yaml` record the exact commit each server was audited against. Classifications are valid only at those commits. If a field is `null`, the server was audited from the HEAD of the default branch at the time of data collection (April 2026) and should be pinned before archival.

Seven official reference servers (`ref-github`, `ref-gitlab`, `ref-postgres`, `ref-sqlite`, `ref-slack`, `ref-gdrive`, `ref-sentry`) have been archived from their original monorepo location (`modelcontextprotocol/servers`) to `modelcontextprotocol/servers-archived`. Their tool lists were reconstructed from the archived repository documentation. This is noted in the `file_path` column (`[archived]`) and in `MCP_SERVERS.md`.

The Stripe MCP server (`ent-stripe`) delivers tools from a cloud endpoint (`mcp.stripe.com`). The agent toolkit repository contains no local tool definitions. Tool classifications were derived from the Stripe MCP public API documentation at the time of audit and are noted accordingly.

---

## Inter-Rater Agreement

A second independent annotator classified a random sample of 10 state-mutating tools from 3 randomly selected servers using only `RUBRIC.md`. Agreement on the `inverse_type` column was computed prior to any discussion. Results are reported in Section 4.1 of the paper.
---

## License

The audit data, rubric, and scripts in this repository are released under the MIT License.
