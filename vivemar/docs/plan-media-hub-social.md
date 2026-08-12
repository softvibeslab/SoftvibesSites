# Plan: Media Hub Social — importar y categorizar la media de sus redes

Objetivo: que el Media Hub contenga TODO el material de las redes de Vive Mar,
categorizado y buscable, para armar el sitio eligiendo fotos sin salir del CMS.

## Restricción de arquitectura (importante)

El servidor de Hostinger NO puede scrapear Instagram/Facebook (muros de login).
La cosecha corre **en la máquina de Roger** usando el Chrome con sesión
(`~/.vivemar-debug-chrome`, perfil que ya usamos) y empuja los archivos al
servidor vía la API del CMS. El servidor solo recibe, convierte y cataloga.

```
[Chrome con sesión] → cosechador local (Playwright) → manifest + archivos
        → subida masiva vía /admin/api.php → /img/ + media.json → Hub UI
```

## Fase 1 — Cosecha ampliada (local)

Extender el extractor que ya funciona (`.tools/extract-ig2.js`):

| Fuente | Método | Volumen esperado |
|---|---|---|
| IG @viridianamarrealtor | Chrome CDP + scroll completo | ~219 posts |
| IG @vivemarrealestate | Chrome CDP + scroll completo | ~59 posts |
| TikTok (2 cuentas) | HTML del perfil + oembed (sin login) | ~180 portadas de video |
| Facebook /photos | Chrome CDP (misma sesión) | variable |
| Pinterest (público) | fetch directo | variable |

Salida por archivo: `{origen, cuenta, urlPost, caption/alt, fecha, sha1}` en
`manifest.json`. El **alt de IG trae la descripción completa del post** — es la
materia prima de la categorización. Dedupe por hash sha1 (muchas fotos se
repiten entre cuentas).

## Fase 2 — Categorización automática

Taxonomía (basada en su contenido real y sus historias destacadas):

- `propiedades` — renders y fotos de desarrollos (subetiqueta por desarrollo:
  corasol, selva-serena, bacab…)
- `interiores` — recámaras, salas, amenidades
- `zonas` — playa-del-carmen, tulum, cancun, puerto-morelos, puerto-aventuras
- `viridiana` — retratos y lifestyle de la asesora
- `clientes` — entregas y clientes felices (oro para testimonios)
- `branding` — posts con logo, frases, texturas de marca
- `video-covers` — portadas de TikTok/reels (enlazables al video)

Método en dos pasadas:
1. **Reglas por keywords** sobre caption/alt (barato, cubre ~70%): "penthouse|
   corasol" → propiedades/corasol; "lote|selva" → selva-serena; "cliente|
   entrega|llaves" → clientes; etc.
2. **Visión por IA** (Claude API, imagen + caption) para lo que las reglas no
   resuelvan y para validar: clasifica en la taxonomía + genera 3-5 etiquetas
   y un alt descriptivo en español (mejora también la accesibilidad del sitio).
   ~200-450 imágenes ≈ centavos de dólar.

## Fase 3 — Servidor: catálogo y subida masiva

- Nueva acción `importar_media` en `api.php`: recibe archivo + metadatos,
  convierte formato si hace falta (ya existe `importar_imagen`), **redimensiona
  a máx. 1600px y recomprime** (peso sano del sitio), guarda en `/img/` y
  registra en `admin/media.json`:
  ```json
  { "archivo": "corasol-alberca-01.jpg", "categoria": "propiedades",
    "etiquetas": ["corasol","alberca","render"], "origen": "ig:@vivemarrealestate",
    "caption": "…", "fecha": "2024-11-13", "sha1": "…" }
  ```
- Script local `subir-media.py`: login al CMS + POST de cada archivo con su
  metadata (reutiliza el flujo curl que ya probamos). Idempotente por sha1
  (re-ejecutar solo sube lo nuevo → sirve como **sincronización** mensual).

## Fase 4 — UI del Hub y el editor

- **Media Hub v2:** chips de categoría (Todas · Propiedades · Interiores ·
  Zonas · Viridiana · Clientes · Branding · Videos), búsqueda que incluye
  captions y etiquetas, badge de origen (IG/TikTok/FB), vista de caption al
  pasar el cursor, contador por categoría.
- **Selector del editor:** los mismos chips dentro del modal "Elegir del Media
  Hub" — cambiar la foto del hero filtrando por "zonas · playa-del-carmen" en
  dos taps.
- `media.json` es la fuente de verdad; los archivos sin registro (subidos a
  mano) aparecen en categoría "sin clasificar".

## Fase 5 (opcional) — Videos

Los videos pesan y TikTok/IG los sirven mejor: propuesta = portada en el Hub
+ campo `urlPost`, y en el sitio un componente "video" que muestra la portada
con play y abre el post original (o embed oficial de TikTok). No descargar mp4.

## Consideraciones

- **Derechos:** es material de la propia marca; en fase de pitch va con la nota
  de transparencia que ya usamos. Al cerrar el trato, pedirle originales en
  alta resolución para las piezas clave (IG entrega máx. ~1440px).
- **Peso total estimado:** ~250 imágenes × ~200KB optimizadas ≈ 50 MB — nada
  para el plan Cloud Startup.
- **Login del CMS:** la subida masiva usa la sesión; cambiar la contraseña no
  rompe nada (el script pide credenciales).

## Esfuerzo estimado

| Fase | Qué se entrega | Tiempo |
|---|---|---|
| 1 | Cosechador multi-red + manifest con captions | 1 sesión |
| 2 | Clasificador (reglas + IA) sobre el manifest | misma sesión |
| 3 | `importar_media` + subida masiva + media.json | 1 sesión |
| 4 | Hub v2 con categorías + picker del editor filtrado | 1 sesión |
| 5 | Componente de video (opcional) | corta |
