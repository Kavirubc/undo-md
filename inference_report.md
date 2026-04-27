# Type Inference Evaluation Report

Evaluated on **237** mutating tools with known ground truth.

Algorithm uses only `tool_name`, `verb_class`, and the server's tool inventory.

## Per-Class Metrics

| Class | TP | FP | FN | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| exact | 20 | 2 | 30 | 0.909 | 0.400 | 0.556 |
| partial | 23 | 17 | 65 | 0.575 | 0.261 | 0.359 |
| absent | 71 | 97 | 6 | 0.423 | 0.922 | 0.580 |
| irrev | 5 | 2 | 17 | 0.714 | 0.227 | 0.345 |

**Macro-averaged F1: 0.460**

## Confusion Matrix

Rows = ground truth, columns = predicted.

| GT \ Pred | exact | partial | absent | irrev |
|---|---|---|---|---|
| **exact** | 20 | 9 | 20 | 1 |
| **partial** | 1 | 23 | 64 | 0 |
| **absent** | 1 | 4 | 71 | 1 |
| **irrev** | 0 | 4 | 13 | 5 |

## Disagreements (first 30)

| server_id | tool_name | verb_class | ground_truth | predicted |
|---|---|---|---|---|
| ref-filesystem | edit_file | update | partial | absent |
| ref-filesystem | move_file | other | partial | absent |
| ref-git | git_commit | create | partial | absent |
| ref-git | git_add | update | partial | absent |
| ref-git | git_reset | update | partial | absent |
| ref-git | git_checkout | update | partial | absent |
| ref-github | update_issue | update | partial | absent |
| ref-github | add_issue_comment | create | irrev | absent |
| ref-github | create_review | create | irrev | absent |
| ref-github | merge_pull_request | other | irrev | partial |
| ref-github | add_pull_request_review_comment | create | irrev | absent |
| ref-gitlab | update_issue | update | partial | absent |
| ref-gitlab | create_note | create | irrev | absent |
| ref-gitlab | update_merge_request | update | partial | absent |
| ref-sqlite | write_query | update | partial | absent |
| ref-sentry | update_sentry_issue | update | partial | absent |
| ref-memory | delete_entities | delete | exact | partial |
| ref-memory | delete_observations | delete | exact | absent |
| ref-memory | delete_relations | delete | exact | partial |
| com-kubernetes | exec_in_pod | other | irrev | absent |
| com-kubernetes | upgrade_helm_chart | update | partial | absent |
| com-kubernetes | kubectl_apply | update | partial | absent |
| com-kubernetes | kubectl_context | update | partial | absent |
| com-kubernetes | kubectl_generic | other | irrev | partial |
| com-kubernetes | kubectl_patch | update | partial | absent |
| com-kubernetes | kubectl_reconnect | other | partial | absent |
| com-kubernetes | kubectl_scale | update | partial | absent |
| com-kubernetes | node_management | other | partial | absent |
| com-kubernetes | port_forward | create | exact | absent |
| com-kubernetes | stop_port_forward | delete | exact | absent |

Total disagreements: 118 / 237

## Notes on Algorithm

- Resource extraction strips the leading verb token; for infix-verb names (e.g. `kubectl_create`, `s3_bucket_create`) the verb is found by scanning all tokens.

- Candidate inverse search uses substring overlap on the resource noun, which handles both `create_container`/`remove_container` and `s3_bucket_create`/`s3_bucket_delete`.

- Exact/partial decision follows the rubric: create→delete pairs are `exact`; all update and delete→create pairs are `partial`.

- Irreversibility is triggered by verb (`send`, `post`, …) or keyword in name (`charge`, `capture`, `pay`, …).
