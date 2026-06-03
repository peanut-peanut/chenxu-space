#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-all}"
case "$TARGET" in
  all|web|server) ;;
  *)
    echo "Usage: $0 [all|web|server]" >&2
    exit 1
    ;;
esac

DEPLOY_HOST="${DEPLOY_HOST:-47.94.146.17}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
APP_DIR="${APP_DIR:-/opt/chenxu-space}"
BACKUP_DIR="${BACKUP_DIR:-/root/deploy-backups}"
HEALTH_URL="${HEALTH_URL:-https://chenxu.xyz/api/health}"
SITE_URL="${SITE_URL:-https://chenxu.xyz}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="/tmp/chenxu-space-deploy-$(date +%Y%m%d-%H%M%S).tgz"
REMOTE_ARCHIVE="/tmp/chenxu-space-deploy.tgz"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command tar
require_command ssh
require_command scp
require_command curl

echo "Deploy target: $TARGET"
echo "Remote: $DEPLOY_USER@$DEPLOY_HOST:$APP_DIR"

echo "Packing release..."
(
  cd "$ROOT_DIR"
  COPYFILE_DISABLE=1 tar \
    --exclude=.git \
    --exclude=node_modules \
    --exclude='**/node_modules' \
    --exclude='**/dist' \
    --exclude=.env \
    --exclude=apps/server/.env \
    --exclude=.DS_Store \
    -czf "$ARCHIVE" \
    .
)

echo "Uploading release..."
scp -P "$DEPLOY_PORT" "$ARCHIVE" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_ARCHIVE"

echo "Activating release..."
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" \
  "DEPLOY_TARGET='$TARGET' APP_DIR='$APP_DIR' BACKUP_DIR='$BACKUP_DIR' RELEASE_ARCHIVE='$REMOTE_ARCHIVE' bash -s" <<'REMOTE'
set -euo pipefail

TS=$(date +%Y%m%d-%H%M%S)

if [ ! -d "$APP_DIR" ]; then
  echo "Missing $APP_DIR; create the first deployment before using this script." >&2
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing $APP_DIR/.env; refusing to deploy without production environment variables." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$APP_DIR/.env" /tmp/chenxu-space.env
if [ -d "$APP_DIR/nginx/ssl" ]; then
  rm -rf /tmp/chenxu-space-ssl
  cp -a "$APP_DIR/nginx/ssl" /tmp/chenxu-space-ssl
fi

mv "$APP_DIR" "$BACKUP_DIR/chenxu-space-$TS"
mkdir -p "$APP_DIR"
tar -xzf "$RELEASE_ARCHIVE" -C "$APP_DIR"
cp /tmp/chenxu-space.env "$APP_DIR/.env"
if [ -d /tmp/chenxu-space-ssl ]; then
  mkdir -p "$APP_DIR/nginx"
  cp -a /tmp/chenxu-space-ssl "$APP_DIR/nginx/ssl"
fi

cd "$APP_DIR"
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

case "$DEPLOY_TARGET" in
  web)
    $COMPOSE up -d --build web
    $COMPOSE up -d --force-recreate nginx
    ;;
  server)
    $COMPOSE up -d --build server
    $COMPOSE up -d --force-recreate nginx
    ;;
  all)
    $COMPOSE up -d --build
    $COMPOSE up -d --force-recreate nginx
    ;;
  *)
    echo "Unsupported DEPLOY_TARGET=$DEPLOY_TARGET" >&2
    exit 1
    ;;
esac

$COMPOSE ps
rm -f "$RELEASE_ARCHIVE"
REMOTE

echo "Checking API health..."
curl --fail --show-error --silent --max-time 20 "$HEALTH_URL"
echo

echo "Checking site response..."
curl --fail --show-error --silent --head --max-time 20 "$SITE_URL" >/dev/null

rm -f "$ARCHIVE"
echo "Deploy completed: $TARGET"
