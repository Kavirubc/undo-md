/*
 * Stricli flag definition for --mcp-apps. Shared between start/serve commands.
 */

import { parseMcpAppsList } from "./config.js";

export const mcpAppsFlag = {
  kind: "parsed" as const,
  brief:
    "Enable MCP Apps (interactive UI). Bare flag or 'all'/'true' enables all; 'none'/'false' disables; or comma-separated: asset-gallery,asset-details,asset-upload. Env: CLOUDINARY_MCP_APPS.",
  optional: true as const,
  inferEmpty: true as const,
  parse: parseMcpAppsList,
};
