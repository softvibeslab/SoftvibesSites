# Verificación de la entrega

- 574 variantes de skills, 548 nombres distintos (incluye 3 skills de coordinación propias).
- Perfil web: 40 skills; perfil all: una variante preferida por cada nombre.
- Catálogo, perfiles y recursos comprobados mediante SHA-256.
- Ocho pruebas automatizadas: integridad; instalación/repetición/traslado; protección de
  conflictos; instalación completa; ZIP reproducible y extracción; rechazo de alteraciones y
  `.env`; rechazo de destinos simbólicos o inicialización no vacía; rutas fuera del paquete.
- Plugin y tres skills propias aprobados por los validadores de plugin-creator y skill-creator.
  PyYAML se utilizó en un entorno temporal únicamente para esos validadores; no es dependencia
  del instalador entregado.
- Revisión de exportación: no se copiaron proyectos de clientes; no hay coincidencias de sus
  identificadores del catálogo original ni del usuario local en el contenido textual exportado.
- Escaneo de patrones de credenciales: las coincidencias revisadas corresponden a ejemplos
  y fixtures de detección de secretos de terceros. Se conservan para no romper esas pruebas.
- Los entornos `.env`, cachés y metadatos de instalación locales se excluyeron. Las rutas y
  endpoints propios de las habilidades locales fueron generalizados.

Estas comprobaciones validan el paquete y la instalación. No certifican cada script externo,
no ejecutan integraciones de pago ni sustituyen las pruebas del sitio que construya el receptor.
El archivo `catalog/files.sha256.json` describe el snapshot que genera el ZIP.
