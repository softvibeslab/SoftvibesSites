# Análisis de @_valmadero y propuesta digital

Fecha de corte: 3 de agosto de 2026.

## Alcance y fuente

Se analizó el perfil público `https://www.instagram.com/_valmadero` mediante `apify/instagram-profile-scraper`.

- Run de Apify: `IwBqusGIdbugwY6dN`
- Dataset: `9Ht8Q0LJdfjpIMt6S`
- Perfil devuelto: Valeria Soto Madero, categoría `Real Estate Agent`
- Muestra: 12 publicaciones entregadas por el actor, fechadas entre julio de 2025 y junio de 2026

Las métricas son una fotografía de datos públicos. No incluyen alcance, guardados, compartidos, mensajes, leads, inversión publicitaria ni cierres.

## Foto del perfil

| Señal | Resultado |
| --- | ---: |
| Seguidores | 6,547 |
| Seguidos | 2,712 |
| Publicaciones del perfil | 66 |
| Highlights | 37 |
| Reels en la muestra | 10 de 12 |
| Carruseles en la muestra | 2 de 12 |
| Promedio de me gusta | 119.9 |
| Mediana de me gusta | 71.5 |
| Promedio de comentarios | 1.5 |
| Promedio de vistas en los 10 videos | 1,314.8 |
| Interacción proxy promedio | 1.85% |

La interacción proxy es `(me gusta + comentarios) / seguidores`; sirve para comparar esta muestra, no como tasa oficial de Instagram.

## Hallazgo central

La muestra se divide en ocho piezas inmobiliarias y cuatro personales o de estilo de vida.

- Contenido inmobiliario: 58.9 me gusta promedio.
- Contenido personal: 242 me gusta promedio.
- El contenido personal genera aproximadamente 4.1 veces más me gusta en esta muestra.

Esto no significa que el contenido inmobiliario deba desaparecer. Indica que la experiencia personal es el mejor gancho y que la educación inmobiliaria debe funcionar como puente hacia la conversación comercial.

### Lectura comercial del hallazgo

El dato de 4.1 veces más `likes` no demuestra que el contenido personal produzca más ventas. Sí permite formular una hipótesis de recorrido:

1. La vida personal y el arraigo en Playa del Carmen generan atención y afinidad.
2. La educación inmobiliaria convierte esa afinidad en preguntas concretas.
3. Las referencias de producto ayudan a reconocer preferencias y presupuesto.
4. El sitio conserva el contexto y lleva a una conversación con una intención definida.

La medición que falta para validar la hipótesis es: visita al sitio → clic en intención → clic en WhatsApp → conversación útil → oportunidad calificada.

## Posicionamiento observable

La marca combina tres territorios:

1. Vida personal en Playa del Carmen y el Caribe.
2. Educación: crédito, enganche, gastos, Airbnb y decisión de compra.
3. Producto: casas, departamentos, lotes y villas en Playa del Carmen y Tulum.

La promesa que mejor ordena esos territorios es: **“Tu siguiente paso en Riviera Maya, explicado claro.”**

## Fortalezas

- Voz cercana y reconocible.
- Arraigo personal en Playa del Carmen.
- Buen uso de video corto.
- Temas útiles para compradores primerizos e inversionistas.
- Canal de WhatsApp visible desde la biografía.

## Brechas y riesgos

- El siguiente paso cambia entre comentar una palabra, enviar DM y abrir WhatsApp.
- Las publicaciones de propiedad pueden quedar desactualizadas; el sitio debe mostrar fecha y estado de verificación.
- Mensualidades, financiamiento y plusvalía requieren contexto y validación individual.
- Falta confirmar dominio, correo, teléfono, fotografía autorizada, identidad legal y aviso de privacidad.
- Conviene corregir “Rivera Maya” a “Riviera Maya” en la biografía.
- Debe aclararse la relación de la marca personal con `@blestyum_realestate_`.

## Fugas del recorrido actual

### 1. El siguiente paso cambia entre publicaciones

Comentar una palabra, enviar mensaje directo o abrir WhatsApp son acciones válidas, pero fragmentan el contexto. El prospecto debe recordar la publicación y volver a explicar qué busca.

**Respuesta aplicada:** un canal principal de conversación, precedido por tres rutas de intención: vivir, invertir o entender crédito y presupuesto.

### 2. Las referencias inmobiliarias pierden vigencia

Instagram conserva una publicación aunque precio, disponibilidad, superficie o financiamiento hayan cambiado.

**Respuesta aplicada:** cada referencia del sitio distingue demostración y vigencia, conserva fuente y fecha, y puede actualizarse o retirarse desde el CMS.

### 3. El servicio completo no se ve en un solo lugar

Las publicaciones resuelven dudas puntuales, pero no explican de forma continua qué recibe una persona después del primer mensaje.

**Respuesta aplicada:** el acompañamiento se presenta como una ruta simple: escuchar, filtrar y decidir con contexto.

### 4. La infraestructura oficial sigue incompleta

El prototipo funciona, pero no debe indexarse como sitio oficial hasta confirmar dominio, correo receptor, teléfono, responsable de privacidad, relación comercial y analítica.

**Estado:** pendiente antes de producción.

## Arquitectura editorial propuesta

| Territorio | Función | Puente al sitio |
| --- | --- | --- |
| Vida en el Caribe | Atracción y afinidad | Historia de Val, ubicación y estilo de acompañamiento |
| Educación inmobiliaria | Consideración | Guías sobre crédito, enganche, gastos, Airbnb y criterios de compra |
| Producto y oportunidad | Conversión | Referencias fechadas, estado de verificación y llamada a conversación |

La mezcla no necesita ser rígida. La regla operativa es que cada publicación identifique su función y conduzca a un siguiente paso coherente.

## Decisiones aplicadas en la landing

- El hero vende una decisión de vida, no una propiedad específica.
- Tres rutas segmentan la intención: vivir, invertir o entender crédito/presupuesto.
- El proceso tiene tres pasos: escuchar, filtrar y decidir con contexto.
- Una referencia pública demuestra el flujo, pero aparece como “Por verificar”.
- La página conecta contenido personal, educación y WhatsApp.
- El hero sigue siendo conceptual y no representa inventario disponible.
- El retrato y siete videos fueron proporcionados para la landing; se optimizaron para web y se muestran como activos autorizados.
- La galería de video no reproduce automáticamente y detiene la pieza anterior al iniciar otra.

## Sistema digital construido

- Landing de posicionamiento y captación.
- Galería responsive con siete videos y miniaturas locales.
- Catálogo de referencias con estado, fuente y fecha.
- Páginas de zona para Playa del Carmen y Tulum.
- Guías editoriales para dudas frecuentes.
- Página `/links/` como punto de entrada desde redes.
- Formulario y llamadas a WhatsApp.
- CMS PHP para contenido, medios, respaldos y recuperación.
- Diagnóstico `/analisis/` no indexable con recorrido interactivo del sitio.

## Hoja de activación

### Fase 1 — Confirmar

1. Definir dominio, correo y teléfono oficiales.
2. Completar responsable y texto de privacidad.
3. Aclarar la relación pública con Blestyum.
4. Aprobar promesas, credenciales y datos que pueden mostrarse.

### Fase 2 — Operar

1. Cargar únicamente inventario vigente y autorizado.
2. Asignar fecha, fuente y responsable de validación.
3. Probar formulario, login, respaldos y restauración.
4. Definir responsable y frecuencia de actualización.

### Fase 3 — Activar y medir

1. Conectar el dominio y actualizar la biografía de Instagram.
2. Habilitar Search Console y analítica de conversiones.
3. Medir visitas, selección de intención, clics en WhatsApp y contactos útiles.
4. Revisar mensualmente qué combinación de contenido produce conversaciones calificadas.

## CMS y operación

El CMS permite editar copies, datos de contacto, medios, propiedades, artículos y respaldos. El contenido estructurado se exporta a JSON y se sincroniza con Astro antes de recompilar.

Antes de publicar:

1. Configurar `public/admin/config.local.php` con credenciales y correo receptor.
2. Sustituir dominio `.example`, correo y aviso de privacidad; confirmar que los medios proporcionados pueden permanecer publicados.
3. Cargar únicamente inventario vigente, autorizado y fechado.
4. Ejecutar `npm test` después de cada importación del CMS.
