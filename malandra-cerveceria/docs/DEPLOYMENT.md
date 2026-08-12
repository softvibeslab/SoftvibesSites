# Despliegue temporal — Hostinger

**Fecha:** 2026-08-07  
**Estado:** publicado para revisión, con `noindex,nofollow`

## URLs

- Landing: `https://darkslateblue-okapi-933335.hostingersite.com/`
- CMS: `https://darkslateblue-okapi-933335.hostingersite.com/admin/`

## Entorno

- Hostinger Cloud Startup.
- Sitio PHP/HTML personalizado.
- PHP 8.3.31 observado en la respuesta del CMS.
- Canonical compilado con el dominio temporal.
- Actualización multimedia desplegada mediante el paquete `malandra-media-hostinger-20260807-v3.zip`.
- SHA-256 del paquete: `6717cd8b0e9a17c2c58df121ad6c4a32907832679793ec3f0d5756b14efedc9c`.

## Seguridad y limpieza

- El CMS conserva únicamente un hash de contraseña en `admin/storage/credentials.php`.
- `admin/storage/` responde HTTP 403.
- La página predeterminada y el ZIP de instalación se movieron fuera de `public_html` a `malandra-deploy-backup-20260807/` para conservar una recuperación sin exposición pública.
- No se activó CDN ni se creó una API key nueva.
- El ZIP de despliegue no se publica dentro de `public_html` y responde HTTP 404.
- El 2026-08-07 se rotó el acceso único del CMS y se verificó el nuevo login antes de entregar las credenciales por correo. La documentación no conserva usuario ni contraseña.

## Validación

- Landing, CMS y JSON editorial: HTTP 200.
- Ocho fotografías, tres videos y sus pósteres: HTTP 200.
- Login del CMS: aprobado.
- Sección multimedia del CMS: visible y operativa tras el login.
- Escritorio y móvil: aprobados sin errores de navegador ni overflow horizontal.
- Evidencia actual: `qa/deployed-media-desktop.png` y `qa/deployed-media-mobile.png`.
