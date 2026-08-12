# MenuVibes

MenuVibes es una plataforma whitelabel multi-tenant para restaurantes: menu digital QR, pedidos por WhatsApp, panel de administracion, branding por negocio, lealtad, NPS y flujo de reseñas.

## Componentes principales

- `whitelabel/menu.html`: menu publico multi-tenant, usando `?n=<slug>`.
- `whitelabel/dashboard.html`: CMS administrativo con Supabase Auth.
- `whitelabel/schema.sql`: tablas, RLS, RPCs y modulos premium.
- `whitelabel/marketing/`: kit comercial, landing, emails y lead magnets.
- `whitelabel/link-previews/`: tarjetas compartibles para WhatsApp.
- `whitelabel/hermes/`: operador CLI/documentado para tareas internas con credenciales por entorno.

## Produccion

- Frontend: `https://menu.rovicrm.com`
- Dashboard: `https://menu.rovicrm.com/dashboard.html`
- Menus: `https://menu.rovicrm.com/?n=<slug>`

## Seguridad

No guardar claves de servicio, tokens ni contraseñas en el repositorio. Las operaciones administrativas de Supabase deben usar variables de entorno locales o del VPS.

El admin legado con contraseña estatica quedo deshabilitado; el dashboard actual usa Supabase Auth.

