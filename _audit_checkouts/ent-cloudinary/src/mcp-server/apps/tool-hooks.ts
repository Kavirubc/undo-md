/*
 * Hooks wired into tools.ts to gate App UI metadata on the --mcp-apps flag.
 * Tool identity is conveyed via the per-tool resource URI itself (the
 * gallery/details/upload apps inject window.__MCP_TOOL_NAME__ into their HTML
 * at serve time), so we no longer stamp the tool name onto CallToolResult.
 */

export function shouldForwardToolMeta(
  meta: Record<string, unknown> | undefined,
  enabledUriPrefixes: readonly string[],
): boolean {
  if (!meta) return false;
  const ui = (meta as { ui?: { resourceUri?: unknown } }).ui;
  const uri = ui && typeof ui.resourceUri === "string"
    ? ui.resourceUri
    : undefined;
  if (!uri) return true;
  return enabledUriPrefixes.some((p) => uri.startsWith(p));
}
