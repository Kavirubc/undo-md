import { CollectHeaders } from "./cloudConfig.js";
import { AfterSuccessContext, AfterSuccessHook } from "./types.js";

/**
 * Checks whether a lowercased header name matches a single collect spec.
 *
 * Supported spec formats:
 *   - `"prefix:<value>"`  → headerName.startsWith(value)
 *   - `"regex:<pattern>"` → new RegExp(pattern).test(headerName)
 *   - any other string    → exact match
 *
 * Both headerName and spec are expected to be lowercased already.
 */
function matchesSpec(headerName: string, spec: string): boolean {
  if (spec.startsWith("prefix:")) {
    return headerName.startsWith(spec.slice(7));
  }
  if (spec.startsWith("regex:")) {
    try {
      return new RegExp(spec.slice(6)).test(headerName);
    } catch {
      return false; // invalid regex — skip
    }
  }
  return headerName === spec;
}

/**
 * Captures response headers and injects them into the JSON body as `_headers`
 * so they survive through the generated formatResult() and surface in MCP tool
 * output. The set of headers to collect is driven by configuration:
 *   - `true`      → collect every response header
 *   - `string[]`  → collect only matching headers (exact name, prefix:, or regex:)
 */
export class ResponseHeadersHook implements AfterSuccessHook {
  private readonly collectHeaders: CollectHeaders;

  constructor(collectHeaders: CollectHeaders) {
    this.collectHeaders = collectHeaders;
  }

  async afterSuccess(
    hookCtx: AfterSuccessContext,
    response: Response,
  ): Promise<Response> {
    // Per-request SDK options override the constructor config (used by mcp-service)
    const optCollect = (hookCtx.options as any)?.collectHeaders as
      | CollectHeaders
      | undefined;
    const effective = optCollect ?? this.collectHeaders;

    // Not configured — exit early
    if (effective !== true && effective.length === 0) {
      return response;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      return response;
    }

    const hdrs: Record<string, string> = {};
    let found = false;

    if (effective === true) {
      // Collect all response headers
      for (const [name, value] of response.headers.entries()) {
        hdrs[name] = value;
        found = true;
      }
    } else {
      // Match each response header against the specs (exact, prefix:, regex:)
      for (const [name, value] of response.headers.entries()) {
        for (const spec of effective) {
          if (matchesSpec(name, spec)) {
            hdrs[name] = value;
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      return response;
    }

    // Read body, inject headers, return a new Response so the stream is fresh.
    const body = await response.json();
    body._headers = hdrs;

    return new Response(JSON.stringify(body), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
}
