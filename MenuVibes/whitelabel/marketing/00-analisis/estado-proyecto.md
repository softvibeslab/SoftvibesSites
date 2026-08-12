# Analisis de MenuVibes Whitelabel

## Que es MenuVibes hoy

MenuVibes paso de ser un menu HTML por cliente a una plataforma whitelabel
multi-tenant. El mismo `menu.html` sirve para todos los negocios usando el
parametro `?n=<slug>`, y el mismo `dashboard.html` permite crear/editar negocios,
branding, secciones, productos, media, niveles de lealtad y modulos premium.

La base viva esta en Supabase self-hosted (`https://supabase.rovicrm.com`) y el
frontend se sirve desde `https://menu.rovicrm.com`.

## Ultimo desarrollo validado

- Se aplico `schema.sql` en Supabase vivo.
- Se endurecio RLS para que la anon key no vea negocios en borrador.
- Se crearon tablas premium:
  - `beneficios_premium`
  - `visitas_clientes`
  - `nps_respuestas`
  - `canales_resena`
  - `acciones_resena`
- Se publicaron RPC controlados para clientes finales:
  - `cliente_register`
  - `cliente_login`
  - `cliente_resumen`
  - `registrar_visita_cliente`
  - `responder_nps_cliente`
  - `registrar_accion_resena_cliente`
  - `crear_pedido_cliente`
- Se creo tenant demo premium:
  - URL: `https://menu.rovicrm.com/menu.html?n=demo-premium`
  - Features premium activadas.
  - Beneficios, canales de resena y productos demo.
- Se actualizo el frontend vivo en `/var/www/menuvibes`.
- Se inicializo git local en `MenuVibes`.

## Que ya se puede demostrar

1. Menu publico responsive con branding por negocio.
2. Secciones, productos, fotos, promociones, WhatsApp y WiFi.
3. Dashboard para editar contenido sin tocar codigo.
4. Negocios publicados vs borrador.
5. Lealtad basica por pedidos.
6. Premium:
   - registrar visita,
   - responder NPS,
   - sugerir resena si el cliente esta satisfecho,
   - configurar beneficios y canales desde dashboard.

## Posicionamiento recomendado

MenuVibes no debe venderse solo como "menu digital". Eso lo vuelve commodity.
Debe venderse como:

> Un menu digital administrable que convierte visitas en pedidos, datos,
> reseñas y clientes recurrentes.

## Segmentos prioritarios

- Restaurantes con mucha atencion por WhatsApp.
- Cafeterias con clientes recurrentes.
- Bares o beach clubs con cambios frecuentes de menu.
- Negocios turisticos que dependen de Google Maps y Tripadvisor.
- Restaurantes que ya pagan comisiones altas a apps.
- Negocios con menu en PDF, imagen vieja o link desactualizado.

## Riesgos comerciales

- No prometer "reseñas positivas". El flujo premium incentiva participacion y
  salida al canal, no opiniones positivas.
- No prometer automatizacion total todavia. La demo se puede crear rapido, pero
  el pipeline de scraping sigue como etapa siguiente.
- En clientes grandes, falta rate limiting/autenticacion robusta para alto
  volumen. Para pilotos y clientes chicos/medianos, el flujo RPC ya paso smoke
  test.

## Mensaje comercial central

MenuVibes ayuda a que el negocio deje de mandar PDFs, deje de perder pedidos por
menus desactualizados y empiece a medir visitas, satisfaccion y reputacion desde
el mismo QR del menu.

