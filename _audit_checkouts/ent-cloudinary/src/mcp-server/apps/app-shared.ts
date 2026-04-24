/*
 * Shared building blocks for MCP Apps (gallery + details).
 * Each export is a raw string fragment to be interpolated into the
 * final HTML template literal of each app.
 */

import { toJSONSchema } from "zod";
import { Info$zodSchema } from "../../models/info.js";
import { UploadResponse$zodSchema } from "../../models/uploadresponse.js";

// ── Build-time tooltip map from Zod schema descriptions ─────────────
function extractSchemaDescriptions(
  schema: Record<string, unknown>,
): Record<string, string> {
  const props = (schema as { properties?: Record<string, unknown> })
    .properties || {};
  const result: Record<string, string> = {};
  for (const [key, prop] of Object.entries(props)) {
    const p = prop as { description?: string } | null;
    if (p?.description) result[key] = p.description;
  }
  return result;
}

const _infoSchema = toJSONSchema(Info$zodSchema, {
  unrepresentable: "any",
}) as Record<string, unknown>;
const _uploadSchema = toJSONSchema(UploadResponse$zodSchema, {
  unrepresentable: "any",
}) as Record<string, unknown>;
const TOOLTIP_MAP_JSON = JSON.stringify({
  ...extractSchemaDescriptions(_infoSchema),
  ...extractSchemaDescriptions(_uploadSchema),
});

// ── CSS: CLDS Design Tokens (light + dark) ──────────────────────────
export const SHARED_CSS_TOKENS = /* css */ `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cld-primary: #3448c5;
  --cld-primary-light: #4c64d7;
  --cld-bg: #ffffff;
  --cld-bg2: #f9fafb;
  --cld-bg3: #f3f4f7;
  --cld-bg4: #edeef3;
  --cld-text: #0a0c0f;
  --cld-text2: #333b4c;
  --cld-text3: #90a0b3;
  --cld-border: #d1d6e0;
  --cld-border2: #c2c9d6;
  --cld-accent: #3448c5;
  --cld-accent-bg: #f1f2f9;
  --cld-error: #CE190D;
  --cld-warning: #ff620c;
  --cld-success: #22AA00;
  --cld-radius: 8px;
  --cld-radius-sm: 4px;
  --cld-radius-lg: 16px;
  --cld-shadow-sm: 0 2px 4px 0 rgba(0,0,0,0.25);
  --cld-shadow-md: 0 4px 5px 0 rgba(0,0,0,0.2), 0 3px 14px 3px rgba(0,0,0,0.12), 0 8px 10px 1px rgba(0,0,0,0.14);
  --cld-shadow-lg: 0 24px 24px 0 rgba(0,0,0,0.3), 0 0 24px 0 rgba(0,0,0,0.22);
  --cld-sp-xxs: 0.25rem;
  --cld-sp-xs: 0.5rem;
  --cld-sp-sm: 0.75rem;
  --cld-sp-md: 1rem;
  --cld-sp-lg: 1.25rem;
  --cld-sp-xl: 2rem;
  --cld-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --cld-font-xxs: 0.75rem;
  --cld-font-xs: 0.875rem;
  --cld-font-sm: 1rem;
  --cld-chip-tag-bg: #f1f2f9;
  --cld-chip-tag-fg: #3448c5;
  --cld-chip-set-bg: #e6faf6;
  --cld-chip-set-fg: #13a5aa;
  --cld-chip-set-border: #b2e8e9;
  --cld-chip-date-bg: #fff8eb;
  --cld-chip-date-fg: #a16207;
  --cld-chip-date-border: #fde68a;
  --cld-chip-int-bg: #f5f0ff;
  --cld-chip-int-fg: #7c3aed;
  --cld-chip-int-border: #e9d5ff;
}

[data-theme="dark"], .dark {
  --cld-primary: #0D9AFF;
  --cld-primary-light: #51a3ff;
  --cld-bg: #1f242e;
  --cld-bg2: #14181e;
  --cld-bg3: #090c0f;
  --cld-bg4: #000000;
  --cld-text: #ffffff;
  --cld-text2: #d1d6e0;
  --cld-text3: #90a0b3;
  --cld-border: #3d475c;
  --cld-border2: #535f7a;
  --cld-accent: #0D9AFF;
  --cld-accent-bg: rgba(13,154,255,0.12);
  --cld-error: #ff5959;
  --cld-warning: #ffa359;
  --cld-success: #9affa6;
  --cld-chip-tag-bg: rgba(13,154,255,0.15);
  --cld-chip-tag-fg: #0D9AFF;
  --cld-chip-set-bg: rgba(72,208,216,0.15);
  --cld-chip-set-fg: #7dedff;
  --cld-chip-set-border: rgba(72,208,216,0.3);
  --cld-chip-date-bg: rgba(255,196,121,0.15);
  --cld-chip-date-fg: #ffc479;
  --cld-chip-date-border: rgba(255,196,121,0.3);
  --cld-chip-int-bg: rgba(167,111,255,0.15);
  --cld-chip-int-fg: #a76fff;
  --cld-chip-int-border: rgba(167,111,255,0.3);
}
[data-theme="dark"] .status-ok,   .dark .status-ok   { background: #166534; color: #bbf7d0; }
[data-theme="dark"] .status-warn, .dark .status-warn { background: #854d0e; color: #fef08a; }
[data-theme="dark"] .status-err,  .dark .status-err  { background: #991b1b; color: #fecaca; }

body {
  font-family: var(--cld-font);
  background: var(--cld-bg);
  color: var(--cld-text);
  padding: var(--cld-sp-md);
  line-height: 1.5;
  font-size: var(--cld-font-xs);
  position: relative;
}
.theme-btn {
  position: absolute; top: 4px; right: 4px; z-index: 900;
  width: 22px; height: 22px; border-radius: 50%;
  border: 1px solid transparent; background: transparent;
  color: var(--cld-text3); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0; transition: background 0.15s, color 0.15s, border-color 0.15s;
  opacity: 0.5;
}
.theme-btn:hover { background: var(--cld-bg3); color: var(--cld-text); border-color: var(--cld-border); opacity: 1; }
.theme-btn svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

// ── CSS: Shared component styles ────────────────────────────────────
export const SHARED_CSS_COMPONENTS = /* css */ `
.link { cursor: pointer; }
.link:hover { color: var(--cld-accent); text-decoration: underline; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(3px); padding: 24px;
}
.modal {
  background: var(--cld-bg); border: 1px solid var(--cld-border);
  border-radius: var(--cld-radius); width: 100%; max-width: 620px;
  max-height: 85vh; display: flex; flex-direction: column;
  box-shadow: var(--cld-shadow-lg); animation: modalIn 0.15s ease-out;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid var(--cld-border); flex-shrink: 0;
}
.modal-header-thumb {
  width: 40px; height: 40px; border-radius: 6px;
  object-fit: cover; background: var(--cld-bg3); flex-shrink: 0;
}
.modal-header-info { flex: 1; min-width: 0; }
.modal-header-info h2 {
  font-size: 14px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.modal-header-sub { font-size: 11px; color: var(--cld-text3); margin-top: 2px; }
.modal-close {
  background: var(--cld-bg3); border: 1px solid var(--cld-border);
  width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--cld-text2); flex-shrink: 0; font-family: inherit;
}
.modal-close:hover { background: var(--cld-border); }
.modal-body { overflow-y: auto; padding: 0; }
.modal-hero {
  width: 100%; max-height: 220px; object-fit: contain;
  background: var(--cld-bg3); display: block;
}
.modal-loading { text-align: center; padding: 48px 20px; color: var(--cld-text2); font-size: 13px; }
.modal-loading .spinner {
  display: inline-block; width: 24px; height: 24px;
  border: 2.5px solid var(--cld-border); border-top-color: var(--cld-accent);
  border-radius: 50%; animation: spin 0.6s linear infinite; margin-bottom: 10px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Detail sections */
.detail-section { padding: 14px 20px; border-bottom: 1px solid var(--cld-bg3); }
.detail-section:last-child { border-bottom: none; }
.detail-section-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--cld-text3); margin-bottom: 10px;
  display: flex; align-items: center; gap: 6px;
}
.detail-section-title .count {
  background: var(--cld-bg3); padding: 1px 6px; border-radius: 8px;
  font-size: 10px; font-weight: 600; color: var(--cld-text2);
}
details.detail-section > summary.detail-section-title {
  cursor: pointer; list-style: none; user-select: none;
}
details.detail-section > summary.detail-section-title::before {
  content: "\\25B6"; display: inline-block; width: 14px; font-size: 9px;
  transition: transform 0.15s ease; margin-right: 4px;
}
details.detail-section[open] > summary.detail-section-title::before {
  transform: rotate(90deg);
}
details.detail-section > summary.detail-section-title::-webkit-details-marker { display: none; }
.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: var(--cld-bg3); border-radius: var(--cld-radius-sm); overflow: hidden;
}
.detail-cell { background: var(--cld-bg); padding: 8px 12px; }
.detail-cell-key { font-size: 10px; color: var(--cld-text3); font-weight: 500; margin-bottom: 2px; }
.detail-cell-val { font-size: 12px; color: var(--cld-text); font-weight: 500; word-break: break-all; }
.detail-cell-val.link-val { color: var(--cld-accent); cursor: pointer; }
.detail-cell-val.link-val:hover { text-decoration: underline; }
.detail-cell.full-width { grid-column: 1 / -1; }

/* Chips */
.chip-list { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 500; white-space: nowrap; }
.chip-tag { background: var(--cld-chip-tag-bg); color: var(--cld-chip-tag-fg); }
.chip-set { background: var(--cld-chip-set-bg); color: var(--cld-chip-set-fg); border: 1px solid var(--cld-chip-set-border); }
.chip-date { background: var(--cld-chip-date-bg); color: var(--cld-chip-date-fg); border: 1px solid var(--cld-chip-date-border); }
.chip-int { background: var(--cld-chip-int-bg); color: var(--cld-chip-int-fg); border: 1px solid var(--cld-chip-int-border); }

/* Meta rows */
.meta-row {
  display: flex; align-items: baseline; padding: 6px 0;
  border-bottom: 1px solid var(--cld-bg3); gap: 8px; font-size: 12px;
}
.meta-row:last-child { border-bottom: none; }
.meta-key {
  color: var(--cld-text2); min-width: 0; flex-shrink: 0; max-width: 45%;
  font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px;
}
.meta-val { color: var(--cld-text); flex: 1; min-width: 0; text-align: right; }

/* Derived assets */
.derived-card {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--cld-bg3); font-size: 11px;
}
.derived-card:last-child { border-bottom: none; }
.derived-thumb {
  width: 48px; height: 36px; border-radius: 4px;
  object-fit: cover; background: var(--cld-bg3); flex-shrink: 0;
}
.derived-info { flex: 1; min-width: 0; }
.derived-tx { color: var(--cld-text); font-family: monospace; font-size: 10px; word-break: break-all; }
.derived-meta { color: var(--cld-text3); font-size: 10px; margin-top: 2px; }
.derived-open { color: var(--cld-accent); cursor: pointer; font-weight: 500; white-space: nowrap; font-size: 11px; }
.derived-open:hover { text-decoration: underline; }

/* Error */
.modal-error { text-align: center; padding: 32px 20px; color: var(--cld-text2); font-size: 13px; }

/* Status / loading */
.status { text-align: center; padding: 48px 16px; color: var(--cld-text2); font-size: 14px; }
.status .icon { font-size: 32px; margin-bottom: 8px; }

/* Fetch prompt */
.prompt { text-align: center; padding: 48px 24px; color: var(--cld-text2); }
.prompt-icon { font-size: 36px; margin-bottom: 12px; }
.prompt-title { font-size: 15px; font-weight: 600; color: var(--cld-text); margin-bottom: 6px; }
.prompt-desc { font-size: 13px; max-width: 420px; margin: 0 auto 20px; line-height: 1.5; }
.prompt-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.prompt-btn {
  padding: 8px 20px; border-radius: var(--cld-radius); font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--cld-border); background: var(--cld-bg2);
  color: var(--cld-text); font-family: inherit; transition: background 0.15s, border-color 0.15s;
}
.prompt-btn:hover { background: var(--cld-bg3); border-color: var(--cld-border2); }
.prompt-btn-primary { background: var(--cld-primary); color: #fff; border-color: var(--cld-primary); }
.prompt-btn-primary:hover { background: var(--cld-primary-light); border-color: var(--cld-primary-light); }

/* Error toast */
.error-toast {
  position: fixed; bottom: 16px; left: 16px; right: 16px;
  background: var(--cld-error); color: #fff; padding: 12px 16px;
  border-radius: var(--cld-radius); box-shadow: var(--cld-shadow-md);
  font-size: 13px; z-index: 2000; display: flex; align-items: flex-start;
  gap: 10px; animation: toastIn 0.2s ease-out; max-width: 600px; margin: 0 auto;
}
.error-toast-icon { font-size: 18px; flex-shrink: 0; line-height: 1; }
.error-toast-body { flex: 1; min-width: 0; }
.error-toast-title { font-weight: 600; margin-bottom: 2px; }
.error-toast-msg { font-size: 12px; opacity: 0.9; word-break: break-word; }
.error-toast-close {
  background: none; border: none; color: #fff; cursor: pointer;
  font-size: 16px; opacity: 0.8; padding: 0 2px; flex-shrink: 0; font-family: inherit;
}
.error-toast-close:hover { opacity: 1; }
@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Thumb overlays */
.thumb-overlay {
  position: absolute; inset: 0; display: flex;
  align-items: center; justify-content: center; pointer-events: none;
}
.play-icon {
  width: 40px; height: 40px; background: rgba(0,0,0,0.55);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.play-icon::after {
  content: ""; display: block; width: 0; height: 0;
  border-style: solid; border-width: 8px 0 8px 14px;
  border-color: transparent transparent transparent #fff; margin-left: 3px;
}
.audio-icon {
  width: 40px; height: 40px; background: rgba(0,0,0,0.55);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px;
}
.duration-badge {
  position: absolute; bottom: 6px; right: 6px;
  background: rgba(0,0,0,0.7); color: #fff; font-size: 10px;
  font-weight: 600; padding: 2px 6px; border-radius: 4px;
  font-variant-numeric: tabular-nums; backdrop-filter: blur(4px);
}
.status-badge {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 1px 8px; border-radius: 10px; text-transform: capitalize;
}
.status-ok   { background: #dcfce7; color: #166534; }
.status-warn { background: #fef9c3; color: #854d0e; }
.status-err  { background: #fee2e2; color: #991b1b; }
.file-icon {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 4px; color: var(--cld-text3);
}
.file-icon svg { width: 36px; height: 36px; }
.file-icon-label { font-size: 10px; font-weight: 600; text-transform: uppercase; }

/* Native media players */
.hero-video {
  width: 100%; max-height: 300px; display: block;
  background: #000; border-radius: 0;
}
.hero-audio-wrap {
  position: relative; padding: 20px;
  background: var(--cld-bg3); display: flex; flex-direction: column;
  align-items: center; gap: 12px;
}
.hero-audio-waveform {
  width: 100%; max-height: 120px; object-fit: contain; display: block;
  opacity: 0.6; border-radius: var(--cld-radius-sm);
}
.hero-audio-wrap audio { width: 100%; max-width: 500px; }
.hero-audio-note {
  font-size: 28px; color: var(--cld-text3); margin-bottom: 4px;
}
.media-modal-video {
  width: 100%; display: block; background: #000;
  max-height: 60vh;
}
.media-modal-audio-wrap {
  padding: 24px 20px; background: var(--cld-bg3);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.media-modal-audio-wrap img {
  width: 100%; max-height: 100px; object-fit: contain; opacity: 0.6;
  border-radius: var(--cld-radius-sm);
}
.media-modal-audio-wrap audio { width: 100%; max-width: 480px; }
.thumb-overlay.playable { pointer-events: auto; cursor: pointer; }

/* Upload app */
.upload-zone {
  border: 2px dashed var(--cld-border2); border-radius: var(--cld-radius);
  padding: 40px 24px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--cld-bg2);
}
.upload-zone:hover { border-color: var(--cld-accent); background: var(--cld-accent-bg); }
.upload-zone.dragover { border-color: var(--cld-accent); background: var(--cld-accent-bg); }
.upload-zone-icon { font-size: 36px; margin-bottom: 8px; color: var(--cld-text3); }
.upload-zone-text { font-size: 14px; color: var(--cld-text2); margin-bottom: 4px; }
.upload-zone-hint { font-size: 12px; color: var(--cld-text3); }
.upload-zone-btn {
  display: inline-block; margin-top: 14px; padding: 8px 22px;
  border-radius: var(--cld-radius); font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--cld-accent); background: var(--cld-accent);
  color: #fff; font-family: inherit; transition: background 0.15s;
}
.upload-zone-btn:hover { background: var(--cld-primary-light); border-color: var(--cld-primary-light); }
.upload-or { margin: 16px 0; font-size: 12px; color: var(--cld-text3); display: flex; align-items: center; gap: 10px; }
.upload-or::before, .upload-or::after { content: ""; flex: 1; height: 1px; background: var(--cld-border); }
.upload-url-row { display: flex; gap: 8px; }
.upload-url-input {
  flex: 1; padding: 8px 12px; border-radius: var(--cld-radius-sm);
  border: 1px solid var(--cld-border); background: var(--cld-bg);
  color: var(--cld-text); font-size: 13px; font-family: inherit; outline: none;
}
.upload-url-input:focus { border-color: var(--cld-accent); }
.upload-url-input::placeholder { color: var(--cld-text3); }
.upload-url-btn {
  padding: 8px 16px; border-radius: var(--cld-radius-sm);
  font-size: 13px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--cld-accent); background: transparent;
  color: var(--cld-accent); font-family: inherit; transition: background 0.15s;
  white-space: nowrap;
}
.upload-url-btn:hover { background: var(--cld-accent-bg); }
.upload-params {
  margin-top: 16px; padding: 12px 16px; background: var(--cld-bg3);
  border-radius: var(--cld-radius-sm); font-size: 12px; color: var(--cld-text2);
}
.upload-params-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--cld-text3); margin-bottom: 6px; }
.upload-params .chip { margin-right: 4px; margin-bottom: 4px; }
.upload-preview {
  display: flex; align-items: center; gap: 14px; padding: 16px;
  background: var(--cld-bg2); border: 1px solid var(--cld-border);
  border-radius: var(--cld-radius); margin-bottom: 16px;
}
.upload-preview-thumb {
  width: 56px; height: 56px; border-radius: var(--cld-radius-sm);
  object-fit: cover; background: var(--cld-bg3); flex-shrink: 0;
}
.upload-preview-icon {
  width: 56px; height: 56px; border-radius: var(--cld-radius-sm);
  background: var(--cld-bg3); flex-shrink: 0; display: flex;
  align-items: center; justify-content: center; font-size: 24px; color: var(--cld-text3);
}
.upload-preview-info { flex: 1; min-width: 0; }
.upload-preview-name { font-size: 13px; font-weight: 600; color: var(--cld-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.upload-preview-meta { font-size: 11px; color: var(--cld-text3); margin-top: 2px; }
.upload-progress-wrap { margin-top: 8px; }
.upload-progress-bar {
  height: 6px; border-radius: 3px; background: var(--cld-bg3); overflow: hidden;
}
.upload-progress-fill {
  height: 100%; background: var(--cld-accent); border-radius: 3px;
  transition: width 0.3s ease; width: 0%;
}
.upload-progress-text { font-size: 11px; color: var(--cld-text3); margin-top: 4px; text-align: center; }
.upload-error-msg {
  background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--cld-radius);
  color: #991b1b; padding: 10px 14px; font-size: 12px; margin-top: 8px;
  word-break: break-word; line-height: 1.5;
}
.upload-result {
  border: 1px solid var(--cld-border); border-radius: var(--cld-radius);
  overflow: hidden;
}
.upload-result-hero {
  position: relative; background: var(--cld-bg3);
  display: flex; align-items: center; justify-content: center; min-height: 120px;
}
.upload-result-hero img { width: 100%; max-height: 260px; object-fit: contain; display: block; }
.upload-result-hero .file-icon { padding: 30px 20px; }
.upload-result-body { padding: 16px; }
.upload-result-title {
  font-size: 15px; font-weight: 600; color: var(--cld-text); margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.upload-result-title .success-icon { color: var(--cld-success); font-size: 18px; }
.upload-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.upload-actions .prompt-btn { font-size: 12px; padding: 6px 16px; }

/* Upload form fields */
.upload-form {
  margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.upload-field { display: flex; flex-direction: column; gap: 3px; }
.upload-field.full-width { grid-column: 1 / -1; }
.upload-field label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.6px; color: var(--cld-text3);
}
.upload-field input[type="text"],
.upload-field input[type="number"],
.upload-field select,
.upload-field textarea {
  padding: 7px 10px; border-radius: var(--cld-radius-sm);
  border: 1px solid var(--cld-border); background: var(--cld-bg);
  color: var(--cld-text); font-size: 13px; font-family: inherit; outline: none;
  width: 100%;
}
.upload-field input[type="text"]:focus,
.upload-field input[type="number"]:focus,
.upload-field select:focus,
.upload-field textarea:focus { border-color: var(--cld-accent); }
.upload-field input::placeholder,
.upload-field textarea::placeholder { color: var(--cld-text3); }
.upload-field textarea { resize: vertical; min-height: 36px; }
.upload-field select { cursor: pointer; appearance: auto; }

/* Help icon ("?") with inline bubble */
.help-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--cld-border); color: var(--cld-text2);
  font-size: 9px; font-weight: 700; cursor: pointer;
  position: relative; vertical-align: middle; margin-left: 4px;
  user-select: none; line-height: 1; flex-shrink: 0;
}
.help-toggle:hover, .help-toggle:focus { background: var(--cld-accent); color: #fff; }
.help-bubble {
  display: none; position: absolute; left: 50%; bottom: calc(100% + 6px);
  transform: translateX(-50%); width: 220px; padding: 8px 10px;
  background: var(--cld-text); color: var(--cld-bg); font-size: 11px;
  font-weight: 400; line-height: 1.4; border-radius: var(--cld-radius-sm);
  box-shadow: var(--cld-shadow-sm); z-index: 200; text-transform: none;
  letter-spacing: 0; white-space: normal; pointer-events: none;
}
.help-bubble::after {
  content: ""; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%); border: 5px solid transparent;
  border-top-color: var(--cld-text);
}
.help-toggle:hover .help-bubble,
.help-toggle:focus .help-bubble { display: block; }
.detail-grid .help-toggle .help-bubble,
.detail-section-title .help-toggle .help-bubble {
  left: -4px; transform: none;
}
.detail-grid .help-toggle .help-bubble::after,
.detail-section-title .help-toggle .help-bubble::after {
  left: 10px; transform: none;
}
.color-swatch {
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;
}
.color-swatch-box {
  width: 28px; height: 28px; border-radius: 4px; border: 1px solid var(--cld-border);
}
.color-swatch-label { font-size: 9px; color: var(--cld-text3); }
.color-swatch-pct { font-size: 9px; color: var(--cld-text2); }
.color-group-title {
  font-size: 10px; font-weight: 600; color: var(--cld-text3);
  text-transform: uppercase; margin: 6px 0 4px;
}
.color-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }

/* Checkbox field variant */
.upload-field-check {
  flex-direction: row; align-items: center; gap: 6px;
}
.upload-field-check label {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  text-transform: none; font-weight: 500; font-size: 12px; color: var(--cld-text2);
}
.upload-field-check input[type="checkbox"] {
  width: 15px; height: 15px; cursor: pointer; accent-color: var(--cld-accent);
}

/* Collapsible sections */
details.upload-section {
  margin-top: 14px; border: 1px solid var(--cld-border);
  border-radius: var(--cld-radius-sm); overflow: hidden;
}
details.upload-section summary {
  padding: 8px 12px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.6px; color: var(--cld-text3);
  cursor: pointer; list-style: none; display: flex; align-items: center; gap: 6px;
  background: var(--cld-bg2); user-select: none;
}
details.upload-section summary::before {
  content: "\\25B6"; font-size: 8px; transition: transform 0.15s;
}
details.upload-section[open] summary::before { transform: rotate(90deg); }
details.upload-section summary::-webkit-details-marker { display: none; }
details.upload-section > .upload-form { margin: 0; padding: 10px 12px; }

/* Staged file preview */
.upload-staged {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  background: var(--cld-accent-bg); border: 1px solid var(--cld-accent);
  border-radius: var(--cld-radius); margin-bottom: 4px; position: relative;
}
.upload-staged-icon { font-size: 24px; flex-shrink: 0; }
.upload-staged-info { flex: 1; min-width: 0; }
.upload-staged-name {
  font-size: 13px; font-weight: 600; color: var(--cld-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.upload-staged-meta { font-size: 11px; color: var(--cld-text3); margin-top: 2px; }
.upload-staged-clear {
  background: none; border: none; cursor: pointer; font-size: 16px;
  color: var(--cld-text3); padding: 4px 6px; border-radius: var(--cld-radius-sm);
  transition: color 0.15s, background 0.15s; flex-shrink: 0;
}
.upload-staged-clear:hover { color: var(--cld-error); background: rgba(206,25,13,0.08); }

/* Upload submit button */
.upload-submit {
  position: sticky; bottom: 0; z-index: 10;
  background: var(--cld-bg); border-top: 1px solid var(--cld-border);
  padding: 12px 0; margin-top: 16px; text-align: center;
}
.upload-submit-btn {
  padding: 10px 32px !important; font-size: 14px !important; font-weight: 600 !important;
}

/* Combobox (folder picker) */
.combo-wrap { position: relative; }
.combo-dropdown {
  display: none; position: absolute; top: 100%; left: 0; right: 0;
  max-height: 180px; overflow-y: auto; z-index: 100;
  background: var(--cld-bg); border: 1px solid var(--cld-border);
  border-radius: var(--cld-radius-sm); box-shadow: var(--cld-shadow-sm);
  margin-top: 2px;
}
.combo-item {
  padding: 7px 10px; font-size: 13px; color: var(--cld-text);
  cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.combo-item:hover, .combo-item-active { background: var(--cld-accent-bg); color: var(--cld-accent); }

.raw-response-pre {
  margin: 0; padding: 10px 12px; overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px; line-height: 1.45; white-space: pre-wrap; word-break: break-all;
  background: var(--cld-bg2); border-radius: 6px; color: var(--cld-text2);
  max-height: 500px; overflow-y: auto;
}
.json-key { color: #881391; }
.json-str { color: #0b7285; }
.json-num { color: #c92a2a; }
.json-bool { color: #5c940d; }
.json-null { color: #868e96; }
@media (prefers-color-scheme: dark) {
  .json-key { color: #da77f2; }
  .json-str { color: #66d9e8; }
  .json-num { color: #ff8787; }
  .json-bool { color: #a9e34b; }
  .json-null { color: #868e96; }
}
`;

// ── JS: MCPApp client class ─────────────────────────────────────────
export const SHARED_JS_MCP_CLIENT = /* js */ `
var RPC_TIMEOUT_MS = 15000;
var TOOL_CALL_TIMEOUT_MS = 30000;
var INIT_TIMEOUT_MS = 10000;

class MCPApp {
  constructor(info) {
    this.info = info;
    this.ontoolresult = null;
    this.ontoolinput = null;
    this.ontoolcancelled = null;
    this.onhostcontextchanged = null;
    this._id = 1;
    this._pending = new Map();
    this._timers = new Map();
  }
  connect() {
    console.log(LOG_PREFIX, "connecting…");
    window.addEventListener("message", (ev) => {
      const m = ev.data;
      if (!m || m.jsonrpc !== "2.0") return;
      if (m.method) console.log(LOG_PREFIX, "recv notification:", m.method);
      else if (m.id != null) console.log(LOG_PREFIX, "recv response id=" + m.id);

      if (m.method === "ui/notifications/tool-result" && this.ontoolresult)
        this.ontoolresult(m.params);
      else if (m.method === "ui/notifications/tool-input" && this.ontoolinput)
        this.ontoolinput(m.params);
      else if (m.method === "ui/notifications/tool-cancelled" && this.ontoolcancelled)
        this.ontoolcancelled(m.params);
      else if (m.method === "ui/notifications/host-context-changed" && this.onhostcontextchanged)
        this.onhostcontextchanged(m.params);
      else if (m.id != null && this._pending.has(m.id)) {
        clearTimeout(this._timers.get(m.id));
        this._timers.delete(m.id);
        var cb = this._pending.get(m.id);
        this._pending.delete(m.id);
        if (m.error) {
          console.warn(LOG_PREFIX, "rpc error id=" + m.id, m.error);
          cb.reject(m.error);
        } else {
          cb.resolve(m.result);
        }
      }
    });
    return this._rpc("ui/initialize", {
      protocolVersion: "2026-01-26",
      appInfo: { name: this.info.name, version: this.info.version },
      appCapabilities: {},
    }, INIT_TIMEOUT_MS).then(function() {
      console.log(LOG_PREFIX, "initialized, sending initialized notification");
      window.parent.postMessage({ jsonrpc: "2.0", method: "ui/notifications/initialized" }, "*");
    });
  }
  callServerTool(params) {
    console.log(LOG_PREFIX, "calling tool:", params.name);
    return this._rpc("tools/call", params, TOOL_CALL_TIMEOUT_MS);
  }
  _rpc(method, params, timeoutMs) {
    var self = this;
    var id = this._id++;
    var ms = timeoutMs || RPC_TIMEOUT_MS;
    console.log(LOG_PREFIX, "rpc →", method, "id=" + id, "timeout=" + ms + "ms");
    return new Promise(function(resolve, reject) {
      self._pending.set(id, { resolve: resolve, reject: reject });
      var timer = setTimeout(function() {
        if (self._pending.has(id)) {
          self._pending.delete(id);
          self._timers.delete(id);
          var err = new Error("RPC timeout after " + ms + "ms: " + method + " (id=" + id + ")");
          console.error(LOG_PREFIX, err.message);
          reject(err);
        }
      }, ms);
      self._timers.set(id, timer);
      window.parent.postMessage({ jsonrpc: "2.0", id: id, method: method, params: params }, "*");
    });
  }
  reportSize(height) {
    window.parent.postMessage({
      jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height: height },
    }, "*");
  }
}
`;

// ── JS: Helper functions ────────────────────────────────────────────
export const SHARED_JS_HELPERS = /* js */ `
function fmtBytes(b) {
  if (!b) return "";
  var u = ["B","KB","MB","GB"], i = Math.min(Math.floor(Math.log(b)/Math.log(1024)), 3);
  var v = b / Math.pow(1024, i);
  return (v < 10 ? v.toFixed(1) : Math.round(v)) + " " + u[i];
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function fmtDuration(sec) {
  if (sec == null || sec <= 0) return "";
  var s = Math.round(sec);
  var m = Math.floor(s / 60);
  s = s % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function isAudioResource(r) {
  if (!r) return false;
  return r.is_audio === true || (r.resource_type === "video" && !r.width && !r.height);
}

function insertTransformation(url, tx, resource) {
  var rt = (resource && resource.resource_type) || "";
  var pattern = new RegExp("/(" + (rt || "image|video|raw") + ")/([^/]+)/");
  var match = url.match(pattern);
  if (!match) return "";
  var insertAt = match.index + match[0].length;
  return url.slice(0, insertAt) + tx + "/" + url.slice(insertAt);
}

function thumbUrl(url, w, h, resource) {
  if (!url) return "";
  w = w || 300; h = h || 225;
  var rt = (resource && resource.resource_type) || "";
  var fmt = (resource && resource.format || "").toLowerCase();

  if (rt === "raw") return "";

  if (isAudioResource(resource)) {
    var base = url.replace(/\\.[^/.]+$/, ".png");
    return insertTransformation(base, "c_scale,w_" + w + ",h_" + h + "/fl_waveform,b_transparent,co_rgb:3448c5", resource);
  }

  if (rt === "video") {
    return insertTransformation(url, "c_fill,g_auto,w_" + w + ",h_" + h + ",so_auto,f_jpg,q_auto", resource);
  }

  if (fmt === "pdf") {
    return insertTransformation(url, "c_fill,w_" + w + ",h_" + h + ",pg_1,f_auto,q_auto", resource);
  }

  return insertTransformation(url, "c_fill,g_auto,w_" + w + ",h_" + h + ",f_auto,q_auto", resource);
}

function mediaUrl(url, resource) {
  if (!url) return "";
  var rt = (resource && resource.resource_type) || "";
  if (rt !== "video") return url;
  return insertTransformation(url, "q_auto", resource) || url;
}

function esc(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function prettyKey(k) {
  return k.replace(/[_-]/g, " ").replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
}

var FILE_TYPE_ICONS = {
  pdf:  '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#E8384F" opacity="0.15" stroke="#E8384F" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#E8384F" font-size="9" font-weight="700">PDF</text></svg>',
  zip:  '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#F5A623" opacity="0.15" stroke="#F5A623" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#F5A623" font-size="9" font-weight="700">ZIP</text></svg>',
  doc:  '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#2B7CFF" opacity="0.15" stroke="#2B7CFF" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#2B7CFF" font-size="9" font-weight="700">DOC</text></svg>',
  xls:  '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#22AA00" opacity="0.15" stroke="#22AA00" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#22AA00" font-size="9" font-weight="700">XLS</text></svg>',
  csv:  '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#22AA00" opacity="0.15" stroke="#22AA00" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#22AA00" font-size="9" font-weight="700">CSV</text></svg>',
  json: '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#7c3aed" opacity="0.15" stroke="#7c3aed" stroke-width="1.5"/><text x="18" y="22" text-anchor="middle" fill="#7c3aed" font-size="8" font-weight="700">JSON</text></svg>',
  _default: '<svg viewBox="0 0 36 36" fill="none"><rect x="6" y="2" width="24" height="32" rx="3" fill="#90a0b3" opacity="0.15" stroke="#90a0b3" stroke-width="1.5"/><path d="M14 14h8M14 18h8M14 22h5" stroke="#90a0b3" stroke-width="1.2" stroke-linecap="round"/></svg>',
};
FILE_TYPE_ICONS.docx = FILE_TYPE_ICONS.doc;
FILE_TYPE_ICONS.xlsx = FILE_TYPE_ICONS.xls;
FILE_TYPE_ICONS.rar = FILE_TYPE_ICONS.zip;
FILE_TYPE_ICONS["7z"] = FILE_TYPE_ICONS.zip;
FILE_TYPE_ICONS.xml = FILE_TYPE_ICONS.json;

function fileTypeIcon(format) {
  var f = (format || "").toLowerCase();
  return FILE_TYPE_ICONS[f] || FILE_TYPE_ICONS._default;
}

var errorToastTimer = null;
function showError(title, msg) {
  console.error(LOG_PREFIX, title, msg);
  dismissError();
  var h = '<div class="error-toast" id="error-toast">';
  h += '<span class="error-toast-icon">\\u26A0</span>';
  h += '<div class="error-toast-body">';
  h += '<div class="error-toast-title">' + esc(title) + "</div>";
  if (msg) h += '<div class="error-toast-msg">' + esc(msg) + "</div>";
  h += "</div>";
  h += '<button class="error-toast-close" onclick="dismissError()">\\u2715</button>';
  h += "</div>";
  document.body.insertAdjacentHTML("beforeend", h);
  errorToastTimer = setTimeout(dismissError, 8000);
}

function dismissError() {
  clearTimeout(errorToastTimer);
  var el = document.getElementById("error-toast");
  if (el) el.remove();
}

function showPersistentError(title, msg) {
  var root = document.getElementById("app");
  var h = '<div class="prompt">';
  h += '<div class="prompt-icon">\\u26A0\\uFE0F</div>';
  h += '<div class="prompt-title">' + esc(title) + '</div>';
  if (msg) h += '<div class="prompt-desc">' + esc(msg) + '</div>';
  h += '</div>';
  root.innerHTML = h;
  requestAnimationFrame(function() { app.reportSize(document.documentElement.scrollHeight); });
}

function renderParamsList(args) {
  if (!args) return '';
  var keys = Object.keys(args);
  if (keys.length === 0) return '';
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;margin-top:6px">';
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = args[k];
    var display;
    if (v === null || v === undefined) display = '<span style="color:var(--cld-text3)">null</span>';
    else if (typeof v === "boolean") display = '<span style="color:' + (v ? '#16a34a' : 'var(--cld-text3)') + '">' + v + '</span>';
    else if (typeof v === "object") display = '<span style="font-family:monospace">' + esc(JSON.stringify(v)) + '</span>';
    else display = '<span style="color:var(--cld-text)">' + esc(String(v)) + '</span>';
    h += '<span style="font-size:11px"><span style="color:var(--cld-text3)">' + esc(prettyKey(k)) + '</span> ' + display + '</span>';
  }
  h += '</div>';
  return h;
}

function showReadyPrompt(pendingCall, fetchFn) {
  var root = document.getElementById("app");
  var h = '<div style="text-align:center;padding:24px 16px;color:var(--cld-text2)">';
  h += '<div style="font-size:13px;color:var(--cld-text2);margin-bottom:4px">Waiting for result\\u2026</div>';
  h += renderParamsList(pendingCall.args);
  h += '<div style="margin-top:12px"><button class="prompt-btn" id="ready-fetch-btn" style="font-size:11px;padding:4px 14px">Fetch Directly</button></div>';
  h += '</div>';
  root.innerHTML = h;
  document.getElementById("ready-fetch-btn").addEventListener("click", function() { fetchFn(); });
  requestAnimationFrame(function() { app.reportSize(document.documentElement.scrollHeight); });
}

function showCancelledPrompt(pendingCall, fetchFn) {
  var root = document.getElementById("app");
  var name = pendingCall.name;
  var h = '<div class="prompt" style="padding:32px 24px">';
  h += '<div style="font-size:14px;font-weight:600;color:var(--cld-text);margin-bottom:4px">Cancelled</div>';
  if (name) h += '<div style="font-size:12px;color:var(--cld-text3);margin-bottom:8px">' + esc(prettyKey(name)) + '</div>';
  h += renderParamsList(pendingCall.args);
  h += '<div class="prompt-actions" style="margin-top:14px">';
  h += '<button class="prompt-btn prompt-btn-primary" id="cancelled-fetch-btn">Fetch Directly</button>';
  h += '</div>';
  h += '</div>';
  root.innerHTML = h;
  document.getElementById("cancelled-fetch-btn").addEventListener("click", function() { fetchFn(); });
  requestAnimationFrame(function() { app.reportSize(document.documentElement.scrollHeight); });
}

function ingestResult(params) {
  try {
    var payload = params.result || params;
    var isErr = payload.isError === true;
    var content = payload.content || [];
    var text = content.find(function(c) { return c.type === "text"; });
    if (!text) return null;
    var raw = text.text;
    if (isErr) {
      console.warn(LOG_PREFIX, "ingestResult: server error:", raw);
      return { _error: true, _message: raw };
    }
    if (typeof raw === "string" && raw.charAt(0) !== "{" && raw.charAt(0) !== "[") {
      console.warn(LOG_PREFIX, "ingestResult: text is not JSON, likely truncated:", raw.substring(0, 120));
      return { _truncated: true, _message: raw };
    }
    var parsed = JSON.parse(raw);
    if (parsed && parsed.error) {
      var msg = parsed.error.message || JSON.stringify(parsed.error);
      console.warn(LOG_PREFIX, "ingestResult: API error:", msg);
      return { _error: true, _message: msg };
    }
    return parsed;
  } catch (e) {
    console.warn(LOG_PREFIX, "ingestResult parse error:", e, "raw length:", (raw || "").length);
    return { _parseError: true, _message: "JSON parse failed (length " + (raw || "").length + ")" };
  }
}

function renderModalError(title, detail) {
  return '<div class="modal-error" style="padding:40px 20px;text-align:center;">'
    + '<div style="font-size:28px;margin-bottom:8px;">\\u26A0\\uFE0F</div>'
    + '<div style="font-weight:600;font-size:14px;color:var(--cld-text);margin-bottom:6px;">' + esc(title) + "</div>"
    + '<div style="font-size:12px;color:var(--cld-text3);max-width:400px;margin:0 auto;">' + esc(detail) + "</div>"
    + "</div>";
}
`;

// ── JS: Modal system ────────────────────────────────────────────────
export const SHARED_JS_MODAL = /* js */ `
function closeModal() {
  var ov = document.querySelector(".modal-overlay");
  if (ov) ov.remove();
}

function openModal(headerHtml, bodyHtml) {
  closeModal();
  var h = '<div class="modal-overlay"><div class="modal">';
  h += headerHtml;
  h += '<div class="modal-body">' + bodyHtml + "</div>";
  h += "</div></div>";
  document.body.insertAdjacentHTML("beforeend", h);

  var overlay = document.querySelector(".modal-overlay");
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay || e.target.classList.contains("modal-close")) {
      closeModal();
      return;
    }
    var el = e.target;
    while (el && el !== overlay) {
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
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") { closeModal(); document.removeEventListener("keydown", onEsc); }
  });
}

function modalHeader(name, url, sub, resource) {
  var h = '<div class="modal-header">';
  var thumb = thumbUrl(url, 60, 60, resource);
  if (thumb) h += '<img class="modal-header-thumb" src="' + esc(thumb) + '">';
  h += '<div class="modal-header-info">';
  h += '<h2>' + esc(name) + "</h2>";
  if (sub) h += '<div class="modal-header-sub">' + esc(sub) + "</div>";
  h += "</div>";
  h += '<button class="modal-close" title="Close">\\u2715</button>';
  h += "</div>";
  return h;
}
`;

// ── JS: Detail rendering functions ──────────────────────────────────
export const SHARED_JS_DETAIL_RENDERERS = /* js */ `
function statusBadge(text) {
  if (!text) return "";
  var t = text.toLowerCase().trim();
  var cls = "status-badge";
  if (t === "complete" || t === "approved") cls += " status-ok";
  else if (t === "pending" || t === "queued") cls += " status-warn";
  else if (t === "rejected" || t === "aborted" || t === "failed" || t === "error") cls += " status-err";
  return '<span class="' + cls + '">' + esc(text) + '</span>';
}

var OPEN_SECTIONS = { tags:1, context:1, timestamps:1, moderation:1, asset_info:1 };
function sectionStart(id) {
  return '<details class="detail-section"' + (OPEN_SECTIONS[id] ? ' open' : '') + '>';
}

function renderAssetGrid(r) {
  var fields = [
    ["public_id", "Public ID", r.public_id],
    ["asset_id", "Asset ID", r.asset_id],
    ["display_name", "Display Name", r.display_name],
    ["format", "Format", (r.format || "").toUpperCase()],
    ["resource_type", "Resource Type", r.resource_type],
    ["type", "Type", r.type],
    ["", "Dimensions", (r.width && r.height) ? r.width + " \\u00d7 " + r.height : ""],
    ["duration", "Duration", r.duration ? fmtDuration(r.duration) + " (" + r.duration.toFixed(2) + "s)" : ""],
    ["bytes", "File Size", r.bytes ? fmtBytes(r.bytes) + " (" + r.bytes.toLocaleString() + " bytes)" : ""],
    ["created_at", "Created", fmtDate(r.created_at)],
    ["uploaded_at", "Uploaded", fmtDate(r.uploaded_at)],
    ["access_mode", "Access Mode", r.access_mode],
    ["asset_folder", "Asset Folder", r.asset_folder || "\\u2014"],
    ["filename", "Filename", r.filename],
    ["original_filename", "Original Filename", r.original_filename],
    ["version", "Version", r.version],
    ["version_id", "Version ID", r.version_id],
    ["status", "Status", r.status],
    ["substatus", "Substatus", r.substatus],
    ["resource_subtype", "Subtype", r.resource_subtype],
    ["backup", "Backup", r.backup != null ? String(r.backup) : ""],
    ["backup_bytes", "Backup Size", r.backup_bytes ? fmtBytes(r.backup_bytes) : ""],
    ["pages", "Pages", r.pages],
    ["pixels", "Pixels", r.pixels ? r.pixels.toLocaleString() : ""],
    ["animated", "Animated", r.animated != null ? String(r.animated) : ""],
    ["placeholder", "Placeholder", r.placeholder != null ? String(r.placeholder) : ""],
    ["etag", "ETag", r.etag],
    ["illustration_score", "Illustration Score", r.illustration_score != null ? String(r.illustration_score) : ""],
    ["semi_transparent", "Semi-Transparent", r.semi_transparent != null ? String(r.semi_transparent) : ""],
    ["grayscale", "Grayscale", r.grayscale != null ? String(r.grayscale) : ""],
  ];
  if (r.is_audio) fields.push(["", "Audio", "Yes"]);
  if (r.audio_codec) fields.push(["", "Audio Codec", r.audio_codec]);
  if (r.audio_frequency) fields.push(["", "Audio Frequency", r.audio_frequency + " Hz"]);
  if (r.channels) fields.push(["", "Channels", r.channel_layout ? r.channels + " (" + r.channel_layout + ")" : String(r.channels)]);
  if (r.bit_rate) fields.push(["", "Bit Rate", Math.round(r.bit_rate / 1000) + " kbps"]);

  var h = '<div class="detail-grid">';
  for (var i = 0; i < fields.length; i++) {
    if (!fields[i][2] && fields[i][2] !== 0) continue;
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(fields[i][1]) + tip(fields[i][0]) + "</div>";
    h += '<div class="detail-cell-val">' + esc(String(fields[i][2])) + "</div>";
    h += "</div>";
  }
  h += "</div>";

  if (r.url || r.secure_url) {
    h += '<div style="margin-top:10px">';
    if (r.url) {
      h += '<div class="meta-row"><span class="meta-key">URL</span>';
      h += '<span class="meta-val link-val detail-cell-val" data-url="' + esc(r.url) + '">' + esc(r.url) + "</span></div>";
    }
    if (r.secure_url) {
      h += '<div class="meta-row"><span class="meta-key">Secure URL</span>';
      h += '<span class="meta-val link-val detail-cell-val" data-url="' + esc(r.secure_url) + '">' + esc(r.secure_url) + "</span></div>";
    }
    if (r.playback_url) {
      h += '<div class="meta-row"><span class="meta-key">Playback URL</span>';
      h += '<span class="meta-val link-val detail-cell-val" data-url="' + esc(r.playback_url) + '">' + esc(r.playback_url) + "</span></div>";
    }
    h += "</div>";
  }
  return h;
}

function renderAudioInfo(r) {
  var a = r.audio || (r.video_metadata && r.video_metadata.audio);
  var codec = (a && a.codec) || r.audio_codec || "";
  var bitRate = (a && a.bit_rate) || r.audio_bit_rate || "";
  var freq = (a && a.frequency) || r.audio_frequency || "";
  var ch = (a && a.channels) || r.channels || "";
  var layout = (a && a.channel_layout) || r.channel_layout || "";
  if (!codec && !bitRate && !freq && !ch) return "";
  var fields = [
    ["Codec", codec],
    ["Bit Rate", bitRate ? Math.round(Number(bitRate) / 1000) + " kbps" : ""],
    ["Frequency", freq ? Number(freq).toLocaleString() + " Hz" : ""],
    ["Channels", layout ? ch + " (" + layout + ")" : ch],
  ];
  var h = sectionStart("audio_info");
  h += '<summary class="detail-section-title">Audio Info</summary>';
  h += '<div class="detail-grid">';
  for (var i = 0; i < fields.length; i++) {
    if (!fields[i][1] && fields[i][1] !== 0) continue;
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(fields[i][0]) + "</div>";
    h += '<div class="detail-cell-val">' + esc(String(fields[i][1])) + "</div>";
    h += "</div>";
  }
  h += "</div></details>";
  return h;
}

function renderVideoInfo(r) {
  var v = r.video || (r.video_metadata && r.video_metadata.video);
  var codec = (v && v.codec) || r.codec || "";
  var profile = (v && v.profile) || r.profile || "";
  var level = (v && v.level) || r.level || "";
  var pixFmt = (v && v.pix_format) || r.pix_format || "";
  var vbr = (v && v.bit_rate) || r.video_bit_rate || "";
  var dar = (v && v.dar) || r.dar || "";
  var tb = (v && v.time_base) || r.time_base || "";
  if (!codec && !profile && !pixFmt && !vbr) return "";
  var fields = [
    ["Codec", codec],
    ["Profile", profile],
    ["Level", level],
    ["Pixel Format", pixFmt],
    ["Bit Rate", vbr ? Math.round(Number(vbr) / 1000) + " kbps" : ""],
    ["Aspect Ratio", dar],
    ["Time Base", tb],
    ["Frame Rate", r.frame_rate ? r.frame_rate + " fps" : ""],
    ["Frames", r.nb_frames],
    ["Rotation", (r.rotation != null && r.rotation !== 0) ? r.rotation + "\\u00b0" : ""],
  ];
  var h = sectionStart("video_info");
  h += '<summary class="detail-section-title">Video Info</summary>';
  h += '<div class="detail-grid">';
  for (var i = 0; i < fields.length; i++) {
    if (!fields[i][1] && fields[i][1] !== 0) continue;
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(fields[i][0]) + "</div>";
    h += '<div class="detail-cell-val">' + esc(String(fields[i][1])) + "</div>";
    h += "</div>";
  }
  h += "</div></details>";
  return h;
}

function renderTags(tags) {
  if (!tags || !tags.length) return "";
  var h = sectionStart("tags");
  h += '<summary class="detail-section-title">Tags' + tip("tags") + ' <span class="count">' + tags.length + "</span></summary>";
  h += '<div class="chip-list">';
  for (var i = 0; i < tags.length; i++) {
    h += '<span class="chip chip-tag">' + esc(tags[i]) + "</span>";
  }
  h += "</div></details>";
  return h;
}

function classifyMetaVal(v) {
  if (Array.isArray(v)) return "set";
  if (typeof v === "number") return "int";
  if (typeof v === "string" && /^\\d{4}-\\d{2}-\\d{2}/.test(v)) return "date";
  return "string";
}

function renderMetadata(meta) {
  if (!meta) return "";
  var keys = Object.keys(meta);
  if (!keys.length) return "";

  var groups = { string: [], int: [], date: [], set: [] };
  for (var i = 0; i < keys.length; i++) {
    var t = classifyMetaVal(meta[keys[i]]);
    groups[t].push({ key: keys[i], val: meta[keys[i]] });
  }

  var h = sectionStart("metadata");
  h += '<summary class="detail-section-title">Structured Metadata' + tip("metadata") + ' <span class="count">' + keys.length + "</span></summary>";

  if (groups.set.length) {
    for (var s = 0; s < groups.set.length; s++) {
      var item = groups.set[s];
      h += '<div class="meta-row" style="flex-direction:column;gap:4px">';
      h += '<span class="meta-key" style="max-width:100%">' + esc(prettyKey(item.key)) + "</span>";
      h += '<div class="chip-list">';
      for (var si = 0; si < item.val.length; si++) {
        h += '<span class="chip chip-set">' + esc(String(item.val[si])) + "</span>";
      }
      h += "</div></div>";
    }
  }
  if (groups.date.length) {
    for (var d = 0; d < groups.date.length; d++) {
      h += '<div class="meta-row">';
      h += '<span class="meta-key" title="' + esc(groups.date[d].key) + '">' + esc(prettyKey(groups.date[d].key)) + "</span>";
      h += '<span class="meta-val"><span class="chip chip-date">' + esc(groups.date[d].val) + "</span></span></div>";
    }
  }
  if (groups.int.length) {
    for (var n = 0; n < groups.int.length; n++) {
      h += '<div class="meta-row">';
      h += '<span class="meta-key" title="' + esc(groups.int[n].key) + '">' + esc(prettyKey(groups.int[n].key)) + "</span>";
      h += '<span class="meta-val"><span class="chip chip-int">' + esc(String(groups.int[n].val)) + "</span></span></div>";
    }
  }
  if (groups.string.length) {
    for (var st = 0; st < groups.string.length; st++) {
      h += '<div class="meta-row">';
      h += '<span class="meta-key" title="' + esc(groups.string[st].key) + '">' + esc(prettyKey(groups.string[st].key)) + "</span>";
      h += '<span class="meta-val">' + esc(String(groups.string[st].val)) + "</span></div>";
    }
  }

  h += "</details>";
  return h;
}

function renderDerived(derived, nextCursor, assetId) {
  if (!derived || !derived.length) return "";
  var h = sectionStart("derived");
  h += '<summary class="detail-section-title">Derived Assets' + tip("derived") + ' <span class="count" id="derived-count">' + derived.length + (nextCursor ? "+" : "") + "</span></summary>";
  h += '<div id="derived-list">';
  for (var i = 0; i < derived.length; i++) {
    var d = derived[i];
    var dUrl = d.secure_url || d.url || "";
    h += '<div class="derived-card">';
    if (dUrl) h += '<img class="derived-thumb" src="' + esc(dUrl) + '">';
    h += '<div class="derived-info">';
    h += '<div class="derived-tx">' + esc(d.transformation || "") + "</div>";
    h += '<div class="derived-meta">' + (d.format || "").toUpperCase() + " &middot; " + fmtBytes(d.bytes) + "</div>";
    h += "</div>";
    if (dUrl) h += '<span class="derived-open" data-url="' + esc(dUrl) + '">Open</span>';
    h += "</div>";
  }
  h += "</div>";
  if (nextCursor && assetId) {
    h += '<div style="text-align:center;padding:8px 0;">';
    h += '<button class="prompt-btn" id="load-more-derived-btn" data-cursor="' + esc(nextCursor) + '" data-asset-id="' + esc(assetId) + '">Load More Derived</button>';
    h += "</div>";
  }
  h += "</details>";
  return h;
}

function renderContext(ctx) {
  if (!ctx || typeof ctx !== "object") return "";
  var pairs = ctx.custom || ctx;
  if (typeof pairs !== "object") return "";
  var keys = Object.keys(pairs);
  if (!keys.length) return "";
  var h = sectionStart("context");
  h += '<summary class="detail-section-title">Context' + tip("context") + '</summary>';
  h += '<div class="detail-grid">';
  for (var i = 0; i < keys.length; i++) {
    var v = pairs[keys[i]];
    if (v === null || v === undefined) continue;
    var vs = typeof v === "object" ? JSON.stringify(v) : String(v);
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(prettyKey(keys[i])) + "</div>";
    h += '<div class="detail-cell-val">' + esc(vs) + "</div>";
    h += "</div>";
  }
  h += "</div></details>";
  return h;
}

function summarizeInfoVal(v) {
  if (typeof v !== "object" || v === null) return esc(String(v));
  if (v.status) return statusBadge(v.status);
  var parts = [];
  var keys = Object.keys(v);
  for (var i = 0; i < keys.length; i++) {
    var sv = v[keys[i]];
    if (sv && typeof sv === "object" && sv.status) {
      parts.push(esc(prettyKey(keys[i])) + ": " + statusBadge(sv.status));
    } else if (typeof sv === "string" || typeof sv === "number" || typeof sv === "boolean") {
      parts.push(esc(prettyKey(keys[i])) + ": " + esc(String(sv)));
    } else if (sv && typeof sv === "object") {
      parts.push(esc(prettyKey(keys[i])) + ": " + summarizeInfoVal(sv));
    }
  }
  return parts.length ? parts.join(", ") : esc(JSON.stringify(v));
}

function renderImageMetadata(meta) {
  if (!meta || typeof meta !== "object") return "";
  var keys = Object.keys(meta);
  if (!keys.length) return "";
  var h = sectionStart("image_metadata");
  h += '<summary class="detail-section-title">Media Metadata' + tip("image_metadata") + '</summary>';
  h += '<div class="detail-grid">';
  for (var i = 0; i < keys.length; i++) {
    var v = meta[keys[i]];
    if (v === null || v === undefined) continue;
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(prettyKey(keys[i])) + "</div>";
    h += '<div class="detail-cell-val">' + esc(String(v)) + "</div>";
    h += "</div>";
  }
  h += "</div></details>";
  return h;
}

function renderInfo(info) {
  if (!info || typeof info !== "object") return "";
  var keys = Object.keys(info);
  if (!keys.length) return "";
  var rows = "";
  for (var i = 0; i < keys.length; i++) {
    var v = info[keys[i]];
    if (v === null || v === undefined) continue;
    var statusStr = summarizeInfoVal(v);
    if (statusStr.length > 300) statusStr = statusStr.substring(0, 297) + "...";
    rows += '<div class="detail-cell">';
    rows += '<div class="detail-cell-key">' + esc(prettyKey(keys[i])) + "</div>";
    rows += '<div class="detail-cell-val">' + statusStr + "</div>";
    rows += "</div>";
  }
  if (!rows) return "";
  var h = sectionStart("info");
  h += '<summary class="detail-section-title">Info' + tip("info") + '</summary>';
  h += '<div class="detail-grid">' + rows + "</div></details>";
  return h;
}

function renderLastUpdated(lu) {
  if (!lu) return "";
  var keys = Object.keys(lu);
  if (!keys.length) return "";
  var h = sectionStart("timestamps");
  h += '<summary class="detail-section-title">Timestamps' + tip("last_updated") + '</summary>';
  h += '<div class="detail-grid">';
  for (var i = 0; i < keys.length; i++) {
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(prettyKey(keys[i])) + "</div>";
    h += '<div class="detail-cell-val">' + esc(fmtDate(lu[keys[i]])) + "</div>";
    h += "</div>";
  }
  h += "</div></details>";
  return h;
}

function renderHeroPreview(r) {
  var url = r.secure_url || r.url || "";
  var rt = r.resource_type || "";
  var h = "";

  if (rt === "raw") {
    h += '<div style="text-align:center;padding:30px 20px;background:var(--cld-bg3)">';
    h += '<div class="file-icon">' + fileTypeIcon(r.format);
    h += '<div class="file-icon-label">' + esc((r.format || "FILE").toUpperCase()) + "</div></div></div>";
    return h;
  }

  if (isAudioResource(r)) {
    var waveform = thumbUrl(url, 600, 120, r);
    h += '<div class="hero-audio-wrap">';
    if (waveform) {
      h += '<img class="hero-audio-waveform" src="' + esc(waveform) + '">';
    } else {
      h += '<div class="hero-audio-note">\\u266B</div>';
    }
    h += '<audio controls preload="metadata" src="' + esc(mediaUrl(url, r)) + '"></audio>';
    h += "</div>";
    return h;
  }

  if (rt === "video") {
    var poster = thumbUrl(url, 600, 300, r);
    var src = mediaUrl(url, r);
    h += '<div style="position:relative">';
    h += '<video class="hero-video" controls preload="metadata"';
    if (poster) h += ' poster="' + esc(poster) + '"';
    h += '><source src="' + esc(src) + '"></video>';
    if (r.duration) {
      h += '<div class="duration-badge">' + fmtDuration(r.duration) + "</div>";
    }
    h += "</div>";
    return h;
  }

  var thumb = thumbUrl(url, 600, 220, r);
  if (thumb) {
    h += '<img class="modal-hero" src="' + esc(thumb) + '">';
  }
  return h;
}

function renderMediaModalBody(r) {
  var url = r.secure_url || r.url || "";
  var h = "";

  if (isAudioResource(r)) {
    var waveform = thumbUrl(url, 560, 100, r);
    h += '<div class="media-modal-audio-wrap">';
    if (waveform) h += '<img src="' + esc(waveform) + '">';
    h += '<audio controls autoplay preload="metadata" src="' + esc(mediaUrl(url, r)) + '"></audio>';
    h += "</div>";
    return h;
  }

  var poster = thumbUrl(url, 600, 340, r);
  h += '<video class="media-modal-video" controls autoplay preload="metadata"';
  if (poster) h += ' poster="' + esc(poster) + '"';
  h += '><source src="' + esc(mediaUrl(url, r)) + '"></video>';
  return h;
}

function renderColors(colors, predominant) {
  var hasColors = colors && colors.length;
  var hasPred = predominant && typeof predominant === "object" && Object.keys(predominant).length;
  if (!hasColors && !hasPred) return "";

  var h = sectionStart("colors");
  h += '<summary class="detail-section-title">Colors' + tip("colors") + '</summary>';

  if (hasColors) {
    h += '<div class="color-row">';
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var hex = c[0] || "";
      var pct = c[1] != null ? parseFloat(c[1]).toFixed(1) + "%" : "";
      h += '<div class="color-swatch">';
      h += '<div class="color-swatch-box" style="background:' + esc(hex) + '"></div>';
      h += '<div class="color-swatch-label">' + esc(hex) + '</div>';
      if (pct) h += '<div class="color-swatch-pct">' + esc(pct) + '</div>';
      h += '</div>';
    }
    h += '</div>';
  }

  if (hasPred) {
    var pkeys = Object.keys(predominant);
    for (var p = 0; p < pkeys.length; p++) {
      var group = predominant[pkeys[p]];
      if (!group || !group.length) continue;
      h += '<div class="color-group-title">' + esc(prettyKey(pkeys[p])) + '</div>';
      h += '<div class="color-row">';
      for (var gi = 0; gi < group.length; gi++) {
        var gc = group[gi];
        var ghex = gc[0] || "";
        var gpct = gc[1] != null ? parseFloat(gc[1]).toFixed(1) + "%" : "";
        var isHex = ghex.charAt(0) === "#";
        h += '<div class="color-swatch">';
        if (isHex) h += '<div class="color-swatch-box" style="background:' + esc(ghex) + '"></div>';
        h += '<div class="color-swatch-label">' + esc(ghex) + '</div>';
        if (gpct) h += '<div class="color-swatch-pct">' + esc(gpct) + '</div>';
        h += '</div>';
      }
      h += '</div>';
    }
  }

  h += '</details>';
  return h;
}

function renderModerationSection(moderation, kind, status) {
  var hasArr = moderation && moderation.length;
  if (!hasArr && !kind && !status) return "";

  var h = sectionStart("moderation");
  h += '<summary class="detail-section-title">Moderation' + tip("moderation") + '</summary>';

  if (hasArr) {
    for (var i = 0; i < moderation.length; i++) {
      var m = moderation[i];
      h += '<div class="meta-row">';
      h += '<span class="meta-key">' + esc(m.kind || "unknown") + '</span>';
      h += '<span class="meta-val">' + (m.status ? statusBadge(m.status) : "");
      if (m.updated_at) h += ' \\u00b7 ' + fmtDate(m.updated_at);
      h += '</span></div>';
    }
  } else {
    h += '<div class="meta-row">';
    h += '<span class="meta-key">' + esc(kind || "unknown") + '</span>';
    h += '<span class="meta-val">' + (status ? statusBadge(status) : "") + '</span></div>';
  }

  h += '</details>';
  return h;
}

function renderAccessControl(acl) {
  if (!acl || !acl.length) return "";

  var h = sectionStart("access_control");
  h += '<summary class="detail-section-title">Access Control' + tip("access_control") + ' <span class="count">' + acl.length + '</span></summary>';

  for (var i = 0; i < acl.length; i++) {
    var rule = acl[i];
    h += '<div class="meta-row" style="flex-direction:column;gap:2px">';
    h += '<span class="meta-key" style="max-width:100%">' + esc(prettyKey(rule.access_type || "unknown")) + '</span>';
    var parts = [];
    if (rule.start) parts.push("Start: " + (typeof rule.start === "number" ? new Date(rule.start * 1000).toISOString() : String(rule.start)));
    if (rule.end) parts.push("End: " + (typeof rule.end === "number" ? new Date(rule.end * 1000).toISOString() : String(rule.end)));
    if (rule.key) parts.push("Key: " + rule.key);
    if (parts.length) h += '<span class="meta-val" style="text-align:left;font-size:11px;color:var(--cld-text3)">' + esc(parts.join(" \\u00b7 ")) + '</span>';
    h += '</div>';
  }

  h += '</details>';
  return h;
}

function renderVersions(versions) {
  if (!versions || !versions.length) return "";

  var h = sectionStart("versions");
  h += '<summary class="detail-section-title">Versions <span class="count">' + versions.length + '</span></summary>';

  for (var i = 0; i < versions.length; i++) {
    var v = versions[i];
    h += '<div class="meta-row">';
    h += '<span class="meta-key">' + esc(v.version_id || String(v.version || "#" + (i + 1))) + '</span>';
    var parts = [];
    if (v.format) parts.push(v.format.toUpperCase());
    if (v.size) parts.push(fmtBytes(v.size));
    if (v.time) parts.push(fmtDate(v.time));
    if (v.restorable != null) parts.push(v.restorable ? "Restorable" : "Not restorable");
    h += '<span class="meta-val">' + esc(parts.join(" \\u00b7 ")) + '</span>';
    h += '</div>';
  }

  h += '</details>';
  return h;
}

function renderEager(eager) {
  if (!eager || !eager.length) return "";

  var h = sectionStart("eager");
  h += '<summary class="detail-section-title">Eager Transformations <span class="count">' + eager.length + '</span></summary>';

  for (var i = 0; i < eager.length; i++) {
    var e = eager[i];
    var eUrl = e.secure_url || e.url || "";
    h += '<div class="derived-card">';
    if (eUrl) h += '<img class="derived-thumb" src="' + esc(eUrl) + '">';
    h += '<div class="derived-info">';
    h += '<div class="derived-tx">' + esc(e.transformation || "") + '</div>';
    var meta = [];
    if (e.format) meta.push(e.format.toUpperCase());
    if (e.width && e.height) meta.push(e.width + "\\u00d7" + e.height);
    if (e.bytes) meta.push(fmtBytes(e.bytes));
    h += '<div class="derived-meta">' + esc(meta.join(" \\u00b7 ")) + '</div>';
    h += '</div>';
    if (eUrl) h += '<span class="derived-open" data-url="' + esc(eUrl) + '">Open</span>';
    h += '</div>';
  }

  h += '</details>';
  return h;
}

function renderCoordinates(faces, coordinates) {
  var faceArr = (coordinates && coordinates.faces) || faces || [];
  var customArr = (coordinates && coordinates.custom) || [];
  if (!faceArr.length && !customArr.length) return "";

  var h = sectionStart("coordinates");
  h += '<summary class="detail-section-title">Coordinates' + tip("coordinates") + '</summary>';
  h += '<div class="detail-grid">';

  if (faceArr.length) {
    h += '<div class="detail-cell full-width">';
    h += '<div class="detail-cell-key">Faces' + tip("faces") + '</div>';
    h += '<div class="detail-cell-val">' + faceArr.length + ' region' + (faceArr.length !== 1 ? 's' : '');
    for (var i = 0; i < Math.min(faceArr.length, 5); i++) {
      var f = faceArr[i];
      if (f && f.length >= 4) h += ' [' + f[0] + ',' + f[1] + ',' + f[2] + ',' + f[3] + ']';
    }
    if (faceArr.length > 5) h += ' \\u2026';
    h += '</div></div>';
  }

  if (customArr.length) {
    h += '<div class="detail-cell full-width">';
    h += '<div class="detail-cell-key">Custom Regions</div>';
    h += '<div class="detail-cell-val">' + customArr.length + ' region' + (customArr.length !== 1 ? 's' : '');
    for (var j = 0; j < Math.min(customArr.length, 5); j++) {
      var c = customArr[j];
      if (c && c.length >= 4) h += ' [' + c[0] + ',' + c[1] + ',' + c[2] + ',' + c[3] + ']';
    }
    if (customArr.length > 5) h += ' \\u2026';
    h += '</div></div>';
  }

  h += '</div></details>';
  return h;
}

function renderDerivatives(derivatives) {
  if (!derivatives || !derivatives.length) return "";

  var h = sectionStart("derivatives");
  h += '<summary class="detail-section-title">Derivatives' + tip("derivatives") + ' <span class="count">' + derivatives.length + '</span></summary>';

  for (var i = 0; i < derivatives.length; i++) {
    var d = derivatives[i];
    var dUrl = d.secure_url || "";
    h += '<div class="derived-card">';
    if (dUrl) h += '<img class="derived-thumb" src="' + esc(dUrl) + '">';
    h += '<div class="derived-info">';
    h += '<div class="derived-tx">' + esc(d.transformation || "") + '</div>';
    if (d.id) h += '<div class="derived-meta">ID: ' + esc(d.id) + '</div>';
    h += '</div>';
    if (dUrl) h += '<span class="derived-open" data-url="' + esc(dUrl) + '">Open</span>';
    h += '</div>';
  }

  h += '</details>';
  return h;
}

function renderQualityAnalysis(qa, score) {
  if (!qa && score == null) return "";

  var h = sectionStart("quality_analysis");
  h += '<summary class="detail-section-title">Quality Analysis' + tip("quality_analysis") + '</summary>';
  h += '<div class="detail-grid">';

  if (score != null) {
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">Overall Score</div>';
    h += '<div class="detail-cell-val">' + esc(String(score)) + '</div>';
    h += '</div>';
  }

  if (qa && typeof qa === "object") {
    var keys = Object.keys(qa);
    for (var i = 0; i < keys.length; i++) {
      var v = qa[keys[i]];
      if (v == null) continue;
      h += '<div class="detail-cell">';
      h += '<div class="detail-cell-key">' + esc(prettyKey(keys[i])) + '</div>';
      h += '<div class="detail-cell-val">' + esc(typeof v === "number" ? v.toFixed(2) : String(v)) + '</div>';
      h += '</div>';
    }
  }

  h += '</div></details>';
  return h;
}

function renderAccessibilityAnalysis(aa) {
  if (!aa || typeof aa !== "object") return "";

  var h = sectionStart("accessibility_analysis");
  h += '<summary class="detail-section-title">Accessibility Analysis' + tip("accessibility_analysis") + '</summary>';
  h += '<div class="detail-grid">';

  if (aa.colorblind_accessibility_score != null) {
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">Colorblind Score</div>';
    h += '<div class="detail-cell-val">' + esc(String(aa.colorblind_accessibility_score)) + '</div>';
    h += '</div>';
  }

  var cba = aa.colorblind_accessibility_analysis;
  if (cba && typeof cba === "object") {
    if (cba.distinct_edges != null) {
      h += '<div class="detail-cell">';
      h += '<div class="detail-cell-key">Distinct Edges</div>';
      h += '<div class="detail-cell-val">' + esc(String(cba.distinct_edges)) + '</div>';
      h += '</div>';
    }
    if (cba.distinct_colors != null) {
      h += '<div class="detail-cell">';
      h += '<div class="detail-cell-key">Distinct Colors</div>';
      h += '<div class="detail-cell-val">' + esc(String(cba.distinct_colors)) + '</div>';
      h += '</div>';
    }
    if (cba.most_indistinct_pair && cba.most_indistinct_pair.length) {
      h += '<div class="detail-cell full-width">';
      h += '<div class="detail-cell-key">Most Indistinct Pair</div>';
      h += '<div class="detail-cell-val" style="display:flex;gap:6px;align-items:center">';
      for (var i = 0; i < cba.most_indistinct_pair.length; i++) {
        var hex = cba.most_indistinct_pair[i];
        h += '<span style="display:inline-flex;align-items:center;gap:4px">';
        h += '<span style="width:16px;height:16px;border-radius:3px;border:1px solid var(--cld-border);background:' + esc(hex) + ';display:inline-block;vertical-align:middle"></span>';
        h += esc(hex);
        h += '</span>';
      }
      h += '</div></div>';
    }
  }

  h += '</div></details>';
  return h;
}

function renderRelatedAssets(related) {
  if (!related || !related.length) return "";

  var h = sectionStart("related_assets");
  h += '<summary class="detail-section-title">Related Assets' + tip("related_assets") + ' <span class="count">' + related.length + '</span></summary>';

  for (var i = 0; i < related.length; i++) {
    var ra = related[i];
    h += '<div class="meta-row">';
    h += '<span class="meta-key">' + esc(ra.asset_id || ra.public_id || "#" + (i + 1)) + '</span>';
    var parts = [];
    if (ra.format) parts.push(ra.format.toUpperCase());
    if (ra.resource_type) parts.push(ra.resource_type);
    if (ra.bytes) parts.push(fmtBytes(ra.bytes));
    h += '<span class="meta-val">' + esc(parts.join(" \\u00b7 ")) + '</span>';
    h += '</div>';
  }

  h += '</details>';
  return h;
}

var RENDERED_KEYS = {
  asset_id:1, public_id:1, version:1, version_id:1, signature:1,
  width:1, height:1, format:1, resource_type:1, created_at:1,
  tags:1, bytes:1, type:1, etag:1, placeholder:1, url:1,
  secure_url:1, asset_folder:1, display_name:1, access_mode:1,
  pages:1, duration:1, is_audio:1, audio_codec:1, audio_frequency:1,
  channels:1, channel_layout:1, bit_rate:1, backup:1, original_filename:1,
  metadata:1, info:1, derived:1, context:1, image_metadata:1, media_metadata:1,
  colors:1, predominant:1, moderation:1, moderation_kind:1, moderation_status:1,
  faces:1, coordinates:1, eager:1, animated:1, illustration_score:1,
  semi_transparent:1, grayscale:1, status:1, substatus:1, resource_subtype:1,
  backup_bytes:1, pixels:1, uploaded_at:1, filename:1, folder:1,
  api_key:1, derivatives:1, versions:1, access_control:1, related_assets:1,
  quality_analysis:1, quality_score:1, accessibility_analysis:1, phash:1,
  cinemagraph_analysis:1, responsive_breakpoints:1, last_updated:1,
  next_cursor:1, derived_next_cursor:1, usage:1,
  playback_url:1, video_metadata:1,
  frame_rate:1, rotation:1, nb_frames:1,
  audio_codec:1, audio_bit_rate:1, audio_frequency:1, channels:1, channel_layout:1,
  codec:1, profile:1, level:1, pix_format:1, video_bit_rate:1, dar:1, time_base:1
};

function isEmptyObj(v) {
  if (v === null || v === undefined || v === "") return true;
  if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

var RENDERED_LEAF_KEYS = {
  codec:1, bit_rate:1, frequency:1, channels:1, channel_layout:1,
  pix_format:1, profile:1, level:1, dar:1, time_base:1
};

function flattenObj(obj, prefix, out) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = obj[k];
    var label = prefix ? prefix + " \\u203a " + prettyKey(k) : prettyKey(k);
    if (isEmptyObj(v)) continue;
    if (prefix && RENDERED_LEAF_KEYS[k] && typeof v !== "object") continue;
    if (Array.isArray(v)) {
      var vs = JSON.stringify(v);
      if (vs.length > 500) vs = vs.substring(0, 497) + "...";
      out.push([label, vs, k]);
    } else if (typeof v === "object") {
      flattenObj(v, label, out);
    } else {
      var s = String(v);
      if (s.length > 500) s = s.substring(0, 497) + "...";
      out.push([label, s, k]);
    }
  }
}

function renderExtraFields(r) {
  var cells = [];
  var keys = Object.keys(r);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (RENDERED_KEYS[k]) continue;
    var v = r[k];
    if (isEmptyObj(v)) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      flattenObj(v, prettyKey(k), cells);
    } else {
      var vs = typeof v === "object" ? JSON.stringify(v) : String(v);
      if (vs.length > 500) vs = vs.substring(0, 497) + "...";
      cells.push([prettyKey(k), vs, k]);
    }
  }
  if (!cells.length) return "";
  var h = "";
  for (var c = 0; c < cells.length; c++) {
    h += '<div class="detail-cell">';
    h += '<div class="detail-cell-key">' + esc(cells[c][0]) + (cells[c][2] && !cells[c][0].indexOf("\\u203a") ? tip(cells[c][2]) : "") + "</div>";
    h += '<div class="detail-cell-val" style="word-break:break-all">' + esc(cells[c][1]) + "</div>";
    h += "</div>";
  }
  var out = '<details class="upload-section" style="margin-top:12px">';
  out += "<summary>More Details</summary>";
  out += '<div class="detail-grid" style="padding:10px 12px">' + h + "</div>";
  out += "</details>";
  return out;
}

function syntaxHighlight(json) {
  var s = json.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return s.replace(
    /("(\\\\u[a-fA-F0-9]{4}|\\\\[^u]|[^\\\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function(m) {
      var cls = "json-num";
      if (/^"/.test(m)) {
        cls = /:$/.test(m) ? "json-key" : "json-str";
      } else if (/true|false/.test(m)) {
        cls = "json-bool";
      } else if (/null/.test(m)) {
        cls = "json-null";
      }
      return '<span class="' + cls + '">' + m + "</span>";
    }
  );
}

function renderRawResponse(r) {
  if (!r || typeof r !== "object") return "";
  var json = JSON.stringify(r, null, 2);
  var out = '<details class="upload-section" style="margin-top:12px">';
  out += "<summary>Raw Response</summary>";
  out += '<pre class="raw-response-pre">' + syntaxHighlight(json) + "</pre>";
  out += "</details>";
  return out;
}

function renderFullDetails(r) {
  var body = renderHeroPreview(r);

  body += sectionStart("asset_info");
  body += '<summary class="detail-section-title">Asset Info</summary>';
  body += renderAssetGrid(r);
  body += "</details>";

  body += renderAudioInfo(r);
  body += renderVideoInfo(r);
  body += renderTags(r.tags);
  body += renderContext(r.context);
  body += renderImageMetadata(r.image_metadata || r.media_metadata);
  body += renderColors(r.colors, r.predominant);
  body += renderModerationSection(r.moderation, r.moderation_kind, r.moderation_status);
  body += renderAccessControl(r.access_control);
  body += renderCoordinates(r.faces, r.coordinates);
  body += renderLastUpdated(r.last_updated);
  body += renderMetadata(r.metadata);
  body += renderInfo(r.info);
  body += renderDerived(r.derived, r.derived_next_cursor, r.asset_id);
  body += renderDerivatives(r.derivatives);
  body += renderRelatedAssets(r.related_assets);
  body += renderVersions(r.versions);
  body += renderEager(r.eager);
  body += renderQualityAnalysis(r.quality_analysis, r.quality_score);
  body += renderAccessibilityAnalysis(r.accessibility_analysis);
  body += renderExtraFields(r);
  body += renderRawResponse(r);

  return body;
}

async function loadMoreDerived(btn) {
  var cursor = btn.dataset.cursor;
  var aid = btn.dataset.assetId;
  if (!cursor || !aid) return;
  btn.textContent = "Loading\\u2026";
  btn.disabled = true;
  try {
    var res = await app.callServerTool({
      name: "get-asset-details",
      arguments: { asset_id: aid, derived_next_cursor: cursor },
    });
    var data = ingestResult(res);
    if (data && data.derived && data.derived.length) {
      var container = document.getElementById("derived-list");
      if (container) {
        var frag = "";
        for (var i = 0; i < data.derived.length; i++) {
          var d = data.derived[i];
          var dUrl = d.secure_url || d.url || "";
          frag += '<div class="derived-card">';
          if (dUrl) frag += '<img class="derived-thumb" src="' + esc(dUrl) + '">';
          frag += '<div class="derived-info">';
          frag += '<div class="derived-tx">' + esc(d.transformation || "") + '</div>';
          frag += '<div class="derived-meta">' + (d.format || "").toUpperCase() + " \\u00b7 " + fmtBytes(d.bytes) + '</div>';
          frag += '</div>';
          if (dUrl) frag += '<span class="derived-open" data-url="' + esc(dUrl) + '">Open</span>';
          frag += '</div>';
        }
        container.insertAdjacentHTML("beforeend", frag);
        requestAnimationFrame(function() {
          app.reportSize(document.documentElement.scrollHeight);
        });
      }
      var countEl = document.getElementById("derived-count");
      if (countEl) {
        var total = container.querySelectorAll(".derived-card").length;
        countEl.textContent = total + (data.derived_next_cursor ? "+" : "");
      }
      if (data.derived_next_cursor) {
        btn.dataset.cursor = data.derived_next_cursor;
        btn.textContent = "Load More Derived";
        btn.disabled = false;
      } else {
        btn.parentElement.remove();
      }
    } else {
      btn.parentElement.remove();
    }
  } catch (e) {
    showError("Load Failed", e && e.message ? e.message : String(e));
    btn.textContent = "Load More Derived";
    btn.disabled = false;
  }
}
`;

// ── JS: Host context handler ────────────────────────────────────────
export const SHARED_JS_HOST_CONTEXT = /* js */ `
var _themeOverride = null;
var _hostTheme = null;

function applyTheme() {
  var effective;
  if (_themeOverride === "light" || _themeOverride === "dark") {
    effective = _themeOverride;
  } else {
    effective = _hostTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  document.documentElement.setAttribute("data-theme", effective);
}

var _themeIcons = {
  light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  system: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  dark: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
};
var _themeCycle = ["light", "system", "dark"];
var _themeLabels = { light: "Light", system: "System", dark: "Dark" };

function renderThemeToggle() {
  var existing = document.getElementById("theme-btn");
  if (existing) existing.remove();
  var current = _themeOverride || "system";
  var btn = document.createElement("button");
  btn.id = "theme-btn";
  btn.className = "theme-btn";
  btn.title = _themeLabels[current];
  btn.innerHTML = _themeIcons[current];
  btn.addEventListener("click", function() {
    var cur = _themeOverride || "system";
    var idx = (_themeCycle.indexOf(cur) + 1) % _themeCycle.length;
    var next = _themeCycle[idx];
    _themeOverride = next === "system" ? null : next;
    try { localStorage.setItem("cld-theme", next); } catch(e) {}
    applyTheme();
    renderThemeToggle();
  });
  document.body.appendChild(btn);
}

function setupHostContext(app) {
  try { var saved = localStorage.getItem("cld-theme");
    if (saved === "light" || saved === "dark") _themeOverride = saved;
  } catch(e) {}

  app.onhostcontextchanged = function(ctx) {
    if (ctx.theme) {
      _hostTheme = ctx.theme;
      applyTheme();
    }
    if (ctx.styles && ctx.styles.variables) {
      var vars = ctx.styles.variables;
      for (var k in vars) document.documentElement.style.setProperty(k, vars[k]);
    }
    if (ctx.styles && ctx.styles.css && ctx.styles.css.fonts) {
      var el = document.getElementById("host-fonts");
      if (!el) { el = document.createElement("style"); el.id = "host-fonts"; document.head.appendChild(el); }
      el.textContent = ctx.styles.css.fonts;
    }
    if (ctx.safeAreaInsets) {
      var s = ctx.safeAreaInsets;
      document.body.style.padding =
        (s.top||0)+"px "+(s.right||0)+"px "+(s.bottom||0)+"px "+(s.left||0)+"px";
    }
  };

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function() {
    if (!_themeOverride) applyTheme();
  });

  applyTheme();
  renderThemeToggle();
}

function setupResize(app, minHeight) {
  var _raf = 0;
  function report() {
    cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(function() {
      app.reportSize(Math.max(document.documentElement.scrollHeight, minHeight));
    });
  }
  var ro = new ResizeObserver(report);
  ro.observe(document.body);
  ro.observe(document.documentElement);
  report();
}
`;

// ── JS: Tooltip map (generated at build time from Zod schema descriptions) ──
export const SHARED_JS_TOOLTIPS = /* js */ `var FIELD_TIPS = ${TOOLTIP_MAP_JSON};

function tip(key) {
  if (!key) return "";
  var d = FIELD_TIPS[key];
  if (!d) return "";
  return ' <span class="help-toggle" tabindex="0">?<span class="help-bubble">' + esc(d) + '</span></span>';
}
`;
