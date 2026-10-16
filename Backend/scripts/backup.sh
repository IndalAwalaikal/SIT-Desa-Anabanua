#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/desa_anabanua_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting database backup..."

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-desa_app}"
DB_NAME="${DB_NAME:-desa_digital}"

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[backup] ERROR: DB_PASSWORD is not set" >&2
  exit 1
fi

mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[backup] Backup saved to: $BACKUP_FILE"
echo "[backup] Size: $(du -h "$BACKUP_FILE" | cut -f1)"

RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
echo "[backup] Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name 'desa_anabanua_*.sql.gz' -mtime +${RETENTION_DAYS} -delete

echo "[backup] Done."
