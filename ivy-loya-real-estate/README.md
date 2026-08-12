# Ivy Loya Real Estate — demo local

Micrositio bilingüe, análisis público y editor de contenido para `@ivyloyarealestate`, siguiendo el flujo operativo usado en Vivemar: investigación → análisis → landing → editor → QA.

## Rutas

- `/` — landing en español, con selector ES/EN.
- `/en/` — versión inglesa indexable.
- `/links/` — página compacta para la bio de Instagram.
- `/analisis/` — diagnóstico de presencia digital, marcado `noindex`.
- `/admin/` — acceso al CMS PHP.
- `/admin/editor.php` — editor visual, después de iniciar sesión.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

El build estático se genera en `dist/`; los archivos PHP de `public/admin/` se copian sin transformación para un hosting Apache/PHP, como Hostinger.

## Configurar el editor

El CMS no contiene contraseña predeterminada. Genera el hash en un entorno con PHP 8+:

```bash
php -r 'echo password_hash("UNA_CLAVE_UNICA", PASSWORD_DEFAULT), PHP_EOL;'
```

Después configura `IVY_CMS_USER` y `IVY_CMS_PASSWORD_HASH` en el hosting con el usuario elegido y el hash resultante.

En Hostinger estas variables deben configurarse con el mecanismo disponible en el plan. Si PHP/FPM no hereda variables de entorno, crea la configuración fuera de `public_html` y adapta `public/admin/config.php`; nunca subas una contraseña o token al repositorio.

El usuario y contraseña finales deben entregarse por un canal privado, no en documentación ni chat compartido.

## Límites y publicación

- Las imágenes proceden de perfiles públicos de Ivy/Golfia y se incluyen únicamente para el prototipo local. Confirma derechos de uso antes de publicar.
- Los proyectos mostrados provienen de publicaciones públicas. Precio, inventario, entrega, amenidades y condiciones deben validarse con Ivy antes del lanzamiento.
- No se publicaron testimonios, métricas de retorno ni licencias no verificadas.
- Falta confirmar dominio, WhatsApp, correo, aviso de privacidad definitivo y datos fiscales/comerciales.

Consulta [docs/RESEARCH.md](docs/RESEARCH.md) y [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) antes de desplegar.
