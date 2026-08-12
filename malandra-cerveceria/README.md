# Malandra — landing y CMS

Primera versión local para la cervecería artesanal Malandra, construida con Astro y un CMS PHP/JSON compatible con hosting compartido.

## Estado

- Landing y CMS publicados en un dominio temporal de revisión.
- Dirección visual aprobada: opción híbrida E.
- URL temporal: `https://darkslateblue-okapi-933335.hostingersite.com/`.
- CMS: `https://darkslateblue-okapi-933335.hostingersite.com/admin/`.
- La publicación conserva `noindex,nofollow` y no debe considerarse lanzamiento de producción.
- No incluye precios, pedidos, reservas, dirección comercial, horarios, testimonios ni disponibilidad no confirmada.
- El avatar/logo de 320 × 320 px es temporal; se necesita el archivo maestro para producción.
- La versión actual integra 3 videos de elaboración y 8 fotografías proporcionados para la landing.

## Fuentes y decisiones

- Logo: `@cerveceria.malandra`, únicamente su avatar público.
- Información: publicaciones cerveceras de `@valle.malandra`.
- Plan: `LandingVibes/analysis/valle-malandra/PLAN.md`.
- Selección visual: `LandingVibes/analysis/valle-malandra/envato-template-review.json`.
- Selección multimedia: `docs/MEDIA-ANALYSIS.md`.

Las plantillas Fermentio, Lament y Heisberg son referencias visuales; no se descargó ni incorporó código o activos de sus paquetes.

## Desarrollo

```bash
npm install
npm run dev
npm test
npm run build
```

Astro genera el sitio en `dist/`. Los archivos del CMS se copian a `dist/admin/` y requieren PHP 8.1+ para ejecutarse.

## CMS

Rutas de hosting:

- `/admin/` — inicio de sesión.
- `/admin/editor.php` — editor de marca, hero, historia, textos multimedia, lotes, timeline, FAQ, CTA y SEO.

El CMS puede configurarse mediante estas variables del servidor:

```text
MALANDRA_CMS_USER
MALANDRA_CMS_PASSWORD_HASH
```

Genera un hash bcrypt o Argon2 con PHP:

```bash
php -r "echo password_hash('UNA_CLAVE_LARGA', PASSWORD_DEFAULT), PHP_EOL;"
```

Nunca guardes la contraseña en texto claro dentro del proyecto. Cada guardado conserva un respaldo del JSON anterior en `admin/storage/backups/`, protegido por `.htaccess`.

En hosting compartido también se admite un archivo de despliegue `admin/storage/credentials.php` con el usuario y únicamente el hash de la contraseña. La carpeta completa está bloqueada para acceso web y el archivo no se versiona. El despliegue temporal de Hostinger utiliza este mecanismo.

Los cambios editoriales se leen desde `/data/site-content.json` al cargar la landing. Para actualizar el HTML inicial y los metadatos SEO también se debe reconstruir el sitio.

## Publicación temporal

El sitio está desplegado en Hostinger con PHP 8.3. El detalle técnico y las comprobaciones están en `docs/DEPLOYMENT.md` y `qa/REPORT.md`.

## Antes de producción

Antes de publicar se requieren:

1. Logo original vectorial o transparente.
2. Confirmación del relato y los estados de cada lote.
3. Permiso para cualquier fotografía o video.
4. Canal de contacto y disponibilidad, si deben mostrarse.
5. Revisión de privacidad, cookies y avisos aplicables.
6. Credenciales CMS configuradas fuera del repositorio.
