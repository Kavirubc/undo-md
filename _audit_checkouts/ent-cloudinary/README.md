# Cloudinary Asset Management MCP Server

<!-- mcp-name: io.github.cloudinary/asset-management-mcp -->

<!-- Start Summary [summary] -->
## Summary


<!-- End Summary [summary] -->

<!-- Start Table of Contents [toc] -->
## Table of Contents
<!-- $toc-max-depth=2 -->
* [Cloudinary Asset Management MCP Server](#cloudinary-asset-management-mcp-server)
  * [Installation](#installation)
  * [Configuration](#configuration)
  * [Authentication](#authentication)
  * [Available Tools](#available-tools)
  * [Custom Tools](#custom-tools)
  * [Progressive Discovery](#progressive-discovery)
* [Development](#development)
  * [Building from Source](#building-from-source)
  * [Contributions](#contributions)

<!-- End Table of Contents [toc] -->

<!-- Start Installation [installation] -->
## Installation

<details>
<summary>Claude Desktop</summary>

Install the MCP server as a Desktop Extension using the pre-built [`mcp-server.mcpb`](https://github.com/cloudinary/asset-management-mcp/releases/download/v0.9.0/mcp-server.mcpb) file:

Simply drag and drop the [`mcp-server.mcpb`](https://github.com/cloudinary/asset-management-mcp/releases/download/v0.9.0/mcp-server.mcpb) file onto Claude Desktop to install the extension.

The MCP bundle package includes the MCP server and all necessary configuration. Once installed, the server will be available without additional setup.

> [!NOTE]
> MCP bundles provide a streamlined way to package and distribute MCP servers. Learn more about [Desktop Extensions](https://www.anthropic.com/engineering/desktop-extensions).

</details>

<details>
<summary>Cursor</summary>

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](cursor://anysphere.cursor-deeplink/mcp/install?name=CloudinaryAssetMgmt&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJAY2xvdWRpbmFyeS9hc3NldC1tYW5hZ2VtZW50LW1jcCIsInN0YXJ0IiwiLS1hcGkta2V5IiwiIiwiLS1hcGktc2VjcmV0IiwiIiwiLS1jbG91ZC1uYW1lIiwiIl19)

Or manually:

1. Open Cursor Settings
2. Select Tools and Integrations
3. Select New MCP Server
4. If the configuration file is empty paste the following JSON into the MCP Server Configuration:

```json
{
  "command": "npx",
  "args": [
    "@cloudinary/asset-management-mcp",
    "start",
    "--api-key",
    "",
    "--api-secret",
    "",
    "--cloud-name",
    ""
  ]
}
```

</details>

<details>
<summary>Claude Code CLI</summary>

```bash
claude mcp add CloudinaryAssetMgmt -- npx -y @cloudinary/asset-management-mcp start --api-key  --api-secret  --cloud-name 
```

</details>
<details>
<summary>Gemini</summary>

```bash
gemini mcp add CloudinaryAssetMgmt -- npx -y @cloudinary/asset-management-mcp start --api-key  --api-secret  --cloud-name 
```

</details>
<details>
<summary>Windsurf</summary>

Refer to [Official Windsurf documentation](https://docs.windsurf.com/windsurf/cascade/mcp#adding-a-new-mcp-plugin) for latest information

1. Open Windsurf Settings
2. Select Cascade on left side menu
3. Click on `Manage MCPs`. (To Manage MCPs you should be signed in with a Windsurf Account)
4. Click on `View raw config` to open up the mcp configuration file.
5. If the configuration file is empty paste the full json

```bash
{
  "command": "npx",
  "args": [
    "@cloudinary/asset-management-mcp",
    "start",
    "--api-key",
    "",
    "--api-secret",
    "",
    "--cloud-name",
    ""
  ]
}
```
</details>
<details>
<summary>VS Code</summary>

[![Install in VS Code](https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20CloudinaryAssetMgmt%20MCP&color=0098FF)](vscode://ms-vscode.vscode-mcp/install?name=CloudinaryAssetMgmt&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJAY2xvdWRpbmFyeS9hc3NldC1tYW5hZ2VtZW50LW1jcCIsInN0YXJ0IiwiLS1hcGkta2V5IiwiIiwiLS1hcGktc2VjcmV0IiwiIiwiLS1jbG91ZC1uYW1lIiwiIl19)

Or manually:

Refer to [Official VS Code documentation](https://code.visualstudio.com/api/extension-guides/ai/mcp) for latest information

1. Open [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)
1. Search and open `MCP: Open User Configuration`. This should open mcp.json file
2. If the configuration file is empty paste the full json

```bash
{
  "command": "npx",
  "args": [
    "@cloudinary/asset-management-mcp",
    "start",
    "--api-key",
    "",
    "--api-secret",
    "",
    "--cloud-name",
    ""
  ]
}
```

</details>
<details>
<summary> Stdio installation via npm </summary>
To start the MCP server, run:

```bash
npx @cloudinary/asset-management-mcp start --api-key  --api-secret  --cloud-name 
```

For a full list of server arguments, run:

```
npx @cloudinary/asset-management-mcp --help
```

</details>
<!-- End Installation [installation] -->

## Configuration

### Environment Variables

The MCP server supports the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | Yes |
| `CLOUDINARY_URL` | Complete Cloudinary URL (alternative to individual vars) | No |
| `CLOUDINARY_COLLECT_HEADERS` | Collect API response headers (see below) | No |
| `CLOUDINARY_MCP_APPS` | Enable MCP Apps (see [MCP Apps](#mcp-apps)) | No |

### CLOUDINARY_URL Format

You can use a single `CLOUDINARY_URL` instead of individual variables:

```bash
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

### Response Header Collection

You can configure the server to include Cloudinary API response headers (such as `x-request-id` and rate limit info) in tool output. This is useful for debugging and monitoring.

Set `CLOUDINARY_COLLECT_HEADERS` to control which headers are collected:

```bash
# Collect all response headers
CLOUDINARY_COLLECT_HEADERS=true

# Collect specific headers by exact name (comma-separated)
CLOUDINARY_COLLECT_HEADERS=x-request-id,x-featureratelimit-limit,x-featureratelimit-remaining

# Mix exact names, prefix matching, and regex matching
CLOUDINARY_COLLECT_HEADERS=x-request-id,prefix:x-featureratelimit-
```

#### Header matching specs

Each entry in the comma-separated list is matched against response header names:

| Format | Example | Behaviour |
|--------|---------|-----------|
| exact name | `x-request-id` | matches only `x-request-id` |
| `prefix:<value>` | `prefix:x-featureratelimit-` | matches any header starting with `x-featureratelimit-` |
| `regex:<pattern>` | `regex:ratelimit` | matches any header whose name contains `ratelimit` |

You can also set this via the `CLOUDINARY_URL` query parameter:

```bash
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME?collect_headers=true
```

When enabled, collected headers appear in an `_headers` field in the tool response. When not set, no headers are collected and responses are unchanged.

### MCP Apps

The server can expose interactive MCP UI **Apps** (spec-aligned with `io.modelcontextprotocol/ui`) that hosts can render alongside tool results — for example, an asset gallery for list results, a single-asset detail view, and an upload UI.

Apps are **opt-in**. Use the `--mcp-apps` flag (available on both `start` and `serve`) or the `CLOUDINARY_MCP_APPS` environment variable to enable them:

| Value | Effect |
|-------|--------|
| bare `--mcp-apps` (no value), `all`, or `true` | Enable every app |
| `none` or `false` | Disable every app (kill-switch) |
| comma-separated subset, e.g. `asset-gallery,asset-details` | Enable only the listed apps |
| unset | Default (currently **off**; may flip on in a future release) |

Available app names: `asset-gallery`, `asset-details`, `asset-upload`.

```bash
# Enable all apps via CLI flag (bare flag implies "all")
npx @cloudinary/asset-management-mcp start --mcp-apps

# Equivalent: explicit value
npx @cloudinary/asset-management-mcp start --mcp-apps all

# Enable just the gallery via env var
CLOUDINARY_MCP_APPS=asset-gallery npx @cloudinary/asset-management-mcp start

# Explicitly disable
npx @cloudinary/asset-management-mcp serve --mcp-apps none
```

Precedence: CLI flag > environment variable > built-in default.

<!-- Start Authentication [security] -->

## Authentication

The MCP server uses your Cloudinary API key and secret for authentication:

```json
{
  "env": {
    "CLOUDINARY_CLOUD_NAME": "demo",
    "CLOUDINARY_API_KEY": "123456789012345",
    "CLOUDINARY_API_SECRET": "abcdefghijklmnopqrstuvwxyz12"
  }
}
```

<!-- End Authentication [security] -->

## Available Tools

The MCP server exposes Cloudinary's Asset Management API as tools. Use your AI application to discover and invoke the available tools for uploading, managing, searching, and transforming your media assets.

### Usage Examples

#### Example 1: Upload and Transform an Image

```yaml
1. Upload a local image: "Upload file:///Users/me/photo.jpg to Cloudinary as 'hero-image'"
2. Transform it: "Transform asset 'hero-image' with transformations 'c_fill,w_800,h_600/e_sharpen'"
3. Get details: "Show me details for asset with ID [asset-id]"
```

#### Example 2: Search and Organize Assets

```yaml
1. Search for images: "Find all images with tag 'product' uploaded in the last 7 days"
2. Create folder: "Create a new folder called 'summer-2024-products'"
3. List assets: "Show me all video assets in the 'marketing' folder"
```

#### Example 3: Generate Archive

```yaml
1. Get transformation docs: "Show me the Cloudinary transformation reference"
2. Apply transformations: "Transform 'banner' asset with 'c_scale,w_1200/f_auto,q_auto'"
3. Create archive: "Generate a ZIP archive of all images with tag 'export-ready'"
```

#### Example 4: Asset Management Workflow

```yaml
1. Upload multiple files: "Upload all images from folder /assets/new-products/"
2. Add tags: "Update asset [asset-id] and add tags 'featured,homepage'"
3. Get usage stats: "Show my Cloudinary account usage statistics"
```

## Custom Tools

This MCP server includes two powerful custom tools:

### `get-tx-reference`

Retrieves the complete Cloudinary transformation reference documentation.

**When to use:**

- Before creating or modifying transformations
- When user asks about image/video effects, resizing, cropping, filters

**Example:**

```sh
Use get-tx-reference to learn about available transformations
```

### `transform-asset`

Applies transformations to existing assets using Cloudinary's explicit API.

**Parameters:**

- `publicId` - The asset's public ID
- `transformations` - Transformation string (e.g., `c_fill,w_300,h_200`)
- `resourceType` - Type: `image`, `video`, or `raw` (default: `image`)
- `invalidate` - Invalidate CDN cache (default: `false`)

**Example:**

```sh
Transform asset "sample" with transformations "c_fill,w_500,h_500/e_sepia"
```

<!-- Start Progressive Discovery [dynamic-mode] -->
## Progressive Discovery

MCP servers with many tools can bloat LLM context windows, leading to increased token usage and tool confusion. Dynamic mode solves this by exposing only a small set of meta-tools that let agents progressively discover and invoke tools on demand.

To enable dynamic mode, pass the `--mode dynamic` flag when starting your server:

```jsonc
{
  "mcpServers": {
    "CloudinaryAssetMgmt": {
      "command": "npx",
      "args": ["@cloudinary/asset-management-mcp", "start", "--mode", "dynamic"],
      // ... other server arguments
    }
  }
}
```

In dynamic mode, the server registers only the following meta-tools instead of every individual tool:

- **`list_tools`**: Lists all available tools with their names and descriptions.
- **`describe_tool_input`**: Returns the input schema for one or more tools by name.
- **`execute_tool`**: Executes a tool by name with its arguments.
- **`list_scopes`**: Lists the scopes available on the server.

This approach significantly reduces the number of tokens sent to the LLM on each request, which is especially useful for servers with a large number of tools.

You can combine dynamic mode with scope and tool filters:

```jsonc
{
  "mcpServers": {
    "CloudinaryAssetMgmt": {
      "command": "npx",
      "args": ["@cloudinary/asset-management-mcp", "start", "--mode", "dynamic", "--scope", "admin"],
      // ... other server arguments
    }
  }
}
```
<!-- End Progressive Discovery [dynamic-mode] -->

# Development

## Building from Source

### Prerequisites

- Node.js v20 or higher
- npm, pnpm, bun, or yarn

### Build Steps

```bash
# Clone the repository
git clone https://github.com/cloudinary/asset-management-mcp.git
cd asset-management-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start
```

### Project Structure

```ini
asset-management-mcp/
├── src/
│   ├── hooks/              # SDK hooks (manual)
│   │   ├── cloudinaryAuthHook.ts   # Auth & file:// handling
│   │   ├── customHeadersHook.ts    # Inject custom request headers
│   │   ├── responseHeadersHook.ts  # Collect response headers
│   │   ├── userAgentHook.ts        # Build User-Agent string
│   │   └── registration.ts         # Hook registration
│   ├── mcp-server/         # MCP server implementation
│   │   ├── server.ts             # Main server (auto-generated)
│   │   ├── server.extensions.ts  # Custom tools & app wiring (manual)
│   │   ├── tools/                # Generated tool wrappers
│   │   └── apps/                 # MCP UI Apps (manual)
│   │       ├── config.ts             # App registry & --mcp-apps parsing
│   │       ├── cli-flag.ts           # stricli flag definition
│   │       ├── extensions.ts         # Resource-template registration
│   │       ├── uri.ts                # App URI helpers / tool-name injection
│   │       ├── tool-hooks.ts         # Per-tool app hooks
│   │       ├── app-shared.ts         # Shared app utilities
│   │       ├── asset-gallery-app.ts  # List results gallery UI
│   │       ├── asset-details-app.ts  # Single-asset detail UI
│   │       └── asset-upload-app.ts   # Upload UI
│   ├── funcs/              # API function implementations
│   └── models/             # Type definitions
├── .github/
│   └── workflows/          # CI/CD workflows
└── .speakeasy/             # Speakeasy configuration
```

## Contributions

While we value contributions to this MCP Server, most of the code is generated programmatically from the Cloudinary API spec. Any manual changes to generated files will be overwritten on the next generation — please direct your changes to the manual extension points below.

**What you can contribute:**

- Custom tools and server wiring in `src/mcp-server/server.extensions.ts`
- MCP UI Apps in `src/mcp-server/apps/` (gallery, details, upload, and new apps)
- SDK hooks in `src/hooks/` (auth, custom headers, response headers, user agent)
- Documentation improvements (this README, JSDoc on manual files)
- Bug reports and feature requests

**Generated files (do not edit):**

- `src/mcp-server/server.ts`
- `src/mcp-server/tools/*.ts`
- `src/funcs/*.ts`
- `src/models/*.ts`

When touching generated files is unavoidable, prefer updating the upstream spec or Speakeasy configuration in `.speakeasy/` so the change survives regeneration.

We look forward to hearing your feedback. Feel free to open a PR or issue with a proof of concept and we'll do our best to include it in a future release.

---

### MCP Server Created by [Speakeasy](https://www.speakeasy.com/?utm_source=asset-management-mcp&utm_campaign=mcp-typescript)

<!-- Placeholder for Future Speakeasy SDK Sections -->
