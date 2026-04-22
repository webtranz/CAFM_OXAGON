#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL found. Preparing Prisma schema..."
  ./node_modules/.bin/prisma db push
  ./node_modules/.bin/prisma db seed
else
  echo "DATABASE_URL is not set. Starting in demo mode without database initialization."
fi

exec node server.js
