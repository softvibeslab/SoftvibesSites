# THE CLOSE FACTORY

Landing de inteligencia comercial inmobiliaria (Grupo Zamna + ROVI CRM). La v2 «La Línea» es del 2026-10-29 y parte de la página pública [theclosefactory.vercel.app](https://theclosefactory.vercel.app/), que sigue siendo el sitio oficial.

Vive en su dominio definitivo, https://closefactory.softvibes.art (VPS rovicrm, `/var/www/closefactory`), desde el 2026-10-29. La landing se indexa (robots.txt y sitemap.xml); `/analisis/` lleva `noindex` en el HTML y en la cabecera.

## Publicar

```bash
./deploy/publicar.sh
```

Respalda la versión anterior en `/var/backups/closefactory-web/` y sube solo lo público: `index.html`, `styles.css`, `main.js`, `calc.js`, `favicon.svg`, `sitemap.xml`, `img/` y `analisis/`. El vhost está en `deploy/closefactory.softvibes.art.conf` e incluye los bloques de certbot, así que se puede subir tal cual sin romper el SSL (Let's Encrypt).

## Ver en local

Los scripts son módulos ES, así que hace falta un servidor (no abre con `file://`):

```bash
python3 -m http.server 8917 --bind 127.0.0.1
```

## Verificar

```bash
node --test tests/calc.test.mjs                       # lógica de la calculadora
PW=~/.npm/_npx/a50edfa03303c0a4/node_modules          # cualquier carpeta con playwright
NODE_PATH=$PW node tools/qa_funcional.cjs http://127.0.0.1:8917/          # interacciones
NODE_PATH=$PW node tools/qa_capturas.cjs http://127.0.0.1:8917/ /tmp/qa   # capturas desktop/móvil/movimiento reducido
```

## Estructura

- `index.html` — la página: hero con diorama, la línea (sticky con sellos por estación), problema, calculadora de fuga, método, solución, audiencias, respaldo, métricas, preguntas y orden de diagnóstico.
- `styles.css` / `main.js` / `calc.js` — presentación, interacción y la lógica pura de la calculadora.
- `svg/linea.svg` — diorama isométrico. Se genera con `tools/gen_linea_svg.py` y se incrusta en el hero con `tools/incrustar_linea.py`. Ese script también resuelve los enlaces `WA[origen]` de WhatsApp: si editas el HTML con marcadores, vuelve a correrlo.
- `img/` — imagen para compartir (1200×630), foto de Grupo Zamna en Prana Towers y su logo (uso autorizado por Grupo Zamna).
- `analisis/` — análisis de la página pública: 8 fugas con su estado en la v2, antes/ahora y vista previa por dispositivo.
- `docs/` — inventario previo, análisis, benchmark, plan, `DESIGN.md` y kit de lanzamiento (borradores sin enviar).
- `comfy/` — proyecto de Comfy sin usar: se prefirieron fotos reales de Grupo Zamna a imágenes generadas.
- `deploy/` — vhost de nginx, script de publicación y bitácora.

La conversión es el WhatsApp público de diagnóstico (+52 984 136 2816). Cada enlace lleva su origen y, si la visita trae `utm_*`, la campaña. No hay dependencias en producción ni datos de otros clientes.
