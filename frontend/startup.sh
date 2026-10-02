#!/bin/sh
# startup.sh — runs inside the frontend container
# 1. Runs pending migrations (safe to run multiple times)
# 2. Starts the Next.js server

set -e

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Starting Next.js server..."
exec node server.js
