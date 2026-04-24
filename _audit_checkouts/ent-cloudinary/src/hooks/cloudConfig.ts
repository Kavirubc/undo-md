/**
 * Parsed value for the collect_headers option.
 *   - `true`  → collect ALL response headers
 *   - `string[]` → collect only the listed header names (lowercased)
 *   - `[]`    → disabled (default)
 */
export type CollectHeaders = true | string[];

export class CloudConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    collectHeaders: CollectHeaders;

    constructor() {
        this.cloudName = "";
        this.apiKey = "";
        this.apiSecret = "";
        this.collectHeaders = [];

        // Access process through globalThis
        const process = (globalThis as any)?.process;

        // First, try to parse CLOUDINARY_URL if it exists
        let envVar: string | undefined = undefined;

        if (process?.env?.CLOUDINARY_URL) {
            envVar = process.env.CLOUDINARY_URL;
        }

        if (envVar) {
            try {
                const url = new URL(envVar);
                this.cloudName = url.host;
                this.apiKey = url.username || "";
                this.apiSecret = url.password || "";

                // Parse collect_headers from CLOUDINARY_URL query params
                const collectParam = url.searchParams.get("collect_headers");
                if (collectParam) {
                    this.collectHeaders = CloudConfig.parseCollectHeaders(collectParam);
                }
            } catch (error) {
                throw new Error(`Invalid CLOUDINARY_URL: '${envVar}'`);
            }
        }

        // Then, check for individual environment variables (these take precedence)
        if (process?.env) {
            if (process.env.CLOUDINARY_CLOUD_NAME) {
                this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            }
            if (process.env.CLOUDINARY_API_KEY) {
                this.apiKey = process.env.CLOUDINARY_API_KEY;
            }
            if (process.env.CLOUDINARY_API_SECRET) {
                this.apiSecret = process.env.CLOUDINARY_API_SECRET;
            }

            // CLOUDINARY_COLLECT_HEADERS takes precedence over CLOUDINARY_URL query param
            if (process.env.CLOUDINARY_COLLECT_HEADERS) {
                this.collectHeaders = CloudConfig.parseCollectHeaders(
                    process.env.CLOUDINARY_COLLECT_HEADERS,
                );
            }
        }

        // Automatically set CLOUDINARY_CLOUD_NAME if not already set
        // This ensures the SDK can find cloudName during initialization
        if (this.cloudName && process?.env && !process.env.CLOUDINARY_CLOUD_NAME) {
            process.env.CLOUDINARY_CLOUD_NAME = this.cloudName;
        }
    }

    /**
     * Parses a collect_headers value.
     *   "true" | "all" → `true` (collect every header)
     *   "x-request-id,cf-ray" → `["x-request-id", "cf-ray"]`
     *   "" → `[]` (disabled)
     */
    private static parseCollectHeaders(value: string): CollectHeaders {
        const trimmed = value.trim().toLowerCase();
        if (trimmed === "true" || trimmed === "all") {
            return true;
        }
        const names = trimmed
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean);
        return names;
    }
}
