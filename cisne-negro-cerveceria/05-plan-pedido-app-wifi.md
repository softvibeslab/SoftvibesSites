# Plan — "Mi pedido" para mostrar al mesero, app instalable del Pasaporte y Wi-Fi gestionable

> Propuesta del 2026-10-06. Rama de trabajo: `feat/cisne-negro-continuacion`. Nada de esto está construido todavía.
> Referencia técnica (solo lectura, sin contenido del cliente): el carrito de `resortes-momo/site/cart.mjs` y sus pruebas `tests/cart.test.mjs`.

---

## 0. Qué se reutiliza y qué no

**De Resortes Momo (patrones de código, no contenido):**

| Patrón | Cómo se adapta a Cisne Negro |
|---|---|
| Módulo puro `cart.mjs`: `addItem`, `restoreCart`, `validQuantity`, `cleanText`, límites de líneas y cantidades | `pedido.mjs` con las mismas funciones puras y otros límites (máx. 20 por línea, 40 líneas) |
| `localStorage` con clave versionada (`momo-cart-v1`) | `cisne-pedido-v1` + caducidad: el pedido se vacía solo tras 12 h (cada visita al bar empieza limpia) |
| **Revalidación contra el catálogo publicado** (`unavailable`, `fingerprint`/`changed`) | Si un barril rotó o cambió un precio, la línea se marca "Ya no está en barril" o "Cambió el precio" y no entra a la tarjeta hasta que el cliente la revise |
| Juntar líneas iguales (mismo producto + variante + nota) | Igual, con variante = medida (12/14 oz o 4 oz) |
| `buildMessage` arma el texto final | `buildTarjeta` arma la tarjeta "Para tu mesero" (no se envía a ningún lado) |
| Pruebas con `node --test` | `tests/pedido.test.mjs` |

**Lo que NO se copia:** el flujo de WhatsApp para cotizar, el CMS PHP/MySQL ni datos del cliente. En el bar no hay pedido en línea: el cliente arma su pedido y **se lo muestra al mesero**, igual que hoy con el Vuelo del Cisne.

**Lo que ya existe en Cisne Negro y se aprovecha:** el diálogo `#vuelo-tarjeta` ("Muéstraselo a tu mesero"), el constructor del Vuelo, el backend del club (Python + SQLite), el panel con pestañas y `deploy/publicar.sh` con respaldo previo.

---

## 1. "Mi pedido" → Mostrar al mesero

### Experiencia
1. Cada producto del menú tiene un botón **"＋ Agregar"**:
   - **Barril:** se elige la medida (12/14 oz o 4 oz) con chips; precio según la medida.
   - **Vuelo del Cisne:** "Agregar vuelo al pedido" entra como **una sola línea** con sus 4 cervezas listadas.
   - **Latas, comida y sin alcohol:** cantidad 1; las variantes van en chips (Chips de Camote 55 g / 110 g; agua mineral normal / Rusa +$10).
2. **Barra flotante** abajo: "Mi pedido · 3 · $415". Respeta la barra inferior del iPhone y no tapa el botón del Pasaporte.
3. **Drawer "Mi pedido":** líneas con − / ＋, quitar, nota por línea ("sin cebolla", 40 caracteres), número de mesa opcional, subtotal y "Vaciar".
4. **"Mostrar al mesero"**: tarjeta a pantalla completa, de alto contraste y letra grande:
   - Primero bebidas, luego comida, con cantidades, medidas y notas.
   - Mesa y total estimado ("El total final lo confirma tu mesero").
   - Pide a la pantalla que no se apague mientras está abierta (Wake Lock API, si el navegador lo permite).
   - Botones "Ya lo pedí" (vacía el pedido) y "Volver".
5. Sin pagos, sin envío y sin backend: todo vive en el teléfono del cliente.

### Datos (`sitio/data/menu.json`)
- Agregar `id` a las 18 latas y a las 5 bebidas sin alcohol (hoy no tienen).
- Convertir variantes que hoy están en texto a datos: `"variantes": [{"id":"55g","nombre":"55 g","precio":75},{"id":"110g","nombre":"110 g","precio":135}]` en Chips de Camote, y `{"id":"rusa","nombre":"Preparada (rusa)","extra":10}` en agua mineral.
- `"disponible": false` opcional por producto para agotados.

### Código
- `sitio/assets/js/pedido.mjs`: funciones puras (`agregar`, `restaurar`, `revalidar`, `total`, `tarjeta`), sin DOM, para probarlas con `node --test`.
- `sitio/assets/js/menu.js`: botones, barra, drawer y tarjeta. **El diálogo del Vuelo se generaliza** a la tarjeta del pedido, en lugar de crear uno nuevo.
- `sitio/assets/css/menu.css`: barra, drawer y tarjeta con los tokens de `DESIGN.md`.

### Pruebas
- `tests/pedido.test.mjs` (modelo `resortes-momo/tests/cart.test.mjs`):
  - Junta líneas iguales y separa medidas y notas distintas.
  - Rechaza cantidades inválidas sin mutar el pedido.
  - `restaurar` tolera JSON corrupto y caduca a las 12 h.
  - Revalida un barril que rotó y un precio que cambió.
  - Total exacto y tarjeta con todos los datos.
- Ampliar `tests/funcional/verificar.cjs`: agregar 3 productos y un vuelo, cambiar cantidades, recargar (persiste), mostrar al mesero y "Ya lo pedí".
- `tests/responsive/audit.cjs`: nuevas vistas `menu-pedido` y `menu-tarjeta-mesero`.

---

## 2. Pasaporte instalable: "Agrega Cisne Negro a tu inicio"

### Qué se instala
Una **PWA** (aplicación web) que abre directo el Pasaporte a pantalla completa, con el ícono del cisne. No pasa por tiendas de apps y funciona en Android, iPhone, iPad, Mac y Windows.

### Archivos nuevos
- `sitio/manifest.webmanifest`:
  - `name` "Cervecería Cisne Negro", `short_name` "Cisne Negro", `start_url` `/menu/?app=1#pasaporte`, `scope` `/`, `display` `standalone`, colores `#0E0D0B`.
  - Íconos 192 y 512 y uno *maskable* 512, generados del cisne.
  - Accesos rápidos (`shortcuts`): Menú, Pasaporte, Wi-Fi.
- `sitio/sw.js` (service worker mínimo):
  - Red primero para páginas, `/data/` y `/api/`; **`/api/` nunca se cachea**.
  - Caché solo para assets con `?v=` y una página "Sin conexión".
  - Versionado para no repetir el problema de caché de hoy.
- `<link rel="manifest">` y metas de Apple en `/`, `/menu/` y `/privacidad/`.
- nginx: `Content-Type` correcto para el manifest y `Cache-Control: no-cache` para `sw.js` (ya cubierto por la regla general).

### Cuándo se muestra la invitación
Solo si **el socio tiene sesión en su Pasaporte**, la página **no** está abierta ya como app (`display-mode: standalone`) y no la descartó en los últimos 30 días. Va como tarjeta dentro de "Mi Pasaporte", nunca como ventana emergente.

### Cómo se instala según el dispositivo

| Dispositivo / navegador | Qué ve el socio |
|---|---|
| Android (Chrome, Edge, Samsung Internet) · Windows y Mac (Chrome/Edge) | Botón **"Instalar app"**, que abre el diálogo nativo (`beforeinstallprompt`) |
| iPhone / iPad (Safari, y Chrome/Edge desde iOS 16.4) | Pasos con íconos: Compartir → "Agregar a inicio" |
| Mac con Safari 17+ | Archivo → "Agregar al Dock" |
| Firefox (escritorio) | "Agrégalo a favoritos" (Firefox de escritorio no instala apps web) |

### Detalle importante (iPhone/iPad)
En iOS, la app instalada **no comparte la sesión con Safari**, así que el socio entra **una vez** con su teléfono y PIN dentro de la app; después la cookie de 180 días lo mantiene. La tarjeta lo avisa antes de instalar. No se recomiendan "enlaces mágicos" con el token en la URL: se pueden filtrar.

### Pruebas
- Lighthouse / Chrome DevTools: el manifest es válido y la app es instalable.
- En Playwright:
  - La tarjeta aparece solo con sesión y desaparece en modo `standalone` (emulado).
  - El service worker no cachea `/api/`.
- Prueba manual en un Android y un iPhone reales, porque la instalación nativa no se puede automatizar.

---

## 3. Wi-Fi en el menú, administrable desde el panel

### En el menú
- Botón **"Wi-Fi"** en la barra superior del menú y en el pie.
- El diálogo muestra el nombre de la red y la contraseña, cada uno con botón "Copiar", y un **código QR para conectarse con la cámara** (formato estándar `WIFI:T:WPA;S:…;P:…;;`, que reconocen iPhone y Android).
- Si el negocio la ocultó, el botón no aparece.

### Datos iniciales (de ejemplo, marcados como tales)
`CisneNegro-Invitados` / `CuentaloEnElCisne` con la leyenda "datos de ejemplo" visible solo en el panel hasta que se cambien.

### Backend (`backend/club_server.py`, cambio aditivo)
- Tabla `ajustes` (`clave`, `valor` JSON, `actualizado_at`, `actualizado_por`), creada por la migración automática; no toca datos existentes.
- `GET /api/config` (público): devuelve solo lo visible (`wifi: {ssid, password, seguridad}` o `null`).
- `GET` y `PUT /api/admin/ajustes` (protegido por nginx): nombre de red, contraseña, tipo (WPA/WEP/abierta) y **visibilidad**:
  - **Pública:** cualquiera con el menú.
  - **Solo socios:** con sesión del Pasaporte.
  - **Oculta.**

  Con validación de longitudes y caracteres.
- `backend/test_club.py`: probar visibilidad, validaciones y que `/api/config` no exponga nada con la red oculta.

### Panel del equipo
- Pestaña nueva **"Ajustes"** con la sección Wi-Fi: formulario, vista previa del QR, "Mostrar/ocultar contraseña", selector de visibilidad y última modificación.

### Seguridad
La contraseña de una red de invitados es pública por naturaleza. Se recomienda que sea **una red de invitados aislada** del sistema de cobro y las cámaras. "Solo socios" sirve como incentivo para crear el Pasaporte.

---

## 4. Orden de trabajo y estimación

| Fase | Entregable | Esfuerzo | Riesgo |
|---|---|---|---|
| A | **Wi-Fi**: backend + panel + diálogo del menú + pruebas | 0.5–1 día | Bajo |
| B | **Mi pedido**: `pedido.mjs` + pruebas unitarias + UI + tarjeta para el mesero + integración con el Vuelo | 2–3 días | Medio (UX en móvil) |
| C | **App instalable**: manifest + íconos + service worker + tarjeta por dispositivo | 1–1.5 días | Medio (caché del SW, diferencias de iOS) |
| D | QA completo (`test_club`, `pedido.test`, funcional, responsivo, smoke de producción) + documentación + `deploy/publicar.sh` | 0.5 día | Bajo |

Se sugiere **A → B → C**: el Wi-Fi da valor inmediato y prueba el patrón "dato gestionado en el panel"; el pedido es lo de mayor impacto; la app va al final porque el service worker es lo más delicado de publicar. Cada fase se publica por separado con respaldo y rollback.

## 5. Decisiones que necesitamos del cliente
1. Nombre y contraseña reales del Wi-Fi, y ¿pública o solo para socios?
2. ¿Quieren número de mesa en la tarjeta? ¿Las mesas tienen número visible?
3. ¿El total estimado se muestra o solo los productos (por si hay promociones en barra)?
4. ¿Algún producto no se pide desde la mesa (por ejemplo, latas para llevar)?
5. ¿El ícono de la app es el cisne ilustrado o la pluma?
