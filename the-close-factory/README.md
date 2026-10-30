# THE CLOSE FACTORY

Landing local de inteligencia comercial inmobiliaria, reconstruida el 2026-10-29 a partir de la página pública [theclosefactory.vercel.app](https://theclosefactory.vercel.app/).

Demo publicada en https://closefactory.softvibes.art (VPS rovicrm, `/var/www/closefactory`, desde el 2026-10-29). Lleva `noindex` en el HTML y en la cabecera `X-Robots-Tag`. El sitio público sigue siendo el de Vercel.

## Publicar

```bash
./deploy/publicar.sh
```

Respalda la versión anterior en `/var/backups/closefactory-web/` y sube solo lo público. `docs/`, `deploy/` y este README no se publican. El vhost está en `deploy/closefactory.softvibes.art.conf` y el certificado es de Let's Encrypt (certbot).

## Ver en local

```bash
python3 -m http.server 8765
```

Abrir `http://127.0.0.1:8765/`.

## Qué incluye

- `index.html` — la página: hero con orden de seguimiento, método, solución, audiencias, métricas y preguntas.
- `styles.css` / `main.js` — presentación y menú móvil. El acordeón de preguntas funciona sin JavaScript.
- `docs/inventario-previo.md` — decisión de nicho nuevo y referencias de Envato.
- `analisis/index.html` — análisis completo de la página pública: lo que ya sostiene la oferta y ocho fugas con evidencia.
- `docs/analisis.md` — la misma lectura en Markdown.
- `docs/plan-rediseno.md` — plan del rediseño «La Línea» y decisiones pendientes.
- `deploy/` — vhost de nginx, script de publicación y bitácora.

La conversión es el WhatsApp público de diagnóstico. No hay dependencias ni datos de otros clientes.
