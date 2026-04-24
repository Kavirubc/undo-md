# --- Builder Stage ---
FROM node:22-alpine AS builder
WORKDIR /app

# Install bun
RUN apk add --no-cache bash curl unzip && \
    (unset OS; unset SHELL; curl -fsSL https://bun.sh/install | bash)

# Add bun to the PATH
ENV PATH="/root/.bun/bin:$PATH"

# Copy dependency manifests
COPY package.json package-lock.json tsconfig.json ./

# Install dependencies
RUN bun install --ignore-scripts

# Copy the rest of the source code
COPY . .

# Build the application
RUN bun src/mcp-server/build.mts && npx tsc


# --- Release Stage ---
FROM node:22-alpine AS release
WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests from builder
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install production-only dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --omit=dev --prefer-offline --no-audit --progress=false

# Copy built server from builder stage
COPY --from=builder /app/bin ./bin

LABEL io.modelcontextprotocol.server.name="io.github.cloudinary/asset-management-mcp"

# Entrypoint to run the MCP server
ENTRYPOINT ["node", "bin/mcp-server.js"]

