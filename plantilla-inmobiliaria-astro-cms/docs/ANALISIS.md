# Análisis y decisiones de la plantilla

## Objetivo

Extraer el patrón útil de un sitio inmobiliario estático con editor PHP y convertirlo en una base neutral que pueda replicarse sin mezclar marcas, medios, inventario o secretos entre clientes.

## Diagnóstico de la arquitectura de referencia

La solución de referencia combina dos modelos:

1. Astro compila landing, propiedades, zonas y blog como HTML estático.
2. Un panel PHP modifica elementos del HTML publicado mediante atributos `data-cms` y reemplazo de archivos de imagen.

El modelo ofrece buen rendimiento, SEO sencillo y compatibilidad con hosting compartido. Su tensión principal es que el HTML editado en producción no es la fuente de verdad: un nuevo build puede reemplazar los cambios. Además, crear nuevas propiedades o artículos requiere recompilar Astro.

## Decisión adoptada

La plantilla conserva un modelo híbrido, pero hace explícita la separación:

```text
Configuración + Markdown ── build Astro ──> HTML estático
                                              │
                                 CMS PHP ─────┤ copies, contacto, medios
                                              │
                     JSON estructurado <──────┘ propiedades y blog
                              │
                    importador Node
                              │
                              └──────────────> siguiente build Astro
```

Los cambios sencillos se publican inmediatamente. El contenido que afecta rutas, sitemap o datos estructurados vuelve al código fuente mediante exportación e importación. Así se evita duplicar el render de Astro en PHP y se conserva la calidad SEO.

## Límites del CMS

### Publicación inmediata

- Copies con identificadores `data-cms`.
- Teléfono, WhatsApp, agenda y correo visibles.
- Imágenes raster verificadas.
- Reaplicación después de despliegues.

### Publicación con build

- Altas, cambios y bajas de propiedades.
- Artículos del blog.
- Cambios de esquema o de rutas.
- Zonas SEO, que permanecen en TypeScript para conservar su contrato tipado.

## Seguridad incorporada

- Configuración local ignorada y separada del paquete.
- Contraseñas mediante `password_hash`/`password_verify`.
- Regeneración de sesión y cookies HttpOnly, SameSite y Secure bajo HTTPS.
- CSRF en todas las mutaciones desde el panel.
- Pausa de 15 minutos después de cinco intentos fallidos.
- Token de automatización independiente enviado mediante encabezado Bearer.
- Escrituras JSON atómicas mediante archivo temporal y `rename`.
- Papelera recuperable para contenido.
- Subidas limitadas por tamaño, MIME real y `getimagesize`.
- SVG bloqueado en subidas del CMS.
- Directorios sin listado y estado JSON protegido con `.htaccess`.

## Elementos deliberadamente excluidos

- Builds y dependencias instaladas.
- ZIP de despliegue.
- Fotografías y metadatos de redes del proyecto de referencia.
- Investigación, mensajes comerciales y entregables del cliente.
- Testimonios y cifras de rendimiento.
- Credenciales, hashes, tokens y configuración activa.
- Páginas experimentales ajenas a la arquitectura principal.

## Riesgos restantes

1. `mail()` depende de la configuración del hosting; debe probarse en destino.
2. La modificación de HTML mediante marcadores exige que cada `data-cms` permanezca único y estable.
3. El control de intentos usa archivos JSON y no sustituye un WAF o rate limiter del servidor.
4. La protección de `.htaccess` presupone Apache/LiteSpeed. En Nginx se deben replicar las reglas.
5. Los respaldos JSON no contienen binarios de medios.
6. El aviso de privacidad de muestra no es asesoría legal.

## Criterios de aceptación

- El proyecto compila desde una instalación limpia.
- Las colecciones fallan ante contenido inválido.
- No aparecen datos del cliente de referencia en `src/` o `public/`.
- El generador nunca sobrescribe un destino existente.
- El CMS no funciona mientras falte su configuración local.
- Las eliminaciones de contenido son recuperables.
- No existe una credencial válida dentro de la plantilla.
- Landing, catálogo y contenido funcionan en móvil y escritorio.
