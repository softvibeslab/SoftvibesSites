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

- **Publicar cambios:** `deploy/publicar.sh` desde un estado con commit. Respalda antes en el VPS (`/var/backups/cisnenegro-web/<fecha>/`), sincroniza `sitio/` **sin `/experiencia/`** (`INCLUIR_EXPERIENCIA=1` para incluirla), reinicia `cisnenegro-club` solo si cambió el backend y anota el commit en `DESPLIEGUES.log`. El hub se regenera con `deploy/build_proyecto.py` (requiere el paquete `markdown`).
- **Editar el menú:** `sitio/data/menu.json` es la fuente única de la landing y del menú. Al publicar, el cambio se refleja en ambos.
- **Backend del club:** `backend/club_server.py` (Python + SQLite), servicio `cisnenegro-club` en el VPS rovicrm, base en `/var/lib/cisnenegro-club/club.db`, con respaldo diario a las 03:30 (CDMX) en `/var/backups/cisnenegro-club/`. Pruebas: `python3 backend/test_club.py` (26 verificaciones). Desarrollo local: `python3 backend/dev_server.py 8080`.
- **Batería funcional:** `NODE_PATH=<carpeta con playwright>/node_modules tests/funcional/correr.sh [puerto]` levanta un servidor con base desechable, siembra 14 socios de prueba y corre 70 pruebas (menú, Pasaporte, NPS, ranking y panel). Se niega a correr contra producción.
- **Auditoría responsiva:** `tests/responsive/audit.cjs` revisa 20 perfiles en 3 motores (Android, iPhone, iPad y tabletas Android, Mac, Windows, 2560 px) sobre 13 vistas: desbordes, objetivos táctiles, zoom de iOS, recortes y errores JS. Uso: `python3 backend/dev_server.py 8082 &` y luego `NODE_PATH=<carpeta con playwright>/node_modules node tests/responsive/audit.cjs`. Las capturas y `reporte.json` quedan en `sitio/qa/responsive/` (fuera de git).
- **Infra:** DNS A `cisnenegro.softvibes.art → 31.220.63.211` (Hostinger), vhost nginx `deploy/nginx-cisnenegro.conf`, SSL de Let's Encrypt (certbot), y el panel protegido con basic auth.

## Despliegue a producción — 2026-10-06 (portada, menú y Pasaporte)

**Entrega:** rama `feat/cisne-negro-menu-pasaporte` @ `66a3037`, **sin `/experiencia/`**. El contenido activo equivale a `4f5291e` (`feat/cisne-negro-responsive`), que es `66a3037` sin los 4 archivos de `/experiencia/` (verificado con `git diff --stat 66a3037 4f5291e`).

**Resultado:** producción ya servía byte a byte esta versión (se había publicado antes con `deploy/publicar.sh`). Comparación por checksum (`rsync -ancic` con `--exclude experiencia/`): **0 archivos con contenido distinto** en `sitio/`, y `club_server.py` idéntico (`cmp`). Por eso **no se transfirieron archivos ni se reinició** `cisnenegro-club` (activo desde 2026-10-06 10:26:46 UTC). No hubo merge a `main`.

**URL:** https://cisnenegro.softvibes.art — portada `/`, menú `/menu/`, Pasaporte `/menu/#pasaporte`, ranking `/menu/#ranking`, panel `/admin/` (basic auth). Hosting: VPS rovicrm (nginx + certbot, certificado vigente hasta 2027-01-04), DNS A `cisnenegro.softvibes.art`.

**Pruebas ejecutadas el 2026-10-06** (worktree limpio en `66a3037`, bases SQLite desechables que se borraron al terminar):

| Prueba | Comando | Resultado |
|---|---|---|
| Backend del Pasaporte | `python3 backend/test_club.py` | 55/55 |
| Funcional menú + Pasaporte + panel | `verificar.js` (Playwright) contra `dev_server.py 8095` con datos sembrados; ahora versionado como `tests/funcional/correr.sh` (70/70 también) | 70/70 |
| Responsivo | `tests/responsive/audit.cjs` (20 perfiles × 13 vistas, WebKit/Chromium/Firefox) | 0 desbordes · 0 zoom iOS · 0 errores JS · 0 errores de carga · 11 excepciones aceptadas (enlaces numéricos en tablas de `/analisis/`) |
| Producción: infraestructura | `curl` / `openssl` | HTTPS válido, redirección 301 a HTTPS, rutas 200, `/api/salud` 200, `/api/ranking` 200 sin datos personales, `/api/yo` 401 y `/admin/` 401 (esperados), 29/29 assets del menú |
| Producción: navegador (solo lectura) | Playwright en iPhone 16 (WebKit), Pixel 7 y Mac 1440 (Chromium), Windows 1366 (Firefox) | portada (6 cervezas), navegación portada → menú (6 cervezas, 20 platillos), diálogo de etiqueta, Pasaporte como invitado y ranking: 0 errores JS, 0 recursos fallidos, 0 desbordes, 0 imágenes rotas |

**No verificado en producción:** los flujos autenticados de socio (registro, check-in con código del día, NPS, cortesías y canje) y el panel `/admin/` con credenciales. No hay una cuenta de prueba autorizada y no se crearon socios ni datos reales; esos flujos solo se probaron con base desechable (70/70).

**Respaldo** (VPS, sin secretos en el repo): `/var/backups/cisnenegro-web/20261006T115900Z/`
- `web.tar.gz` (raíz web completa, incluida `/experiencia/`; la restauración se probó: `diff -r` contra lo activo dio idéntico)
- `club_server.py`, `nginx-cisnenegro.conf`, `cisnenegro-club.service`
- `club.db` (respaldo consistente con la API `backup` de SQLite, `integrity_check = ok`)
- `SHA256SUMS`

Además, la base tiene un respaldo diario automático en `/var/backups/cisnenegro-club/` (cron 03:30 CDMX).

**Rollback** (en el VPS, como root):
1. **Sitio** (no toca datos): `R=/var/backups/cisnenegro-web/20261006T115900Z; T=$(mktemp -d); tar -xzf $R/web.tar.gz -C $T && rsync -a --delete $T/cisnenegro/ /var/www/cisnenegro/ && rm -rf $T`
2. **Backend:** `cp $R/club_server.py /opt/cisnenegro-club/club_server.py && systemctl restart cisnenegro-club && systemctl is-active cisnenegro-club`
3. **Base** (solo ante daño de datos, porque **sobrescribe** socios y visitas posteriores al respaldo): `systemctl stop cisnenegro-club; cp /var/lib/cisnenegro-club/club.db /var/lib/cisnenegro-club/club.db.antes-rollback; cp $R/club.db /var/lib/cisnenegro-club/club.db; rm -f /var/lib/cisnenegro-club/club.db-wal /var/lib/cisnenegro-club/club.db-shm; chown cisneclub:cisneclub /var/lib/cisnenegro-club/club.db; systemctl start cisnenegro-club`
4. Verificar con `curl -s https://cisnenegro.softvibes.art/api/salud` y abrir `/` y `/menu/`.

**Pendientes fuera de esta entrega:**
- **`/experiencia/`** ("Entra al Cisne", de otra sesión): sin commit en la copia de trabajo, y en producción con una instantánea anterior (el usuario decidió dejarla publicada). `deploy/publicar.sh` ya la excluye por defecto (ni la sube ni la borra del servidor).
- La rama `feat/cisne-negro-menu-pasaporte` (`66a3037`) **contiene `/experiencia/` en progreso**: no fusionarla a `main` tal cual; usar `4f5291e` o esta rama.
- Decidir el merge a `main` (no hecho).
- Cliente: `BACKLOG.md` (B1–B4) y preguntas abiertas de la base de conocimientos (Henry IX ¿IPA o Munich Helles?, ABV de ¿A poco sí pa'?, historia de cada nombre, aviso de privacidad, valores de la gamificación).

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
