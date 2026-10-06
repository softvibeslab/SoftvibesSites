#!/bin/zsh
# Publica sitio/ y el backend del club en el VPS (cisnenegro.softvibes.art).
# Uso: deploy/publicar.sh
#
# Salvaguardas:
# - Se niega a publicar si hay cambios sin commit en sitio/ o backend/ (FORZAR=1 lo omite).
# - Antes de publicar respalda en el VPS la raíz web, el backend y la base (API backup de SQLite)
#   en /var/backups/cisnenegro-web/<fecha>/ y anota el commit en DESPLIEGUES.log.
# - Excluye sitio/experiencia/ (trabajo en progreso de otra sesión): no la sube ni la borra.
#   INCLUIR_EXPERIENCIA=1 la publica.
# - Solo reinicia cisnenegro-club si club_server.py cambió.
set -e
cd "$(dirname "$0")/.."
KEY=~/.ssh/rovi_vps_deploy; HOST=root@31.220.63.211
SSH=(ssh -i $KEY $HOST)

SUCIO=$(git status --porcelain -- sitio backend | grep -v 'sitio/experiencia/' | grep -v '/qa/' || true)
if [[ -n "$SUCIO" && "$FORZAR" != "1" ]]; then
  echo "Hay cambios sin commit en sitio/ o backend/:"; echo "$SUCIO"
  echo "Haz commit primero (o usa FORZAR=1)."; exit 1
fi
COMMIT=$(git rev-parse --short HEAD); RAMA=$(git rev-parse --abbrev-ref HEAD)
TS=$(date -u +%Y%m%dT%H%M%SZ)

echo "→ Respaldo previo en el VPS ($TS)"
$SSH "set -e; D=/var/backups/cisnenegro-web/$TS; mkdir -p \$D; chmod 700 /var/backups/cisnenegro-web
  tar -czf \$D/web.tar.gz -C /var/www cisnenegro
  cp -a /opt/cisnenegro-club/club_server.py \$D/club_server.py
  python3 -c \"import sqlite3,sys;s=sqlite3.connect('/var/lib/cisnenegro-club/club.db');d=sqlite3.connect(sys.argv[1]);s.backup(d);assert d.execute('pragma integrity_check').fetchone()[0]=='ok';d.close()\" \$D/club.db
  chmod 600 \$D/club.db; (cd \$D && sha256sum web.tar.gz club_server.py club.db > SHA256SUMS)
  echo \"  respaldo: \$D\""

EXCLUIR=(--exclude 'qa/' --exclude 'DESIGN.md' --exclude '*.py' --exclude 'analisis/data.json' --exclude '.DS_Store')
[[ "$INCLUIR_EXPERIENCIA" == "1" ]] || EXCLUIR+=(--exclude 'experiencia/')

echo "→ Sitio"
rsync -az --delete -e "ssh -i $KEY" $EXCLUIR sitio/ $HOST:/var/www/cisnenegro/
$SSH 'find /var/www/cisnenegro -type d -exec chmod 755 {} + && find /var/www/cisnenegro -type f -exec chmod 644 {} +'

echo "→ Backend"
if $SSH 'cmp -s /opt/cisnenegro-club/club_server.py -' < backend/club_server.py; then
  echo "  sin cambios: no se reinicia cisnenegro-club"
else
  rsync -az -e "ssh -i $KEY" backend/club_server.py $HOST:/opt/cisnenegro-club/club_server.py
  $SSH 'systemctl restart cisnenegro-club && sleep 1 && systemctl is-active cisnenegro-club'
fi

$SSH "echo '$TS $COMMIT $RAMA' >> /var/backups/cisnenegro-web/DESPLIEGUES.log"
echo "Publicado $COMMIT ($RAMA) en https://cisnenegro.softvibes.art"
echo "Rollback: ver README (sección Despliegue) con el respaldo /var/backups/cisnenegro-web/$TS"
