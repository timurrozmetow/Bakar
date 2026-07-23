#!/usr/bin/env bash
# Nightly backup of the Bakar database and uploaded files.
#
# Cron example (03:30 daily):
#   30 3 * * * /var/www/bakar/deploy/backup.sh >> /var/log/bakar/backup.log 2>&1
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bakar}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/bakar}"
KEEP_DAYS="${KEEP_DAYS:-14}"
ENV_FILE="$APP_DIR/server/.env"
STAMP="$(date +%F_%H%M)"

log() { echo "[$(date '+%F %T')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

[ -f "$ENV_FILE" ] || fail "env file not found: $ENV_FILE"
command -v mysqldump >/dev/null || fail "mysqldump not installed"

# Dumps and archives must not be world-readable — they contain everything.
umask 077
mkdir -p "$BACKUP_DIR"

# Parse DATABASE_URL with Node (handles ports, query strings and %-encoded
# passwords correctly — a sed/regex version breaks on @ : / in the password).
read -r DB_HOST DB_PORT DB_USER DB_NAME <<EOF
$(node -e '
  const fs = require("fs");
  const line = fs.readFileSync(process.argv[1], "utf8")
    .split(/\r?\n/).find(l => l.startsWith("DATABASE_URL="));
  if (!line) { console.error("DATABASE_URL missing"); process.exit(1); }
  const raw = line.slice("DATABASE_URL=".length).trim().replace(/^["'"'"']|["'"'"']$/g, "");
  const u = new URL(raw);
  process.stdout.write([
    u.hostname,
    u.port || "3306",
    decodeURIComponent(u.username),
    decodeURIComponent(u.pathname.replace(/^\//, "")),
  ].join(" "));
' "$ENV_FILE")
EOF
[ -n "${DB_NAME:-}" ] || fail "could not parse DATABASE_URL"

DB_PASS="$(node -e '
  const fs = require("fs");
  const line = fs.readFileSync(process.argv[1], "utf8")
    .split(/\r?\n/).find(l => l.startsWith("DATABASE_URL="));
  const raw = line.slice("DATABASE_URL=".length).trim().replace(/^["'"'"']|["'"'"']$/g, "");
  process.stdout.write(decodeURIComponent(new URL(raw).password));
' "$ENV_FILE")"

# Pass credentials through a private file instead of the command line, where
# every user on the box could read them from the process list.
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
cat > "$CNF" <<EOF
[client]
host=$DB_HOST
port=$DB_PORT
user=$DB_USER
password=$DB_PASS
EOF

DB_OUT="$BACKUP_DIR/db-$STAMP.sql.gz"
UP_OUT="$BACKUP_DIR/uploads-$STAMP.tar.gz"

# --no-tablespaces: since MySQL 8.0.21 mysqldump reads INFORMATION_SCHEMA.FILES,
# which needs the global PROCESS privilege. Our app user is scoped to its own
# database on purpose, so we skip tablespace info instead of widening the grant.
log "dumping database $DB_NAME"
if ! mysqldump --defaults-extra-file="$CNF" \
      --single-transaction --quick --no-tablespaces \
      --default-character-set=utf8mb4 \
      "$DB_NAME" | gzip > "$DB_OUT.part"; then
  rm -f "$DB_OUT.part"
  fail "mysqldump failed — no backup written"
fi
mv "$DB_OUT.part" "$DB_OUT"

log "archiving uploads (excluding the resize cache)"
if ! tar -czf "$UP_OUT.part" --exclude='./uploads/.cache' -C "$APP_DIR/server" ./uploads; then
  rm -f "$UP_OUT.part"
  fail "uploads archive failed"
fi
mv "$UP_OUT.part" "$UP_OUT"

log "pruning backups older than $KEEP_DAYS days"
find "$BACKUP_DIR" -name 'db-*.sql.gz'      -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name '*.part'           -mtime +1           -delete

log "done: $(du -sh "$DB_OUT" | cut -f1) db, $(du -sh "$UP_OUT" | cut -f1) uploads"
