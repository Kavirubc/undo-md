# MCP Forward-Inverse Coverage — Analysis Report

## §4 Headline Table

| Metric | Value |
|---|---|
| N_total (tools surveyed) | 478 |
| N_mut (state-mutating) | 237 |
| N_irr (semantically irreversible) | 22 |
| exact inverses (a) | 50 |
| partial inverses (b) | 88 |
| absent inverses (c) | 77 |
| scope-gated inverses (d) | 0 |
| **Raw coverage** (a+b)/N_mut | **58.2%** |
| **Structural coverage** (a+b)/(N_mut−N_irr) | **64.2%** |

## §4.2 Per-Bucket Coverage

| Bucket | N_total | N_mut | N_irr | exact | partial | absent | Raw cov | Structural cov |
|---|---|---|---|---|---|---|---|---|
| Official reference | 99 | 46 | 7 | 6 | 12 | 21 | 39.1% | 46.2% |
| Community | 160 | 97 | 10 | 25 | 43 | 19 | 70.1% | 78.2% |
| Enterprise | 219 | 94 | 5 | 19 | 33 | 37 | 55.3% | 58.4% |

## §4.3 Verb-Class Cross-Tabulation (mutating tools only)

| Verb class | N | irreversible | exact | partial | absent | structural cov |
|---|---|---|---|---|---|---|
| create | 91 | 9 | 32 | 6 | 44 | 46.3% |
| update | 88 | 5 | 8 | 51 | 24 | 71.1% |
| delete | 39 | 0 | 10 | 24 | 5 | 87.2% |
| send | 3 | 3 | 0 | 0 | 0 | 0.0% |
| other | 16 | 5 | 0 | 7 | 4 | 63.6% |

## §4.4 Per-Server Summary

| Server | Bucket | N | N_mut | exact | partial | absent | irr | Structural cov |
|---|---|---|---|---|---|---|---|---|
| atlassian (jira/confluence) | com | 20 | 17 | 5 | 7 | 4 | 1 | 75.0% |
| aws | com | 23 | 13 | 4 | 8 | 1 | 0 | 92.3% |
| docker | com | 20 | 15 | 8 | 4 | 2 | 1 | 85.7% |
| exa search | com | 10 | 0 | 0 | 0 | 0 | 0 | 0.0% |
| figma | com | 2 | 0 | 0 | 0 | 0 | 0 | 0.0% |
| kubernetes | com | 22 | 16 | 4 | 10 | 0 | 2 | 100.0% |
| linear | com | 5 | 3 | 0 | 1 | 1 | 1 | 50.0% |
| notion | com | 18 | 8 | 0 | 6 | 1 | 1 | 85.7% |
| playwright | com | 20 | 17 | 4 | 4 | 5 | 4 | 61.5% |
| terraform (tfmcp) | com | 20 | 8 | 0 | 3 | 5 | 0 | 37.5% |
| buildkite | ent | 30 | 13 | 3 | 5 | 5 | 0 | 61.5% |
| cloudflare | ent | 30 | 11 | 2 | 5 | 3 | 1 | 70.0% |
| cloudinary | ent | 24 | 12 | 5 | 4 | 3 | 0 | 75.0% |
| elasticsearch | ent | 5 | 0 | 0 | 0 | 0 | 0 | 0.0% |
| grafana | ent | 20 | 7 | 0 | 2 | 4 | 1 | 33.3% |
| mongodb | ent | 20 | 9 | 0 | 3 | 6 | 0 | 33.3% |
| neon | ent | 29 | 11 | 2 | 6 | 3 | 0 | 72.7% |
| pinecone | ent | 9 | 2 | 0 | 0 | 2 | 0 | 0.0% |
| stripe (agent toolkit) | ent | 20 | 16 | 4 | 5 | 4 | 3 | 69.2% |
| supabase | ent | 32 | 13 | 3 | 3 | 7 | 0 | 46.2% |
| filesystem (MCP reference) | ref | 14 | 4 | 0 | 3 | 1 | 0 | 75.0% |
| google-drive (MCP reference) | ref | 2 | 0 | 0 | 0 | 0 | 0 | 0.0% |
| git (MCP reference) | ref | 12 | 5 | 0 | 4 | 1 | 0 | 80.0% |
| github (MCP reference) | ref | 25 | 13 | 0 | 1 | 8 | 4 | 11.1% |
| gitlab (MCP reference) | ref | 17 | 10 | 0 | 2 | 7 | 1 | 22.2% |
| memory (MCP reference) | ref | 9 | 6 | 6 | 0 | 0 | 0 | 100.0% |
| postgres (MCP reference) | ref | 1 | 0 | 0 | 0 | 0 | 0 | 0.0% |
| sentry (MCP reference) | ref | 4 | 2 | 0 | 1 | 1 | 0 | 50.0% |
| slack (MCP reference) | ref | 8 | 3 | 0 | 0 | 1 | 2 | 0.0% |
| sqlite (MCP reference) | ref | 7 | 3 | 0 | 1 | 2 | 0 | 33.3% |

## Sanity Checks

✅  Structural coverage 64.2% is within expected range (10–90%).
