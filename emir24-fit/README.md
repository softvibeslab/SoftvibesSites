# Emir24 Fit — demo local

Micrositio para `@emir24.fit` construido con el flujo del template operativo:
investigación pública → análisis → landing → CMS → QA.

## Rutas

- `/` — landing de conversión para entrenamiento presencial y asesoría online.
- `/analisis/` — diagnóstico de presencia digital, marcado `noindex`.
- `/admin/` — acceso al CMS PHP.
- `/admin/editor.php` — editor de textos después de iniciar sesión.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Astro genera el sitio estático en `dist/`. Los archivos PHP de `public/admin/` se
copian al build para hosting Apache/PHP. El sitio incorpora el contenido inicial en
el HTML y vuelve a leer `/data/site-content.json` en el navegador; así, las ediciones
del CMS aparecen sin recompilar. Para reflejar cambios de SEO en el HTML inicial se
recomienda ejecutar un build nuevo.

## Configurar el CMS

No existe contraseña predeterminada. Genera un hash con PHP 8+:

```bash
php -r 'echo password_hash("UNA_CLAVE_UNICA", PASSWORD_DEFAULT), PHP_EOL;'
```

Configura `EMIR_CMS_USER` y `EMIR_CMS_PASSWORD_HASH` fuera de `public_html`. El
usuario y la contraseña finales deben entregarse por un canal privado.

## Límites del prototipo

- La investigación se limita al perfil público y 4 publicaciones obtenidas el 5 de
  agosto de 2026. No representa alcance, leads, ventas ni rendimiento histórico total.
- Precios, cupos vigentes, alcance de la guía alimentaria, credenciales, dominio y
  políticas comerciales deben confirmarse con Emir antes de publicar.
- Las imágenes proceden del perfil público y se incluyen solo para revisión local.
  Confirma derechos de uso y consentimiento antes de desplegar.
- La marca Smart Fit se menciona únicamente como lugar indicado por Emir; este demo no
  implica afiliación ni aprobación de Smart Fit.

Consulta `docs/RESEARCH.md` y `docs/LAUNCH-CHECKLIST.md` antes de publicar.

## Despliegue temporal en Hostinger

Publicado el 5 de agosto de 2026:

- Landing: <https://palegreen-marten-782084.hostingersite.com/>
- Análisis: <https://palegreen-marten-782084.hostingersite.com/analisis/>
- CMS: <https://palegreen-marten-782084.hostingersite.com/admin/>

El CMS está en línea y PHP funciona, pero el acceso permanece deshabilitado hasta
configurar `EMIR_CMS_USER` y `EMIR_CMS_PASSWORD_HASH` fuera del código público.
