#!/usr/bin/env python3
"""
compute_kappa.py — Cohen's κ between annotator1 (inverse_type / irrev flag)
and annotator2 (annotator2_inverse_type) on irr_sample.csv.

Usage:
    python compute_kappa.py [--sample irr_sample.csv] [--out kappa_report.md]
                            [--n-boot 10000] [--seed 42]

Requires: only stdlib (no scipy/numpy needed for the bootstrap).
"""

import argparse
import csv
import math
import random
from collections import Counter


CLASSES = ['exact', 'partial', 'absent', 'irrev']


def load_pairs(path: str) -> list[tuple[str, str]]:
    """Return (annotator1_label, annotator2_label) for fully annotated rows."""
    pairs = []
    missing = 0
    with open(path, newline='') as f:
        for row in csv.DictReader(f):
            a2 = row.get('annotator2_inverse_type', '').strip()
            if not a2:
                missing += 1
                continue
            # Derive annotator1 label
            if row.get('semantically_irreversible', '') == 'yes':
                a1 = 'irrev'
            else:
                a1 = row.get('inverse_type', '').strip()
            if a1 not in CLASSES or a2 not in CLASSES:
                continue
            pairs.append((a1, a2))
    if missing:
        print(f"[warn] {missing} rows have no annotator2_inverse_type — excluded from κ")
    return pairs


def cohen_kappa(pairs: list[tuple[str, str]]) -> float:
    n = len(pairs)
    if n == 0:
        return float('nan')
    # Observed agreement
    p_o = sum(a == b for a, b in pairs) / n
    # Expected agreement
    count_a = Counter(a for a, _ in pairs)
    count_b = Counter(b for _, b in pairs)
    p_e = sum((count_a[c] / n) * (count_b[c] / n) for c in CLASSES)
    if p_e == 1.0:
        return 1.0
    return (p_o - p_e) / (1.0 - p_e)


def bootstrap_ci(
    pairs: list[tuple[str, str]],
    n_boot: int = 10_000,
    seed: int = 42,
    alpha: float = 0.05,
) -> tuple[float, float]:
    rng = random.Random(seed)
    n = len(pairs)
    kappas = []
    for _ in range(n_boot):
        sample = [pairs[rng.randrange(n)] for _ in range(n)]
        kappas.append(cohen_kappa(sample))
    kappas.sort()
    lo = kappas[int(alpha / 2 * n_boot)]
    hi = kappas[int((1 - alpha / 2) * n_boot)]
    return lo, hi


def confusion_matrix(pairs: list[tuple[str, str]]) -> dict:
    cm = {c: {d: 0 for d in CLASSES} for c in CLASSES}
    for a1, a2 in pairs:
        if a1 in cm and a2 in CLASSES:
            cm[a1][a2] += 1
    return cm


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sample', default='irr_sample.csv')
    ap.add_argument('--out',    default='kappa_report.md')
    ap.add_argument('--n-boot', type=int, default=10_000)
    ap.add_argument('--seed',   type=int, default=42)
    args = ap.parse_args()

    pairs = load_pairs(args.sample)
    n = len(pairs)

    if n == 0:
        print("No annotated pairs found — fill in irr_sample.csv first.")
        return

    kappa = cohen_kappa(pairs)
    lo, hi = bootstrap_ci(pairs, n_boot=args.n_boot, seed=args.seed)
    p_o = sum(a == b for a, b in pairs) / n
    cm = confusion_matrix(pairs)

    # ── stdout ───────────────────────────────────────────────────────────────
    print(f"Inter-rater agreement on {n} items\n")
    print(f"  Observed agreement (p_o): {p_o:.3f}")
    print(f"  Cohen's κ:                {kappa:.3f}")
    print(f"  95% bootstrap CI:         [{lo:.3f}, {hi:.3f}]  (B={args.n_boot})")

    print("\nConfusion matrix (rows=annotator1, cols=annotator2):")
    header = f"{'A1 \\ A2':<10}" + "".join(f"{c:>9}" for c in CLASSES)
    print(header)
    for c in CLASSES:
        row_str = f"{c:<10}" + "".join(f"{cm[c][d]:>9}" for d in CLASSES)
        print(row_str)

    # Per-class agreement
    print("\nPer-class agreement:")
    for c in CLASSES:
        agree = cm[c][c]
        total = sum(cm[c][d] for d in CLASSES)
        print(f"  {c:<8}: {agree}/{total} agreed")

    # ── Markdown report ───────────────────────────────────────────────────────
    lines = []
    w = lines.append
    w("# Inter-Rater Agreement Report\n")
    w(f"Sample: **{n}** items from `irr_sample.csv`  ")
    w(f"Bootstrap: B = {args.n_boot}, seed = {args.seed}\n")

    w("## Summary\n")
    w("| Metric | Value |")
    w("|---|---|")
    w(f"| Sample size | {n} |")
    w(f"| Observed agreement (p_o) | {p_o:.3f} |")
    w(f"| Cohen's κ | **{kappa:.3f}** |")
    w(f"| 95% bootstrap CI | [{lo:.3f}, {hi:.3f}] |")
    w("")

    strength = (
        "almost perfect (κ > 0.80)" if kappa > 0.80 else
        "substantial (0.60 < κ ≤ 0.80)" if kappa > 0.60 else
        "moderate (0.40 < κ ≤ 0.60)" if kappa > 0.40 else
        "fair (0.20 < κ ≤ 0.40)" if kappa > 0.20 else
        "slight or poor (κ ≤ 0.20)"
    )
    w(f"Agreement strength by Landis & Koch (1977): **{strength}**.\n")

    w("## Confusion Matrix\n")
    w("Rows = Annotator 1 (ground truth), columns = Annotator 2.\n")
    header_md = "| A1 \\ A2 |" + "|".join(f" {c} " for c in CLASSES) + "|"
    sep_md    = "|---|" + "|".join("---" for _ in CLASSES) + "|"
    w(header_md)
    w(sep_md)
    for c in CLASSES:
        row_md = f"| **{c}** |" + "|".join(f" {cm[c][d]} " for d in CLASSES) + "|"
        w(row_md)
    w("")

    w("## Per-Class Agreement\n")
    w("| Class | Agreed | Total | Rate |")
    w("|---|---|---|---|")
    for c in CLASSES:
        agree = cm[c][c]
        total = sum(cm[c][d] for d in CLASSES)
        rate  = agree / total if total > 0 else 0
        w(f"| {c} | {agree} | {total} | {rate:.3f} |")
    w("")

    w("## Notes\n")
    w("- κ computed on the four-class scheme: `exact`, `partial`, `absent`, `irrev`.\n")
    w("- `irrev` is derived from `semantically_irreversible == yes` for annotator 1.\n")
    w("- Rows with blank `annotator2_inverse_type` are excluded.\n")

    with open(args.out, 'w') as f:
        f.write("\n".join(lines))
    print(f"\n→ {args.out} written")


if __name__ == '__main__':
    main()
