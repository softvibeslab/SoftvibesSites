# Plan — QR del pedido, modo mesero, historial y cierre de día

> Propuesta del 2026-10-07 sobre el entorno `/v2` (rama `feat/cisne-negro-v2-pedido`). Nada de esto está construido todavía.
> Parte de lo que ya existe: "Mi pedido" (`sitio/assets/js/pedido.js`), la tarjeta "Para tu mesero" (`#pedido-tarjeta`), el backend `club_server.py` (Python + SQLite) y el panel `/admin/`.

---

## 0. La idea en una línea

El cliente toca **"Mostrar al mesero"** y la tarjeta agrega un **QR**. El mesero lo escanea **desde su cuenta**, ve el pedido completo y lo **toma**. El pedido queda en su historial, y al final del turno hace su **corte**; el gerente hace el **cierre del día**.

**Límite de alcance:** no es un punto de venta fiscal. No emite tickets ni facturas (CFDI) y no controla la caja. Si el bar ya usa un POS, esto lo **complementa** (registro de pedidos por mesero y cortes de control); la integración con un POS sería otro proyecto.

---

## 1. QR en "Mostrar al mesero" (cliente)

### Cómo funciona
1. Al tocar "Mostrar al mesero", el menú **envía el pedido al servidor** (`POST /api/pedidos`) y recibe un **código corto** (por ejemplo `K7M2-Q9`, unos 40 bits aleatorios, no adivinable).
2. La tarjeta muestra lo de siempre más un **QR** con la URL `https://cisnenegro.softvibes.art/equipo/p/K7M2Q9`, y el código en texto por si la cámara falla.
3. **Sin internet:** si el envío falla, el QR lleva el pedido **comprimido dentro de la URL** (`/equipo/p/#d=<datos>`). El mesero lo puede tomar igual y se registra cuando su teléfono tenga conexión.
4. Al tomarlo el mesero, la tarjeta del cliente cambia a **"✓ Pedido tomado por Luis"** (consulta ligera cada 5 s mientras la tarjeta está abierta) y el pedido local se vacía. "Ya lo pedí" queda como respaldo manual.

### Reglas
- **Sin datos personales.** Si el cliente tiene sesión en el Pasaporte, el pedido se liga a su `socio_id` (ver §6).
- Un pedido **pendiente caduca a las 3 h** si nadie lo toma.
- Límite de pedidos por IP generoso (el wifi del bar comparte IP) y validación contra `menu.json`: el servidor recalcula precios y no confía en los del navegador.

---

## 2. Cuentas del equipo y rol "mesero"

### Por qué cambiar el acceso actual
Hoy `/admin/` usa **una sola contraseña compartida** (basic auth de nginx). Para saber **qué mesero tomó cada pedido** se necesitan cuentas individuales.

### Modelo
- Tabla `staff`: nombre, usuario, **PIN de 6 dígitos o contraseña** (con hash PBKDF2 y sal propia), rol (`mesero` | `gerente`), activo y fechas.
- Sesión del equipo con su propia cookie `cn_equipo` (HttpOnly, SameSite=Strict, **12 h = un turno**), separada de la del Pasaporte.
- 5 intentos fallidos bloquean el acceso 15 minutos; queda registro de cada inicio de sesión.

| Rol | Puede |
|---|---|
| **Mesero** | Escanear y tomar pedidos, editar los que tomó (antes del corte), cerrarlos con forma de pago, ver **su** historial y hacer **su** corte |
| **Gerente** | Todo lo anterior para cualquier mesero, más alta y baja de cuentas, cambio de PIN, reabrir un corte (con motivo), **cierre del día** y el panel actual (NPS, socios, ajustes) |

### Transición sin riesgo
1. Se crea la app del equipo en **`/equipo/`** con login propio.
2. El panel `/admin/` sigue con su contraseña actual **hasta** que el gerente use su cuenta. Después se retira el basic auth y `/admin/` queda solo para el rol gerente.

---

## 3. App del mesero `/equipo/` (celular primero, instalable)

- **Inicio de sesión:** usuario + PIN, con teclado numérico grande.
- **Escanear:** dos caminos, para que funcione en cualquier teléfono.
  - **Cámara nativa** (iPhone y Android): el QR es una URL; al abrirla, si hay sesión de mesero, entra directo al pedido.
  - **Botón "Escanear" dentro de la app:** `BarcodeDetector` en Chrome/Android y **jsQR** (MIT, incluido en el proyecto) en iPhone. Si no se da permiso de cámara, se puede escribir el código.
- **Pedido escaneado:**
  - Mesa, líneas con medidas, variantes y notas, total recalculado por el servidor.
  - Si es socio: nombre, visitas y cortesías vigentes.
  - Botón **"Tomar pedido"**. Después se puede marcar una línea como "no hay", ajustar cantidades y agregar nota.
  - Cada cambio queda en la bitácora (`pedido_eventos`).
- **Mis pedidos abiertos** (agrupados por mesa) → **"Cerrar cuenta"**: forma de pago (efectivo, tarjeta, transferencia u otra), propina opcional y total final.
- **Historial** (ver §4) y **Corte** (ver §5).
- **Instalable** como app ("Cisne Equipo"), con el mismo patrón del Pasaporte.

### Estados de un pedido
`pendiente` (lo creó el cliente) → `tomado` (por un mesero) → `cerrado` (cobrado), o `cancelado` (con motivo) o `caducado`. Tras el corte del mesero, sus pedidos quedan **bloqueados**.

---

## 4. Historial con filtros

- **Rangos rápidos:** Hoy · Ayer · Esta semana · Este mes · **Personalizado** (desde/hasta, por fecha y hora).
- **Día operativo:** el bar cierra a las 23:30, así que un pedido de las 00:40 **pertenece al día anterior**. Se propone que el día operativo corte a las **05:00** (configurable en Ajustes). Zona horaria America/Mexico_City.
- **Filtros:** estado, mesa, forma de pago y, para el gerente, **mesero**.
- **Indicadores del rango:** pedidos, total vendido, ticket promedio, propinas, desglose por forma de pago, productos más pedidos y pedidos por hora.
- **Lista paginada** con detalle de cada pedido y su bitácora. **Exportar CSV.**
- **Permisos:** el mesero solo ve lo suyo; el gerente ve todo y compara meseros.

---

## 5. Corte del mesero y cierre del día

### Corte del mesero (fin de turno)
1. **"Hacer mi corte"** muestra el resumen del día operativo: pedidos, total, desglose por forma de pago, propinas y **pedidos que siguen abiertos**.
2. Si hay pedidos abiertos, hay que cerrarlos, cancelarlos con motivo o **transferirlos** a otro mesero antes de cortar.
3. Al confirmar se guarda un **corte inmutable** (tabla `cortes`, con el resumen en JSON y un hash), se bloquean esos pedidos y se puede **compartir o imprimir** el resumen.

### Cierre del día (gerente)
- Vista del día: estado de los cortes por mesero, totales del día y por mesero, productos top, más datos del club del mismo día (visitas al Pasaporte, NPS y cortesías canjeadas).
- **"Cerrar día"**:
  - Exige que todos los meseros con pedidos tengan corte, o permite un **cierre forzado** con motivo.
  - Marca los pendientes no tomados como caducados.
  - Genera el **reporte del día** (vista imprimible y CSV).
- **Reapertura** solo por el gerente, con motivo y registro en la bitácora. Nada se borra.

---

## 6. Opcional, de alto valor: ligar con el Pasaporte

Si el pedido viene de un socio con sesión, al tomarlo el mesero puede:
- **Registrar la visita de hoy** con un toque, **sin código del día**, porque la valida el equipo en persona.
- **Canjear una cortesía vigente** (CN-XXXXX) en el mismo pedido.

Esto reduce fricción en la barra y hace más confiables las visitas del Pasaporte.

---

## 7. Cambios técnicos

**Backend** (`club_server.py`; migraciones aditivas, nada se borra):
- **Tablas nuevas:** `staff`, `staff_sesiones`, `pedidos` (código, estado, mesa, líneas JSON, total estimado y final, `socio_id`, `tomado_por`, fechas, `dia_operativo`, forma de pago, propina, `corte_id`), `pedido_eventos` y `cortes`.
- **API pública:** `POST /api/pedidos` y `GET /api/pedidos/<código>/estado`.
- **API del equipo:** login, logout y `yo`; `GET /api/equipo/pedidos/<código>`; tomar, editar, cerrar, cancelar y transferir; historial con filtros e indicadores; CSV; corte; cierre del día; gestión de cuentas (solo gerente).
- **Pruebas** en `test_club.py`:
  - Roles: un mesero no ve pedidos ajenos ni gestiona cuentas.
  - Caducidad, recálculo de precios, día operativo después de medianoche y bloqueo tras el corte.
  - Cierre con pendientes, cierre forzado y reapertura.
  - Límites e intentos de login.

**Frontend:**
- Menú: QR en `#pedido-tarjeta` (usa `lib/qrcode.js`, ya incluido) y estado "tomado".
- **Nueva** `sitio/equipo/` (login, escanear, pedido, mis pedidos, historial, corte), con `lib/jsqr.js` incluido.
- Panel `/admin/`: pestañas Equipo (cuentas), Pedidos (historial global) y Cierre del día.

**Infraestructura:** igual que `/v2` (sin servicios nuevos). nginx sirve `/v2/equipo/`, sin basic auth porque tiene login propio.

**Pruebas end-to-end** con Playwright, simulando dos teléfonos:
- El cliente arma el pedido y muestra el QR.
- El mesero inicia sesión, abre la URL del QR, toma el pedido, ajusta una línea y cierra con tarjeta y propina.
- El cliente ve "Pedido tomado".
- El mesero hace su corte y el gerente cierra el día.
- Se revisa el historial con rango personalizado.

Además, auditoría responsiva de las vistas nuevas.

---

## 8. Fases y estimación

| Fase | Entregable | Esfuerzo |
|---|---|---|
| A | Pedidos en el servidor + QR en la tarjeta + estado "tomado" + respaldo sin conexión | 1.5–2 días |
| B | Cuentas del equipo, roles y login en `/equipo/` | 1.5 días |
| C | App del mesero: escanear, tomar, editar, cerrar cuenta y mis pedidos | 2 días |
| D | Historial con rangos, filtros, indicadores y CSV | 1.5 días |
| E | Corte del mesero + cierre del día + reportes | 1.5–2 días |
| F | (Opcional) Pasaporte: visita y cortesía desde el pedido | 1 día |
| G | QA completo y publicación en `/v2` | 1 día |

**Total:** unos 10–11 días. Cada fase se publica por separado en `/v2` con respaldo.

## 9. Decisiones del cliente

1. ¿El pedido se cobra **por ronda** o se acumula en una **cuenta por mesa** (varias rondas, un solo cierre)? Se recomienda cuenta por mesa.
2. ¿Registramos **forma de pago** y **propina**? ¿Qué formas de pago usan?
3. ¿Hora de corte del día operativo? Se propone 05:00.
4. ¿Quién puede hacer el cierre del día: solo el gerente, o también un encargado?
5. ¿El mesero puede cambiar precios o solo cantidades y disponibilidad? Se recomienda solo cantidades y disponibilidad.
6. ¿Usan algún POS (Soft Restaurant, Parrot u otro)? Para no duplicar captura.
7. ¿Activamos la fase F (visita y cortesía desde el pedido)?
8. Lista de meseros y gerentes para crear sus cuentas.
