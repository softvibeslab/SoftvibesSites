#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso:
  VPS_HOST=1.2.3.4 VPS_USER=root VPS_PATH=/var/www/ieoushua ./scripts/deploy-vps.sh

Opcionales:
  VPS_PORT=22
  VPS_KEY=~/.ssh/rovi_vps_deploy
  VPS_SERVICE=ieoushua-cms

Sube el proyecto completo para correr el CMS Node en el VPS.
EOF
  exit 0
fi

: "${VPS_HOST:?Falta VPS_HOST}"
: "${VPS_USER:?Falta VPS_USER}"
: "${VPS_PATH:?Falta VPS_PATH}"

VPS_PORT="${VPS_PORT:-22}"
VPS_KEY="${VPS_KEY:-}"
VPS_SERVICE="${VPS_SERVICE:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

SSH_ARGS=(-p "$VPS_PORT")
if [[ -n "$VPS_KEY" ]]; then
  SSH_ARGS+=(-i "$VPS_KEY")
fi

REMOTE="${VPS_USER}@${VPS_HOST}"

cd "$ROOT"
npm run build

ssh "${SSH_ARGS[@]}" "$REMOTE" "mkdir -p '$VPS_PATH'"

rsync -az --delete \
  -e "ssh ${SSH_ARGS[*]}" \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  --exclude='content/.history' \
  --exclude='dist_*.zip' \
  --exclude='*.log' \
  ./ "$REMOTE:$VPS_PATH/"

if [[ -n "$VPS_SERVICE" ]]; then
  ssh "${SSH_ARGS[@]}" "$REMOTE" "cd '$VPS_PATH' && npm install --omit=dev && sudo systemctl restart '$VPS_SERVICE'"
else
  ssh "${SSH_ARGS[@]}" "$REMOTE" "cd '$VPS_PATH' && npm install --omit=dev"
fi

echo "Deploy VPS listo: $REMOTE:$VPS_PATH"
