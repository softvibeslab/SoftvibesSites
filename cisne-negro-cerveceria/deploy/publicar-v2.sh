#!/bin/zsh
# Publica la versión v2 (Mi pedido, Wi-Fi y app instalable) en https://cisnenegro.softvibes.art/v2/
# con su propio backend (cisnenegro-club-v2, 127.0.0.1:8791) y su propia base, separada de producción.
#
# - Construye sitio/ con rutas /v2 (deploy/construir-v2.py) y verifica la reescritura.
# - Respalda la /v2 publicada y la base v2 en /var/backups/cisnenegro-web/v2-<fecha>/.
# - Sincroniza solo /var/www/cisnenegro/v2/ (no toca la raíz de producción ni su backend).
# - Reinicia cisnenegro-club-v2 solo si cambió el backend.
# Requisito único en el VPS: deploy/v2/instalar-v2.sh (usuario, servicio, nginx).
set -e
cd "$(dirname "$0")/.."
KEY=~/.ssh/rovi_vps_deploy; HOST=root@31.220.63.211
SSH=(ssh -i $KEY $HOST)

SUCIO=$(git status --porcelain -- sitio backend deploy | grep -v 'sitio/experiencia/' | grep -v '/qa/' || true)
if [[ -n "$SUCIO" && "$FORZAR" != "1" ]]; then
  echo "Hay cambios sin commit:"; echo "$SUCIO"; echo "Haz commit primero (o usa FORZAR=1)."; exit 1
fi
COMMIT=$(git rev-parse --short HEAD); RAMA=$(git rev-parse --abbrev-ref HEAD)
TS=$(date -u +%Y%m%dT%H%M%SZ)
BUILD=$(mktemp -d)/v2
python3 deploy/construir-v2.py $BUILD /v2

echo "→ Respaldo previo de /v2 ($TS)"
$SSH "set -e; D=/var/backups/cisnenegro-web/v2-$TS; mkdir -p \$D
  [ -d /var/www/cisnenegro/v2 ] && tar -czf \$D/web-v2.tar.gz -C /var/www/cisnenegro v2 || true
  [ -f /opt/cisnenegro-club-v2/club_server.py ] && cp -a /opt/cisnenegro-club-v2/club_server.py \$D/ || true
  if [ -f /var/lib/cisnenegro-club-v2/club.db ]; then
    python3 -c \"import sqlite3,sys;s=sqlite3.connect('/var/lib/cisnenegro-club-v2/club.db');d=sqlite3.connect(sys.argv[1]);s.backup(d);d.close()\" \$D/club-v2.db; chmod 600 \$D/club-v2.db
  fi
  echo \"  respaldo: \$D\""

echo "→ Sitio /v2"
rsync -az --delete -e "ssh -i $KEY" $BUILD/ $HOST:/var/www/cisnenegro/v2/
$SSH 'find /var/www/cisnenegro/v2 -type d -exec chmod 755 {} + && find /var/www/cisnenegro/v2 -type f -exec chmod 644 {} +'

echo "→ Backend v2"
if $SSH 'cmp -s /opt/cisnenegro-club-v2/club_server.py -' < backend/club_server.py; then
  echo "  sin cambios: no se reinicia cisnenegro-club-v2"
else
  rsync -az -e "ssh -i $KEY" backend/club_server.py $HOST:/opt/cisnenegro-club-v2/club_server.py
  $SSH 'systemctl restart cisnenegro-club-v2 && sleep 1 && systemctl is-active cisnenegro-club-v2'
fi
$SSH "echo '$TS $COMMIT $RAMA v2' >> /var/backups/cisnenegro-web/DESPLIEGUES.log"
rm -rf "$(dirname $BUILD)"
echo "Publicado $COMMIT ($RAMA) en https://cisnenegro.softvibes.art/v2/"
