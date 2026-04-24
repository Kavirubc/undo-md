/*
 * Registers MCP App UI resource templates (gallery, details, upload) on the
 * server. Each template handles all per-tool variants and bakes the tool name
 * into the served HTML so the app knows which tool it represents — without
 * relying on _meta surviving the host's tool-result pipeline.
 *
 * Each registration is gated on the set of enabled apps so users can opt in
 * per app via --mcp-apps or CLOUDINARY_MCP_APPS.
 */

import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Register } from "../extensions.js";
import { getAssetGalleryHtml } from "./asset-gallery-app.js";
import { getAssetDetailsHtml } from "./asset-details-app.js";
import { getAssetUploadHtml } from "./asset-upload-app.js";
import type { McpApp } from "./config.js";
import { appUri, appUriTemplate, MCP_APP_MIME_TYPE } from "./uri.js";

const CSP_RESOURCE_DOMAINS = [
  "https://res.cloudinary.com",
  "https://*.cloudinary.com",
];

type AppSpec = {
  app: McpApp;
  name: string;
  description: string;
  tools: readonly { tool: string; title: string }[];
  render: (toolName?: string) => string;
};

const APP_SPECS: readonly AppSpec[] = [
  {
    app: "asset-gallery",
    name: "Asset Gallery",
    description:
      "Interactive asset gallery for browsing Cloudinary images, videos, files, and search results",
    tools: [
      { tool: "list-images", title: "Browse Images" },
      { tool: "list-videos", title: "Browse Videos" },
      { tool: "list-files", title: "Browse Files" },
      { tool: "search-assets", title: "Search Assets" },
    ],
    render: getAssetGalleryHtml,
  },
  {
    app: "asset-details",
    name: "Asset Details",
    description: "Interactive single-asset detail view for Cloudinary assets",
    tools: [{ tool: "get-asset-details", title: "Asset Details" }],
    render: getAssetDetailsHtml,
  },
  {
    app: "asset-upload",
    name: "Asset Upload",
    description:
      "Interactive upload interface for uploading assets to Cloudinary",
    tools: [{ tool: "upload-asset", title: "Upload Asset" }],
    render: getAssetUploadHtml,
  },
];

function appResourceContent(uri: URL, html: string) {
  return {
    contents: [{
      uri: uri.toString(),
      mimeType: MCP_APP_MIME_TYPE,
      text: html,
      _meta: { ui: { csp: { resourceDomains: CSP_RESOURCE_DOMAINS } } },
      // deno-lint-ignore no-explicit-any
    } as any],
  };
}

export function registerAppResources(
  register: Register,
  enabledApps: Set<McpApp>,
): void {
  for (const spec of APP_SPECS) {
    if (!enabledApps.has(spec.app)) continue;

    register.resourceTemplate({
      name: spec.name,
      description: spec.description,
      metadata: { mimeType: MCP_APP_MIME_TYPE },
      resource: new ResourceTemplate(appUriTemplate(spec.app), {
        list: async () => ({
          resources: spec.tools.map(({ tool, title }) => ({
            uri: appUri(spec.app, tool),
            name: title,
            mimeType: MCP_APP_MIME_TYPE,
          })),
        }),
      }),
      scopes: [],
      read: async (_client, uri, vars, _extra) => {
        const tool = String(vars["tool"] ?? "");
        return appResourceContent(uri, spec.render(tool || undefined));
      },
    });
  }
}
