import { BeforeRequestContext, BeforeRequestHook } from "./types.js";

/**
 * Injects custom headers into every outgoing request to the Cloudinary API.
 *
 * Headers are read from `hookCtx.options.customHeaders` (a Record<string, string>),
 * which is set by mcp-service when constructing the SDK via getSDK.
 *
 * When no custom headers are configured, this hook is a no-op.
 */
export class CustomHeadersHook implements BeforeRequestHook {
    async beforeRequest(
        hookCtx: BeforeRequestContext,
        request: Request,
    ): Promise<Request> {
        const customHeaders = (hookCtx.options as any)?.customHeaders as
            | Record<string, string>
            | undefined;

        if (!customHeaders) {
            return request;
        }

        for (const [name, value] of Object.entries(customHeaders)) {
            request.headers.set(name, value);
        }

        return request;
    }
}
