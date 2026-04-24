# MCP Servers for the Audit — 30 servers, three buckets

Target sample size: 30. List below has 33 candidates to allow room for dropping
any that turn out to be unreadable (unreachable repo, non-standard tool
declaration, stale fork). Pin the commit SHA when you classify; record it in
the sheet.

## Bucket A — Official MCP reference servers (11 candidates, target 10)

From `github.com/modelcontextprotocol/servers` and the main MCP
specification's reference implementations.

| # | Server | URL |
|---|---|---|
| 1 | filesystem | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem |
| 2 | git | https://github.com/modelcontextprotocol/servers/tree/main/src/git |
| 3 | github | https://github.com/modelcontextprotocol/servers/tree/main/src/github |
| 4 | gitlab | https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab |
| 5 | postgres | https://github.com/modelcontextprotocol/servers/tree/main/src/postgres |
| 6 | sqlite | https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite |
| 7 | slack | https://github.com/modelcontextprotocol/servers/tree/main/src/slack |
| 8 | google-drive | https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive |
| 9 | sentry | https://github.com/modelcontextprotocol/servers/tree/main/src/sentry |
| 10 | puppeteer | https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer |
| 11 | memory | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |

## Bucket B — Top community MCP servers (11 candidates, target 10)

From the `punkpeye/awesome-mcp-servers` curated list, picking
high-star servers where a reasonable fraction of tools mutate state.

| # | Server | URL |
|---|---|---|
| 12 | kubernetes | https://github.com/Flux159/mcp-server-kubernetes |
| 13 | docker | https://github.com/ckreiling/mcp-server-docker |
| 14 | aws | https://github.com/rishikavikondala/mcp-server-aws |
| 15 | terraform (tfmcp) | https://github.com/nwiizo/tfmcp |
| 16 | atlassian (Jira/Confluence) | https://github.com/sooperset/mcp-atlassian |
| 17 | linear | https://github.com/jerhadf/linear-mcp-server |
| 18 | notion | https://github.com/suekou/mcp-notion-server |
| 19 | figma | https://github.com/GLips/Figma-Context-MCP |
| 20 | playwright | https://github.com/microsoft/playwright-mcp |
| 21 | exa search | https://github.com/exa-labs/exa-mcp-server |
| 22 | brave search | https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search |

## Bucket C — Enterprise vendor MCP servers (11 candidates, target 10)

Published or endorsed by the vendor of the underlying product.

| # | Server | URL |
|---|---|---|
| 23 | cloudflare | https://github.com/cloudflare/mcp-server-cloudflare |
| 24 | stripe (agent toolkit) | https://github.com/stripe/agent-toolkit |
| 25 | grafana | https://github.com/grafana/mcp-grafana |
| 26 | elasticsearch | https://github.com/elastic/mcp-server-elasticsearch |
| 27 | pinecone | https://github.com/pinecone-io/pinecone-mcp |
| 28 | mongodb | https://github.com/mongodb-js/mongodb-mcp-server |
| 29 | neon | https://github.com/neondatabase/mcp-server-neon |
| 30 | supabase | https://github.com/supabase-community/supabase-mcp |
| 31 | cloudinary | https://github.com/cloudinary/asset-management-mcp |
| 32 | buildkite | https://github.com/buildkite/buildkite-mcp-server |
| 33 | databricks | https://github.com/RafaelCartenet/mcp-databricks-server |

## Why this mix

- **Bucket A** establishes a baseline: official reference servers represent
  what the protocol authors themselves think good MCP servers look like.
- **Bucket B** tells us about community practice: these are the MCP servers
  people are actually installing.
- **Bucket C** covers the enterprise reality: these servers expose durable,
  billable, or compliance-sensitive state, and are the ones most likely to
  have considered scope-gating deliberately.

If all three buckets show similar gap patterns, the finding is robust. If
they diverge, the divergence itself is the story (e.g. "vendor servers gate
inverses more aggressively because of least-privilege posture").

## Picking commits
For each server:

```bash
git clone <url> /tmp/mcp-<name>
cd /tmp/mcp-<name>
git log -1 --format="%H %ci"
```

Record the SHA and date. If the server publishes its tool list in a
discoverable format (TypeScript `server.registerTool(...)`, Python
`@mcp.tool()` decorator, or a static JSON), extract it directly. Otherwise,
read the main server file end-to-end and transcribe the tool list by hand —
slower, but unavoidable for servers that generate schemas dynamically.
