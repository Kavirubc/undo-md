# MCP Forward-Inverse Coverage Audit — Rubric

## Purpose
For each MCP server in the sample, classify every tool by (a) whether it mutates
durable state, (b) whether its inverse is exposed by the same server, and
(c) whether that inverse is gated behind a different permission scope.

The classification is a judgement instrument. The rubric below is designed to
minimise disagreement between annotators on borderline cases.

## Sample frame
30 MCP servers drawn from three sources in roughly equal proportions:

1. **Official MCP reference servers** (~10): from
   `github.com/modelcontextprotocol/servers`.
2. **Top community MCP servers** (~10): highest-starred from the
   `awesome-mcp-servers` curated list.
3. **Enterprise vendor MCP servers** (~10): published by vendors whose products
   expose durable state (payments, messaging, storage, databases, issue
   trackers, infrastructure).

For each server, record:
- Repository URL
- Commit SHA at time of audit
- Date retrieved

Never classify from memory; always classify from the pinned commit.

## Per-tool classification

### Column A: `verb_class`
Assigned from the tool name and description. Pick the dominant verb.

| Value | Matches |
|---|---|
| `create` | create_, new_, add_, register_, provision_, insert_, upload_ |
| `update` | update_, edit_, modify_, set_, patch_, configure_ |
| `delete` | delete_, remove_, destroy_, deprovision_, purge_ |
| `send` | send_, post_, notify_, publish_, broadcast_, email_ |
| `read` | read_, list_, get_, search_, query_, fetch_, describe_ |
| `other` | anything state-mutating that doesn't fit above (e.g. `transfer_`, `approve_`, `merge_`) |

### Column B: `mutates_state`
| Value | Definition |
|---|---|
| `yes` | Tool produces durable side effects observable after the call returns (writes to disk, calls an API with mutation semantics, sends a message, changes a resource). |
| `no` | Tool is read-only: list, get, search, query, describe. |

Read-only tools (`verb_class == read`, `mutates_state == no`) are out of the
denominator for coverage. Still record them — the count is useful for context.

### Column C: `semantically_irreversible`
Set `yes` if the forward action cannot be undone by any tool the server could
plausibly expose:
- Sending an email to an external recipient
- Publishing to a public feed with external consumers
- Making a payment that has settled with a counterparty
- Invoking a webhook whose downstream effects are outside the server's control

If `yes`, skip columns D–F. The tool counts toward `N_mut` but is excluded
from the coverage numerator (we do not penalise a server for the absence of
an inverse that cannot exist).

### Column D: `inverse_tool`
The name of a tool *in the same server* that plausibly inverts the forward
tool. Examples:
- `create_issue` → `delete_issue` (exact)
- `upload_file` → `delete_file` (exact)
- `update_config` → (no inverse, unless server returns prior config)

Leave blank if no plausible inverse exists in the server's catalogue.

### Column E: `inverse_type`
| Value | Definition |
|---|---|
| `exact` | Clear semantic inverse: create/delete, upload/delete, register/deregister, subscribe/unsubscribe, grant/revoke. |
| `partial` | Inverse exists but is lossy or requires state not captured by the forward tool. Most common case: `update_*` with a matching `update_*` that can restore if you know the prior value — but the forward tool does not return that value. |
| `absent` | No inverse tool exists in this server. |

Do NOT mark `exact` simply because an inverse name exists. Check the input
schema of the inverse: if it cannot be driven by the output of the forward
tool, the pair is `partial` at best.

### Column F: `scope_gated`
| Value | Definition |
|---|---|
| `yes` | Inverse tool requires an OAuth scope or API-key permission different from the forward tool's scope, inferred from the tool's documentation or parameters. |
| `no` | Inverse tool is callable under the same scope as the forward tool. |
| `unknown` | Server documentation does not make this clear. Record `unknown` rather than guessing. |

This column only applies when `inverse_type ∈ {exact, partial}`.

### Column G: `notes`
Free text. Anything that would help a second annotator audit the call:
- Justification for borderline `partial` vs `absent` calls
- Scope references from the server's docs
- Edge cases (e.g. soft-delete vs hard-delete)

## Headline metrics

From the completed sheet:

- `N_total` — all tools surveyed.
- `N_mut` — tools with `mutates_state == yes`.
- `N_irr` — tools with `semantically_irreversible == yes`.
- `a` — tools with `inverse_type == exact`.
- `b` — tools with `inverse_type == partial`.
- `c` — tools with `inverse_type == absent` and `semantically_irreversible == no`.
- `d` — tools with `inverse_type ∈ {exact, partial}` and `scope_gated == yes`.

Report two coverage numbers:

1. **Raw coverage**: `(a + b) / N_mut`. Conservative: counts semantically
   irreversible tools in the denominator.
2. **Structural coverage**: `(a + b) / (N_mut − N_irr)`. Excludes tools where
   absence of an inverse is expected rather than a gap.

Report both; they answer different questions. Structural coverage is the one
that speaks to the skill author's experience ("of the mutations the skill
could reasonably expect to undo, what fraction can the agent actually undo?").

## Inter-rater agreement
Have a second annotator independently classify the same 10 tools across 3
randomly chosen servers. Report agreement on columns B, E, and F. If
agreement is below 80% on any column, revisit the rubric language for that
column before publishing the result.

## Time budget
- Setup + server selection: half a day.
- Classification: 2–4 minutes per tool. 700 tools ≈ 1.5–2 days at steady
  pace. Split across two sessions.
- Inter-rater check: 1 hour.
- Analysis + tables: half a day.
- **Total: 3–4 working days for one auditor, less with two.**
