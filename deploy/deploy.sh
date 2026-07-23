#!/usr/bin/env bash
# Updates a running Bakar deployment: pull, install, build, migrate, reload.
# Usage (on the server, as the app user):  bash deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bakar}"

cd "$APP_DIR"
echo "==> Updating source in $APP_DIR"
if [ -d .git ]; then
  git pull --ff-only
else
  echo "    (not a git checkout — assuming files were uploaded via rsync/scp)"
fi

echo "==> Installing server dependencies"
npm ci --omit=dev --prefix server || npm install --omit=dev --prefix server
# Prisma CLI is a devDependency but is needed for migrate/generate:
npm install --no-save prisma --prefix server

echo "==> Generating Prisma client"
npm run prisma:generate --prefix server

echo "==> Applying database migrations"
npx --prefix server prisma migrate deploy --schema server/prisma/schema.prisma

echo "==> Building server"
npm install --prefix server            # need devDeps (typescript) to build
npm run build --prefix server

echo "==> Building client"
npm install --prefix client
npm run build --prefix client

echo "==> Reloading PM2"
pm2 reload ecosystem.config.cjs --update-env
pm2 save

echo "==> Done. Status:"
pm2 status bakar-api
