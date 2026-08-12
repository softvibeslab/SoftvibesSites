# Vive Mar · Real Estate — Sitio web

Sitio estático (Astro) para Vive Mar Real Estate: landing de conversión, catálogo de
propiedades con filtros, páginas de zona para SEO local, blog y página `/links` que
reemplaza a Linktree.

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo en http://localhost:4321
npm run build    # genera el sitio en dist/
npm run preview  # previsualiza el build
```

## Estructura de contenido

- **Propiedades:** `src/content/propiedades/*.md`. Una propiedad = un archivo Markdown
  con frontmatter (título, precio, tipo, zona, m², imagen, formas de pago…). Las que
  tienen `ejemplo: true` son demostrativas — reemplazarlas con inventario real.
- **Blog:** `src/content/blog/*.md`.
- **Zonas SEO:** `src/data/zonas.ts` (Playa del Carmen, Cancún, Tulum, con FAQs y
  schema FAQPage).
- **Datos globales** (teléfono, Calendly, redes, mensajes de WhatsApp):
  `src/data/site.ts`.

## Pendientes antes de publicar

1. **Dominio:** el sitio asume `vivemarrealestate.com` (en `astro.config.mjs`).
2. **Correo del formulario:** editar `$destino` en `public/contact.php` con un buzón
   real creado en Hostinger. El formulario usa `mail()` de PHP (funciona en el hosting
   compartido de Hostinger; no funciona en `npm run preview`).
3. **GA4:** descomentar el bloque de Google Analytics en
   `src/layouts/BaseLayout.astro` y poner el ID real.
4. **Imágenes:** las fotos de propiedades, el logo y el retrato de Viridiana son reales
   (extraídos de su Instagram/TikTok/Linktree oficiales, ver `/tmp/vivemar-ig/` para las
   60 fotos descargadas). Solo `hero-caribe.jpg` y `parallax-mar.jpg` son de Unsplash —
   reemplazar idealmente con material propio de la marca (dron/playa).
5. **Testimonios:** los de la landing son de muestra; sustituir con reales.
6. **Calendly:** configurar al menos un tipo de evento público en
   calendly.com/vivemarrealestate para que el iframe de `/contacto` muestre agenda.
7. **Propiedades de ejemplo:** eliminar o reemplazar
   `departamento-cancun-ejemplo.md` y `casa-tulum-ejemplo.md`.

## Despliegue en Hostinger (hosting compartido)

1. `npm run build`
2. Subir el contenido de `dist/` (incluye `contact.php` copiado desde `public/`) a
   `public_html` del sitio addon `vivemarrealestate.com`, vía File Manager, FTP o la
   herramienta MCP `hosting_deployStaticWebsite`.
3. Activar SSL y forzar HTTPS en el panel de Hostinger.
4. Alta en Google Search Console y enviar `https://vivemarrealestate.com/sitemap-index.xml`.

## Fase 3 (siguiente)

- Actualizar las bios de Instagram/TikTok/Facebook/LinkedIn/Pinterest para apuntar a
  `vivemarrealestate.com/links` en lugar de Linktree.
- Google Business Profile con enlace al dominio.
