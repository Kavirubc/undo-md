#!/usr/bin/env python3
"""
regression.py — Multinomial logistic regression for inverse_type.

Three nested models on mutating tools:
  Model A (baseline):  verb_class only
  Model B (+server):   verb_class + server fixed effects
  Model C (+bucket):   verb_class + bucket

Outcome: inverse_type ∈ {exact, partial, absent, irrev}
         (irrev = semantically_irreversible == 'yes')

Likelihood-ratio tests: A vs B, A vs C.

Outputs:
  regression_report.md
"""

import csv
import sys
import warnings
from collections import defaultdict

import numpy as np
import pandas as pd
import statsmodels.api as sm
from scipy import stats

INPUT  = 'audit.csv'
OUTPUT = 'regression_report.md'

warnings.filterwarnings('ignore')


def load_df(path: str) -> pd.DataFrame:
    with open(path, newline='') as f:
        rows = list(csv.DictReader(f))

    records = []
    for r in rows:
        if r['mutates_state'] != 'yes':
            continue
        if r['semantically_irreversible'] == 'yes':
            outcome = 'irrev'
        elif r['inverse_type'] in ('exact', 'partial', 'absent'):
            outcome = r['inverse_type']
        else:
            continue   # blank/unknown — skip

        bucket = r['server_id'].split('-')[0]   # ref / com / ent
        records.append({
            'outcome':    outcome,
            'verb_class': r['verb_class'],
            'server_id':  r['server_id'],
            'bucket':     bucket,
        })

    df = pd.DataFrame(records)
    return df


def fit_mnlogit(df: pd.DataFrame, formula_rhs: str):
    """
    Fit a multinomial logit with the given RHS formula string.
    Reference category for outcome: 'absent'.
    """
    dummies = pd.get_dummies(df[['outcome', 'verb_class', 'server_id', 'bucket']],
                             drop_first=False)
    # Build design matrix via patsy for flexibility
    from patsy import dmatrices
    formula = f"outcome ~ {formula_rhs}"
    y, X = dmatrices(formula, data=df, return_type='dataframe')

    # Encode outcome as integer
    classes = sorted(df['outcome'].unique())
    y_int = df['outcome'].map({c: i for i, c in enumerate(classes)}).values

    model = sm.MNLogit(y_int, X)
    result = model.fit(method='bfgs', maxiter=500, disp=False)
    return result, classes


def lr_test(result_restricted, result_full) -> tuple[float, float, int]:
    """Likelihood-ratio test: 2*(llf_full - llf_restr), df = diff in params."""
    lr_stat = 2 * (result_full.llf - result_restricted.llf)
    df = result_full.df_model - result_restricted.df_model
    if df <= 0:
        return lr_stat, float('nan'), int(df)
    p = stats.chi2.sf(lr_stat, df)
    return lr_stat, p, int(df)


def fmt_p(p: float) -> str:
    if np.isnan(p):
        return "—"
    if p < 0.001:
        return "< 0.001"
    return f"{p:.3f}"


def main():
    df = load_df(INPUT)
    n = len(df)
    print(f"Loaded {n} mutating tools with known outcome\n")

    # ── Model A: verb_class only ─────────────────────────────────────────────
    res_A, classes = fit_mnlogit(df, "C(verb_class, Treatment('other'))")
    print(f"Model A (verb_class):  log-likelihood = {res_A.llf:.2f}, "
          f"k = {res_A.df_model}")

    # ── Model B: verb_class + server fixed effects ────────────────────────────
    # Drop servers with too few observations to avoid singular matrix
    server_counts = df['server_id'].value_counts()
    common_servers = server_counts[server_counts >= 3].index.tolist()
    df_B = df[df['server_id'].isin(common_servers)].copy()
    try:
        vc_ref_B = df_B['verb_class'].value_counts().idxmax()
        res_B, _ = fit_mnlogit(
            df_B,
            f"C(verb_class, Treatment('{vc_ref_B}')) + C(server_id)"
        )
        print(f"Model B (+server):     log-likelihood = {res_B.llf:.2f}, "
              f"k = {res_B.df_model}")
        res_A_B, _ = fit_mnlogit(df_B, f"C(verb_class, Treatment('{vc_ref_B}'))")
        lr_B, p_B, df_B_deg = lr_test(res_A_B, res_B)
        b_ok = True
    except Exception as e:
        print(f"[warn] Model B failed: {e}")
        b_ok = False

    # ── Model C: verb_class + bucket ─────────────────────────────────────────
    try:
        res_C, _ = fit_mnlogit(
            df,
            "C(verb_class, Treatment('other')) + C(bucket, Treatment('ref'))"
        )
        print(f"Model C (+bucket):     log-likelihood = {res_C.llf:.2f}, "
              f"k = {res_C.df_model}")
        lr_C, p_C, df_C_deg = lr_test(res_A, res_C)
        c_ok = True
    except Exception as e:
        print(f"[warn] Model C failed: {e}")
        c_ok = False

    # ── LR test results ───────────────────────────────────────────────────────
    print("\nLikelihood-ratio tests:")
    if b_ok:
        print(f"  A vs B (server FE): LR={lr_B:.2f}, df={df_B_deg}, p={fmt_p(p_B)}")
    if c_ok:
        print(f"  A vs C (bucket):    LR={lr_C:.2f}, df={df_C_deg}, p={fmt_p(p_C)}")

    # ── Coefficient table for Model A ────────────────────────────────────────
    coef_A = res_A.params   # shape: (n_params, n_classes-1)
    pval_A = res_A.pvalues

    # ── Markdown report ───────────────────────────────────────────────────────
    lines = []
    w = lines.append

    w("# Multinomial Logistic Regression Report\n")
    w(f"Outcome: `inverse_type` ∈ {{exact, partial, absent, irrev}}  ")
    w(f"Reference categories: outcome = `absent`, verb_class = `other`.  N = {n} mutating tools.\n")

    w("## Model Fit Summary\n")
    w("| Model | Predictors | N | Log-likelihood | k (params) |")
    w("|---|---|---|---|---|")
    w(f"| A | verb_class | {n} | {res_A.llf:.2f} | {res_A.df_model} |")
    if b_ok:
        n_B = len(df_B)
        w(f"| B | verb_class + server FE | {n_B} | {res_B.llf:.2f} | {res_B.df_model} |")
    if c_ok:
        w(f"| C | verb_class + bucket | {n} | {res_C.llf:.2f} | {res_C.df_model} |")
    w("")

    w("## Likelihood-Ratio Tests\n")
    w("| Comparison | LR statistic | df | p-value | Interpretation |")
    w("|---|---|---|---|---|")
    if b_ok:
        interp_B = "significant" if (not np.isnan(p_B) and p_B < 0.05) else "not significant"
        w(f"| A vs B (add server FE) | {lr_B:.2f} | {df_B_deg} | {fmt_p(p_B)} | {interp_B} |")
    if c_ok:
        interp_C = "significant" if (not np.isnan(p_C) and p_C < 0.05) else "not significant"
        w(f"| A vs C (add bucket) | {lr_C:.2f} | {df_C_deg} | {fmt_p(p_C)} | {interp_C} |")
    w("")

    w("## Model A Coefficients (verb_class, reference = 'read')\n")
    w("Outcome classes versus `absent` (reference); verb_class reference = `other`.\n")

    # Outcome column names from statsmodels
    try:
        outcome_names = [f"y={c}" for c in classes if c != classes[0]]
        coef_df = pd.DataFrame(res_A.params.values,
                               index=res_A.params.index,
                               columns=outcome_names)
        pval_df = pd.DataFrame(res_A.pvalues.values,
                               index=res_A.pvalues.index,
                               columns=outcome_names)

        # Build table
        col_headers = "| Predictor |" + "|".join(f" {c} (coef) " for c in outcome_names) + "|"
        col_headers += "|".join(f" p({c}) " for c in outcome_names) + "|"
        w("| Predictor |" +
          "".join(f" {c} coef | {c} p |" for c in outcome_names))
        w("|---|" + "".join("|---|---|" for _ in outcome_names))
        for pred in coef_df.index:
            row_md = f"| `{pred}` |"
            for c in outcome_names:
                coef_val = coef_df.loc[pred, c]
                p_val    = pval_df.loc[pred, c]
                row_md += f" {coef_val:+.3f} | {fmt_p(p_val)} |"
            w(row_md)
        w("")
    except Exception as e:
        w(f"*Coefficient table unavailable: {e}*\n")

    w("## Interpretation\n")
    w("- Model A tests whether verb class alone predicts the inverse type.\n")
    w("- Model B adds server identity as fixed effects; the LR test measures "
      "whether servers differ significantly beyond verb class.\n")
    w("- Model C replaces server FE with the coarser bucket variable "
      "(ref / com / ent); the LR test measures bucket-level variation.\n")
    w("- A significant A→B test implies server-level heterogeneity that "
      "verb class alone cannot explain.\n")
    w("- A non-significant A→C test implies no systematic bucket effect "
      "beyond what verb class captures.\n")

    with open(OUTPUT, 'w') as f:
        f.write("\n".join(lines))
    print(f"\n→ {OUTPUT} written")


if __name__ == '__main__':
    main()
