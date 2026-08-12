# MenuVibes Premium Modules

Este documento define la primera version premium de fidelizacion, NPS y reputacion
para MenuVibes Whitelabel.

## Objetivo

Convertir el menu digital en una herramienta de retencion:

- El cliente registra visitas aunque no haga pedido por WhatsApp.
- El negocio configura beneficios por visita, NPS y acciones de reputacion.
- Cada visita puede pedir NPS para medir satisfaccion.
- Los clientes satisfechos reciben salida directa a Google Maps, Tripadvisor u otro canal.
- El negocio ve senales accionables para mejorar experiencia y recuperar clientes.

## Modulos

### 1. Fidelizacion por visitas

Tablas:

- `beneficios_premium`: beneficios configurables por negocio.
- `visitas_clientes`: registro de cada visita del cliente final.

Tipos de beneficio iniciales:

- `visita`: premio por registrar visita.
- `nps`: premio por contestar encuesta NPS.
- `resena`: beneficio interno por pasar al flujo de resena.
- `post`: beneficio interno por publicar o compartir en redes.

Nota de cumplimiento: el beneficio debe darse por la accion interna verificable
(visita, NPS, participacion), no por dejar una resena positiva. Google y Tripadvisor
restringen reseñas incentivadas o manipuladas.

### 2. NPS por visita

Tablas:

- `nps_respuestas`: score 0-10, comentario, visita relacionada y beneficio aplicado.

Flujo:

1. Cliente registra visita.
2. Si NPS esta activo, se abre encuesta 0-10.
3. Si responde, se puede mostrar un beneficio de tipo `nps`.
4. Si el score es 9 o 10, se invita a compartir la experiencia en canales publicos.
5. Si el score es 0-6, el sistema agradece y evita empujar a resena publica.

### 3. Reputacion y canales publicos

Tablas:

- `canales_resena`: enlaces configurables por negocio.
- `acciones_resena`: salida/click del cliente hacia canal publico.

Canales recomendados:

- Google Maps como canal principal para negocios locales.
- Tripadvisor para restaurantes, experiencias turisticas y zonas con alto trafico de viajeros.
- Instagram, Facebook o TikTok como canales sociales complementarios, especialmente para posts.

La plataforma queda configurable para que cada negocio use los canales que tengan sentido.

## Backlog antes de vender o activar en clientes

Este pendiente viene del analisis inicial y debe ejecutarse antes de venderlo o activarlo:

1. Meter `MenuVibes` en git.
2. Sacar `whitelabel/prospectos` del directorio publico. Hecho: movido a `MenuVibes-private/prospectos`.
3. Endurecer RLS y Storage. Hecho inicial: lectura publica limitada a negocios publicados, Storage por slug/dueno y acciones de cliente via RPC.
4. Filtrar solo negocios publicados en el menu publico. Hecho en `menu.html`.
5. Hacer una prueba completa con un tenant demo desde Supabase. Hecho 2026-07-10: `localito` paso lectura con 25 OK / 0 FAIL y `demo-premium` paso escritura completa con 31 OK / 0 FAIL. Ver `MenuVibes-private/tools/smoke_test/LAST_RUN.md`.

## Backlog tecnico especifico premium

1. Cambiar acciones publicas de visitas/NPS/resenas a Edge Functions o Supabase Auth real. Hecho parcial: ahora pasan por RPC; falta auth real/rate limiting antes de alto volumen.
2. Evitar registros duplicados de visita con una restriccion por usuario, negocio y dia.
3. Agregar canje/redencion real de beneficios con QR o codigo.
4. Agregar metricas por periodo en el dashboard: visitas, NPS promedio, detractores, promotores y clics por canal.
5. Agregar alertas internas cuando un cliente deje NPS bajo.
6. Agregar textos legales configurables por negocio para privacidad y terminos de promociones.
