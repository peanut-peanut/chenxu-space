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
HEALTH_URL="${HEALTH_URL:-https://peanutwcx.xyz/api/health}"
SITE_URL="${SITE_URL:-https://peanutwcx.xyz}"

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

# web 前端在本地构建，避免在低内存服务器上跑 Vite 导致 OOM
if [ "$TARGET" = "all" ] || [ "$TARGET" = "web" ]; then
  require_command pnpm
  echo "Building web locally (types + web)..."
  (
    cd "$ROOT_DIR"
    pnpm --filter @chenxu/types run build
    pnpm --filter web run build
  )
  if [ ! -f "$ROOT_DIR/apps/web/dist/index.html" ]; then
    echo "Web build failed: apps/web/dist/index.html not found." >&2
    exit 1
  fi
fi

echo "Deploy target: $TARGET"
echo "Remote: $DEPLOY_USER@$DEPLOY_HOST:$APP_DIR"

echo "Packing release..."
(
  cd "$ROOT_DIR"
  COPYFILE_DISABLE=1 tar \
    --exclude=.git \
    --exclude=node_modules \
    --exclude='**/node_modules' \
    --exclude=apps/server/dist \
    --exclude=packages/types/dist \
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

# 旧服务器是 docker-compose v1，recreate 已有容器时会触发
# KeyError: 'ContainerConfig'（与新版 Docker 镜像格式不兼容）。
# 因此先 build，再 down（保留 named volume），最后 up -d 全新创建，绕开 recreate 路径。
case "$DEPLOY_TARGET" in
  web)
    $COMPOSE build web
    ;;
  server)
    $COMPOSE build server
    ;;
  all)
    $COMPOSE build
    ;;
  *)
    echo "Unsupported DEPLOY_TARGET=$DEPLOY_TARGET" >&2
    exit 1
    ;;
esac

$COMPOSE down
$COMPOSE up -d

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
