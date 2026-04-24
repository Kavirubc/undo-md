import { SDKInitHook } from "./types.js";
import { SDKOptions, SDK_METADATA } from "../lib/config.js";

// Extract product name from package name part
function getProductName(packageName: string): string {
    try {
        if (packageName) {
            // Extract package name from the package part
            // Format: "@cloudinary/asset-management-mcp"
            const match = packageName.match(/@cloudinary\/(.+)/);
            if (match && match[1]) {
                // Convert kebab-case to PascalCase: "asset-management-mcp" -> "AssetManagementMcp"
                return match[1]
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('');
            }
        }
        return "Unknown";
    } catch {
        return "Unknown";
    }
}

function isRemoteMCP(): boolean {
    // Check if we are running in the OAuth wrapper environment
    const process = (globalThis as any)?.process;
    return process?.env?.['OAUTH_WRAPPER_ORIGIN'] !== undefined;
}

function getRuntime(): string {
    return 'MCP';
}

function getSystemInfo(): string {
    const process = (globalThis as any)?.process;
    const nodeVersion = process?.version || 'unknown'; // e.g., "v18.17.0"
    const platform = process?.platform || 'unknown'; // e.g., "darwin", "linux", "win32"
    const arch = process?.arch || 'unknown'; // e.g., "x64", "arm64"

    return `Node.js ${nodeVersion.startsWith('v') ? nodeVersion.substring(1) : nodeVersion}; ${platform} ${arch}`;
}

function getEnvDetails(): string {
    return isRemoteMCP() ? '; RemoteMCP' : '';
}

function buildUserAgent(
    sdkVersion: string,
    genVersion: string,
    openapiDocVersion: string,
    packageName: string,
    runtime: string,
    callerUserAgent?: string,
): string {
    const productName = getProductName(packageName);
    const systemInfo = getSystemInfo();
    const envDetails = getEnvDetails();
    const origin = callerUserAgent ? `; origin ${callerUserAgent}` : '';

    return `Cloudinary/${productName} ${runtime}/${sdkVersion} Gen/${genVersion} Schema/${openapiDocVersion} (${systemInfo}${envDetails}${origin})`;
}

export class UserAgentHook implements SDKInitHook {
    sdkInit(opts: SDKOptions): SDKOptions {
        // If opts.userAgent is pre-set (e.g. by mcp-service via getSDK),
        // treat it as the caller's User-Agent to embed in the combined string.
        const callerUserAgent = opts.userAgent || undefined;

        const originalUserAgent = SDK_METADATA.userAgent;

        if (originalUserAgent && originalUserAgent.startsWith("speakeasy-sdk/")) {
            const parts = originalUserAgent.split(" ");

            if (parts.length >= 5) {
                const sdkVersion = parts[1];
                const genVersion = parts[2];
                const openapiDocVersion = parts[3];
                const packageName = parts[4];

                // Ensure all parts are defined before proceeding
                if (sdkVersion && genVersion && openapiDocVersion && packageName) {
                    const runtime = getRuntime();
                    opts.userAgent = buildUserAgent(
                        sdkVersion, genVersion, openapiDocVersion,
                        packageName, runtime, callerUserAgent,
                    );
                }
            }
        }
        return opts;
    }
}
