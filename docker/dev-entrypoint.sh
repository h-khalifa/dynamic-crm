#!/bin/sh
set -e
cd /app

# Install / sync dependencies into the node_modules volume when package files change.
HASH_FILE=node_modules/.deps-hash
CURRENT_HASH=$(cat package.json package-lock.json 2>/dev/null | sha1sum | cut -d' ' -f1)
if [ ! -f "$HASH_FILE" ] || [ "$(cat $HASH_FILE)" != "$CURRENT_HASH" ]; then
  echo "[entrypoint] Installing dependencies..."
  npm install --no-audit --no-fund
  CURRENT_HASH=$(cat package.json package-lock.json 2>/dev/null | sha1sum | cut -d' ' -f1)
  echo "$CURRENT_HASH" > "$HASH_FILE"
fi

npx prisma generate >/dev/null

exec "$@"
