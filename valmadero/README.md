# Val Madero · landing + CMS

Prototipo de marca personal inmobiliaria para Valeria Soto Madero, creado desde `plantilla-inmobiliaria-astro-cms` y orientado a Playa del Carmen, Tulum y Riviera Maya.

El sitio ya incluye landing, referencia inmobiliaria, páginas locales, blog, formulario, galería de videos y CMS PHP. La vista previa está desplegada en `https://lightcoral-heron-899450.hostingersite.com` y permanece fuera de indexación. **No está listo para producción**: el dominio definitivo, correo, teléfono, aviso de privacidad e inventario vigente están pendientes.

## Entregables

- Landing: `/`
- Diagnóstico no indexable: `/analisis/`
- Referencias inmobiliarias: `/propiedades/`
- Páginas de Playa del Carmen y Tulum
- Guía editorial y formulario de captación
- Página de enlaces para Instagram: `/links/`
- CMS PHP: `/admin/`
- Análisis completo: [`docs/ANALISIS-INSTAGRAM-Y-PROPUESTA.md`](docs/ANALISIS-INSTAGRAM-Y-PROPUESTA.md)
- Snapshot normalizado: [`docs/research/instagram-valmadero-2026-08-03.json`](docs/research/instagram-valmadero-2026-08-03.json)

## Fuente del análisis

Perfil público: `https://www.instagram.com/_valmadero`

- Actor: `apify/instagram-profile-scraper`
- Run: `IwBqusGIdbugwY6dN`
- Dataset: `9Ht8Q0LJdfjpIMt6S`
- Corte: 3 de agosto de 2026
- Muestra: 12 publicaciones públicas devueltas por el actor

La fotografía de perfil y siete videos fueron proporcionados para integrarlos al sitio y se optimizaron para web. El hero fue generado para el prototipo y está marcado como conceptual.

## Desarrollo

Requisitos: Node.js 22.12+; PHP 8.1+ para probar formulario y CMS.

```bash
npm install
npm run dev
npm test
```

Astro Dev no ejecuta PHP. El formulario y `/admin/` necesitan un servidor PHP o un hosting compatible después del build.

## Configurar el CMS

1. Copia el archivo de ejemplo:

   ```bash
   cp public/admin/config.example.php public/admin/config.local.php
   ```

2. Genera un hash de contraseña:

   ```bash
   php -r "echo password_hash('UNA_CLAVE_LARGA', PASSWORD_DEFAULT), PHP_EOL;"
   ```

3. Completa `config.local.php`:

   - `user`
   - `password_hash`
   - `state_token`, distinto de la contraseña
   - `contact_email`, que recibirá el formulario
   - límite de subida

4. No agregues `config.local.php` a Git. Ya está ignorado y protegido por `.htaccess`.

### Qué edita el CMS

- Publicación inmediata sobre el HTML desplegado: copies, enlaces/contacto e imágenes.
- Contenido estructurado: propiedades y artículos guardados como JSON.
- Operación: respaldos, restauración y papelera recuperable.

Para sincronizar un export del CMS con Astro:

```bash
npm run import:cms -- /ruta/cms-content-fecha.json
npm test
```

El importador crea o actualiza Markdown; no borra automáticamente contenido ausente del paquete.

## Pendientes antes de publicar

1. Sustituir el dominio temporal de Hostinger por el dominio definitivo en `.env`, `astro.config.mjs`, `src/config/site.ts` y `public/robots.txt`; después habilitar indexación.
2. Confirmar teléfono, correo, datos del responsable y aviso de privacidad.
3. Aclarar la relación comercial con Blestyum y las credenciales que pueden publicarse.
4. Sustituir referencias por inventario vigente, autorizado y fechado.
5. Probar login, copies, ajustes, medios, respaldo y envío real del formulario en HTTPS.

## Verificación

```bash
npm test
find public -name '*.php' -print0 | xargs -0 -n1 php -l
```

`npm test` valida contenido, parsea PHP, audita el proyecto, compila Astro y revisa rutas/enlaces del build.
