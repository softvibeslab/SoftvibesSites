# Hopepaoo — análisis, landing y CMS local

Entrega editorial para `@hopepaoo`, reconstruida el 5 de agosto de 2026 a partir de contenido público recuperado con Apify.

## Entregables

- `landing.html`: landing responsive de Paola Elizabeth como cantante y performer.
- `analisis/index.html`: diagnóstico estratégico, métricas, hallazgos y plan 30–60–90.
- `cms/index.html`: editor local de identidad, territorios, trabajo destacado y eventos.
- `site-data.js`: contenido inicial compartido por landing y CMS.
- `config.json`: copia JSON portable del contenido inicial.
- `media/`: cinco fotografías autorizadas para esta entrega, video vertical de Chic Cabaret y poster derivado.
- `data/2026-08-05_hopepaoo-instagram-analysis.json`: dataset limpio usado para el análisis.

`index.html` redirige a la landing para facilitar la navegación local.

## Fuente y alcance

- Actor final: `apify/instagram-scraper`.
- Run: `BmnT50ZEmpAs20lUp` — https://console.apify.com/view/runs/BmnT50ZEmpAs20lUp
- Dataset: `GyJ0Q59hMyAlJNIGN` — https://console.apify.com/storage/datasets/GyJ0Q59hMyAlJNIGN
- Solicitud: 30 resultados.
- Muestra usada: 28 publicaciones cuyo `ownerUsername` es `hopepaoo`.
- Exclusiones: 2 resultados de otros autores.
- Costo real del run útil: US$0.0702.

Los Actors de ficha de perfil devolvieron cero items. Por eso no se publican seguidores, seguidos, bio actual, email, WhatsApp, precios, testimonios ni credenciales terapéuticas.

## Hallazgos base

- 103.3 likes y 7.5 comentarios promedio en la muestra.
- 8 videos con 4,231 reproducciones promedio.
- 18 carruseles, 8 videos y 2 imágenes.
- Los retratos editoriales concentran conversación; los covers y performances amplían alcance.
- El posicionamiento propuesto es: **voz, escena y metamorfosis**.

## Uso local

Desde esta carpeta:

```bash
python3 -m http.server 4173
```

Luego abre:

- Landing: `http://127.0.0.1:4173/landing.html`
- Análisis: `http://127.0.0.1:4173/analisis/`
- CMS: `http://127.0.0.1:4173/cms/`

El CMS guarda en `localStorage` bajo la clave `hopepaoo-site-v2`. Landing y CMS deben abrirse desde el mismo origen para compartir cambios.

## Despliegue temporal

- URL: https://mediumslateblue-hyena-743766.hostingersite.com/
- Proveedor: Hostinger, subdominio gratuito aislado.
- Publicado: 5 de agosto de 2026 mediante el MCP de Hostinger.
- Contenido: landing, análisis, CMS local, `site-data.js`, `config.json` y `media/` con cinco fotografías, poster y video MP4.
- Verificación: HTTPS 200 para `/`, `/landing.html`, `/analisis/`, `/cms/` y los siete recursos multimedia.

No se sobrescribió `hopepaoo-temp.hostingersite.com` ni otro sitio existente.

La versión con la nueva dirección visual y los medios locales se volvió a publicar y verificar el 5 de agosto de 2026.

## Límite del CMS

Es un prototipo editorial local: no tiene autenticación, base de datos, usuarios ni sincronización en servidor. No debe desplegarse como panel de producción. Permite exportar e importar respaldos JSON.

## Verificación

```bash
node tests/check-site.mjs
```

El test valida el dataset, recalcula métricas, compila los scripts inline y bloquea la reaparición de afirmaciones no verificadas en la landing.

## Pendiente antes de publicar

1. Confirmar con Paola el canal de contacto, booking y disponibilidad.
2. Reemplazar el CMS local por un backend autenticado si habrá edición en producción.
3. Validar derechos de cualquier fotografía antes de incorporarla como activo propio.
4. Generar un nuevo paquete de despliegue solo después de aprobación. Los ZIP y carpetas `deploy_*` existentes no fueron modificados.
