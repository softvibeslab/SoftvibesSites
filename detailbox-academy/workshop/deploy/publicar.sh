#!/bin/sh
# Publica el workshop desde un commit (no desde la copia de trabajo) al VPS rovicrm.
# Uso: deploy/publicar.sh [ref]   (por defecto feat/detailbox-pad)
set -eu
REF=${1:-feat/detailbox-pad}
VPS=root@31.220.63.211
KEY=${VPS_KEY:-$HOME/.ssh/rovi_vps_deploy}
REPO=$(git rev-parse --show-toplevel)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$REPO" archive "$REF" detailbox-academy/workshop | tar -x -C "$TMP"
W="$TMP/detailbox-academy/workshop"
rsync -rlt --delete -e "ssh -i $KEY" --exclude tests --exclude __pycache__ "$W/backend" "$W/web" "$VPS:/opt/detailbox-workshop/"
ssh -i "$KEY" "$VPS" 'set -e
  chown -R root:root /opt/detailbox-workshop/backend /opt/detailbox-workshop/web
  find /opt/detailbox-workshop/backend /opt/detailbox-workshop/web -type d -exec chmod 755 {} +
  find /opt/detailbox-workshop/backend /opt/detailbox-workshop/web -type f -exec chmod 644 {} +
  /opt/detailbox-workshop/.venv/bin/pip install -q -r /opt/detailbox-workshop/backend/requirements.txt
  systemctl restart detailbox-workshop
  sleep 2; curl -fsS -o /dev/null -w "salud %{http_code}\n" http://127.0.0.1:8796/entrar/'
echo "$(date -u +%FT%TZ) $(git -C "$REPO" rev-parse --short "$REF") $REF" >> "$(dirname "$0")/DESPLIEGUES.log"
