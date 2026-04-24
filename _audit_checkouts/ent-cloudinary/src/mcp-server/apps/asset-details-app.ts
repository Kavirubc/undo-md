/*
 * Standalone MCP App for displaying a single Cloudinary asset
 * in a rich detail view. Attached to the get-asset-details tool.
 *
 * Shares CLDS tokens, MCPApp client, helpers, and detail renderers
 * with the gallery app via app-shared.ts.
 */

import {
  SHARED_CSS_TOKENS,
  SHARED_CSS_COMPONENTS,
  SHARED_JS_MCP_CLIENT,
  SHARED_JS_HELPERS,
  SHARED_JS_TOOLTIPS,
  SHARED_JS_MODAL,
  SHARED_JS_DETAIL_RENDERERS,
  SHARED_JS_HOST_CONTEXT,
} from "./app-shared.js";
import { injectToolName } from "./uri.js";

export function getAssetDetailsHtml(toolName?: string): string {
  return injectToolName(ASSET_DETAILS_HTML, toolName);
}

const ASSET_DETAILS_CSS = /* css */ `
.details-header {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: var(--cld-sp-md);
  margin-bottom: var(--cld-sp-md);
  border-bottom: 1px solid var(--cld-border);
}

.details-header-thumb {
  width: 56px; height: 56px; border-radius: var(--cld-radius);
  object-fit: cover; background: var(--cld-bg3); flex-shrink: 0;
}

.details-header-icon {
  width: 56px; height: 56px; border-radius: var(--cld-radius);
  background: var(--cld-bg3); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.details-header-icon svg { width: 28px; height: 28px; }

.details-header-info { flex: 1; min-width: 0; }

.details-header-name {
  font-size: 16px; font-weight: 600; color: var(--cld-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.details-header-sub {
  font-size: 12px; color: var(--cld-text3); margin-top: 2px;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}

.details-header-sub .pill {
  font-size: 10px; color: var(--cld-text2); background: var(--cld-bg3);
  padding: 2px 7px; border-radius: 4px; border: 1px solid var(--cld-border);
}

.open-link {
  padding: 6px 14px; border-radius: var(--cld-radius-sm);
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--cld-accent); background: transparent;
  color: var(--cld-accent); font-family: inherit;
  transition: background 0.15s;
  white-space: nowrap; flex-shrink: 0;
}
.open-link:hover { background: var(--cld-accent-bg); }

.hero-container {
  position: relative; margin-bottom: var(--cld-sp-md);
  border-radius: var(--cld-radius); overflow: hidden;
  background: var(--cld-bg3);
}

.hero-container img {
  width: 100%; max-height: 300px; object-fit: contain; display: block;
}
.hero-container video {
  width: 100%; max-height: 300px; display: block;
}
.hero-container .hero-audio-wrap {
  border-radius: 0;
}

.hero-container .file-icon {
  padding: 40px 20px;
}
.hero-container .file-icon svg { width: 48px; height: 48px; }

.details-content .detail-section { padding: 14px 0; }
.details-content .detail-section:first-child { padding-top: 0; }
`;

const ASSET_DETAILS_JS = /* js */ `
var LOG_PREFIX = "[details]";
var MIN_HEIGHT = 120;
var pendingCall = { name: null, args: null };

var app = new MCPApp({ name: "Cloudinary Asset Details", version: "1.0.0" });
setupHostContext(app);

function renderPage(r) {
  var root = document.getElementById("app");
  var url = r.secure_url || r.url || "";
  var name = r.display_name || r.public_id || r.filename || "Asset";
  var fmt = (r.format || "").toUpperCase();
  var rt = r.resource_type || "";
  var dims = (r.width && r.height) ? r.width + "\\u00d7" + r.height : "";
  var size = r.bytes ? fmtBytes(r.bytes) : "";
  var dur = r.duration ? fmtDuration(r.duration) : "";

  var h = "";

  // Header
  h += '<div class="details-header">';
  var headerThumb = thumbUrl(url, 56, 56, r);
  if (headerThumb) {
    h += '<img class="details-header-thumb" src="' + esc(headerThumb) + '">';
  } else if (rt === "raw") {
    h += '<div class="details-header-icon">' + fileTypeIcon(r.format) + "</div>";
  }
  h += '<div class="details-header-info">';
  h += '<div class="details-header-name" title="' + esc(name) + '">' + esc(name) + "</div>";
  h += '<div class="details-header-sub">';
  if (fmt) h += '<span class="pill">' + esc(fmt) + "</span>";
  if (rt) h += '<span class="pill">' + esc(rt) + (r.is_audio ? " (audio)" : "") + "</span>";
  if (dims) h += '<span class="pill">' + dims + "</span>";
  if (dur) h += '<span class="pill">' + dur + "</span>";
  if (size) h += '<span class="pill">' + size + "</span>";
  h += "</div></div>";
  h += '<div style="display:flex;gap:6px;flex-shrink:0">';
  h += '<button class="open-link" id="refresh-asset" title="Refresh">\\u21BB</button>';
  if (url) h += '<button class="open-link" id="open-asset">Open</button>';
  h += "</div>";
  h += "</div>";

  // Hero
  h += '<div class="hero-container">';
  h += renderHeroPreview(r);
  h += "</div>";

  // Details content
  h += '<div class="details-content">';

  h += sectionStart("asset_info");
  h += '<summary class="detail-section-title">Asset Info</summary>';
  h += renderAssetGrid(r);
  h += "</details>";

  h += renderAudioInfo(r);
  h += renderVideoInfo(r);
  h += renderTags(r.tags);
  h += renderContext(r.context);
  h += renderImageMetadata(r.image_metadata || r.media_metadata);
  h += renderColors(r.colors, r.predominant);
  h += renderModerationSection(r.moderation, r.moderation_kind, r.moderation_status);
  h += renderAccessControl(r.access_control);
  h += renderCoordinates(r.faces, r.coordinates);
  h += renderLastUpdated(r.last_updated);
  h += renderMetadata(r.metadata);
  h += renderInfo(r.info);
  h += renderDerived(r.derived, r.derived_next_cursor, r.asset_id);
  h += renderDerivatives(r.derivatives);
  h += renderRelatedAssets(r.related_assets);
  h += renderVersions(r.versions);
  h += renderEager(r.eager);
  h += renderQualityAnalysis(r.quality_analysis, r.quality_score);
  h += renderAccessibilityAnalysis(r.accessibility_analysis);
  h += renderExtraFields(r);
  h += renderRawResponse(r);

  h += "</div>";

  root.innerHTML = h;

  // Event delegation
  root.addEventListener("click", function handler(e) {
    var el = e.target;
    while (el && el !== root) {
      if (el.id === "open-asset") {
        app._rpc("ui/open-link", { url: url });
        return;
      }
      if (el.id === "refresh-asset") {
        fetchDirect();
        return;
      }
      if (el.id === "load-more-derived-btn") {
        loadMoreDerived(el);
        return;
      }
      if (el.classList && el.classList.contains("link-val") && el.dataset.url) {
        app._rpc("ui/open-link", { url: el.dataset.url });
        return;
      }
      if (el.classList && el.classList.contains("derived-open") && el.dataset.url) {
        app._rpc("ui/open-link", { url: el.dataset.url });
        return;
      }
      el = el.parentElement;
    }
  });
}


function showFetchPrompt() {
  var name = pendingCall.name || "get-asset-details";
  var root = document.getElementById("app");
  var h = '<div class="prompt">';
  h += '<div class="prompt-icon">\\u{1F4E6}</div>';
  h += '<div class="prompt-title">Could Not Display Results</div>';
  h += '<div class="prompt-desc">';
  h += "The response from <strong>" + esc(name) + "</strong> could not be rendered. ";
  h += "You can try fetching the data directly from the server.";
  h += "</div>";
  h += '<div class="prompt-actions">';
  h += '<button class="prompt-btn prompt-btn-primary" id="fetch-direct-btn">Fetch Directly</button>';
  h += "</div></div>";
  root.innerHTML = h;
  document.getElementById("fetch-direct-btn").addEventListener("click", function() { fetchDirect(); });
}

async function fetchDirect() {
  var name = pendingCall.name || "get-asset-details";
  var args = pendingCall.args || {};
  console.log(LOG_PREFIX, "tools/call ->", name, JSON.stringify(args));

  document.getElementById("app").innerHTML = '<div class="status">Fetching asset details\\u2026</div>';
  try {
    var res = await app.callServerTool({ name: name, arguments: args });
    var data = ingestResult(res);
    if (data && !data._error && !data._truncated && !data._parseError) {
      renderPage(data);
    } else if (data && data._error) {
      showPersistentError("Server Error", data._message || JSON.stringify(data));
    } else if (data && data._parseError) {
      showPersistentError("Parse Error", data._message || "Could not parse response.");
    } else if (data && data._truncated) {
      showPersistentError("Truncated", "Response was truncated: " + (data._message || "").substring(0, 200));
    } else {
      showPersistentError("No Data", "Server returned no asset details.");
    }
  } catch (e) {
    showPersistentError("Fetch Failed", e && e.message ? e.message : String(e));
  }
}

app.ontoolinput = function(params) {
  pendingCall.name = "get-asset-details";
  if (params.arguments) pendingCall.args = params.arguments;
  showReadyPrompt(pendingCall, fetchDirect);
};

app.ontoolcancelled = function(params) {
  console.log(LOG_PREFIX, "tool cancelled:", params && params.reason);
  showCancelledPrompt(pendingCall, fetchDirect);
};

app.ontoolresult = function(result) {
  var data = ingestResult(result);
  if (data && !data._error && !data._truncated && !data._parseError) {
    console.log(LOG_PREFIX, "host result received for", data.asset_id || data.public_id);
    renderPage(data);
    return;
  }

  if (data && data._error) {
    showPersistentError("Error", data._message || JSON.stringify(data));
    return;
  }

  console.warn(LOG_PREFIX, "host result unusable:", data && data._message ? data._message.substring(0, 200) : "null");
  showFetchPrompt();
};

app.connect().then(function() {
  console.log(LOG_PREFIX, "ready");
  setupResize(app, MIN_HEIGHT);
}).catch(function(err) {
  showError("Connection Failed", err && err.message ? err.message : String(err));
});
`;

const ASSET_DETAILS_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloudinary Asset Details</title>
<style>
${SHARED_CSS_TOKENS}
${SHARED_CSS_COMPONENTS}
${ASSET_DETAILS_CSS}
</style>
</head>
<body>
<div id="app"><div class="status">Loading asset details&hellip;</div></div>

<script>
${SHARED_JS_MCP_CLIENT}
${SHARED_JS_HELPERS}
${SHARED_JS_TOOLTIPS}
${SHARED_JS_MODAL}
${SHARED_JS_DETAIL_RENDERERS}
${SHARED_JS_HOST_CONTEXT}
${ASSET_DETAILS_JS}
</script>
</body>
</html>`;
