# Cervecería Cisne Negro — Pachuca, Hgo.

Proyecto de marca y presencia digital: investigación, análisis, landing, menú digital con maridaje, fidelización y NPS.

## Estado (2026-10-06) — publicado en https://cisnenegro.softvibes.art

| URL | Qué es |
|---|---|
| `/` | Landing nueva (barril de hoy, historia, maridajes, Pasaporte, galería, eventos, visítanos) |
| `/menu/` | Menú QR con maridaje, filtro por perfil, Vuelo del Cisne, Pasaporte Cisne y NPS |
| `/admin/` | Panel del equipo: código del día, canje, NPS y socios (credenciales en `PRIVADO/credenciales-panel.txt`, fuera de git) |
| `/analisis/` | Informe de presencia digital (score global 37/100) |
| `/proyecto/` | Hub de artefactos: base de conocimientos, propuesta, plan, backlog, inventario y sistema visual |
| `/privacidad/` | Aviso de privacidad (preliminar, falta que lo apruebe el cliente) |
| `/assets/qr/menu-qr.png` · `.svg` | QR del menú para portavasos y mesas |

- ✅ Fases 0–5 completas. Vista previa con `noindex`; el dominio del cliente sigue siendo cisnenegro.mx.
- 📋 Pendiente del cliente: ver [BACKLOG.md](BACKLOG.md) y las preguntas abiertas (§9 de la base de conocimientos), además de validar los maridajes, las notas de cata, la historia de cada nombre y el aviso de privacidad.
- ⚠️ Urgente para el cliente: corregir o retirar la landing de Abacus (teléfono falso y horario incorrecto) y quitar "temporalmente cerrado" en Tripadvisor.

## Operación

- **Publicar cambios:** `deploy/publicar.sh` (rsync de `sitio/` + backend y reinicio del servicio). El hub se regenera con `deploy/build_proyecto.py` (requiere el paquete `markdown`).
- **Editar el menú:** `sitio/data/menu.json` es la fuente única de la landing y del menú. Al publicar, el cambio se refleja en ambos.
- **Backend del club:** `backend/club_server.py` (Python + SQLite), servicio `cisnenegro-club` en el VPS rovicrm, base en `/var/lib/cisnenegro-club/club.db`, con respaldo diario a las 03:30 (CDMX) en `/var/backups/cisnenegro-club/`. Pruebas: `python3 backend/test_club.py` (26 verificaciones). Desarrollo local: `python3 backend/dev_server.py 8080`.
- **Auditoría responsiva:** `tests/responsive/audit.cjs` revisa 20 perfiles en 3 motores (Android, iPhone, iPad y tabletas Android, Mac, Windows, 2560 px) sobre 13 vistas: desbordes, objetivos táctiles, zoom de iOS, recortes y errores JS. Uso: `python3 backend/dev_server.py 8082 &` y luego `NODE_PATH=<carpeta con playwright>/node_modules node tests/responsive/audit.cjs`. Las capturas y `reporte.json` quedan en `sitio/qa/responsive/` (fuera de git).
- **Infra:** DNS A `cisnenegro.softvibes.art → 31.220.63.211` (Hostinger), vhost nginx `deploy/nginx-cisnenegro.conf`, SSL de Let's Encrypt (certbot), y el panel protegido con basic auth.

## Documentos

| Archivo | Contenido |
|---|---|
| [01-base-conocimientos.md](01-base-conocimientos.md) | Datos verificados con fuente, menú, huella digital y preguntas abiertas |
| [02-propuesta-marca-digital.md](02-propuesta-marca-digital.md) | Hallazgos, plataforma de marca, maridaje, lealtad, NPS, redes y KPIs |
| [03-plan-ejecucion.md](03-plan-ejecucion.md) | Fases: scraping → análisis → landing → menú → lealtad/NPS → lanzamiento |
| [BACKLOG.md](BACKLOG.md) | Pendientes que dependen del cliente (B1–B4) |
| [sitio/DESIGN.md](sitio/DESIGN.md) | Sistema visual «Neón y tinta» |
| [scraping/README.md](scraping/README.md) | Inventario descargado, huecos, costo, cómo reproducir y hallazgos preliminares |

## Bases reutilizadas

- Landing: `../malandra-cerveceria` (mismo nicho; solo la base técnica).
- Menú, lealtad y NPS: backend propio del club (MenuVibes/Supabase está apagado desde ago 2026; decisión del usuario el 2026-10-06).

## Reglas

No se inventan datos. No se publica, despliega ni contacta al cliente sin autorización explícita.
