#!/bin/sh
set -e

npx prisma generate
npx prisma migrate deploy

if [ "${RUN_SEED_ON_BOOT:-false}" = "true" ]; then
  node prisma/seed.js
fi

node src/server.js
