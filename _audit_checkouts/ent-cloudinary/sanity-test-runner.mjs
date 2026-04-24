/**
 * Full sanity test runner — all phases including destructive operations.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const BASE = "http://localhost:2718";
const USE_STREAMABLE = process.argv.includes("--streamable");
let passed = 0, failed = 0;

function log(label, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${label}${detail ? " — " + detail : ""}`);
  ok ? passed++ : failed++;
}

async function callTool(client, name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { text, json, isError: res.isError };
}

async function main() {
  const RUN_ID = Date.now().toString(36);
  const PFX = `sanity-${RUN_ID}`;
  console.log(`\n=== MCP Full Sanity Test Runner (run ${RUN_ID}) ===\n`);

  const transport = USE_STREAMABLE
    ? new StreamableHTTPClientTransport(new URL("/mcp", BASE))
    : new SSEClientTransport(new URL("/sse", BASE));
  const client = new Client({ name: "sanity-test", version: "1.0.0" });
  await client.connect(transport);
  console.log(`Connected to MCP server (${USE_STREAMABLE ? "streamable HTTP" : "SSE"})\n`);

  // ─── Phase 0: Hook verification ───
  console.log("--- Phase 0: Hook verification ---\n");
  {
    const { json, isError } = await callTool(client, "get-usage-details");
    const hdrs = json?._headers;
    log("0.2 _headers present", !!hdrs && !isError);
    if (hdrs) {
      log("0.2a exact: x-request-id", "x-request-id" in hdrs, hdrs["x-request-id"]);
      const rl = Object.keys(hdrs).filter((k) => k.startsWith("x-featureratelimit-"));
      log("0.2b prefix: x-featureratelimit-*", rl.length > 0, rl.join(", "));
    }
  }

  // ─── Phase 1: Read-only ───
  console.log("\n--- Phase 1: Read-only tools ---\n");
  {
    const { json, isError } = await callTool(client, "get-usage-details");
    log("1.1 get-usage-details", !isError && json?.plan != null, json?.plan);
  }
  {
    const { json, isError } = await callTool(client, "list-images", { max_results: 3, fields: ["filename","format","bytes","width","height"] });
    log("1.2 list-images", !isError && json?.resources?.length > 0, `${json?.resources?.length ?? 0} resource(s)`);
  }
  {
    const { json, isError } = await callTool(client, "list-videos", { max_results: 3 });
    log("1.3 list-videos", !isError, `${json?.resources?.length ?? 0} resource(s)`);
  }
  {
    const { json, isError } = await callTool(client, "list-files", { max_results: 3 });
    log("1.4 list-files", !isError, `${json?.resources?.length ?? 0} resource(s)`);
  }
  {
    const { json, isError } = await callTool(client, "list-tags", { resource_type: "image", max_results: 5 });
    log("1.5 list-tags", !isError && json?.tags != null, `${json?.tags?.length ?? 0} tag(s)`);
  }
  {
    const { json, isError } = await callTool(client, "search-assets", { request: { expression: "resource_type:image AND format:jpg", max_results: 2 } });
    log("1.6 search-assets", !isError && json?.total_count != null, `total_count=${json?.total_count}`);
  }
  {
    const { json, isError } = await callTool(client, "search-folders", { max_results: 5 });
    log("1.7 search-folders", !isError, `${json?.total_count ?? "?"} folder(s)`);
  }
  {
    const { text, isError } = await callTool(client, "get-tx-reference");
    log("1.8 get-tx-reference", !isError && text?.includes("# Cloudinary Transformation Rules"), "ok");
  }

  // ─── Phase 2: Upload and create ───
  console.log("\n--- Phase 2: Upload and asset creation ---\n");
  let assetId1, assetId2;
  {
    const { json, isError } = await callTool(client, "upload-asset", {
      resource_type: "image",
      upload_request: {
        file: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        public_id: `${PFX}-upload`,
        tags: PFX,
      },
    });
    assetId1 = json?.asset_id;
    log("2.1 upload-asset (remote URL)", !isError && !!assetId1, `asset_id=${assetId1}`);
  }
  {
    const { json, isError } = await callTool(client, "create-folder", { folder: `${PFX}-folder` });
    log("2.3 create-folder", !isError, json?.name || json?.path || "created");
  }

  // ─── Phase 3: Read details ───
  console.log("\n--- Phase 3: Read details ---\n");
  if (assetId1) {
    const { json, isError } = await callTool(client, "get-asset-details", { asset_id: assetId1 });
    log("3.1 get-asset-details", !isError && json?.public_id === `${PFX}-upload`, `public_id=${json?.public_id}`);
  } else {
    log("3.1 get-asset-details", false, "skipped — no asset_id from 2.1");
  }
  {
    const { json, isError } = await callTool(client, "search-assets", { request: { expression: `tags:${PFX}`, max_results: 10 } });
    log("3.2 search-assets (by tag)", !isError && json?.total_count > 0, `total_count=${json?.total_count}`);
  }
  {
    const { json, isError } = await callTool(client, "visual-search-assets", { request: { text: "landscape with mountains" } });
    log("3.3 visual-search-assets", !isError, `${json?.total_count ?? json?.resources?.length ?? "?"} result(s)`);
  }

  // ─── Phase 4: Transform ───
  console.log("\n--- Phase 4: Transform ---\n");
  {
    const { json, isError } = await callTool(client, "transform-asset", {
      publicId: `${PFX}-upload`,
      transformations: "c_fill,g_auto,h_300,w_400/f_auto/q_auto",
    });
    const eager = json?.eager?.[0];
    log("4.1 transform fill+auto", !isError && eager?.width === 400 && eager?.height === 300,
      eager ? `${eager.width}x${eager.height} ${eager.format}` : "no eager");
  }
  {
    const { json, isError } = await callTool(client, "transform-asset", {
      publicId: `${PFX}-upload`,
      transformations: "e_sepia/c_scale,w_600/f_webp/q_80",
    });
    const eager = json?.eager?.[0];
    log("4.2 transform sepia+webp", !isError && eager?.format === "webp" && eager?.width === 600,
      eager ? `${eager.width} ${eager.format}` : "no eager");
  }
  {
    const { json, isError } = await callTool(client, "transform-asset", {
      publicId: `${PFX}-upload`,
      transformations: "c_thumb,g_face,h_200,w_200/r_max/f_png",
    });
    const eager = json?.eager?.[0];
    log("4.3 transform circular thumb", !isError && eager?.format === "png" && eager?.width === 200,
      eager ? `${eager.width}x${eager.height} ${eager.format}` : "no eager");
  }

  // ─── Phase 5: Update and mutate ───
  console.log("\n--- Phase 5: Update and mutate ---\n");
  if (assetId1) {
    const { json, isError } = await callTool(client, "asset-update", {
      asset_id: assetId1,
      ResourceUpdateRequest: { tags: `${PFX},updated`, context: "caption=Sanity test image|alt=A sample image" },
    });
    log("5.1 asset-update (tags+context)", !isError, json?.tags ? `tags=${json.tags}` : "updated");
  } else {
    log("5.1 asset-update", false, "skipped");
  }
  {
    const { json, text, isError } = await callTool(client, "asset-rename", {
      resource_type: "image",
      RequestBody: { from_public_id: `${PFX}-upload`, to_public_id: `${PFX}-renamed` },
    });
    if (!json?.public_id) console.log("  DEBUG 5.2 raw text:", text?.slice(0, 500));
    log("5.2 asset-rename", !isError && json?.public_id === `${PFX}-renamed`, `public_id=${json?.public_id}`);
  }
  {
    const { json, isError } = await callTool(client, "move-folder", {
      folder: `${PFX}-folder`,
      RequestBody: { to_folder: `${PFX}-folder-moved` },
    });
    log("5.4 move-folder", !isError, "moved");
  }
  {
    const { json, isError } = await callTool(client, "generate-archive", {
      resource_type: "image",
      RequestBody: {
        public_ids: [`${PFX}-renamed`],
        target_public_id: `${PFX}-archive`,
        target_format: "zip",
      },
    });
    log("5.5 generate-archive", !isError && !!json?.secure_url, json?.secure_url ? "has secure_url" : "no url");
  }

  // ─── Phase 6: Cleanup ───
  console.log("\n--- Phase 6: Cleanup ---\n");

  // Get derived IDs for cleanup
  let derivedIds = [];
  if (assetId1) {
    const { json } = await callTool(client, "get-asset-details", { asset_id: assetId1 });
    derivedIds = (json?.derived || []).map((d) => d.derived_resource_id).filter(Boolean);
  }
  if (derivedIds.length > 0) {
    const { isError } = await callTool(client, "delete-derived-assets", { request: { derived_resource_ids: derivedIds } });
    log("6.2 delete-derived-assets", !isError, `${derivedIds.length} derived`);
  } else {
    log("6.2 delete-derived-assets", true, "none to delete");
  }

  if (assetId1) {
    const { isError } = await callTool(client, "delete-asset", { request: { asset_id: assetId1 } });
    log("6.3 delete-asset (test image)", !isError, assetId1);
  }

  {
    const { isError } = await callTool(client, "delete-folder", { folder: `${PFX}-folder-moved` });
    log("6.4 delete-folder", !isError, `${PFX}-folder-moved`);
  }

  // Delete the archive raw file
  {
    const { json } = await callTool(client, "search-assets", { request: { expression: `public_id:${PFX}-archive*`, max_results: 5 } });
    if (json?.resources?.length > 0) {
      for (const r of json.resources) {
        await callTool(client, "delete-asset", { request: { asset_id: r.asset_id } });
      }
      log("6.4b delete archive asset", true, `cleaned ${json.resources.length} archive(s)`);
    }
  }

  {
    const { json, isError } = await callTool(client, "search-assets", { request: { expression: `tags:${PFX}`, max_results: 10 } });
    log("6.5 final verification", !isError && json?.total_count === 0, `total_count=${json?.total_count}`);
  }

  // ─── Summary ───
  console.log(`\n=== Summary: ${passed + failed} total, ${passed} passed, ${failed} failed ===\n`);

  await client.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(2); });
