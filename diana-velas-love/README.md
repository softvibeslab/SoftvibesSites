# Diana Velas Love — análisis, catálogo y CMS

Micrositio para `@diana_velas_love`, adaptado del template operativo de Softvibes:
investigación pública → análisis → landing/catalogo → CMS → QA.

## Rutas

- `/` — landing de conversión con catálogo filtrable y CTA de WhatsApp por artículo.
- `/analisis/` — diagnóstico estratégico de la presencia pública, marcado `noindex`.
- `/admin/` — acceso al CMS PHP.
- `/admin/editor.php` — editor de marca, contacto, productos, FAQ y SEO.

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm test
```

Astro genera el sitio estático en `dist/`. Los archivos PHP de `public/admin/` se
copian al build para hosting Apache/PHP. La landing incorpora el JSON al compilar y
vuelve a leer `/data/site-content.json` en el navegador, de modo que los cambios del
CMS se muestran sin recompilar. Para reflejar cambios de SEO en el HTML inicial se
recomienda volver a construir.

## Configurar WhatsApp

La investigación no encontró un número público verificable. Mientras
`contact.whatsappNumber` esté vacío, los botones abren el selector de WhatsApp con el
mensaje precargado, pero **no están dirigidos a la vendedora**. Configura en el CMS el
número real con código de país y solo dígitos, por ejemplo `529841234567`, antes de
publicar.

Cada producto usa un mensaje propio que pide precio, tamaño, aroma y disponibilidad;
ninguno de esos datos se inventó desde las imágenes.

## Configurar el CMS

El despliegue temporal usa el usuario `diana_admin` y un hash bcrypt de coste 12 en
`public/admin/config.php`, porque el PHP de este hosting no hereda las variables
`SetEnv` de Apache. La contraseña en texto claro no forma parte del proyecto ni del
despliegue: está guardada en el Llavero de macOS con el servicio
`Softvibes Diana Velas Love CMS` y la cuenta `diana_admin`.

En un entorno con gestor de secretos, `DIANA_CMS_USER` y
`DIANA_CMS_PASSWORD_HASH` pueden sobrescribir esos valores mediante variables de
entorno. Para rotar la clave, genera otro hash bcrypt con PHP 8+ y actualiza el
fallback protegido antes de reconstruir.

## Investigación y trazabilidad

- Actor útil: `apify/instagram-scraper`.
- Run: `BaheKltSHnsP6Rh7e` — https://console.apify.com/view/runs/BaheKltSHnsP6Rh7e
- Dataset: `Nb6817j2SMT1QKxfh` — https://console.apify.com/storage/datasets/Nb6817j2SMT1QKxfh
- Muestra observada: 26 publicaciones del perfil, todas videos, entre el 24 de marzo y
  el 2 de agosto de 2026.
- Cargo del run útil: US$0.0675 por 25 eventos facturados. El dataset expuso 26 items
  al hacer la lectura final.
- Los Actors especializados de perfil y posts devolvieron cero items y costo cero.

La ficha mínima (nombre público, bio, conteos y foto) se contrastó después con el
endpoint web público de Instagram porque los Actors de perfil no entregaron datos.
Consulta `docs/RESEARCH.md` y el dataset limpio en `data/`.

## Despliegue temporal en Hostinger

Publicado el 5 de agosto de 2026 en un dominio gratuito aislado:

- Landing: <https://saddlebrown-fox-562614.hostingersite.com/>
- Análisis: <https://saddlebrown-fox-562614.hostingersite.com/analisis/>
- CMS: <https://saddlebrown-fox-562614.hostingersite.com/admin/>

El sitio usa PHP 8.3.31. Landing, análisis, CMS, JSON e imágenes respondieron HTTPS
200; los filtros, CTA por producto, `noindex`, consola y responsive también se
probaron contra el dominio público. El acceso del CMS está configurado con contraseña
aleatoria fuerte; en el servidor solo se despliega su hash bcrypt.

## Límites del prototipo

- No hay acceso a Insights, pedidos, mensajes, ventas, clientes ni historial de stock.
- WhatsApp, precios, aromas, ingredientes, tamaños, tiempos, entregas y políticas están
  pendientes de confirmación.
- El jabón íntimo observado no se incluyó en el catálogo: requiere composición,
  advertencias, uso previsto y revisión comercial antes de ofrecerse.
- Las imágenes proceden del perfil público y se incluyen solo para revisión local.
  Confirma derechos de uso antes de desplegar.
- La demo temporal está publicada, pero no está conectada a un número de terceros ni
  debe tratarse como tienda de producción.

Revisa `docs/LAUNCH-CHECKLIST.md` antes de publicar.
