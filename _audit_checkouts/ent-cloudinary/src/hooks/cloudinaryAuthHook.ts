import { CloudConfig } from "./cloudConfig.js";
import { BeforeRequestContext, BeforeRequestHook } from "./types.js";

/**
 * Attaches Cloudinary authentication to every outgoing request.
 *
 * Priority:
 *   1. OAuth2 Bearer token (if provided via security source)
 *   2. Basic auth (apiKey:apiSecret) — works for all endpoints including upload
 *
 * Also preprocesses JSON request bodies to convert local `file://` URIs
 * into base64 data URIs so uploads work with local file paths.
 */
export class CloudinaryAuthHook implements BeforeRequestHook {
    private readonly config: CloudConfig;

    constructor(config: CloudConfig) {
        this.config = config;
    }

    async beforeRequest(
        hookCtx: BeforeRequestContext,
        request: Request,
    ): Promise<Request> {
        const security = await this.resolveSecurity(hookCtx.securitySource);

        // 1. OAuth2 Bearer token takes priority
        if (this.isOAuth2Token(security)) {
            request.headers.set("Authorization", `Bearer ${security.oauth2}`);
            return request;
        }

        // 2. Resolve API key / secret (env → security overrides)
        const { apiKey, apiSecret } = this.resolveCredentials(security);
        if (!apiKey || !apiSecret) {
            return request;
        }

        // Set Basic auth header
        const encoded = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
        request.headers.set("Authorization", `Basic ${encoded}`);

        // Preprocess JSON bodies (e.g. convert file:// URIs to base64)
        request = await this.preprocessBody(request);

        return request;
    }

    // --- Security resolution ---

    private async resolveSecurity(source: unknown): Promise<unknown> {
        return typeof source === "function" ? source() : source;
    }

    private isOAuth2Token(
        security: unknown,
    ): security is { oauth2: string } {
        return (
            typeof security === "object"
            && security !== null
            && "oauth2" in security
            && typeof (security as any).oauth2 === "string"
            && (security as any).oauth2.length > 0
        );
    }

    private resolveCredentials(security: unknown): {
        apiKey: string;
        apiSecret: string;
    } {
        let { apiKey, apiSecret } = this.config;

        if (!security || typeof security !== "object") {
            return { apiKey, apiSecret };
        }

        const sec = security as Record<string, any>;

        // cloudinaryAuth format (camelCase and snake_case)
        if (sec["cloudinaryAuth"]) {
            const auth = sec["cloudinaryAuth"];
            apiKey = auth.apiKey || auth.api_key || apiKey;
            apiSecret = auth.apiSecret || auth.api_secret || apiSecret;
        }
        // Standard SDK security format (used by MCP server)
        else if ("apiKey" in sec || "apiSecret" in sec) {
            apiKey = sec["apiKey"] || apiKey;
            apiSecret = sec["apiSecret"] || apiSecret;
        }

        return { apiKey, apiSecret };
    }

    // --- Body preprocessing ---

    /**
     * For JSON requests, converts local `file://` URIs to inline base64
     * data URIs so Cloudinary can accept the upload payload.
     */
    private async preprocessBody(request: Request): Promise<Request> {
        if (request.headers.get("Content-Type") !== "application/json") {
            return request;
        }

        const body = await request.json();

        if (
            typeof body?.file === "string"
            && body.file.startsWith("file://")
        ) {
            body.file = await this.readLocalFileAsDataUri(body.file);
            return new Request(request, { body: JSON.stringify(body) });
        }

        return new Request(request, { body: JSON.stringify(body) });
    }

    /**
     * Reads a local file and returns it as a base64 data URI.
     */
    private async readLocalFileAsDataUri(fileUrl: string): Promise<string> {
        const filePath = fileUrl.replace(/^file:\/\//, "");

        try {
            const { readFile } = await import("node:fs/promises");
            const buffer = await readFile(filePath);
            const base64 = buffer.toString("base64");
            return `data:application/octet-stream;base64,${base64}`;
        } catch (error) {
            throw new Error(
                `Failed to read file: ${filePath}. ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
