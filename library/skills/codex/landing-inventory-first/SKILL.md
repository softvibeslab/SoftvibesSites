---
name: landing-inventory-first
description: Antes de crear cualquier nueva landing, sitio comercial, micrositio o página de captación para Softvibes, actualiza el inventario de proyectos y analiza el nicho de cada item. Si el nicho ya fue desarrollado, usa una landing existente como base; si es nuevo, investiga plantillas en Envato. Aplica antes de las skills de diseño o implementación, incluso si el usuario no menciona el inventario. No exige repetir el proceso para correcciones menores de una landing existente.
---

# Inventario primero para nuevas landings

## Regla de decisión

Antes de escribir copy, diseñar o implementar una nueva landing, revisa el inventario actual y clasifica cada proyecto por nicho. El resultado decide la base:

- **Nicho ya desarrollado:** toma como base una landing existente de ese nicho y adapta su estructura y componentes al nuevo cliente.
- **Nicho nuevo:** investiga plantillas actuales en Envato y elige una referencia adecuada antes de implementar.
- **Cobertura o nicho inciertos:** completa la revisión; no interpretes falta de documentación como prueba de que el nicho es nuevo.

Esta skill determina la base del trabajo; las skills de diseño e implementación se aplican después. Respeta una elección explícita del usuario sobre la base o la plantilla y registra esa excepción, sin omitir el inventario.

## 1. Actualizar el inventario

Workspace habitual: `${WORKSPACE}`. Si el usuario trabaja en otro workspace, usa el indicado y las referencias de proyectos que haya autorizado; no busques indiscriminadamente en su equipo.

1. Lee las instrucciones locales, `index.html` y `PROMPT-TELEGRAM.md`, si existen.
2. Contrasta el catálogo con las carpetas y archivos fuente reales mediante `rg --files` y listados dirigidos. No dependas de una cantidad histórica de proyectos ni de una lista fija de clientes. Ten en cuenta que Git puede ignorar proyectos locales: comprueba también las carpetas inmediatas y las colecciones de clientes o sitios.
3. Excluye dependencias, builds, ZIP, respaldos de despliegue, archivos multimedia privados y repositorios externos de herramientas. Agrupa copias y variantes bajo el mismo proyecto; conserva las rutas de variantes relevantes. Los productos distintos dentro de una colección merecen entradas propias.
4. Para **cada item**, revisa evidencia suficiente para identificar qué se desarrolló: portada fuente, título y oferta, análisis asociado y documentación breve. No leas datos privados ni configuración de secretos para clasificar un nicho. Los README pueden conservar nombres de una plantilla anterior: contrástalos con el contenido real. No deduzcas el sector solo del nombre de la carpeta.
5. Registra una fila por proyecto con: nombre, ruta, nicho/subnicho, oferta o audiencia, conversión principal, landing existente, análisis disponible, stack, variantes y evidencia de clasificación. Marca las entradas sin landing como análisis, idea o herramienta; no cuentan como nicho previamente implementado por sí solas.

La revisión de otros clientes es de solo lectura y se limita a inventario y evaluación de bases. Una página existente no implica que esté publicada, probada ni lista para producción.

## 2. Comparar el nuevo nicho con cada item

Define el nicho y subnicho del encargo a partir de su oferta, audiencia y acción de conversión. Usa el contexto disponible; pregunta solo cuando falte un dato que cambie la elección de base.

Añade a cada fila una clasificación respecto del nuevo encargo:

- **Mismo nicho:** actividad y oferta comparables; candidato obligatorio a reutilización.
- **Relacionado:** comparte patrones útiles, pero no demuestra que el nicho ya esté desarrollado.
- **Distinto:** no es candidato para la base específica del nicho.
- **Sin evidencia suficiente:** requiere una lectura adicional o debe quedar como limitación explícita.

Justifica cada clasificación brevemente. No equipares nichos solo por similitud visual: una clínica y un gimnasio no son el mismo nicho por pertenecer al bienestar. Entre proyectos del mismo nicho, usa subnicho, audiencia y conversión para elegir el más adecuado.

## 3A. Si el nicho ya existe: reutilizar

Compara los candidatos por adecuación al encargo, calidad del código, experiencia móvil, flujo de conversión, mantenimiento y compatibilidad del stack. No elijas únicamente el más reciente ni el primero del catálogo.

Lee README, AGENTS, CLAUDE y package.json del candidato, cuando existan, y revisa su estado Git antes de copiar o adaptar. Identifica las variantes sin asumir que una carpeta llamada `final` es la versión canónica.

Usa como base sus componentes, estructura y patrones útiles en la carpeta del nuevo proyecto. Si existe un generador o plantilla saneada que conserve esa arquitectura, úsalo. Copia selectivamente; nunca clones a ciegas la carpeta completa de otro cliente.

Reemplaza identidad, textos, imágenes, inventario, testimonios, contactos, dominios, metadatos y datos estructurados. No transfieras credenciales, leads, identificadores de analítica ni configuración privada. Conserva intacto el proyecto fuente.

Si el código no es compatible, adapta la estructura y el flujo de la landing existente al stack requerido y documenta el motivo. No clasifiques el nicho como nuevo por un problema técnico ni busques una base nueva en Envato por defecto cuando ya existe una aplicable.

## 3B. Si el nicho es nuevo: investigar Envato

Busca en la web y abre fichas oficiales actuales de **Envato Elements** o **ThemeForest**, usando el nicho, la oferta y el stack como términos de búsqueda. Si necesitas un navegador interactivo, usa la skill de navegador disponible según sus instrucciones.

Compara una selección breve de candidatos reales —preferentemente tres si hay opciones pertinentes— e inspecciona sus fichas y demos accesibles. Registra para cada uno:

- Nombre, URL oficial y fecha de consulta.
- Nicho, tipo de producto y stack: HTML, WordPress, kit de Elementor, etc.
- Secciones, experiencia móvil y flujo de conversión útiles para el encargo.
- Dependencias, compatibilidad y condiciones de licencia verificables en la ficha.
- Motivo para elegirlo o descartarlo.

No presentes capturas, títulos de resultados o recuerdos de plantillas como una revisión completa de sus demos. Un kit de Elementor no equivale a una plantilla HTML o Astro. Diferencia **referencia visual/estructural** de **paquete que se incorporará al proyecto**.

Recomienda una base y continúa con el trabajo autorizado. Investigar Envato no autoriza compras: para incorporar un paquete comercial, verifica que el usuario lo haya proporcionado o que exista acceso y licencia adecuados. Solicita autorización solo si realmente se requiere un pago no autorizado. No copies código o activos protegidos de una demo como sustituto del paquete.

Si Envato no es accesible o no ofrece opciones pertinentes, documenta lo comprobado y la limitación. No inventes candidatos ni marques la investigación como completada. Continúa con tareas independientes y pide el dato o decisión necesarios antes de implementar con una base alternativa.

## 4. Dejar la decisión verificable

Antes de implementar, guarda en la documentación del nuevo proyecto un registro breve, por ejemplo `docs/inventario-previo.md`, con:

- Fecha, workspace revisado y límites de cobertura.
- Tabla completa de proyectos con nicho y comparación frente al encargo.
- Nicho del encargo y conclusión: existente, nuevo o pendiente de determinar.
- Base elegida, ruta o enlace, evidencia y motivos.
- Si corresponde, candidatos Envato y resultado de la investigación.

El registro contiene metadatos técnicos y clasificación, no información comercial privada de otros clientes, y debe permanecer fuera de los archivos públicos del sitio. Si solo se pidió una propuesta y no crear archivos, entrega este registro en la respuesta.

Comunica en pocas líneas qué base usarás y por qué, y continúa sin pedir confirmación de rutina. Una vez creada la landing, verifica que no queden datos del cliente fuente, comprueba el flujo principal y actualiza el catálogo operativo existente con el nuevo proyecto y su nicho, sin cambiar estados ajenos. Así podrá reutilizarse en el siguiente encargo.
