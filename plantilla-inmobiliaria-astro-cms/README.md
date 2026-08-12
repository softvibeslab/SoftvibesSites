# Plantilla inmobiliaria · Astro + CMS PHP

Base reutilizable para crear sitios inmobiliarios con landing de conversión, catálogo, fichas, zonas SEO, blog, formulario y un CMS plano compatible con hosting PHP compartido.

La plantilla contiene únicamente marca, imágenes y contenido demostrativos. No incluye medios, testimonios, credenciales ni inventario del proyecto utilizado como referencia.

## Qué incluye

- Landing modular y responsive.
- Catálogo con filtros por tipo, zona y precio.
- Fichas de propiedad con Schema.org.
- Páginas locales de zona con FAQPage.
- Blog con BlogPosting.
- Página de enlaces, contacto, privacidad, gracias y error 404.
- Formulario PHP con validación, honeypot y consentimiento.
- CMS PHP para copies, contacto, medios, propiedades, blog y respaldos.
- Generador para clonar la plantilla sin modificar el original.
- Auditoría para detectar datos del cliente de referencia o configuración local.

## Requisitos

- Node.js 22.12 o posterior para desarrollo y build.
- Hosting Apache/PHP 8.1 o posterior para formulario y CMS.
- Extensiones PHP `fileinfo`, `json`, `mbstring` y `session`.

## Desarrollo

```bash
npm install
npm run dev
npm test
```

El servidor de Astro no ejecuta PHP. Para probar formulario y CMS se necesita un servidor PHP o el hosting de destino después de ejecutar el build.

## Crear un sitio nuevo

Desde esta carpeta:

```bash
npm run create-site -- \
  --target ../mi-inmobiliaria \
  --name "Mi Inmobiliaria" \
  --short "Mi Marca" \
  --domain https://www.ejemplo.com
```

El generador:

- se niega a sobrescribir carpetas existentes;
- omite dependencias, builds, estado local y credenciales;
- actualiza nombre, dominio y `package.json`;
- crea `.env` con `SITE_URL`.

## Personalización mínima

1. Edita `src/config/site.ts`: marca, contacto, asesor, redes y navegación.
2. Edita `src/config/landing.ts`: hero, argumentos y prueba social.
3. Edita `src/data/zonas.ts` con información local verificada.
4. Sustituye `public/img/demo/` por medios autorizados.
5. Reemplaza o elimina todo contenido con `demostracion: true`.
6. Revisa el aviso de privacidad con una persona competente para la jurisdicción aplicable.
7. Configura el correo y el CMS antes de desplegar.

## Contenido

Las colecciones se validan en `src/content.config.ts`.

```text
src/content/propiedades/*.md
src/content/blog/*.md
```

Un build falla si el frontmatter no cumple el esquema. Esto evita publicar fichas incompletas o con tipos inconsistentes.

## Configurar el CMS

1. Copia el archivo de ejemplo:

   ```bash
   cp public/admin/config.example.php public/admin/config.local.php
   ```

2. Genera un hash de contraseña en una máquina con PHP:

   ```bash
   php -r "echo password_hash('UNA_CLAVE_LARGA', PASSWORD_DEFAULT), PHP_EOL;"
   ```

3. Completa en `config.local.php`:

   - `user`;
   - `password_hash`;
   - `state_token`, con un token aleatorio independiente;
   - `contact_email`;
   - límite de subida.

4. No agregues `config.local.php` a Git. El archivo está incluido en `.gitignore` y protegido por `.htaccess`.

5. Después de desplegar, abre `/admin/` mediante HTTPS.

### Alcance del CMS

Los cambios tienen dos comportamientos deliberadamente distintos:

- **Publicación inmediata:** copies marcados con `data-cms`, números de contacto, agenda e imágenes. El panel permite reaplicar copies y ajustes después de un despliegue.
- **Contenido estructurado:** propiedades y artículos se guardan como JSON. Se descargan, sincronizan con el código fuente y requieren un build para mantener páginas estáticas, sitemap y SEO consistentes.

Para sincronizar un JSON descargado:

```bash
npm run import:cms -- /ruta/cms-content-fecha.json
npm test
```

El importador crea o actualiza los Markdown presentes en el JSON. No borra automáticamente archivos fuente ausentes del paquete.

## Despliegue en hosting compartido

```bash
SITE_URL=https://www.ejemplo.com npm run build
```

Sube el contenido de `dist/` a `public_html`. Confirma que el servidor:

- ejecuta PHP 8.1+;
- respeta `.htaccess`;
- tiene HTTPS activo;
- permite escribir en `admin/storage/` e `img/` al usuario de PHP;
- puede enviar correo mediante `mail()` o sustituye `contact.php` por el proveedor elegido.

Antes de reemplazar una instalación existente, descarga un respaldo desde el CMS y conserva las imágenes del servidor. La API `admin/state.php` acepta únicamente `Authorization: Bearer <state_token>`; nunca usa la contraseña como token.

## Verificación

```bash
npm test
find public -name '*.php' -print0 | xargs -0 -n1 php -l
```

`npm test` incluye un parser PHP en Node para detectar errores de sintaxis sin depender del entorno local. El segundo comando usa el intérprete PHP real y sigue siendo obligatorio antes de desplegar.

Comprueba manualmente:

- navegación móvil;
- filtros del catálogo;
- ficha, zona y artículo;
- acceso y cierre de sesión del CMS;
- edición y reaplicación de copies;
- subida de JPG/PNG/WebP/GIF;
- exportación y restauración de respaldo;
- envío real del formulario en el hosting.

## Límites conocidos

- Astro Preview no ejecuta PHP.
- Los cambios instantáneos del CMS modifican el HTML desplegado; un nuevo despliegue puede reemplazarlos. Descarga un respaldo y usa “Reaplicar copies” después de publicar.
- Las imágenes no forman parte del JSON de respaldo: respáldalas desde el hosting.
- La configuración predeterminada usa datos ficticios y no está lista para producción.

La explicación de arquitectura y las decisiones tomadas están en [`docs/ANALISIS.md`](docs/ANALISIS.md).
