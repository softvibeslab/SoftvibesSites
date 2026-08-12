#!/bin/bash
# Deploy de 21 paginas de preview OG para MenuVibes.
# Pegar en hPanel > VPS > Browser Terminal (entra como root, sin SSH).
set -e
mkdir -p /var/www/menuvibes/r
BUCKET="https://supabase.rovicrm.com/storage/v1/object/public/menuvibes"
SITE="https://menu.rovicrm.com"
while IFS='|' read -r slug nombre tag img; do
  [ -z "$slug" ] && continue
  desc="$tag. Escanea el QR, arma tu pedido y te llega por WhatsApp - sin comisiones de apps."
  if [ "$img" = "1" ]; then
    IMG="$BUCKET/$slug/hero/hero.jpg"
    OGIMG="<meta property=\"og:image\" content=\"$IMG\"><meta property=\"og:image:width\" content=\"1200\"><meta property=\"og:image:height\" content=\"630\"><meta name=\"twitter:image\" content=\"$IMG\">"
    TWC="summary_large_image"
  else
    OGIMG=""; TWC="summary"
  fi
  cat > "/var/www/menuvibes/r/$slug.html" <<EOF
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$nombre - Menu digital</title>
<meta name="description" content="$desc">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MenuVibes">
<meta property="og:title" content="$nombre - Menu digital">
<meta property="og:description" content="$desc">
<meta property="og:url" content="$SITE/r/$slug.html">
$OGIMG
<meta name="twitter:card" content="$TWC">
<meta name="twitter:title" content="$nombre">
<meta name="twitter:description" content="$desc">
<meta http-equiv="refresh" content="0; url=$SITE/?n=$slug">
<link rel="canonical" href="$SITE/?n=$slug">
<script>location.replace("$SITE/?n=$slug");</script>
<style>html,body{margin:0;background:#0D0D0D;color:#FFD700;font-family:system-ui,sans-serif}.l{display:flex;height:100vh;align-items:center;justify-content:center;letter-spacing:1px}</style>
</head><body><div class="l">Cargando menu...</div>
<noscript><a href="$SITE/?n=$slug" style="color:#25D366">Abrir menu</a></noscript>
</body></html>
EOF
done <<'DATA'
nicoletta-playa-del-carmen|Nicoletta Playa Del Carmen|Sabor italiano en la Riviera Maya|1
chez-celine|Chez Céline|Un rincón de Francia en Playa|1
bovinos-steakhouse|Bovinos Steakhouse|Cortes al carbón y buena compañía|1
ilios|Ilios|Sabores del Mediterráneo en el Caribe|1
choux-choux-cafe|Choux Choux Café|Café de especialidad en el corazón de la Quinta|1
la-vagabunda|La Vagabunda|Café de especialidad en el corazón de la Quinta|1
sonora-grill-playa-del-carmen|Sonora Grill - Playa del Carmen|Cortes al carbón y buena compañía|1
kascabal|Kascabal|Cocina mexicana con el sazón de casa|1
porfirio-s-playa-del-carmen|Porfirio's Playa del Carmen|Cocina mexicana con el sazón de casa|1
fah|Fah|El mejor ambiente de la Quinta Avenida|1
karen-s-restaurante|Karen’s Restaurante|Cortes al carbón y buena compañía|1
harry-s-steakhouse-raw-bar|Harry's Steakhouse y Raw Bar|Cortes al carbón y buena compañía|1
ah-cacao-chocolate-cafe|Ah Cacao Chocolate Café|Café de especialidad en el corazón de la Quinta|1
aldea-corazon|Aldea Corazón|Cocina mexicana con el sazón de casa|1
el-diez|El Diez|Cortes al carbón y buena compañía|1
tropical|Tropical|Café de especialidad en el corazón de la Quinta|1
marley-coffee|Marley Coffee|Café de especialidad en el corazón de la Quinta|1
el-cafe-de-playa|El café de playa|Café de especialidad en el corazón de la Quinta|1
fifty-brunch|Fifty Brunch|Café de especialidad en el corazón de la Quinta|1
celtic-cactus-restaurant-sports-bar|Celtic Cactus Restaurant y Sports Bar|Cortes al carbón y buena compañía|1
colectivo-mexicano-cervecero|Colectivo Mexicano Cervecero|Cerveza artesanal mexicana en Quinta Avenida|0
sicilia-amo|Sicilia_amo|Cocina siciliana, cafetería y pastelería artesanal en Playa del Carmen|0
DATA
echo "=== Listo. Archivos creados: ==="
ls /var/www/menuvibes/r/
