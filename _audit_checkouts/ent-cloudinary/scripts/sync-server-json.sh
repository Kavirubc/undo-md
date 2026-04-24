#!/usr/bin/env bash
set -euo pipefail

#
# Sync server.json versions from package.json.
#
# Speakeasy bumps the version in package.json and gen.yaml automatically.
# This script propagates that version into server.json so the MCP Registry
# metadata stays in sync.
#
# Usage: bash scripts/sync-server-json.sh
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_JSON="$ROOT/server.json"
PACKAGE_JSON="$ROOT/package.json"

if [[ ! -f "$SERVER_JSON" ]]; then
  echo "server.json not found, skipping."
  exit 0
fi

VERSION=$(node -p "require('$PACKAGE_JSON').version")

if [[ -z "$VERSION" ]]; then
  echo "Error: Could not read version from package.json" >&2
  exit 1
fi

CURRENT=$(node -p "require('$SERVER_JSON').version")

if [[ "$CURRENT" == "$VERSION" ]]; then
  echo "server.json already at v$VERSION."
  exit 0
fi

echo "Syncing server.json: v$CURRENT → v$VERSION"

node -e "
  const fs = require('fs');
  const s = JSON.parse(fs.readFileSync('$SERVER_JSON', 'utf8'));
  const v = '$VERSION';
  s.version = v;
  for (const p of (s.packages || [])) {
    if (p.version) p.version = v;
    if (p.identifier && p.identifier.includes(':')) {
      p.identifier = p.identifier.replace(/:[^:]+$/, ':' + v);
    }
  }
  fs.writeFileSync('$SERVER_JSON', JSON.stringify(s, null, 2) + '\n');
"

echo "server.json updated to v$VERSION."
