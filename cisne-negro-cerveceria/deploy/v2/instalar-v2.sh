#!/bin/zsh
# Instalación única del entorno /v2 en el VPS. Idempotente: se puede volver a correr.
# No toca la raíz de producción, su backend (cisnenegro-club) ni su base.
set -e
cd "$(dirname "$0")/../.."
KEY=~/.ssh/rovi_vps_deploy; HOST=root@31.220.63.211
scp -q -i $KEY deploy/v2/cisnenegro-club-v2.service $HOST:/etc/systemd/system/cisnenegro-club-v2.service
scp -q -i $KEY deploy/v2/nginx-cisnenegro-v2.conf $HOST:/etc/nginx/snippets/cisnenegro-v2.conf
scp -q -i $KEY backend/club_server.py $HOST:/tmp/club_server_v2.py
ssh -i $KEY $HOST 'set -e
  mkdir -p /opt/cisnenegro-club-v2 /var/lib/cisnenegro-club-v2 /var/www/cisnenegro/v2
  install -m 644 /tmp/club_server_v2.py /opt/cisnenegro-club-v2/club_server.py && rm /tmp/club_server_v2.py
  chown cisneclub:cisneclub /var/lib/cisnenegro-club-v2 && chmod 750 /var/lib/cisnenegro-club-v2
  if [ ! -f /etc/cisnenegro-club-v2.env ]; then umask 077; printf "CLUB_SECRET=%s\n" "$(openssl rand -hex 32)" > /etc/cisnenegro-club-v2.env; fi
  C=/etc/nginx/sites-available/cisnenegro.softvibes.art
  if ! grep -q "snippets/cisnenegro-v2.conf" $C; then
    cp -a $C /var/backups/cisnenegro-web/nginx-antes-v2-$(date -u +%Y%m%dT%H%M%SZ).conf
    python3 - $C <<PY
import sys
p=sys.argv[1]; s=open(p).read(); a="    location = /robots.txt {"
assert s.count(a)==1
s=s.replace(a,"    include snippets/cisnenegro-v2.conf;\n"+a); open(p,"w").write(s)
PY
  fi
  nginx -t 2>&1 | tail -1
  systemctl daemon-reload && systemctl enable -q --now cisnenegro-club-v2 && sleep 1
  echo "cisnenegro-club-v2: $(systemctl is-active cisnenegro-club-v2) · producción cisnenegro-club: $(systemctl is-active cisnenegro-club)"
  systemctl reload nginx && echo "nginx recargado"'
