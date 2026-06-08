#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${POSTGRES_URL:-}" ]; then
    export DATABASE_URL="$POSTGRES_URL"
  elif [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
    export DATABASE_URL="$POSTGRES_PRISMA_URL"
  elif [ -n "${DATABASE_PRIVATE_URL:-}" ]; then
    export DATABASE_URL="$DATABASE_PRIVATE_URL"
  fi
fi

if [ -n "${DATABASE_URL:-}" ]; then
  DB_HOST="$(printf '%s' "$DATABASE_URL" | sed -E 's#^[^@]*@([^/:?]+).*#\1#')"
  echo "Database URL found. Preparing Prisma schema for host: ${DB_HOST}"

  attempt=1
  max_attempts=20
  until ./node_modules/.bin/prisma migrate deploy; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Database migration failed after ${max_attempts} attempts. Trying prisma db push as a schema fallback."
      ./node_modules/.bin/prisma db push --accept-data-loss || echo "Database schema push fallback failed. Applying targeted location fallback."
      break
    fi
    echo "Database not ready yet. Retrying migration in 3 seconds... (${attempt}/${max_attempts})"
    attempt=$((attempt + 1))
    sleep 3
  done

  if [ "${RUN_DB_SEED:-no}" = "yes" ]; then
    if ./node_modules/.bin/prisma db seed; then
      echo "Database seed completed."
    else
      echo "Database seed failed. App will still start; check /api/health for DB status."
    fi
  else
    echo "Database seed skipped. Set RUN_DB_SEED=yes to seed/reset demo data."
  fi

  if node scripts/ensure-location-schema.mjs; then
    echo "Location schema check completed."
  else
    echo "Location schema check failed. App will still start; review database logs."
  fi
else
  echo "No database URL found. Starting in demo mode without database initialization."
fi

exec node server.js
