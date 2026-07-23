#!/usr/bin/env bash
# Updates a running Bakar deployment: pull → deps → build → migrate → reload.
# Run on the server as the app user:   bash deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bakar}"
cd "$APP_DIR"

echo "==> 1/6 Source"
if [ -d .git ]; then
  git pull --ff-only
else
  echo "    not a git checkout — assuming files were uploaded via rsync/scp"
fi

# Build tools (typescript, prisma CLI, vite) live in devDependencies, so a full
# install is required. Do NOT use --omit=dev here: the build would fail.
echo "==> 2/6 Dependencies"
npm install --prefix server
npm install --prefix client

echo "==> 3/6 Prisma client"
npm run prisma:generate --prefix server

# Build BEFORE migrating: a failed build then aborts the deploy with the database
# still matching the running code, instead of leaving the schema ahead of it.
echo "==> 4/6 Build"
npm run build --prefix server     # → server/dist
npm run build --prefix client     # → client/dist

# `npm run --prefix` runs with cwd=server/, so Prisma finds server/.env.
# (`npx --prefix` would NOT change cwd and DATABASE_URL would be missing.)
echo "==> 5/6 Database migrations"
npm run db:deploy --prefix server

echo "==> 6/6 Reload PM2"
if pm2 describe bakar-api >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  echo "    process not registered yet — starting it"
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo
echo "Status:"
pm2 status bakar-api
echo
echo "Smoke check:"
curl -fsS http://127.0.0.1:4000/health && echo
