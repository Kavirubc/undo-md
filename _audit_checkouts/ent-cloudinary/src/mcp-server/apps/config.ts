/*
 * MCP Apps configuration: types, constants, flag/env parsing, and resolution.
 */

import { appUriPrefix } from "./uri.js";

export type McpApp = "asset-gallery" | "asset-details" | "asset-upload";

export const MCP_APPS: readonly McpApp[] = [
  "asset-gallery",
  "asset-details",
  "asset-upload",
];

// Flip to [...MCP_APPS] to enable MCP Apps by default.
export const DEFAULT_MCP_APPS: readonly McpApp[] = [];

export function parseMcpAppsList(value: string): McpApp[] {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  // Bare `--mcp-apps` (empty value via inferEmpty) behaves like "all".
  if (parts.length === 0) return [...MCP_APPS];
  if (parts.length === 1) {
    const v = parts[0]!.toLowerCase();
    if (v === "all" || v === "true") return [...MCP_APPS];
    if (v === "none" || v === "false") return [];
  }
  for (const p of parts) {
    if (!MCP_APPS.includes(p as McpApp)) {
      throw new Error(
        `Invalid mcp-apps value: "${p}". Valid: ${
          MCP_APPS.join(", ")
        }, all/true, none/false`,
      );
    }
  }
  return parts as McpApp[];
}

export function resolveMcpApps(flag: McpApp[] | undefined): McpApp[] {
  if (flag !== undefined) return flag;
  const env = process.env["CLOUDINARY_MCP_APPS"];
  if (env != null) return parseMcpAppsList(env);
  return [...DEFAULT_MCP_APPS];
}

export function enabledAppUriPrefixes(apps: readonly McpApp[]): string[] {
  return apps.map(appUriPrefix);
}
