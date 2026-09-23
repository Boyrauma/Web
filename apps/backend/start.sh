#!/bin/sh
set -e

npx prisma generate

PACKAGED_UPLOAD_DIR="$(pwd)/packaged-uploads"
TARGET_UPLOAD_DIR="${UPLOAD_DIR:-uploads}"

if [ -d "$PACKAGED_UPLOAD_DIR" ]; then
  echo "Syncing packaged uploads into $TARGET_UPLOAD_DIR..."
  mkdir -p "$TARGET_UPLOAD_DIR/branding" "$TARGET_UPLOAD_DIR/vehicles"
  cp -R "$PACKAGED_UPLOAD_DIR/branding/." "$TARGET_UPLOAD_DIR/branding/"
  cp -R "$PACKAGED_UPLOAD_DIR/vehicles/." "$TARGET_UPLOAD_DIR/vehicles/"
fi

npx prisma migrate deploy

if [ "${RUN_SEED_ON_BOOT:-false}" = "true" ]; then
  node prisma/seed.js
fi

node src/server.js
