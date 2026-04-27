# Inter-Rater Agreement Report

Sample: **24** items from `irr_sample.csv`  
Bootstrap: B = 10000, seed = 42

## Summary

| Metric | Value |
|---|---|
| Sample size | 24 |
| Observed agreement (p_o) | 0.958 |
| Cohen's κ | **0.940** |
| 95% bootstrap CI | [0.805, 1.000] |

Agreement strength by Landis & Koch (1977): **almost perfect (κ > 0.80)**.

## Confusion Matrix

Rows = Annotator 1 (ground truth), columns = Annotator 2.

| A1 \ A2 | exact | partial | absent | irrev |
|---|---|---|---|---|
| **exact** | 4 | 1 | 0 | 0 |
| **partial** | 0 | 9 | 0 | 0 |
| **absent** | 0 | 0 | 8 | 0 |
| **irrev** | 0 | 0 | 0 | 2 |

## Per-Class Agreement

| Class | Agreed | Total | Rate |
|---|---|---|---|
| exact | 4 | 5 | 0.800 |
| partial | 9 | 9 | 1.000 |
| absent | 8 | 8 | 1.000 |
| irrev | 2 | 2 | 1.000 |

## Notes

- κ computed on the four-class scheme: `exact`, `partial`, `absent`, `irrev`.

- `irrev` is derived from `semantically_irreversible == yes` for annotator 1.

- Rows with blank `annotator2_inverse_type` are excluded.
