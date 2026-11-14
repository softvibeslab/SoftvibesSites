#!/bin/sh
# Publica las landings estáticas de Detailbox en detailbox.softvibes.art (/var/www/detailbox)
# desde un commit, no desde la copia de trabajo. Uso: deploy/publicar-landings.sh [ref]
set -eu
REF=${1:-feat/detailbox-pad}
VPS=root@31.220.63.211
KEY=${VPS_KEY:-$HOME/.ssh/rovi_vps_deploy}
REPO=$(git rev-parse --show-toplevel)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$REPO" archive "$REF" detailbox-academy | tar -x -C "$TMP"
S="$TMP/detailbox-academy"; SITE="$TMP/site"
mkdir -p "$SITE/assets"
cp "$S/index.html" "$S/styles.css" "$S/script.js" "$SITE/"
cp -R "$S/analisis" "$S/pad" "$S/ecosistema" "$S/agente" "$SITE/"
cp "$S"/assets/*.webp "$SITE/assets/"
ssh -i "$KEY" "$VPS" 'TS=$(date +%Y%m%d-%H%M%S); if [ -d /var/www/detailbox ]; then mkdir -p /var/backups/detailbox-web && cp -a /var/www/detailbox /var/backups/detailbox-web/$TS; fi; mkdir -p /var/www/detailbox'
chmod -R u=rwX,go=rX "$SITE"
rsync -rlpt --delete -e "ssh -i $KEY" "$SITE/" "$VPS:/var/www/detailbox/"
echo "$(date -u +%FT%TZ) landings $(git -C "$REPO" rev-parse --short "$REF") $REF" >> "$(dirname "$0")/DESPLIEGUES.log"
