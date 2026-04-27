#!/usr/bin/env python3
"""
sample_for_irr.py — Draw the 24-row stratified inter-rater sample.

Stratified by inverse_type (exact/partial/absent/irrev) from the 237
state-mutating tools in audit.csv.  Seed = 42.  Outputs:
  irr_sample.csv   — 24 rows with annotator2_inverse_type left blank
"""

import csv
import random
from collections import defaultdict

SEED = 42
TOTAL = 24
INPUT  = 'audit.csv'
OUTPUT = 'irr_sample.csv'

# Stratum sizes (sum = 24, proportional to 50:88:77:22 ≈ 5:9:8:2)
STRATA = {
    'exact':   5,
    'partial': 9,
    'absent':  8,
    'irrev':   2,   # maps to semantically_irreversible=yes
}


def irr_label(row: dict) -> str | None:
    """Return the ground-truth stratum key for a mutating tool."""
    if row['semantically_irreversible'] == 'yes':
        return 'irrev'
    it = row['inverse_type']
    if it in ('exact', 'partial', 'absent'):
        return it
    return None


def main():
    rng = random.Random(SEED)

    with open(INPUT, newline='') as f:
        rows = list(csv.DictReader(f))

    # Filter to mutating tools with a known stratum
    buckets: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        if r['mutates_state'] != 'yes':
            continue
        label = irr_label(r)
        if label is not None:
            buckets[label].append(r)

    sample = []
    for stratum, n in STRATA.items():
        pool = buckets[stratum]
        if len(pool) < n:
            raise ValueError(
                f"Stratum '{stratum}' has only {len(pool)} items; need {n}."
            )
        chosen = rng.sample(pool, n)
        for row in chosen:
            row['annotator2_inverse_type'] = ''
        sample.extend(chosen)

    # Shuffle so annotator doesn't see stratum grouping
    rng.shuffle(sample)

    fieldnames = list(rows[0].keys()) + ['annotator2_inverse_type']
    with open(OUTPUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(sample)

    print(f"Wrote {len(sample)} rows to {OUTPUT}")
    print("Stratum breakdown:")
    for stratum, n in STRATA.items():
        print(f"  {stratum:8s}: {n}")
    print(f"\nAnnotator 2: fill in the 'annotator2_inverse_type' column")
    print("(values: exact / partial / absent / irrev)")


if __name__ == '__main__':
    main()
