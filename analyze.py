#!/usr/bin/env python3
"""analyze.py — produce headline table and cross-tabulations from audit.csv"""

import csv
import sys
from collections import defaultdict

def load(path):
    with open(path) as f:
        return list(csv.DictReader(f))

def stats(rows):
    N_total = len(rows)
    N_mut   = sum(1 for r in rows if r['mutates_state'] == 'yes')
    N_irr   = sum(1 for r in rows if r['semantically_irreversible'] == 'yes')
    exact   = sum(1 for r in rows if r['inverse_type'] == 'exact')
    partial = sum(1 for r in rows if r['inverse_type'] == 'partial')
    absent  = sum(1 for r in rows if r['inverse_type'] == 'absent')
    scope   = sum(1 for r in rows if r['scope_gated'] == 'yes')
    denom   = N_mut - N_irr
    raw_cov = (exact + partial) / N_mut  if N_mut  > 0 else 0
    str_cov = (exact + partial) / denom  if denom  > 0 else 0
    return dict(N_total=N_total, N_mut=N_mut, N_irr=N_irr,
                exact=exact, partial=partial, absent=absent,
                scope=scope, raw_cov=raw_cov, str_cov=str_cov)

def pct(v): return f"{v:.1%}"

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'audit.csv'
    out  = sys.argv[2] if len(sys.argv) > 2 else 'report.md'
    rows = load(path)

    lines = []
    w = lines.append

    w("# MCP Forward-Inverse Coverage — Analysis Report\n")

    # ── 1. Headline table ──────────────────────────────────────────────────
    w("## §4 Headline Table\n")
    s = stats(rows)
    w(f"| Metric | Value |")
    w(f"|---|---|")
    w(f"| N_total (tools surveyed) | {s['N_total']} |")
    w(f"| N_mut (state-mutating) | {s['N_mut']} |")
    w(f"| N_irr (semantically irreversible) | {s['N_irr']} |")
    w(f"| exact inverses (a) | {s['exact']} |")
    w(f"| partial inverses (b) | {s['partial']} |")
    w(f"| absent inverses (c) | {s['absent']} |")
    w(f"| scope-gated inverses (d) | {s['scope']} |")
    w(f"| **Raw coverage** (a+b)/N_mut | **{pct(s['raw_cov'])}** |")
    w(f"| **Structural coverage** (a+b)/(N_mut−N_irr) | **{pct(s['str_cov'])}** |")
    w("")

    # ── 2. Per-bucket breakdown ────────────────────────────────────────────
    w("## §4.2 Per-Bucket Coverage\n")
    BUCKETS = [('ref', 'Official reference'), ('com', 'Community'), ('ent', 'Enterprise')]
    w("| Bucket | N_total | N_mut | N_irr | exact | partial | absent | Raw cov | Structural cov |")
    w("|---|---|---|---|---|---|---|---|---|")
    for key, label in BUCKETS:
        br = [r for r in rows if r['server_id'].startswith(key + '-')]
        bs = stats(br)
        w(f"| {label} | {bs['N_total']} | {bs['N_mut']} | {bs['N_irr']} | "
          f"{bs['exact']} | {bs['partial']} | {bs['absent']} | "
          f"{pct(bs['raw_cov'])} | {pct(bs['str_cov'])} |")
    w("")

    # ── 3. Per-verb-class cross-tabulation ────────────────────────────────
    w("## §4.3 Verb-Class Cross-Tabulation (mutating tools only)\n")
    mut_rows = [r for r in rows if r['mutates_state'] == 'yes']
    verbs = ['create', 'update', 'delete', 'send', 'other']
    w("| Verb class | N | irreversible | exact | partial | absent | structural cov |")
    w("|---|---|---|---|---|---|---|")
    for v in verbs:
        vr = [r for r in mut_rows if r['verb_class'] == v]
        if not vr: continue
        irr = sum(1 for r in vr if r['semantically_irreversible'] == 'yes')
        ex  = sum(1 for r in vr if r['inverse_type'] == 'exact')
        pa  = sum(1 for r in vr if r['inverse_type'] == 'partial')
        ab  = sum(1 for r in vr if r['inverse_type'] == 'absent')
        denom = len(vr) - irr
        cov = (ex + pa) / denom if denom > 0 else 0
        w(f"| {v} | {len(vr)} | {irr} | {ex} | {pa} | {ab} | {pct(cov)} |")
    w("")

    # ── 4. Per-server summary ─────────────────────────────────────────────
    w("## §4.4 Per-Server Summary\n")
    by_server = defaultdict(list)
    for r in rows:
        by_server[(r['server_id'], r['server_name'])].append(r)
    w("| Server | Bucket | N | N_mut | exact | partial | absent | irr | Structural cov |")
    w("|---|---|---|---|---|---|---|---|---|")
    for (sid, sname), sr in sorted(by_server.items()):
        bucket = sid.split('-')[0]
        ss = stats(sr)
        w(f"| {sname} | {bucket} | {ss['N_total']} | {ss['N_mut']} | "
          f"{ss['exact']} | {ss['partial']} | {ss['absent']} | {ss['N_irr']} | "
          f"{pct(ss['str_cov'])} |")
    w("")

    # ── 5. Sanity checks ──────────────────────────────────────────────────
    w("## Sanity Checks\n")
    str_cov = s['str_cov']
    if str_cov > 0.90:
        w("⚠️  Structural coverage >90% — check rubric or sample for bugs.")
    elif str_cov < 0.10:
        w("⚠️  Structural coverage <10% — check that update_* tools aren't all marked absent.")
    else:
        w(f"✅  Structural coverage {pct(str_cov)} is within expected range (10–90%).")

    ref_s = stats([r for r in rows if r['server_id'].startswith('ref-')])
    ent_s = stats([r for r in rows if r['server_id'].startswith('ent-')])
    if ent_s['str_cov'] < ref_s['str_cov']:
        w(f"✅  Enterprise ({pct(ent_s['str_cov'])}) < Official ({pct(ref_s['str_cov'])}) — "
          f"expected: vendors gate inverses more aggressively.")
    w("")

    report = "\n".join(lines)
    with open(out, 'w') as f:
        f.write(report)
    print(report)
    print(f"\n→ Written to {out}")

if __name__ == '__main__':
    main()
