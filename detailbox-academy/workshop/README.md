# Workshop PAD · Detailbox Academy

Plataforma del **Workbook PAD | Dashboard del Alumno** (especificación: `../curso/workbook.pdf`). Cada alumno tiene su cuenta y recorre las 4 secciones del workbook (Inicio, Prepara, Apunta y Dispara) con herramientas funcionales que guardan en el servidor. Tiene a la mano el **Copiloto PAD**, un popup conectado al perfil Hermes `detailbox-pad`. El equipo de Detailbox administra usuarios, talleres (registro por QR) y contenido desde el **CMS**.

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/registro/?c=CÓDIGO` | Alumno (al escanear el QR) | Crea su cuenta dentro del taller y entra con el copiloto abierto |
| `/entrar/` | Todos | Inicio de sesión; obliga a cambiar la contraseña temporal |
| `/app/` | Alumno | Workbook: 10 herramientas, progreso, evidencias y copiloto |
| `/cms/` | Equipo Detailbox (rol admin) | Talleres y QR (con modo proyección), usuarios, workbook de cada alumno, contenido y bitácora |

## Arquitectura

```
web/ (HTML + JS sin build)  ──fetch──▶  backend/app.py (Flask)  ──▶  data/workshop.db (SQLite)
                                              │                      data/evidencias/<usuario>/
                                              └─▶ hermes_bridge.py ─▶ hermes_worker.py ─▶ perfil Hermes detailbox-pad
```

| Archivo | Responsabilidad |
|---|---|
| `backend/content_seed.py` | Contenido inicial tomado del workbook; luego lo edita el CMS |
| `backend/progress.py` | **Cálculos sin IA:** estado por herramienta, avance, etapa actual, costo, utilidad y margen, y el contexto que recibe el copiloto |
| `backend/hermes_worker.py` | Una inferencia sin herramientas, terminal, archivos ni memoria. Adaptado del worker de Agente Cisne |

**Reglas del workbook (§6) y dónde se cumplen:**
- Guardado persistente.
- Historial de las últimas 40 versiones por herramienta: no se borra información al actualizar.
- Progreso calculado a partir de lo completado.
- Herramientas de 1 a 3 pasos (el CMS lo valida).
- Si la IA no está conectada, se ofrece copiar el prompt con contexto; nunca se simula una respuesta.

**Seguridad:**
- Contraseñas con hash de Werkzeug; sesión con cookie HttpOnly y SameSite=Lax.
- CSRF en cada escritura; roles `alumno` y `admin`.
- Cada alumno solo ve sus datos y evidencias.
- Límites de intentos en login, registro, subidas y copiloto.
- Archivos validados por contenido (JPG, PNG, WEBP o PDF, máximo 8 MB) y servidos solo con sesión.
- CSP estricta y bitácora de acciones del CMS.

## Correr en local

```sh
cd workshop
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
.venv/bin/python backend/app.py crear-admin --email tu@correo.mx --nombre "Tu nombre"   # pide contraseña
.venv/bin/python backend/app.py serve --port 8090
```

Después:
1. Abre `http://127.0.0.1:8090/entrar/` y entra con tu cuenta.
2. En el CMS, crea un taller.
3. Proyecta su QR. Para probar en tu celular, usa la IP de tu Mac y `serve --host 0.0.0.0`; define `WORKSHOP_PUBLIC_URL` para que el QR apunte a esa dirección.

El copiloto usa el perfil `detailbox-pad`; instálalo con `../agentes/pad/hermes/preparar_perfil.py --install`.

## Pruebas

```sh
cd workshop/backend && ../.venv/bin/python -m unittest discover -s tests -v
```

## Variables de entorno

| Variable | Uso |
|---|---|
| `WORKSHOP_DATA_DIR` | Base de datos y evidencias, fuera del sitio. Por defecto `workshop/data/` (ignorada por Git) |
| `WORKSHOP_PUBLIC_URL` | URL pública que codifica el QR, por ejemplo `https://workshop.detailbox...` |
| `WORKSHOP_SECURE_COOKIES=1` | Obligatoria con HTTPS |
| `WORKSHOP_TRUST_PROXY=1` | Detrás de nginx |
| `DETAILBOX_HERMES_ROOT` / `DETAILBOX_HERMES_PROFILE_DIR` | Instalación de Hermes y carpeta del perfil, si no están en `~/.hermes` |

## Producción (pendiente de autorización)

Necesita un servidor con Python, es decir, el VPS; no sirve el Hostinger estático actual. Los pasos:

1. `gunicorn 'app:create_app()' --workers 2 --threads 4 --timeout 90` (el copiloto tarda hasta ~60 s).
2. nginx con HTTPS y `client_max_body_size 9m`.
3. Las variables de arriba.
4. Respaldo diario de `WORKSHOP_DATA_DIR`.
5. El perfil Hermes con **llave propia de Detailbox (D4)**.

No se ha desplegado.

## Pendientes del cliente

- Aviso de privacidad oficial. Hoy se muestra un texto provisional marcado `[Pendiente]`, editable en CMS → Contenido → Textos.
- Dominio o subdominio del workshop (D8) y llave del modelo (D4).
- Las tareas del plan de 30 días derivan de las herramientas del workbook y de la Base PAD §10. Detailbox puede ajustarlas desde el CMS.
