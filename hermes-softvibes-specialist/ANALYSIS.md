# Análisis y plan de transferencia

Fecha de corte: 2026-08-06. Este documento resume el workspace observado; no afirma que un sitio siga publicado o que un tercero haya autorizado cambios. Los estados externos se vuelven a comprobar antes de actuar.

## Resultado del inventario

- El workspace es una colección de repositorios y carpetas, no un monorepo.
- El registro clasifica 46 proyectos o activos: 20 clientes, 4 productos, 4 análisis, 4 herramientas externas, 3 archivos, 2 colecciones de clientes y 9 activos de otros tipos.
- `index.html` presenta 32 entradas. Hay 14 activos útiles que existen en disco o como subproyecto pero no están individualizados en ese catálogo visual.
- Se analizaron 1,153 archivos relevantes después de excluir dependencias, builds, cachés, binarios, medios, credenciales locales y repositorios externos vendorizados.
- El grafo de conocimiento contiene 1,756 nodos y 1,251 relaciones, sin relaciones colgantes tras reconciliar imports y retirar tres archivos locales sensibles del corpus.
- Hay 17 familias de ejecución y 9 workflows operativos ya identificados en MenuVibes, MoneyPrinter y Vive Mar.

La fotografía reproducible está en `project-registry.json`; `softvibes_context.py reconcile` compara el registro con `index.html`, el disco y el estado de Git.

El grafo detallado queda en `.ua/knowledge-graph.json` dentro del workspace. Es un índice de navegación, no una fuente con mayor precedencia que el código y las instrucciones actuales.

## Arquitectura real

El workspace tiene dos generaciones principales de sitios:

1. Sitios HTML/CSS/JavaScript/PHP hechos a medida, con entrypoints y flujos de formulario propios.
2. Sitios Astro con contenido estructurado y, en varios casos, un CMS PHP que escribe JSON para reimportarlo al código fuente.

Alrededor de ellos existen productos y herramientas con workflows propios:

- MenuVibes: plataforma multi-tenant; la unidad de aislamiento es `business_slug`.
- MenuVibes Private: operación comercial privada con gate de contacto.
- MoneyPrinterV2: generación, publicación cruzada y programación de contenido.
- Softvibes Flow: CRM/registro de proyectos en Next.js con contratos de API, dominio, persistencia y pruebas.
- Análisis, propuestas, contenido y redirects: artefactos especializados; no deben recibir el workflow de un sitio completo.
- Repositorios de referencia y archivos históricos: solo lectura por defecto.

## Hallazgos que condicionan al agente

### Catálogos divergentes

`index.html` no es un inventario suficiente. El disco contiene proyectos no catalogados y Softvibes Flow mantiene otra vista operativa. El agente debe reconciliar fuentes y reportar discrepancias; no debe elegir una fuente silenciosamente.

### Contaminación de template

`blooming-skincare/sitio`, `frank-hernandez/sitio`, `katya-varela/sitio` y `suemi-garcia/sitio` contienen referencias de alta señal heredadas de Vive Mar, especialmente en README o `package.json`. El contenido visible puede pertenecer al cliente correcto aunque la documentación técnica no. Por eso una búsqueda de nombre de cliente debe revisar al menos:

- README, package y configuración de sitio;
- `src/config`, `src/data`, `src/pages` y configuración del CMS;
- títulos, metadata, teléfonos, dominios y CTAs;
- datos demo y fuentes de evidencia.

### Cambios locales

Durante el corte había cambios locales en MenuVibes, colegios-875, Softvibes Flow y `blooming-skincare/sitio`. El agente debe volver a ejecutar `git status --short`, identificar solapamientos y conservar trabajo ajeno.

### Estados públicos no verificables por nombre

Etiquetas como `live`, `production` o `demo-live-review` son clasificación interna. No autorizan despliegues ni sustituyen una comprobación HTTP y funcional actual.

### Workflows históricos con permisos más amplios

Algunos playbooks antiguos describen outreach o automatización. Las reglas actuales del workspace prevalecen: investigar y redactar es interno; contactar, publicar, cobrar o aceptar términos necesita instrucción y aprobación humana vigente.

## Template canónico

La fuente neutral para un nuevo sitio inmobiliario Astro + CMS es `plantilla-inmobiliaria-astro-cms`, no Vive Mar ni otro sitio de cliente.

El generador `scripts/create-site.mjs` requiere destino, nombre y dominio; opcionalmente acepta nombre corto. Rechaza sobrescrituras y evita copiar dependencias, builds, Git, configuración local del CMS y almacenamiento activo. Después de generar, todavía deben resolverse marca, contenido, zonas, CTAs, evidencia, SEO, analytics, idiomas, CMS y criterios de aceptación.

El CMS es híbrido: Astro produce el sitio público y PHP administra contenido JSON que puede regresar a la fuente. Una verificación seria incluye build Astro, sintaxis PHP, autenticación, escritura segura, respaldo, importación y comportamiento después de reconstruir.

## Diseño del especialista Hermes

La solución es una distribución de perfil instalable, separada del perfil Hermes existente. Tiene cuatro capas:

1. `SOUL.md`: identidad, precedencia, límites y formato de reporte.
2. `SKILL.md`: procedimiento obligatorio para selección, ejecución, verificación y gates humanos.
3. Referencias estructuradas: registro de proyectos, catálogo de workflows, JSON Schema y contratos de seguridad/template.
4. `softvibes_context.py`: operaciones deterministas para reducir decisiones ambiguas del modelo.

La herramienta admite:

```text
list       filtrar y enumerar proyectos
show       resolver proyecto, familia y workflow
init       crear una selección sin sobrescribir
validate   validar dependencias y gates de variables
plan       producir pasos según familia y operación
audit      detectar contaminación, secretos, builds, demos y Git sucio
reconcile  comparar registro, catálogo visual, disco y repositorios
```

No se instalaron ni activaron el perfil o el gateway. Eso conserva intacto el perfil `softvibes-sites` actual.

## Modelo de selección de variables

Cada ejecución debe fijar un solo proyecto y una sola operación. Las operaciones soportadas son `inspect`, `create`, `adapt`, `maintain`, `compare`, `verify`, `publish` y `outreach`.

El contrato separa:

- selección: proyecto, familia, operación, origen, destino y fecha de corte;
- identidad: marca, nombre corto, dominio, industria, ubicación e idiomas;
- evidencia: fuentes, afirmaciones, estado de verificación e incertidumbre;
- marca: paleta, tipografía, tono, logos e imágenes;
- contacto y conversión: canales, formularios, CTAs, consentimiento y escalamiento;
- contenido: oferta, zonas, FAQ, testimonios y flags de demostración;
- infraestructura: stack, CMS, analytics y nombres de variables secretas;
- aprobaciones: uso de material, deploy y contacto externo;
- aceptación: comandos y comprobaciones funcionales.

Dependencias relevantes:

- `create` y `adapt` requieren destino, identidad y fuentes.
- Un destino nuevo debe ser inexistente y derivarse del template neutral correspondiente.
- CMS habilitado requiere nombres de variables de entorno, nunca valores secretos.
- Publicación requiere aprobación de deploy, contenido no demo, HTTPS, SEO y pruebas.
- Outreach requiere aprobación separada del destinatario, canal y mensaje.
- Claims sensibles o no verificadas bloquean publicación hasta resolver evidencia.

## Plan de adopción

### Fase 1 — Uso en modo lectura

Instalar el perfil con un nombre separado, ejecutar `list`, `show`, `reconcile` y `audit`, y comparar sus resultados contra decisiones humanas conocidas. No habilitar deploy ni gateways externos.

Criterio de salida: selecciona correctamente proyectos homónimos/variantes, identifica los cuatro sitios contaminados y no propone editar repositorios de referencia.

### Fase 2 — Planeación con variables

Crear selecciones para tres casos representativos: mantener Valmadero, crear un sitio desde el template y preparar una publicación sin ejecutarla. Revisar errores, advertencias y pasos producidos.

Criterio de salida: ninguna selección incompleta obtiene un plan ejecutable; secretos y aprobaciones se representan sin valores sensibles.

### Fase 3 — Cambios locales reversibles

Autorizar una tarea pequeña en un único proyecto limpio o con archivos objetivo no solapados. Exigir diff, pruebas y reporte de evidencia. Mantener `noindex` y demo cuando corresponda.

Criterio de salida: cambia solo fuentes permitidas, conserva modificaciones ajenas y pasa las verificaciones del subproyecto.

### Fase 4 — Staging controlado

Probar build, CMS, rutas y formulario en un destino no productivo. Separar aprobación de material, deploy y contacto externo.

Criterio de salida: existe respaldo, rollback, comprobación post-build y evidencia de cada gate.

### Fase 5 — Operación asistida

Permitir despliegues o contactos solamente por instrucción explícita y aprobación por acción. Mantener un registro de fecha, destinatario/destino, resultado y verificación posterior.

Criterio de salida: el agente nunca infiere autorización por el estado del proyecto ni por un playbook histórico.

## Decisiones pendientes

- Elegir cuándo instalar el perfil y si conservar el alias sugerido por Hermes.
- Confirmar qué variante de Vive Mar es canónica antes de consolidar contenido.
- Decidir si los 13 activos no catalogados deben incorporarse a `index.html` o solo al registro operativo.
- Normalizar README/package de los cuatro sitios contaminados mediante tareas separadas y con revisión por cliente.
- Definir entornos y comandos de staging por familia; no almacenar sus secretos en esta distribución.
- Elegir el sistema de evidencia de acciones externas (Softvibes Flow u otro registro autorizado).

## Criterios de aceptación globales

- Selección inequívoca de proyecto, familia, operación y ruta.
- Variables requeridas y sus dependencias validadas antes de editar.
- Cero mezcla de identidad o contenido entre clientes.
- Cero valores secretos en prompts, selecciones, logs o Git.
- Cambios limitados a fuente canónica y verificación proporcional al riesgo.
- Gates humanos efectivos para publicar, desplegar, contactar, cobrar o aceptar términos.
- Reconciliación reproducible entre catálogo, disco, workflow y estado de Git.
