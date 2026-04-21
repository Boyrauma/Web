#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/nhaxedinhdung}"
COMPOSE_FILES=(-f "$APP_DIR/docker-compose.yml" -f "$APP_DIR/docker-compose.prod.yml")
BACKUP_ROOT="${BACKUP_ROOT:-/root/backups/nhaxedinhdung}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$TARGET_DIR"

echo "[1/5] Checking running containers..."
docker compose "${COMPOSE_FILES[@]}" ps

echo "[2/5] Exporting PostgreSQL dump..."
docker compose "${COMPOSE_FILES[@]}" exec -T postgres sh -lc \
  "pg_dump -U postgres -d dinhdung_transport -f /tmp/dinhdung_transport-$TIMESTAMP.sql"
docker cp "dinhdung-postgres:/tmp/dinhdung_transport-$TIMESTAMP.sql" "$TARGET_DIR/dinhdung_transport.sql"
docker compose "${COMPOSE_FILES[@]}" exec -T postgres rm -f "/tmp/dinhdung_transport-$TIMESTAMP.sql"

echo "[3/5] Archiving uploads..."
docker compose "${COMPOSE_FILES[@]}" exec -T backend sh -lc \
  "tar -czf /tmp/uploads-$TIMESTAMP.tar.gz -C /app uploads"
docker cp "dinhdung-backend:/tmp/uploads-$TIMESTAMP.tar.gz" "$TARGET_DIR/uploads.tar.gz"
docker compose "${COMPOSE_FILES[@]}" exec -T backend rm -f "/tmp/uploads-$TIMESTAMP.tar.gz"

echo "[4/5] Backing up production .env..."
cp "$APP_DIR/.env" "$TARGET_DIR/.env"

echo "[5/5] Writing manifest..."
cat > "$TARGET_DIR/README.txt" <<EOF
Backup created: $TIMESTAMP
App dir: $APP_DIR
Files:
- dinhdung_transport.sql
- uploads.tar.gz
- .env
EOF

echo "Backup completed: $TARGET_DIR"
