# Mónica Arteaga / DK del Karibe

Micrositio bilingüe de marca personal para Mónica Arteaga, en sinergia con DK del Karibe, con DK44 como campaña destacada y un diagnóstico completo de oportunidad digital.

## Rutas

- `/` - landing comercial ES/EN.
- `/analisis/` - diagnóstico visual e interactivo de oportunidad, marcado `noindex`.
- `/assets/BROCHURE-DK44.pdf` - brochure bilingüe usado como fuente primaria visual y de producto.

## Desarrollo local

No requiere dependencias ni proceso de build:

```bash
python3 -m http.server 4173 --directory monica-arteaga-dkdelkaribe
```

Después abre `http://127.0.0.1:4173/`.

Verificación mínima:

```bash
node --check script.js
node --check analisis/script.js
node tests/smoke.mjs
```

## Despliegue temporal

- URL: <https://skyblue-wren-617413.hostingersite.com/>
- Proveedor: Hostinger, sitio estático aislado.
- Actualizado: 9 de agosto de 2026.
- La ruta `/analisis/` permanece `noindex`.
- Este dominio es temporal; no sustituye todavía a `dkdelkaribe.com.mx`.

## Conversión

- Todos los CTA comerciales abren WhatsApp con un texto distinto según sección e idioma e identifican la landing personal.
- El formulario no almacena datos: compone el mensaje y lo entrega al usuario en WhatsApp.
- El formulario distingue DK44, otras preventas y rentas, además de presupuesto e intención.
- El prototipo emite eventos a `window.dataLayer`; falta conectar una plataforma analítica.
- El contacto configurado es `+52 984 179 9401`.

## Análisis interactivo

- Narrativa visual inspirada en la estructura de los análisis de Colegios 875 y Vive Mar, adaptada a DK del Karibe.
- Incluye arquitectura Mónica × DK, seis hallazgos desplegables, comparador Antes/Ahora, landing navegable dentro de un marco responsive, galería ampliable y ruta de publicación.
- Se agregaron seis renders oficiales del brochure: fachada frontal, recepción, coworking, gimnasio, rooftop aéreo y recámara.

## Límites de publicación

- Precio, inventario, fecha de entrega y planes de pago deben confirmarse con Mónica antes de publicar.
- Los renders proceden del brochure comercial público de DK44. Debe confirmarse la autorización de uso final.
- No se publican promesas de retorno, ocupación, plusvalía ni testimonios no verificados.
- Falta sustituir el aviso breve por el aviso de privacidad definitivo del responsable comercial.
- Falta validar biografía, fotografía profesional y reglas de convivencia visual entre la marca personal y DK del Karibe.

Consulta [ANALISIS.md](ANALISIS.md) antes de desplegar.
