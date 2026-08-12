# Áurea Corporativa

Landing estática para **Áurea Corporativa — Recuperación y Activos**.

El inventario inicial incluye dos publicaciones públicas de Facebook Marketplace y ocho fotografías descargadas localmente para evitar depender de enlaces temporales de Facebook:

- KIA K3 2024 — `2243689233059384`
- Nissan Urvan LE 2024 — `1558581502663062`

Extracción de referencia: ejecución Apify `g26JhdIyZ7vXzZ8Tk`, dataset `0wpa4PhuUqxaQo5OK`.

## Embudo de recorrido

La experiencia toma como referencia el flujo inmobiliario de visita guiada de `colegios-875` y lo adapta a vehículos:

1. Recorrido visual por las fotografías exteriores e interiores.
2. Selección de la unidad desde el inventario.
3. Captura de nombre, WhatsApp, fecha y horario preferidos.
4. Preparación de una solicitud para enviarla en la publicación original de Marketplace.

Mientras no exista un WhatsApp oficial verificado de Áurea, la página no simula el envío del formulario. La persona copia su solicitud y abre el canal real de la publicación. Cuando se confirme el número oficial, este cierre puede cambiarse por un enlace directo de WhatsApp.

## Vista local

```bash
python3 -m http.server 4173
```

Abrir `http://localhost:4173`.

## Publicación

El proyecto no requiere compilación. Se pueden subir `index.html`, `styles.css`, `script.js` y `assets/` directamente al directorio público del hosting.

Antes de publicar:

- Conectar la agenda al WhatsApp oficial de atención cuando esté verificado.
- Agregar teléfono, correo y enlaces sociales verificados.
- Incorporar inventario aprobado con fotografías y datos reales.
- Cambiar la meta `robots` a `index, follow` cuando el contenido sea definitivo.

La carpeta `multimedia/` contiene un respaldo privado y no debe subirse al hosting.

## Despliegue temporal

- URL: <https://sienna-quetzal-133474.hostingersite.com/>
- Hosting: Hostinger Cloud, sitio estático.
- Estado: publicado y validado el 2026-08-07.
- Paquete: `auerea_20260807_222018.zip`.
- SHA-256: `2d5cca8a20e89bb3efc51e094c2f48287862893cab8a23255bb521108b5b8fb3`.
- Indexación: desactivada mediante `noindex, nofollow` hasta confirmar contacto e inventario definitivo.
- Validación: landing, CSS, JavaScript y ocho fotografías con HTTP 200; respaldo privado y ZIP de despliegue con HTTP 404; listado de directorios con HTTP 403.

La versión local contiene el nuevo embudo de “Agendar recorrido” y todavía no se ha sincronizado con este despliegue temporal.
