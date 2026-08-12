# Tania G.O. · Micrositio inmobiliario bilingüe

Micrositio personal con 16 publicaciones de renta y venta, filtros, fichas en modal y mensajes contextuales de WhatsApp.

## Despliegue temporal

- Hostinger: <https://ghostwhite-marten-731354.hostingersite.com/>
- Análisis: <https://ghostwhite-marten-731354.hostingersite.com/analisis/>
- Publicado el 9 de agosto de 2026.

## Fuentes y criterios

- CSV entregado: `data/tania-go-inventario-publicado-2026-08-06.csv`.
- Diez rentas publicadas el 5 de agosto de 2026 y seis ventas publicadas el 6 de agosto de 2026.
- Fotografías seleccionadas de subcarpetas públicas de Drive verificadas por nombre de propiedad.
- El CSV fechado prevalece sobre precios escritos en títulos de carpetas de Drive.
- Las ventas sin material enlazado usan un placeholder, no una imagen atribuida por suposición.
- Precio, unidad, vigencia, disponibilidad, condiciones y superficies deben confirmarse directamente.
- Los formularios no almacenan datos; preparan mensajes para WhatsApp.

## Verificación mínima

```sh
node --check script.js
node --check analisis/script.js
node tests/smoke.mjs
```

El sitio es estático y no requiere build ni dependencias.
