#!/bin/sh
set -e

cd /app

if [ ! -f node_modules/.bin/vite ]; then
  echo "[entrypoint] Installing npm dependencies..."
  npm install
fi

exec "$@"
