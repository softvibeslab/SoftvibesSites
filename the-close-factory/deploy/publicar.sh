#!/usr/bin/env bash
# Publica la landing en https://closefactory.softvibes.art (VPS rovicrm). Respaldo previo en el servidor.
# Sube solo lo público: index, estilos, JS, favicon, img/ y analisis/. Fuentes, pruebas y docs no se publican.
set -euo pipefail
cd "$(dirname "$0")/.."
VPS=root@31.220.63.211
KEY=~/.ssh/rovi_vps_deploy
TS=$(date +%Y%m%d-%H%M%S)
ssh -i "$KEY" "$VPS" "mkdir -p /var/www/closefactory /var/backups/closefactory-web && cp -a /var/www/closefactory /var/backups/closefactory-web/$TS"
rsync -az --delete --exclude '.*' --exclude 'docs/' --exclude 'deploy/' --exclude 'tools/' --exclude 'tests/' --exclude 'svg/' --exclude 'comfy/' --exclude 'README.md' -e "ssh -i $KEY" ./ "$VPS:/var/www/closefactory/"
ssh -i "$KEY" "$VPS" "find /var/www/closefactory -type d -exec chmod 755 {} + && find /var/www/closefactory -type f -exec chmod 644 {} +"
echo "$TS publicado" >> deploy/DESPLIEGUES.log
echo "ok → https://closefactory.softvibes.art (respaldo /var/backups/closefactory-web/$TS)"
