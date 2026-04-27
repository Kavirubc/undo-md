# Bidirectional Tool-Pair Analysis

Source: `audit.csv` — 137 inverse-tool declarations across 23 servers.

## Summary

| Category | N | % of declarations |
|---|---|---|
| Bidirectional (A→B **and** B→A) | 124 | 90.5% |
| Unidirectional (A→B, B silent) | 3 | 2.2% |
| Asymmetric (A→B, B→C≠A) | 10 | 7.3% |
| Dangling (B not found in server) | 0 | 0.0% |
| **Total** | **137** | 100% |

**Bidirectionality rate: 90.5%** of declared inverse relationships are reciprocally declared by the target tool.

## Per-Server Breakdown

| Server | Bidir | Unidir | Asymm | Dangling |
|---|---|---|---|---|
| com-atlassian | 12 | 0 | 0 | 0 |
| com-aws | 12 | 0 | 0 | 0 |
| com-docker | 10 | 0 | 2 | 0 |
| com-kubernetes | 12 | 0 | 1 | 0 |
| com-linear | 1 | 0 | 0 | 0 |
| com-notion | 5 | 0 | 1 | 0 |
| com-playwright | 8 | 0 | 0 | 0 |
| com-terraform | 2 | 1 | 0 | 0 |
| ent-buildkite | 7 | 0 | 1 | 0 |
| ent-cloudflare | 7 | 0 | 0 | 0 |
| ent-cloudinary | 9 | 0 | 0 | 0 |
| ent-grafana | 2 | 0 | 0 | 0 |
| ent-mongodb | 3 | 0 | 0 | 0 |
| ent-neon | 6 | 0 | 2 | 0 |
| ent-stripe | 6 | 2 | 1 | 0 |
| ent-supabase | 6 | 0 | 0 | 0 |
| ref-filesystem | 2 | 0 | 1 | 0 |
| ref-git | 3 | 0 | 1 | 0 |
| ref-github | 1 | 0 | 0 | 0 |
| ref-gitlab | 2 | 0 | 0 | 0 |
| ref-memory | 6 | 0 | 0 | 0 |
| ref-sentry | 1 | 0 | 0 | 0 |
| ref-sqlite | 1 | 0 | 0 | 0 |

## Per-Verb-Class Breakdown

| Verb class | Bidir | Unidir |
|---|---|---|
| create | 33 | 1 |
| update | 50 | 2 |
| delete | 34 | 0 |
| other | 7 | 0 |

## Asymmetric Pairs

A claims B as its inverse, but B names a different tool C.

| Server | Tool A | Tool B (claimed) | Tool C (B's declared inverse) |
|---|---|---|---|
| ref-filesystem | edit_file | write_file | write_file |
| ref-git | git_add | git_reset | git_commit |
| com-kubernetes | kubectl_apply | kubectl_delete | kubectl_create |
| com-docker | run_container | stop_container | start_container |
| com-docker | build_image | remove_image | pull_image |
| com-notion | notion_create_database_item | notion_delete_block | notion_append_block_children |
| ent-stripe | payment_intents_confirm | payment_intents_cancel | payment_intents_create |
| ent-neon | complete_database_migration | run_sql | run_sql |
| ent-neon | complete_query_tuning | run_sql | run_sql |
| ent-buildkite | rebuild_build | cancel_build | create_build |

## Bidirectional Pairs (complete list)

| Server | Tool A | Tool B |
|---|---|---|
| ref-filesystem | write_file | write_file |
| ref-filesystem | move_file | move_file |
| ref-git | git_commit | git_reset |
| ref-git | git_checkout | git_checkout |
| ref-github | update_issue | update_issue |
| ref-gitlab | update_issue | update_issue |
| ref-gitlab | update_merge_request | update_merge_request |
| ref-sqlite | write_query | write_query |
| ref-sentry | update_sentry_issue | update_sentry_issue |
| ref-memory | create_entities | delete_entities |
| ref-memory | add_observations | delete_observations |
| ref-memory | create_relations | delete_relations |
| com-kubernetes | install_helm_chart | uninstall_helm_chart |
| com-kubernetes | kubectl_context | kubectl_context |
| com-kubernetes | kubectl_create | kubectl_delete |
| com-kubernetes | kubectl_patch | kubectl_patch |
| com-kubernetes | kubectl_reconnect | kubectl_reconnect |
| com-kubernetes | kubectl_rollout | kubectl_rollout |
| com-kubernetes | kubectl_scale | kubectl_scale |
| com-kubernetes | node_management | node_management |
| com-kubernetes | port_forward | stop_port_forward |
| com-docker | create_container | remove_container |
| com-docker | start_container | stop_container |
| com-docker | pull_image | remove_image |
| com-docker | create_network | remove_network |
| com-docker | create_volume | remove_volume |
| com-aws | s3_bucket_create | s3_bucket_delete |
| com-aws | s3_object_upload | s3_object_delete |
| com-aws | dynamodb_table_create | dynamodb_table_delete |
| com-aws | dynamodb_table_update | dynamodb_table_update |
| com-aws | dynamodb_item_put | dynamodb_item_delete |
| com-aws | dynamodb_item_update | dynamodb_item_update |
| com-aws | dynamodb_item_batch_write | dynamodb_item_batch_write |
| com-aws | dynamodb_update_ttl | dynamodb_update_ttl |
| com-terraform | set_terraform_directory | set_terraform_directory |
| com-terraform | terraform_workspace | terraform_workspace |
| com-atlassian | create_issue | delete_issue |
| com-atlassian | update_issue | update_issue |
| com-atlassian | transition_issue | transition_issue |
| com-atlassian | add_watcher | remove_watcher |
| com-atlassian | create_page | delete_page |
| com-atlassian | update_page | update_page |
| com-atlassian | upload_attachment | delete_attachment |
| com-atlassian | move_page | move_page |
| com-linear | linear_update_issue | linear_update_issue |
| com-notion | notion_update_database | notion_update_database |
| com-notion | notion_update_page_properties | notion_update_page_properties |
| com-notion | notion_append_block_children | notion_delete_block |
| com-notion | notion_update_block | notion_update_block |
| com-playwright | browser_navigate | browser_navigate_back |
| com-playwright | browser_fill_form | browser_fill_form |
| com-playwright | browser_select_option | browser_select_option |
| com-playwright | browser_cookie_set | browser_cookie_delete |
| com-playwright | browser_localstorage_set | browser_localstorage_delete |
| ent-cloudflare | d1_database_create | d1_database_delete |
| ent-cloudflare | r2_bucket_create | r2_bucket_delete |
| ent-cloudflare | set_active_account | set_active_account |
| ent-cloudflare | container_file_write | container_file_delete |
| ent-stripe | customers_update | customers_update |
| ent-stripe | payment_intents_create | payment_intents_cancel |
| ent-stripe | subscriptions_create | subscriptions_cancel |
| ent-stripe | subscriptions_update | subscriptions_update |
| ent-grafana | update_annotation | update_annotation |
| ent-grafana | update_dashboard | update_dashboard |
| ent-mongodb | insert-many | delete-many |
| ent-mongodb | update-many | update-many |
| ent-neon | create_project | delete_project |
| ent-neon | create_branch | delete_branch |
| ent-neon | run_sql | run_sql |
| ent-neon | run_sql_transaction | run_sql_transaction |
| ent-supabase | pause_project | restore_project |
| ent-supabase | execute_sql | execute_sql |
| ent-supabase | create_branch | delete_branch |
| ent-supabase | update_storage_config | update_storage_config |
| ent-cloudinary | upload-asset | delete-asset |
| ent-cloudinary | asset-update | asset-update |
| ent-cloudinary | asset-rename | asset-rename |
| ent-cloudinary | create-folder | delete-folder |
| ent-cloudinary | move-folder | move-folder |
| ent-cloudinary | create-asset-relations | delete-asset-relations |
| ent-buildkite | update_pipeline | update_pipeline |
| ent-buildkite | create_build | cancel_build |
| ent-buildkite | update_cluster | update_cluster |
| ent-buildkite | update_cluster_queue | update_cluster_queue |
| ent-buildkite | pause_cluster_queue_dispatch | resume_cluster_queue_dispatch |

## Notes

- A 'bidirectional' pair requires both A→B **and** B→A in the `inverse_tool` column.

- Only state-mutating tools with a non-blank `inverse_tool` field are analysed.

- A 'dangling' edge means the named inverse does not appear as a tool in the same server.
