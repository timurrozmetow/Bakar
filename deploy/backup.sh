#!/usr/bin/env bash
# Nightly backup of the Bakar database and uploaded files.
# Cron example (03:30 daily):
#   30 3 * * * /var/www/bakar/deploy/backup.sh >> /var/log/bakar/backup.log 2>&1
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bakar}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bakar}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"

# Read DB credentials from the server .env (DATABASE_URL="mysql://user:pass@host:port/db")
DB_URL="$(grep -E '^DATABASE_URL=' "$APP_DIR/server/.env" | cut -d'"' -f2)"
DB_USER="$(echo "$DB_URL" | sed -E 's|mysql://([^:]+):.*|\1|')"
DB_PASS="$(echo "$DB_URL" | sed -E 's|mysql://[^:]+:([^@]*)@.*|\1|')"
DB_HOST="$(echo "$DB_URL" | sed -E 's|.*@([^:/]+).*|\1|')"
DB_NAME="$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] dumping database $DB_NAME"
mysqldump --single-transaction --quick --host="$DB_HOST" --user="$DB_USER" --password="$DB_PASS" \
  "$DB_NAME" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "[$(date)] archiving uploads"
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" \
  --exclude='.cache' -C "$APP_DIR/server" uploads

echo "[$(date)] pruning backups older than $KEEP_DAYS days"
find "$BACKUP_DIR" -name 'db-*.sql.gz'      -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+$KEEP_DAYS" -delete

echo "[$(date)] done: $(ls -1 "$BACKUP_DIR" | wc -l) files in $BACKUP_DIR"
