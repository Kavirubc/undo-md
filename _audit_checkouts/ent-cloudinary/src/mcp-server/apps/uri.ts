/*
 * Single convention for MCP App UI resource URIs.
 *
 * Shape: ui://cloudinary/<app>/<tool>.html
 *
 * The tool name in the URI is the sole carrier of tool identity for the UI
 * (baked into the served HTML as window.__MCP_TOOL_NAME__), so every URI
 * produced or matched by the server goes through the helpers below.
 */

import type { McpApp } from "./config.js";

export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app";

const ROOT = "ui://cloudinary";

export function appUri(app: McpApp, toolName: string): string {
  return `${ROOT}/${app}/${toolName}.html`;
}

export function appUriTemplate(app: McpApp): string {
  return `${ROOT}/${app}/{tool}.html`;
}

export function appUriPrefix(app: McpApp): string {
  return `${ROOT}/${app}/`;
}

/**
 * Bake the tool name into the served HTML so the app can read it from
 * `window.__MCP_TOOL_NAME__` regardless of whether the host forwards _meta.
 */
export function injectToolName(html: string, toolName?: string): string {
  if (!toolName) return html;
  const inject =
    `<script>window.__MCP_TOOL_NAME__=${JSON.stringify(toolName)};</script>`;
  return html.replace("</head>", `${inject}</head>`);
}
