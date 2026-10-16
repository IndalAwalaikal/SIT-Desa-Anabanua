#!/bin/sh
set -e

# Run migrations if MIGRATIONS_DATABASE_URL is set
if [ -n "$MIGRATIONS_DATABASE_URL" ]; then
  echo "[entrypoint] Running database migrations..."
  migrate -path /app/migrations -database "$MIGRATIONS_DATABASE_URL" up || true
  echo "[entrypoint] Migrations complete."
fi

# Start the API server
exec /app/api
