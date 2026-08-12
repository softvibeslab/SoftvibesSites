# Kit completo de ventas MenuVibes

Este kit convierte lo ultimo desarrollado en `whitelabel/` en material comercial
listo para prospectar restaurantes, cafeterias, bares, food trucks y negocios
locales con menu.

## Estado del producto que se puede vender

- CMS multi-tenant: un solo dashboard administra varios negocios.
- Menu publico por slug: `menu.html?n=<slug>`.
- Negocios en `borrador` ya no aparecen en el menu publico.
- RLS/Storage endurecido para el uso actual.
- Prospectos fuera del directorio publico.
- Modulos premium implementados: fidelizacion por visitas, NPS por visita y
  salidas a Google Maps / Tripadvisor / redes.
- Smoke test final documentado: `localito` con 25 OK / 0 FAIL y `demo-premium`
  con 31 OK / 0 FAIL.
- Demo premium viva: `https://menu.rovicrm.com/menu.html?n=demo-premium`.
- Dashboard vivo: `https://menu.rovicrm.com/dashboard.html`.

## Carpetas

| Carpeta | Uso |
|---|---|
| `index.html` | Dashboard interactivo del kit completo de ventas. |
| `00-analisis/` | Resumen del proyecto, whitelabel y ultimo desarrollo para alinear ventas. |
| `01-pitch/` | Guion maestro, llamada/visita, objeciones y calculadora de valor. |
| `02-landing/` | Landing HTML responsiva con demos vivas embebidas. |
| `03-emails/` | Secuencia HTML de 3 emails. |
| `04-lead-magnets/` | Guia PDF/MD, calculadora y mini-auditoria. |
| `05-ia/` | Prompts para imagenes IA y creativos. |
| `06-redes/` | Calendario de publicaciones, stories y reels. |

## Recomendacion de uso comercial

1. Elegir 20 prospectos locales con menu viejo, PDF, imagen borrosa o solo
   WhatsApp/Instagram.
2. Armarles demo con slug en borrador.
3. Mandar primer contacto con la frase: "Te arme una demo de como podria verse
   tu menu digital".
4. En la llamada, mostrar primero el menu del prospecto y despues el dashboard.
5. Si el prospecto pregunta por precio, usar la calculadora de comisiones y
   presentar 3 niveles: Basico, Pro y Premium.
6. Reservar el modulo premium para negocios que quieren retener clientes,
   medir satisfaccion y mejorar reputacion.

## Variables que conviene editar antes de publicar

- Numero de WhatsApp de ventas en `02-landing/landing.html`.
- Precios sugeridos si cambian.
- Logos/imagenes reales de MenuVibes.
- Testimonios reales cuando haya clientes pagos.
