# Multinomial Logistic Regression Report

Outcome: `inverse_type` ∈ {exact, partial, absent, irrev}  
Reference categories: outcome = `absent`, verb_class = `other`.  N = 237 mutating tools.

## Model Fit Summary

| Model | Predictors | N | Log-likelihood | k (params) |
|---|---|---|---|---|
| A | verb_class | 237 | -247.76 | 12.0 |
| B | verb_class + server FE | 233 | -165.02 | 78.0 |
| C | verb_class + bucket | 237 | -241.77 | 18.0 |

## Likelihood-Ratio Tests

| Comparison | LR statistic | df | p-value | Interpretation |
|---|---|---|---|---|
| A vs B (add server FE) | 159.91 | 66 | < 0.001 | significant |
| A vs C (add bucket) | 11.98 | 6 | 0.062 | not significant |

## Model A Coefficients (verb_class, reference = 'read')

Outcome classes versus `absent` (reference); verb_class reference = `other`.

| Predictor | y=exact coef | y=exact p | y=irrev coef | y=irrev p | y=partial coef | y=partial p |
|---||---|---||---|---||---|---|
| `Intercept` | -9.740 | 0.881 | +0.223 | 0.739 | +0.560 | 0.372 |
| `C(verb_class, Treatment('other'))[T.create]` | +9.422 | 0.885 | -1.810 | 0.018 | -2.552 | < 0.001 |
| `C(verb_class, Treatment('other'))[T.delete]` | +10.434 | 0.873 | -17.428 | 0.994 | +1.009 | 0.205 |
| `C(verb_class, Treatment('other'))[T.send]` | -2.844 | 1.000 | +15.593 | 0.992 | -5.549 | 1.000 |
| `C(verb_class, Treatment('other'))[T.update]` | +8.642 | 0.895 | -1.792 | 0.031 | +0.194 | 0.774 |

## Interpretation

- Model A tests whether verb class alone predicts the inverse type.

- Model B adds server identity as fixed effects; the LR test measures whether servers differ significantly beyond verb class.

- Model C replaces server FE with the coarser bucket variable (ref / com / ent); the LR test measures bucket-level variation.

- A significant A→B test implies server-level heterogeneity that verb class alone cannot explain.

- A non-significant A→C test implies no systematic bucket effect beyond what verb class captures.
