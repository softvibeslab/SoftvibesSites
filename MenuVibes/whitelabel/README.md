# MenuVibes Whitelabel — CMS multi-tenant

Evolución de MenuVibes: de "1 HTML + 1 Google Sheets por cliente" a una plataforma
donde **un solo menú y un solo dashboard sirven a todos los negocios**, con los datos
en Supabase.

## Archivos

| Archivo | Qué es |
|---|---|
| `base-tables.sql` | Tablas base de clientes finales, pedidos y cupones. Se corre antes de `schema.sql` en instalaciones nuevas. |
| `schema.sql` | Tablas, RLS y bucket de Storage. Se corre una vez en Supabase. |
| `menu.html` | Menú público. Uno solo para todos: `menu.html?n=<slug>` |
| `dashboard.html` | CMS: CRUD de negocio, branding, secciones, productos, features y lealtad. |
| `PREMIUM_MODULES.md` | Diseño de fidelización por visitas, NPS, reseñas y backlog antes de venta. |
| `MONEYPRINTERV2_NOTES.md` | Ideas aplicables del repo MoneyPrinterV2 para prospectos, demos y outreach. |
| `marketing/` | Kit de ventas: pitch, landing, emails, lead magnets, prompts IA y calendario de redes. |
| `../../MenuVibes-private/tools/smoke_test/` | Smoke test privado para validar Supabase/RLS/RPC antes de activar clientes. |

## Setup (una sola vez)

1. **Supabase → SQL Editor** → en instalacion nueva corre `base-tables.sql`.
2. Luego pega y corre `schema.sql` completo.
3. **Authentication → Users** → crea (o usa) tu usuario admin.
4. Hazte super admin (SQL Editor):
   ```sql
   insert into perfiles (user_id, rol, nombre)
   values ('<TU-USER-UUID>', 'super_admin', 'Roger')
   on conflict (user_id) do update set rol = 'super_admin';
   ```
5. Sube `menu.html` y `dashboard.html` al hosting (Hostinger, misma carpeta).
6. Abre `dashboard.html`, entra con tu email/contraseña → botón **+ Negocio**.
7. Valida Supabase desde la raiz del workspace:
   ```bash
   node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug localito
   ```

Para una prueba completa de fidelizacion/NPS, usa un tenant demo publicado:

```bash
node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write
```

## Flujo por cliente nuevo (manual)

1. Dashboard → **+ Negocio** (nombre, slug, whatsapp) → se crea en estado *borrador*.
2. Tab **Branding**: logo (se sube a Storage), colores, fuentes, footer, promo.
3. Tab **Secciones**: crea secciones con horarios; marca subsecciones si aplica.
4. Tab **Productos**: agrega platillos con precio, opciones, foto.
5. Tab **Negocio** → **Publicar**.
6. El menú del cliente queda en: `https://tudominio.com/menu.html?n=<slug>`

## Roles

| Rol | Puede |
|---|---|
| `super_admin` | Ver/editar todos los negocios, crear negocios nuevos |
| `business_owner` | Editar solo el negocio donde `admin_user_id` = su usuario |

Para dar acceso a un dueño: crea su usuario en Supabase Auth y asigna su UUID
en `negocios.admin_user_id`.

## Notas técnicas

- **RLS**: lectura pública (el menú usa la anon key); escritura solo dueño o super admin.
- **Storage**: bucket público `menuvibes`, imágenes en `<slug>/logo/` y `<slug>/productos/`.
- **Prospectos**: la base comercial se movió fuera del sitio público a `MenuVibes-private/prospectos`.
- **Compatibilidad**: el render del menú es el mismo de `menuv2/` — las filas de DB se
  mapean al formato de filas CSV original, así que el comportamiento (papas, opciones,
  duplicados, promo, lealtad, cupones) es idéntico.
- **Multi-tenant en tablas viejas**: `usuarios`, `pedidos` y `cupones_canjeados` ahora
  tienen `negocio_id`. Los registros previos de Localito quedan con `negocio_id` NULL
  hasta que se les asigne:
  ```sql
  update usuarios set negocio_id = '<UUID-LOCALITO>' where negocio_id is null;
  update pedidos set negocio_id = '<UUID-LOCALITO>' where negocio_id is null;
  update cupones_canjeados set negocio_id = '<UUID-LOCALITO>' where negocio_id is null;
  ```

## Fase 2 (siguiente): generador automático desde Maps/redes

Pipeline previsto (las columnas `origen` y `origen_url` en `negocios` ya lo soportan):

1. Dar lista de negocios (Excel o URLs de Google Maps / Instagram).
2. Scraping con los skills `google-maps-scraper` / `web-scraper`: nombre, teléfono,
   dirección, horarios, fotos, menú (fotos de menú, sitio web, reviews).
3. Análisis de branding: paleta desde el logo/fotos, tono del negocio.
4. Insertar automáticamente: negocio (borrador) + branding + secciones + productos.
5. Revisión en el dashboard → Publicar → enviar link por WhatsApp al prospecto.
