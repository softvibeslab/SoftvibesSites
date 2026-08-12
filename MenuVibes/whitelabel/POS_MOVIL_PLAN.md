# MenuVibes POS Movil - Plan tipo SoftRestaurant

Fecha: 2026-07-18

## Objetivo

Convertir MenuVibes de menu QR whitelabel a un POS movil ligero para restaurantes
chicos y medianos: clientes piden desde QR, staff confirma, cocina prepara,
caja cobra/cierra corte y el dueno ve ventas basicas desde el celular.

La meta no es copiar SoftRestaurant completo desde el dia uno. La jugada es crear
un producto mas simple, movil-first y vendible rapido, usando la base actual de
MenuVibes: Supabase, multi-tenant, menu publico, dashboard, lealtad y flujo de
pedidos.

## Benchmark SoftRestaurant

Fuentes revisadas:

- SoftRestaurant oficial: https://softrestaurant.com/
- Comandero movil oficial: https://softrestaurant.com/addons/movil
- e-Delivery / e-Menu QR: https://softrestaurant.com/e-delivery
- Delivery Hub: https://softrestaurant.com/addons/delivery-hub
- Ficha/folleto historico con modulos: https://yosoyvendedor.com/source/e73023b0f7a95d8ea360597237718f4b/Documentos/folleto_softrestaurant8_versiones.pdf
- Distribuidor Doctor Pyme: https://softrestaurant.doctorpyme.mx/que-es-soft-restaurant

Capacidades clave observadas:

- Punto de venta para comedor, venta rapida, pickup/delivery y drive thru.
- Comandero movil Android para levantar comandas desde mesa y enviarlas a produccion.
- Monitor de cocina / produccion.
- Control de mesas, cuentas, comandas, cuentas divididas y cuentas por cobrar.
- Inventario, recetas, almacenes, ordenes de compra y reduccion de mermas.
- Reportes, KPIs, ventas en tiempo real, seguridad por perfiles y auditoria.
- Facturacion electronica en Mexico.
- Integraciones para apps de delivery y modulo QR/e-Delivery.
- Pagos/terminales en soluciones modernas.

## Estado actual de MenuVibes

Ya existe una base buena para el POS movil:

- `menu.html`: menu publico multi-tenant con `?n=<slug>`.
- `dashboard.html`: CMS con Supabase Auth para negocios, branding, productos,
  features, lealtad y ventas.
- `schema.sql`: RLS, RPCs, tablas premium, pedidos, staff, eventos y cortes.
- `mesero.html`: app movil inicial para staff con login, QR scanner,
  confirmacion de pedido y listado de pedidos activos.
- `MenuVibes-private/tools/smoke_test`: pruebas contra Supabase vivo.

Funciones ya presentes:

- Cliente puede crear pedido desde el menu via `crear_pedido_cliente`.
- Pedido de mesa queda en `pendiente_confirmacion` y genera codigo + token QR.
- Staff puede leer/confirmar QR via `leer_pedido_qr` y `confirmar_pedido_qr`.
- Dashboard puede cambiar estados: pendiente, confirmado, en preparacion, listo,
  entregado, cancelado.
- Dashboard ya calcula ventas, ticket promedio, top productos, cortes de caja y
  staff.

## Brechas para ser POS

Criticas para MVP:

1. PWA movil para staff con roles reales: mesero, cocina, cajero, manager.
2. Pantalla cocina separada con cola por estado y tiempos.
3. Pantalla caja separada para cobrar, metodo de pago y cerrar corte.
4. Mesas: catalogo de mesas, abrir cuenta, cambiar mesa, unir/dividir cuenta.
5. Realtime: suscripciones Supabase para nuevos pedidos y cambios de estado.
6. Notificaciones sonoras/visuales en cocina y caja.
7. Impresion basica: comanda/cuenta en navegador o Bluetooth/ESC-POS mas adelante.
8. Auditoria: registrar cancelaciones, descuentos, cambios de pago y usuario actor.
9. Endurecer rate limiting/auth para volumen.

Importantes post-MVP:

- Inventario por insumo y recetas.
- Insumos descontados por venta.
- Compras, proveedores y traspasos.
- Facturacion CFDI.
- Integracion con terminal de pago.
- Integraciones Uber Eats/Rappi/Didi o entrada manual de pedidos externos.
- Multi-sucursal.
- Offline-first robusto.

## Propuesta de producto

Nombre sugerido: MenuVibes POS Movil.

Formato inicial: PWA responsive instalada desde el navegador. Esto encaja con el
stack actual porque todo ya vive como HTML estatico + Supabase. Despues, si hay
traccion o necesidad de hardware, envolver en Capacitor para Android.

Vistas:

1. Cliente QR
   - Ver menu.
   - Elegir mesa, delivery o pickup.
   - Enviar pedido.
   - Ver QR/codigo de confirmacion.

2. Mesero
   - Ver pedidos de sus mesas.
   - Escanear QR.
   - Confirmar pedido.
   - Agregar items a cuenta abierta.
   - Solicitar cuenta.

3. Cocina
   - Ver comandas nuevas.
   - Cambiar a en preparacion.
   - Marcar listo.
   - Filtrar por area: cocina, barra, postres.

4. Caja
   - Ver cuentas listas/activas.
   - Aplicar descuento autorizado.
   - Cobrar efectivo, tarjeta o transferencia.
   - Marcar entregado/pagado.
   - Abrir/cerrar corte.

5. Manager
   - Ventas del dia.
   - Pedidos activos.
   - Staff activo.
   - Cortes y auditoria.

## Modelo de datos recomendado

Mantener tablas actuales y agregar:

```sql
mesas (
  id uuid primary key,
  negocio_id uuid references negocios(id),
  nombre text,
  zona text,
  capacidad int,
  estado text default 'libre',
  activo boolean default true,
  orden int default 0
);

cuentas (
  id uuid primary key,
  negocio_id uuid references negocios(id),
  mesa_id uuid references mesas(id),
  codigo text,
  cliente_nombre text,
  estado text default 'abierta',
  abierto_por uuid references auth.users(id),
  cerrado_por uuid references auth.users(id),
  subtotal int default 0,
  descuento int default 0,
  total int default 0,
  metodo_pago text,
  corte_id uuid references cortes_caja(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

pedido_items (
  id uuid primary key,
  negocio_id uuid references negocios(id),
  pedido_id uuid references pedidos(id),
  producto_id uuid references productos(id),
  nombre text,
  cantidad int default 1,
  precio_unitario int default 0,
  notas text,
  area text default 'cocina',
  estado text default 'pendiente'
);
```

Opcional: en vez de migrar todo a `pedido_items` desde el inicio, se puede seguir
usando `pedidos.items` JSONB para MVP y crear `pedido_items` en fase 2.

## Fases

### Fase 0 - Alinear base tecnica

- Agregar `popularidad_menu` al schema o quitar el RPC del frontend si no existe.
- Crear smoke tests para `mesero.html`, cambio de estado y cortes.
- Documentar estados permitidos del pedido.
- Revisar politicas RLS de staff para cocina/cajero.

Resultado: base actual sin huecos obvios antes de sumar POS.

### Fase 1 - POS movil PWA MVP

- Convertir `mesero.html` en `pos.html?n=<slug>`.
- Login staff y selector de vista segun rol.
- Tabs: Pedidos, Cocina, Caja, Corte.
- Realtime para pedidos activos.
- Acciones rapidas por estado.
- Vista de cocina con tiempos y sonido.
- Caja: metodo de pago, entregar, abrir/cerrar corte.

Resultado vendible: "menu QR + comandas + cocina + caja desde el celular".

### Fase 2 - Mesas y cuentas

- Tabla `mesas`.
- Mesa en QR: `?n=slug&m=12`.
- Cuenta abierta por mesa.
- Agregar productos a cuenta existente.
- Mover mesa, cerrar cuenta, historial.
- Division simple: pagar parcial por items o monto.

Resultado: operacion de comedor real.

### Fase 3 - Impresion y hardware

- Impresion web de comanda/cuenta.
- Plantillas de ticket 58/80mm.
- Conector local opcional para ESC/POS.
- Pruebas Android con navegador/PWA y luego Capacitor si hace falta Bluetooth.

Resultado: restaurantes con impresora pueden operar sin copiar manualmente.

### Fase 4 - Inventario ligero

- Insumos.
- Recetas por producto.
- Descuento de stock por pedido entregado.
- Alertas de minimo.
- Reporte de mermas basico.

Resultado: empieza a competir con el dolor fuerte de SoftRestaurant.

### Fase 5 - Facturacion/pagos/integraciones

- Pagos con terminal o link externo.
- CFDI via proveedor externo.
- Integracion delivery hub o entrada manual de pedidos de apps.
- Multi-sucursal.

Resultado: POS mas completo para restaurantes de mayor operacion.

## MVP de 2 semanas

Semana 1:

- Crear `pos.html` copiando/ordenando lo mejor de `mesero.html` y la seccion de
  ventas del dashboard.
- Realtime de pedidos.
- Vista cocina.
- Acciones estado: confirmar, preparar, listo, entregar, cancelar.
- Smoke test contra tenant demo.

Semana 2:

- Caja y corte movil.
- Staff por rol.
- Sonido/notificacion visual.
- Pulir mobile UX.
- Demo publica con `demo-premium`.
- Guion comercial: "soft POS desde QR, sin instalar Windows ni comprar servidor".

## Posicionamiento comercial

MenuVibes POS Movil debe venderse como:

> Un POS ligero en tu celular: menu QR, pedidos, cocina y caja sin comisiones por
> marketplace.

Clientes ideales:

- Cafeterias.
- Taquerias/fondas.
- Restaurantes chicos con WhatsApp y menu QR.
- Beach clubs o bares con menu cambiante.
- Negocios que no quieren instalar un POS Windows pesado.

No vender todavia como reemplazo total de SoftRestaurant para restaurantes con
inventario avanzado, facturacion fiscal, multiples almacenes o hardware complejo.

## Primer backlog tecnico

1. Crear `pos.html`.
2. Agregar/modificar SQL para RPC faltante `popularidad_menu`.
3. Agregar vista cocina.
4. Agregar vista caja movil.
5. Agregar realtime.
6. Agregar smoke test POS.
7. Crear tenant demo POS.
8. Documentar instalacion PWA en Android/iPhone.

