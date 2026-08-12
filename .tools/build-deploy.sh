#!/bin/bash
# Build + deploy de Vive Mar a Hostinger (softvibes)
# Uso: HOSTINGER_API_TOKEN=xxx ./build-deploy.sh [dominio]
set -euo pipefail

DOMAIN="${1:-darkgreen-sparrow-923810.hostingersite.com}"
SITE_URL="https://$DOMAIN"
DIR="$(cd "$(dirname "$0")" && pwd)"
LLAVE="eac1047f8fc22e640e477459778e23e70dbe877b53bb3946ded88e0cc3e1bc54"

# El deploy de Hostinger es destructivo: respaldar el estado vivo del CMS
# (ediciones de textos + catálogo de media) antes de desplegar
ESTADO="/tmp/vivemar-estado-pre-deploy.json"
echo ">> Respaldando estado vivo del CMS"
curl -sf "https://$DOMAIN/admin/estado.php?llave=$LLAVE" -o "$ESTADO" \
  || echo "   (no se pudo respaldar - primera vez o sitio caido; continuando)"

cd "$DIR/../vivemar"
echo ">> Compilando para ${SITE_URL}"
SITE_URL="$SITE_URL" npm run build | tail -1

# Versionar URLs de imágenes: evita que navegadores con caché vieja sigan
# mostrando imágenes anteriores (URL nueva = descarga fresca garantizada)
V=$(date +%s)
echo ">> Versionando imagenes (?v=${V})"
find dist -name '*.html' -exec sed -i '' -E \
  "s#(/img/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|svg|gif|avif))#\1?v=$V#g" {} +

echo ">> Empaquetando"
cd dist && rm -f /tmp/vivemar-deploy.zip && zip -rq /tmp/vivemar-deploy.zip .

echo ">> Desplegando"
cd "$DIR"
python3 deploy-mcp.py "$DOMAIN" /tmp/vivemar-deploy.zip

# Restaurar el estado vivo del CMS sobre lo recién desplegado
if [ -s "$ESTADO" ]; then
  echo ">> Restaurando estado vivo del CMS"
  for intento in 1 2 3; do
    RESP=$(curl -sf -X POST -H 'Content-Type: application/json' \
      --data-binary "@$ESTADO" "https://$DOMAIN/admin/estado.php?llave=$LLAVE" || true)
    if [ -n "$RESP" ]; then echo "   $RESP"; break; fi
    sleep 6
  done
fi
