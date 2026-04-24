/*
 * MCP App for uploading assets to Cloudinary.
 * Attached to the upload-asset tool.
 *
 * Features:
 *  - Schema-driven form: fields are auto-generated from the Zod schema
 *    at build time via z.toJSONSchema(), grouped into collapsible sections.
 *  - Staged upload: file/URL is staged first with an explicit Upload button.
 *  - File prepopulation: display_name, format, resource_type inferred from
 *    the staged file metadata.
 *  - Folder picker: combobox with search-folders tool for autocomplete.
 *
 * Shares CLDS tokens, MCPApp client, helpers, and detail renderers
 * with the gallery/details apps via app-shared.ts.
 */

import { toJSONSchema } from "zod";
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
import { UploadRequest$zodSchema } from "../../models/uploadrequest.js";
import { UploadResourceType$zodSchema } from "../../models/uploadresourcetype.js";
import { injectToolName } from "./uri.js";

export function getAssetUploadHtml(toolName?: string): string {
  return injectToolName(ASSET_UPLOAD_HTML, toolName);
}

// ── Build-time schema generation ────────────────────────────────────
const uploadJsonSchema = toJSONSchema(UploadRequest$zodSchema) as {
  properties: Record<string, unknown>;
};
const rtJsonSchema = toJSONSchema(UploadResourceType$zodSchema) as Record<
  string,
  unknown
>;

const allSchemaProperties: Record<string, unknown> = {
  ...(uploadJsonSchema.properties || {}),
};
const rtCopy = { ...rtJsonSchema };
delete rtCopy["$schema"];
allSchemaProperties["resource_type"] = rtCopy;

const SCHEMA_JSON = JSON.stringify(allSchemaProperties);

// ── CSS ─────────────────────────────────────────────────────────────
const UPLOAD_CSS = /* css */ `
.upload-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: var(--cld-sp-md); padding-bottom: var(--cld-sp-sm);
  border-bottom: 1px solid var(--cld-border);
}
.upload-header h1 {
  font-size: var(--cld-font-sm); font-weight: 600; color: var(--cld-text);
}
.upload-header-icon { font-size: 20px; }
.upload-header { position: relative; }
.back-link {
  position: absolute; top: -2px; right: 0;
  background: none; border: none; cursor: pointer;
  color: var(--cld-accent); font-size: var(--cld-font-xs);
  padding: 2px 6px; border-radius: 4px;
}
.back-link:hover { text-decoration: underline; background: var(--cld-accent-bg); }

.upload-result .detail-section { padding: 14px 16px; }
.upload-result .detail-section:first-child { padding-top: 0; }

.upload-another {
  margin-top: 16px; text-align: center;
}
`;

// ── JS ──────────────────────────────────────────────────────────────
const UPLOAD_JS = /* js */ `
var LOG_PREFIX = "[upload]";
var MIN_HEIGHT = 120;
var UPLOAD_TOOL_TIMEOUT_MS = 120000;

/* ── Schema & config (generated at build time) ── */
var UPLOAD_SCHEMA = ${SCHEMA_JSON};

var FIELD_CONFIG = {
  exclude: ["file", "api_key", "signature", "timestamp", "callback",
            "eval", "on_success"],
  sections: [
    { id: "basic", label: "Basic", open: true,
      fields: ["display_name", "format", "asset_folder", "tags"] },
    { id: "naming", label: "Naming & Behavior",
      fields: ["public_id", "context", "use_filename", "unique_filename",
               "overwrite", "use_filename_as_display_name",
               "unique_display_name", "public_id_prefix",
               "use_asset_folder_as_public_id_prefix",
               "filename_override", "discard_original_filename",
               "backup", "allowed_formats", "invalidate",
               "metadata", "folder"] },
    { id: "delivery", label: "Delivery & Access",
      fields: ["resource_type", "type", "access_mode", "access_control",
               "upload_preset", "headers", "return_delete_token"] },
    { id: "transforms", label: "Transformations",
      fields: ["transformation", "eager", "eager_async",
               "eager_notification_url", "responsive_breakpoints"] },
    { id: "ai", label: "AI & Analysis",
      fields: ["moderation", "detection", "ocr", "auto_tagging",
               "background_removal", "categorization", "raw_convert",
               "auto_transcription", "auto_chaptering",
               "media_metadata", "quality_analysis", "accessibility_analysis",
               "cinemagraph_analysis", "colors", "faces", "phash",
               "visual_search"] }
  ]
};

/* ── State ── */
var pendingCall = { name: null, args: null };
var capturedArgs = {};
var state = "idle";
var uploadOrigin = "user";
var pendingLocalFile = null;
var stagedFile = null;
var lastResult = null;
var folderCache = [];
var folderDebounce = null;

var app = new MCPApp({ name: "Cloudinary Upload", version: "1.0.0" });
setupHostContext(app);

/* ── Schema helpers ── */
function humanize(key) {
  return key.replace(/_/g, " ").replace(/\\b[a-z]/g, function(c) {
    return c.toUpperCase();
  });
}

function getFieldType(prop) {
  if (!prop) return "text";
  if (prop.enum) return "select";
  if (prop.type === "boolean") return "checkbox";
  if (prop.type === "number" || prop.type === "integer") return "number";
  if (prop.type === "string") return "text";
  if (prop.type === "array") return "textarea";
  if (prop.anyOf || prop.oneOf) {
    var subs = prop.anyOf || prop.oneOf;
    for (var i = 0; i < subs.length; i++) {
      if (subs[i].type === "boolean") return "checkbox";
    }
    return "textarea";
  }
  return "text";
}

function shortDesc(desc) {
  if (!desc) return "";
  var first = desc.split("\\n")[0];
  return first.length > 120 ? first.substring(0, 117) + "..." : first;
}

/* ── Field renderers ── */
function helpIcon(desc) {
  if (!desc) return "";
  return ' <span class="help-toggle" tabindex="0">?<span class="help-bubble">' + esc(shortDesc(desc)) + "</span></span>";
}

function renderField(key, prop) {
  var id = "f-" + key;
  var label = humanize(key);
  var ft = getFieldType(prop);
  var desc = (prop && prop.description) || "";
  var val = capturedArgs[key];

  var h = "";

  if (ft === "checkbox") {
    var checked = val != null ? !!val : (prop.default === true);
    h += '<div class="upload-field upload-field-check">';
    h += "<label>";
    h += '<input id="' + id + '" type="checkbox"' + (checked ? " checked" : "") + ">";
    h += "<span>" + esc(label) + "</span>";
    h += "</label>" + helpIcon(desc) + "</div>";
  } else if (ft === "select") {
    h += '<div class="upload-field">';
    h += '<label for="' + id + '">' + esc(label) + helpIcon(desc) + "</label>";
    h += '<select id="' + id + '">';
    h += '<option value="">(default)</option>';
    var opts = prop.enum || [];
    for (var i = 0; i < opts.length; i++) {
      var sel = val === opts[i] ? " selected" : "";
      h += '<option value="' + esc(opts[i]) + '"' + sel + ">" + esc(opts[i]) + "</option>";
    }
    h += "</select></div>";
  } else if (ft === "number") {
    h += '<div class="upload-field">';
    h += '<label for="' + id + '">' + esc(label) + helpIcon(desc) + "</label>";
    h += '<input id="' + id + '" type="number" step="any" value="' + esc(val != null ? String(val) : "") + '">';
    h += "</div>";
  } else if (ft === "textarea") {
    var tv = val != null ? (typeof val === "string" ? val : JSON.stringify(val, null, 2)) : "";
    h += '<div class="upload-field full-width">';
    h += '<label for="' + id + '">' + esc(label) + helpIcon(desc) + "</label>";
    h += '<textarea id="' + id + '" rows="2" placeholder="JSON or text">' + esc(tv) + "</textarea>";
    h += "</div>";
  } else {
    h += '<div class="upload-field">';
    h += '<label for="' + id + '">' + esc(label) + helpIcon(desc) + "</label>";
    h += '<input id="' + id + '" type="text" value="' + esc(val != null ? String(val) : "") + '">';
    h += "</div>";
  }
  return h;
}

function renderFolderField(prop) {
  var id = "f-asset_folder";
  var val = capturedArgs.asset_folder || "";
  var desc = (prop && prop.description) || "";
  var h = '<div class="upload-field" id="folder-field-wrap">';
  h += '<label for="' + id + '">Asset Folder' + helpIcon(desc) + "</label>";
  h += '<div class="combo-wrap">';
  h += '<input id="' + id + '" type="text" value="' + esc(val) + '" autocomplete="off" placeholder="Type to search or create...">';
  h += '<div class="combo-dropdown" id="folder-dropdown"></div>';
  h += "</div></div>";
  return h;
}

function renderFormSections() {
  var h = "";
  var rendered = {};
  var sections = FIELD_CONFIG.sections;

  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var fieldsHtml = "";

    for (var f = 0; f < sec.fields.length; f++) {
      var key = sec.fields[f];
      if (FIELD_CONFIG.exclude.indexOf(key) >= 0) continue;
      var prop = UPLOAD_SCHEMA[key];
      if (!prop) continue;

      if (key === "asset_folder") {
        fieldsHtml += renderFolderField(prop);
      } else {
        fieldsHtml += renderField(key, prop);
      }
      rendered[key] = true;
    }
    if (!fieldsHtml) continue;

    if (sec.open) {
      h += '<div class="upload-form">' + fieldsHtml + "</div>";
    } else {
      h += '<details class="upload-section">';
      h += "<summary>" + esc(sec.label) + "</summary>";
      h += '<div class="upload-form">' + fieldsHtml + "</div>";
      h += "</details>";
    }
  }

  var otherHtml = "";
  var allKeys = Object.keys(UPLOAD_SCHEMA);
  for (var k = 0; k < allKeys.length; k++) {
    var okey = allKeys[k];
    if (rendered[okey] || FIELD_CONFIG.exclude.indexOf(okey) >= 0) continue;
    otherHtml += renderField(okey, UPLOAD_SCHEMA[okey]);
    rendered[okey] = true;
  }
  if (otherHtml) {
    h += '<details class="upload-section">';
    h += "<summary>Other</summary>";
    h += '<div class="upload-form">' + otherHtml + "</div>";
    h += "</details>";
  }

  return h;
}

/* ── Dynamic form collection ── */
function collectFormArgs() {
  var allKeys = Object.keys(UPLOAD_SCHEMA);
  for (var i = 0; i < allKeys.length; i++) {
    var key = allKeys[i];
    if (FIELD_CONFIG.exclude.indexOf(key) >= 0) continue;
    var prop = UPLOAD_SCHEMA[key];
    var ft = getFieldType(prop);
    var el = document.getElementById("f-" + key);
    if (!el) continue;

    if (ft === "checkbox") {
      if (el.checked) capturedArgs[key] = true;
      else delete capturedArgs[key];
    } else if (ft === "number") {
      var n = parseFloat(el.value);
      if (!isNaN(n)) capturedArgs[key] = n;
      else delete capturedArgs[key];
    } else if (ft === "textarea") {
      var tv = el.value.trim();
      if (tv) {
        try { capturedArgs[key] = JSON.parse(tv); }
        catch (e) { capturedArgs[key] = tv; }
      } else { delete capturedArgs[key]; }
    } else {
      var sv = (ft === "select") ? el.value : el.value.trim();
      if (sv) capturedArgs[key] = sv;
      else delete capturedArgs[key];
    }
  }
}

/* ── Extract args from tool input ── */
function extractUploadArgs(args) {
  if (!args) return {};
  var out = {};
  if (args.resource_type) out.resource_type = args.resource_type;
  var ua = args.upload_request || {};
  var schemaKeys = Object.keys(UPLOAD_SCHEMA);
  for (var i = 0; i < schemaKeys.length; i++) {
    var k = schemaKeys[i];
    if (k === "resource_type") continue;
    if (ua[k] !== undefined && ua[k] !== null && ua[k] !== "") out[k] = ua[k];
  }
  return out;
}

/* ── File prepopulation ── */
var prevStagedName = "";

function prepopulateFromFile(file) {
  var name = file.name || "";
  var dot = name.lastIndexOf(".");
  var base = dot > 0 ? name.substring(0, dot) : name;
  var ext = dot > 0 ? name.substring(dot + 1).toLowerCase() : "";
  var mime = (file.type || "").toLowerCase();

  var canOverwrite = !capturedArgs.display_name || capturedArgs.display_name === prevStagedName;
  if (base && canOverwrite) capturedArgs.display_name = base;
  capturedArgs.format = ext || undefined;
  if (!ext) delete capturedArgs.format;
  prevStagedName = base;

  if (mime.startsWith("image/")) capturedArgs.resource_type = "image";
  else if (mime.startsWith("video/") || mime.startsWith("audio/")) capturedArgs.resource_type = "video";
  else if (mime === "application/pdf") capturedArgs.resource_type = "image";
  else capturedArgs.resource_type = "auto";
}

function prepopulateFromUrl(url) {
  var path = url.split("?")[0].split("/").pop() || "";
  var decoded = "";
  try { decoded = decodeURIComponent(path); } catch (e) { decoded = path; }
  var dot = decoded.lastIndexOf(".");
  var base = dot > 0 ? decoded.substring(0, dot) : decoded;
  var ext = dot > 0 ? decoded.substring(dot + 1).toLowerCase() : "";

  var canOverwrite = !capturedArgs.display_name || capturedArgs.display_name === prevStagedName;
  if (base && canOverwrite) capturedArgs.display_name = base;
  capturedArgs.format = ext || undefined;
  if (!ext) delete capturedArgs.format;
  prevStagedName = base;
}

/* ── Folder picker ── */
var folderHighlight = -1;

function setupFolderPicker() {
  var input = document.getElementById("f-asset_folder");
  if (!input) return;

  input.addEventListener("focus", function() {
    fetchFolders("");
  });

  input.addEventListener("input", function() {
    clearTimeout(folderDebounce);
    folderHighlight = -1;
    var q = input.value.trim();
    folderDebounce = setTimeout(function() { fetchFolders(q); }, 300);
  });

  input.addEventListener("blur", function() {
    setTimeout(hideFolderDropdown, 200);
  });

  input.addEventListener("keydown", function(e) {
    var dropdown = document.getElementById("folder-dropdown");
    if (!dropdown || dropdown.style.display === "none") return;
    var items = dropdown.querySelectorAll(".combo-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      folderHighlight = Math.min(folderHighlight + 1, items.length - 1);
      updateFolderHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      folderHighlight = Math.max(folderHighlight - 1, 0);
      updateFolderHighlight(items);
    } else if (e.key === "Enter" && folderHighlight >= 0 && items[folderHighlight]) {
      e.preventDefault();
      input.value = items[folderHighlight].dataset.value || "";
      hideFolderDropdown();
    } else if (e.key === "Escape") {
      hideFolderDropdown();
    }
  });
}

function updateFolderHighlight(items) {
  for (var i = 0; i < items.length; i++) {
    items[i].classList.toggle("combo-item-active", i === folderHighlight);
  }
  if (items[folderHighlight]) {
    items[folderHighlight].scrollIntoView({ block: "nearest" });
  }
}

function fetchFolders(query) {
  var args = { max_results: 50 };
  if (query) args.expression = "name:" + query + "*";
  app.callServerTool({ name: "search-folders", arguments: args })
    .then(function(res) {
      var data = ingestResult(res);
      folderCache = (data && data.folders) || [];
      folderHighlight = -1;
      renderFolderDropdown();
    })
    .catch(function(err) {
      console.warn(LOG_PREFIX, "folder search failed:", err);
      folderCache = [];
    });
}

function renderFolderDropdown() {
  var dropdown = document.getElementById("folder-dropdown");
  var input = document.getElementById("f-asset_folder");
  if (!dropdown || !input) return;

  var query = input.value.trim().toLowerCase();
  var filtered = folderCache;
  if (query) {
    filtered = folderCache.filter(function(f) {
      return (f.path || f.name || "").toLowerCase().indexOf(query) >= 0;
    });
  }

  if (filtered.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  var h = "";
  for (var i = 0; i < Math.min(filtered.length, 30); i++) {
    var fp = filtered[i].path || filtered[i].name || "";
    h += '<div class="combo-item" data-value="' + esc(fp) + '">' + esc(fp) + "</div>";
  }
  dropdown.innerHTML = h;
  dropdown.style.display = "block";

  dropdown.onclick = function(e) {
    var item = e.target;
    while (item && !item.classList.contains("combo-item")) item = item.parentElement;
    if (item && item.dataset.value != null) {
      input.value = item.dataset.value;
      dropdown.style.display = "none";
    }
  };
}

function hideFolderDropdown() {
  var dd = document.getElementById("folder-dropdown");
  if (dd) dd.style.display = "none";
}

/* ── Staging ── */
function stageLocalFile(file) {
  collectFormArgs();
  var reader = new FileReader();
  reader.onload = function() {
    stagedFile = { dataUri: reader.result, name: file.name, size: file.size, mime: file.type };
    prepopulateFromFile(file);
    renderPicker();
  };
  reader.onerror = function() {
    showError("Read Error", "Could not read the selected file.");
  };
  reader.readAsDataURL(file);
}

function stageUrl(url) {
  collectFormArgs();
  var parts = url.split("?")[0].split("/");
  var fname = parts[parts.length - 1] || url;
  try { fname = decodeURIComponent(fname); } catch (e) {}
  stagedFile = { url: url, name: fname };
  prepopulateFromUrl(url);
  renderPicker();
}

/* ── Main render: picker ── */
function renderPicker() {
  state = "idle";
  var root = document.getElementById("app");
  var h = "";

  h += '<div class="upload-header">';
  if (lastResult) {
    h += '<button class="back-link" id="back-to-result-btn">\\u2190 Back to Result</button>';
  }
  h += '<span class="upload-header-icon">\\u2B06\\uFE0F</span>';
  h += "<h1>Upload to Cloudinary</h1>";
  h += "</div>";

  if (stagedFile) {
    h += '<div class="upload-staged">';
    h += '<div class="upload-staged-icon">\\u{1F4C4}</div>';
    h += '<div class="upload-staged-info">';
    h += '<div class="upload-staged-name">' + esc(stagedFile.name) + "</div>";
    if (stagedFile.size) {
      h += '<div class="upload-staged-meta">' + fmtBytes(stagedFile.size);
      if (stagedFile.mime) h += " \\u00B7 " + esc(stagedFile.mime);
      h += "</div>";
    } else if (stagedFile.url) {
      h += '<div class="upload-staged-meta">Remote URL</div>';
    }
    h += "</div>";
    h += '<button class="upload-staged-clear" id="clear-staged-btn" title="Remove">\\u2715</button>';
    h += "</div>";
  } else {
    h += '<div class="upload-zone" id="drop-zone">';
    h += '<div class="upload-zone-icon">\\u{1F4C1}</div>';
    h += '<div class="upload-zone-text">Drag & drop a file here</div>';
    h += '<div class="upload-zone-hint">Images, videos, PDFs, and other files up to 60 MB</div>';
    h += '<button class="upload-zone-btn" id="browse-btn">Browse Files</button>';
    h += '<input type="file" id="file-input" style="display:none">';
    h += "</div>";

    h += '<div class="upload-or">or upload from URL</div>';

    h += '<div class="upload-url-row">';
    h += '<input class="upload-url-input" id="url-input" type="text" placeholder="https://example.com/image.jpg">';
    h += '<button class="upload-url-btn" id="url-btn">Add URL</button>';
    h += "</div>";
  }

  h += renderFormSections();

  if (stagedFile) {
    h += '<div class="upload-submit">';
    h += '<button class="prompt-btn prompt-btn-primary upload-submit-btn" id="upload-btn">Upload to Cloudinary</button>';
    h += "</div>";
  }

  root.innerHTML = h;

  var backBtn = document.getElementById("back-to-result-btn");
  if (backBtn && lastResult) {
    backBtn.addEventListener("click", function() { renderResult(lastResult); });
  }

  if (stagedFile) {
    document.getElementById("clear-staged-btn").addEventListener("click", function() {
      collectFormArgs();
      stagedFile = null;
      if (capturedArgs.display_name === prevStagedName) delete capturedArgs.display_name;
      delete capturedArgs.format;
      delete capturedArgs.resource_type;
      prevStagedName = "";
      renderPicker();
    });
    document.getElementById("upload-btn").addEventListener("click", function() {
      collectFormArgs();
      uploadOrigin = "user";
      var fileData = stagedFile.dataUri || stagedFile.url;
      renderUploading(stagedFile.name, stagedFile.size ? fmtBytes(stagedFile.size) : "Remote URL");
      doUpload(fileData, stagedFile.name);
    });
  } else {
    setupDropZone();
  }

  setupFolderPicker();
}

/* ── Drop zone events ── */
function setupDropZone() {
  var zone = document.getElementById("drop-zone");
  var input = document.getElementById("file-input");
  var browseBtn = document.getElementById("browse-btn");
  var urlBtn = document.getElementById("url-btn");
  var urlInput = document.getElementById("url-input");
  if (!zone) return;

  browseBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    input.click();
  });
  zone.addEventListener("click", function() { input.click(); });

  input.addEventListener("change", function() {
    if (input.files && input.files.length) stageLocalFile(input.files[0]);
  });

  zone.addEventListener("dragenter", function(e) { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragover", function(e) { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", function(e) { e.preventDefault(); zone.classList.remove("dragover"); });
  zone.addEventListener("drop", function(e) {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      stageLocalFile(e.dataTransfer.files[0]);
    }
  });

  urlBtn.addEventListener("click", function() {
    var url = urlInput.value.trim();
    if (url) stageUrl(url);
  });
  urlInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      var url = urlInput.value.trim();
      if (url) stageUrl(url);
    }
  });
}

/* ── Uploading state ── */
function renderUploading(name, meta) {
  state = "uploading";
  var root = document.getElementById("app");
  var h = "";

  h += '<div class="upload-header">';
  h += '<span class="upload-header-icon">\\u2B06\\uFE0F</span>';
  h += "<h1>Uploading\\u2026</h1>";
  h += "</div>";

  h += '<div class="upload-preview">';
  h += '<div class="upload-preview-icon">\\u{1F4C4}</div>';
  h += '<div class="upload-preview-info">';
  h += '<div class="upload-preview-name">' + esc(name) + "</div>";
  h += '<div class="upload-preview-meta">' + esc(meta) + "</div>";
  h += "</div></div>";

  h += '<div class="upload-progress-wrap">';
  h += '<div class="upload-progress-bar"><div class="upload-progress-fill" id="progress-fill"></div></div>';
  h += '<div class="upload-progress-text" id="progress-text">Uploading to Cloudinary\\u2026</div>';
  h += "</div>";

  root.innerHTML = h;
  animateProgress();
}

var progressInterval = null;
function animateProgress() {
  clearInterval(progressInterval);
  var fill = document.getElementById("progress-fill");
  if (!fill) return;
  var pct = 0;
  progressInterval = setInterval(function() {
    if (pct < 90) {
      pct += (90 - pct) * 0.08;
      fill.style.width = pct + "%";
    }
  }, 200);
}

function stopProgress(success) {
  clearInterval(progressInterval);
  var fill = document.getElementById("progress-fill");
  var text = document.getElementById("progress-text");
  if (fill) fill.style.width = "100%";
  if (text) text.textContent = success ? "Upload complete" : "Upload failed";
}

function formatErrorMsg(msg) {
  var idx = msg.indexOf("[");
  if (idx !== -1 && msg.indexOf("Invalid arguments") !== -1) {
    try {
      var issues = JSON.parse(msg.substring(idx));
      return issues.map(function(i) {
        var field = (i.path || []).join(".");
        return (field ? field + ": " : "") + (i.message || "invalid");
      }).join("\\n");
    } catch (e) {}
  }
  if (typeof msg === "string" && msg.length > 200) {
    var short = msg.replace(/\\s+/g, " ").substring(0, 200) + "\\u2026";
    return short;
  }
  return msg;
}

function renderUploadError(title, msg) {
  msg = formatErrorMsg(msg);
  state = "error";
  stopProgress(false);

  var wrap = document.querySelector(".upload-progress-wrap");
  if (wrap) {
    var header = document.querySelector(".upload-header h1");
    if (header) header.textContent = title;
    var icon = document.querySelector(".upload-header-icon");
    if (icon) icon.textContent = "\\u26A0\\uFE0F";

    var safeMsg = esc(msg).replace(/\\n/g, "<br>");
    var h = '<div class="upload-error-msg">' + safeMsg + "</div>";
    h += '<div class="upload-another" style="margin-top:14px">';
    h += '<button class="prompt-btn prompt-btn-primary" id="retry-upload-btn">Try from App</button>';
    h += "</div>";
    wrap.innerHTML = h;
  } else {
    var root = document.getElementById("app");
    var safeMsg = esc(msg).replace(/\\n/g, "<br>");
    var h = '<div class="upload-header">';
    h += '<span class="upload-header-icon">\\u26A0\\uFE0F</span>';
    h += "<h1>" + esc(title) + "</h1>";
    h += "</div>";
    h += '<div class="upload-error-msg">' + safeMsg + "</div>";
    h += '<div class="upload-another" style="margin-top:14px;text-align:center">';
    h += '<button class="prompt-btn prompt-btn-primary" id="retry-upload-btn">Try from App</button>';
    h += "</div>";
    root.innerHTML = h;
  }

  var btn = document.getElementById("retry-upload-btn");
  if (btn) btn.addEventListener("click", function() {
    uploadOrigin = "user";
    renderPicker();
  });
}

function extractPathFromError(errMsg) {
  if (!errMsg) return "";
  var m = errMsg.match(/open '([^']+)'/);
  if (m) return m[1];
  m = errMsg.match(/read file: ([^.]+)/);
  if (m) return m[1].trim();
  return "";
}

function classifyFileError(errMsg) {
  var lower = (errMsg || "").toLowerCase();
  if (lower.indexOf("enoent") >= 0 || lower.indexOf("no such file") >= 0) {
    return {
      title: "File Not Found",
      desc: "could not be found at the specified path.",
      hint: "If the server is running remotely, it cannot access files on your device. Drop the file below or click Browse to select it."
    };
  }
  if (lower.indexOf("eacces") >= 0 || lower.indexOf("eperm") >= 0 || lower.indexOf("permission") >= 0) {
    return {
      title: "File Access Denied",
      desc: "could not be read due to insufficient permissions."
    };
  }
  return {
    title: "File Not Accessible",
    desc: "couldn\\u2019t be read from the given path."
  };
}

function renderLocalFileNeeded(expectedName, errMsg) {
  state = "localFileNeeded";
  var classified = classifyFileError(errMsg);
  var root = document.getElementById("app");
  var h = '<div class="upload-header">';
  h += '<span class="upload-header-icon">\\u{1F4C1}</span>';
  h += "<h1>" + esc(classified.title) + "</h1>";
  h += "</div>";
  h += '<div class="prompt" style="margin-bottom:16px">';
  h += '<div class="prompt-desc">The file <strong>' + esc(expectedName)
     + "</strong> " + classified.desc
     + " Please select it from your device.</div>";
  if (classified.hint) {
    h += '<div style="margin-top:8px;font-size:11.5px;color:var(--cld-text3);">' + esc(classified.hint) + "</div>";
  }
  var filePath = extractPathFromError(errMsg);
  if (filePath) {
    h += '<div style="margin-top:6px;font-size:11px;color:var(--cld-text3);word-break:break-all;">Path: ' + esc(filePath) + "</div>";
  }
  h += "</div>";
  h += '<div class="upload-zone" id="drop-zone">';
  h += '<div class="upload-zone-icon">\\u{1F4C1}</div>';
  h += '<div class="upload-zone-text">Drop <strong>' + esc(expectedName) + "</strong> here</div>";
  h += '<div class="upload-zone-hint">Or click to browse your files</div>';
  h += '<button class="upload-zone-btn" id="browse-btn">Browse Files</button>';
  h += '<input type="file" id="file-input" style="display:none">';
  h += "</div>";
  root.innerHTML = h;

  function onFileSelected(file) {
    var reader = new FileReader();
    reader.onload = function() {
      prepopulateFromFile(file);
      renderUploading(file.name, fmtBytes(file.size));
      doUpload(reader.result, file.name);
    };
    reader.onerror = function() {
      showError("Read Error", "Could not read the selected file.");
    };
    reader.readAsDataURL(file);
  }

  var zone = document.getElementById("drop-zone");
  var input = document.getElementById("file-input");
  var browseBtn = document.getElementById("browse-btn");

  browseBtn.addEventListener("click", function(e) { e.stopPropagation(); input.click(); });
  zone.addEventListener("click", function() { input.click(); });
  input.addEventListener("change", function() {
    if (input.files && input.files.length) onFileSelected(input.files[0]);
  });
  zone.addEventListener("dragenter", function(e) { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragover", function(e) { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", function(e) { e.preventDefault(); zone.classList.remove("dragover"); });
  zone.addEventListener("drop", function(e) {
    e.preventDefault(); zone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  });
}

/* ── Upload logic ── */
async function doUpload(fileData, displayHint) {
  var uploadRequest = {};
  var resourceType = "auto";

  var keys = Object.keys(capturedArgs);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k === "resource_type") {
      resourceType = capturedArgs[k] || "auto";
    } else {
      uploadRequest[k] = capturedArgs[k];
    }
  }
  uploadRequest.file = fileData;

  if (pendingCall.args && pendingCall.args.resource_type) {
    resourceType = pendingCall.args.resource_type;
  }

  console.log(LOG_PREFIX, "tools/call -> upload-asset");
  try {
    var res = await app.callServerTool({
      name: "upload-asset",
      arguments: { resource_type: resourceType, upload_request: uploadRequest },
    });
    var data = ingestResult(res);
    console.log(LOG_PREFIX, "upload result:", JSON.stringify(data).substring(0, 300));
    if (data && !data._truncated && !data.error && (data.public_id || data.asset_id || data.status === "pending")) {
      stopProgress(true);
      stagedFile = null;
      if (uploadOrigin === "host") {
        try {
          app._rpc("ui/updateModelContext", {
            content: [{ type: "text", text: "File uploaded successfully via app. public_id: " + data.public_id + ", secure_url: " + (data.secure_url || data.url || "") }]
          });
        } catch (e) { console.warn(LOG_PREFIX, "updateModelContext failed:", e); }
      }
      setTimeout(function() { renderResult(data); }, 300);
    } else if (data && data.error) {
      stopProgress(false);
      var msg = typeof data.error === "object" ? (data.error.message || JSON.stringify(data.error)) : String(data.error);
      if (uploadOrigin === "host") { renderUploadError("Upload Failed", msg); }
      else { showError("Upload Failed", formatErrorMsg(msg)); renderPicker(); }
    } else if (data && data._error) {
      stopProgress(false);
      var srvMsg = data._message || "Server returned an error.";
      if (uploadOrigin === "host") { renderUploadError("Upload Failed", srvMsg); }
      else { showError("Upload Failed", formatErrorMsg(srvMsg)); renderPicker(); }
    } else {
      stopProgress(false);
      var fallbackMsg = "Unexpected response from server.";
      if (data && data._message) fallbackMsg = data._message;
      else if (data && data.message) fallbackMsg = typeof data.message === "string" ? data.message : JSON.stringify(data.message);
      else if (data) try { var snap = JSON.stringify(data).substring(0, 200); if (snap !== "{}") fallbackMsg = snap; } catch(e) {}
      if (uploadOrigin === "host") { renderUploadError("Upload Failed", fallbackMsg); }
      else { showError("Upload Failed", fallbackMsg); renderPicker(); }
    }
  } catch (e) {
    stopProgress(false);
    var errMsg = e && e.message ? e.message : String(e);
    if (uploadOrigin === "host") { renderUploadError("Upload Failed", errMsg); }
    else { showError("Upload Failed", errMsg); renderPicker(); }
  }
}

/* ── Result view ── */
function renderResult(r) {
  state = "result";
  lastResult = r;
  var root = document.getElementById("app");
  var url = r.secure_url || r.url || "";
  var name = r.display_name || r.public_id || "Asset";
  var isPending = r.status === "pending" && !r.public_id;

  var h = "";

  h += '<div class="upload-header">';
  h += '<span class="upload-header-icon">' + (isPending ? "\\u23F3" : "\\u2705") + '</span>';
  h += "<h1>" + (isPending ? "Upload Queued" : "Upload Complete") + "</h1>";
  h += "</div>";

  h += '<div class="upload-result">';

  if (isPending) {
    h += '<div class="upload-result-body">';
    h += '<div class="upload-result-title"><span class="success-icon">\\u2713</span> Upload accepted (async)</div>';
    h += '<div class="detail-section"><div class="prompt-desc">The file has been queued for processing. It will be available shortly.</div>';
    if (r.batch_id) h += '<div style="margin-top:8px;font-size:11px;color:var(--cld-text3);">Batch: ' + esc(r.batch_id) + "</div>";
    h += "</div>";
  } else {
    h += '<div class="upload-result-hero">';
    h += renderHeroPreview(r);
    h += "</div>";

    h += '<div class="upload-result-body">';
    h += '<div class="upload-result-title"><span class="success-icon">\\u2713</span> ' + esc(name) + "</div>";

    h += sectionStart("asset_info");
    h += '<summary class="detail-section-title">Asset Info</summary>';
    h += renderAssetGrid(r);
    h += "</details>";

    h += renderAudioInfo(r);
    h += renderVideoInfo(r);
  }

  if (!isPending) {
    if (r.tags && r.tags.length) {
      h += renderTags(r.tags);
    }

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
  }

  h += '<div class="upload-actions">';
  if (url) h += '<button class="prompt-btn prompt-btn-primary" id="open-url-btn">Open in Browser</button>';
  h += '<button class="prompt-btn" id="upload-another-btn">Upload Another</button>';
  h += "</div>";

  h += "</div></div>";

  root.innerHTML = h;

  root.addEventListener("click", function handler(e) {
    var el = e.target;
    while (el && el !== root) {
      if (el.id === "open-url-btn") {
        app._rpc("ui/open-link", { url: url });
        return;
      }
      if (el.id === "upload-another-btn") {
        capturedArgs = {};
        stagedFile = null;
        prevStagedName = "";
        renderPicker();
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
      el = el.parentElement;
    }
  });
}

/* ── MCP event handlers ── */
app.ontoolinput = function(params) {
  pendingCall.name = "upload-asset";
  if (params.arguments) {
    pendingCall.args = params.arguments;
    capturedArgs = extractUploadArgs(params.arguments);

    var req = params.arguments.upload_request || params.arguments || {};
    var file = req.file || "";
    if (file) {
      uploadOrigin = "host";
      var hint = req.display_name || "";
      if (!hint && file.indexOf("://") !== -1) {
        var parts = file.split("?")[0].split("/");
        hint = parts[parts.length - 1] || file;
        try { hint = decodeURIComponent(hint); } catch (e) {}
      }
      if (!hint) hint = "File";
      pendingLocalFile = (file.indexOf("file://") === 0) ? hint : null;
      renderUploading(hint, "Uploading via server\u2026");
    }
  }
};

app.ontoolcancelled = function(params) {
  console.log(LOG_PREFIX, "tool cancelled:", params && params.reason);
  stopProgress(false);
  pendingLocalFile = null;
  var root = document.getElementById("app");
  var h = '<div class="prompt" style="padding:32px 24px">';
  h += '<div style="font-size:14px;font-weight:600;color:var(--cld-text);margin-bottom:4px">Upload Cancelled</div>';
  h += renderParamsList(pendingCall.args);
  h += '<div class="prompt-actions" style="margin-top:14px">';
  h += '<button class="prompt-btn prompt-btn-primary" id="cancelled-retry-btn">Upload from App</button>';
  h += '</div>';
  h += '</div>';
  root.innerHTML = h;
  document.getElementById("cancelled-retry-btn").addEventListener("click", function() {
    stagedFile = null; capturedArgs = {}; prevStagedName = ""; state = "idle";
    renderPicker();
  });
  requestAnimationFrame(function() { app.reportSize(document.documentElement.scrollHeight); });
};

app.ontoolresult = function(result) {
  stopProgress(false);
  var data = ingestResult(result);

  if (data && !data._truncated && !data._error && !data._parseError && !data.error && (data.public_id || data.asset_id || data.status === "pending")) {
    stopProgress(true);
    pendingLocalFile = null;
    console.log(LOG_PREFIX, "host upload result:", data.public_id || data.status);
    renderResult(data);
    return;
  }

  var errMsg = "Upload failed";
  if (data) {
    if (data.error) {
      var raw = data.error;
      if (typeof raw === "object") errMsg = raw.message || raw.error || JSON.stringify(raw);
      else errMsg = String(raw);
    } else if (data._message) {
      errMsg = String(data._message);
    }
    console.warn(LOG_PREFIX, "host upload error:", errMsg);
  } else {
    console.warn(LOG_PREFIX, "host result unusable, data:", data);
  }

  if (pendingLocalFile) {
    var localName = pendingLocalFile;
    pendingLocalFile = null;
    console.log(LOG_PREFIX, "file:// upload failed, showing local file picker for:", localName);
    renderLocalFileNeeded(localName, errMsg);
  } else if (uploadOrigin === "host") {
    renderUploadError("Upload Failed", errMsg);
  } else {
    renderUploadError("Upload Failed", errMsg);
  }
};

app.connect().then(function() {
  console.log(LOG_PREFIX, "ready, state=" + state);
  setupResize(app, MIN_HEIGHT);
  if (state === "idle") renderPicker();
}).catch(function(err) {
  showError("Connection Failed", err && err.message ? err.message : String(err));
});
`;

// ── HTML template ───────────────────────────────────────────────────
const ASSET_UPLOAD_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloudinary Upload</title>
<style>
${SHARED_CSS_TOKENS}
${SHARED_CSS_COMPONENTS}
${UPLOAD_CSS}
</style>
</head>
<body>
<div id="app"><div class="status">Preparing upload&hellip;</div></div>

<script>
${SHARED_JS_MCP_CLIENT}
${SHARED_JS_HELPERS}
${SHARED_JS_TOOLTIPS}
${SHARED_JS_MODAL}
${SHARED_JS_DETAIL_RENDERERS}
${SHARED_JS_HOST_CONTEXT}
${UPLOAD_JS}
</script>
</body>
</html>`;
