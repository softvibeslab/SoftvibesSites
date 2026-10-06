#!/bin/zsh
# Corre la batería funcional completa con una base desechable que se borra al terminar.
# Uso: tests/funcional/correr.sh [puerto=8095]
# Requiere Playwright: NODE_PATH=<carpeta con playwright>/node_modules
set -e
cd "$(dirname "$0")/../.."
PUERTO=${1:-8095}
DB=backend/dev-$PUERTO.db
rm -f $DB $DB-wal $DB-shm
python3 backend/dev_server.py $PUERTO > /tmp/cisne-funcional-$PUERTO.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; sleep 1; rm -f '"$DB $DB-wal $DB-shm" EXIT
sleep 2
python3 tests/funcional/sembrar.py $DB
BASE_URL=http://127.0.0.1:$PUERTO node tests/funcional/verificar.cjs | tail -1
