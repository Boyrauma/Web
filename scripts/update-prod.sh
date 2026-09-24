#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nhaxedinhdung}"
COMPOSE=(docker compose -f "$APP_DIR/docker-compose.yml" -f "$APP_DIR/docker-compose.prod.yml")

cd "$APP_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Repository has local changes. Commit or stash them before updating."
  exit 1
fi

echo "[1/7] Pulling the latest code..."
git pull --ff-only origin main

echo "[2/7] Backing up database, uploads and .env..."
bash "$APP_DIR/scripts/backup-prod.sh"

echo "[3/7] Building and starting production containers..."
"${COMPOSE[@]}" up -d --build

echo "[4/7] Waiting for backend health..."
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/health >/dev/null; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "Backend did not become healthy in time."
    exit 1
  fi

  sleep 2
done

echo "[5/7] Verifying packaged images..."
"${COMPOSE[@]}" exec -T backend npm run images:verify-packaged

echo "[6/7] Removing upload files that are no longer referenced..."
"${COMPOSE[@]}" exec -T backend npm run uploads:cleanup-orphaned

echo "[7/7] Checking services..."
"${COMPOSE[@]}" ps
curl -fsS http://127.0.0.1:8080/health
curl -fsSI http://127.0.0.1:5173/ >/dev/null
curl -fsSI http://127.0.0.1:5174/admin/ >/dev/null

echo "Production update completed."
