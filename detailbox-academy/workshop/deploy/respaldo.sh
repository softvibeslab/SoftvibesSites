#!/bin/sh
# Respaldo diario (cron de root): copia consistente de SQLite + evidencias; guarda 14 días.
set -eu
DATA=/var/lib/detailbox-workshop/data
DEST=/var/backups/detailbox-workshop
TS=$(date +%Y%m%d-%H%M)
mkdir -p "$DEST" && chmod 700 "$DEST"
TMP=$(mktemp -d)
python3 -c "import sqlite3,sys; s=sqlite3.connect(sys.argv[1]); d=sqlite3.connect(sys.argv[2]); s.backup(d); d.close(); s.close()" "$DATA/workshop.db" "$TMP/workshop.db"
tar -czf "$DEST/workshop-$TS.tgz" -C "$TMP" workshop.db -C "$DATA" --exclude=workshop.db --exclude='workshop.db-*' .
rm -rf "$TMP"
find "$DEST" -name 'workshop-*.tgz' -mtime +14 -delete
