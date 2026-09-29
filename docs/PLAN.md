# Plan de empaquetado

1. Inventariar skills instaladas y bibliotecas de herramientas identificadas por el catálogo.
   Conservar variantes, scripts, referencias y atribución; separar capacidades de sus cuentas.
2. Exportar únicamente recursos reutilizables. Excluir sitios, contenido, clientes, datos,
   `.env`, cachés, dependencias instaladas y configuraciones de sesión. Generalizar rutas locales.
3. Añadir un flujo de creación web y un workspace vacío, junto con instalación por perfiles,
   inventario de procedencia y requisitos externos.
4. Verificar integridad, ausencia de archivos prohibidos, instalación en un destino temporal,
   repetición sin cambios y protección frente a conflictos. Generar ZIP del snapshot revisado.
5. Publicar en `devecositem`, una rama huérfana sin ancestros ni archivos de las páginas.
   Mantener intactas la rama de trabajo original y sus modificaciones locales.

## Límites de cobertura

El inventario corresponde a los archivos locales exportados en esta entrega. No pretende
inventariar servicios remotos, suscripciones ni habilidades todavía no instaladas. Se conservaron
las skills locales (incluidas las no relacionadas con web), las skills de plugins presentes
en la caché local y las bibliotecas de agentes/reglas identificadas. Se conservan variantes por origen;
los nombres repetidos no se contabilizan como nuevas capacidades.

Los playbooks con casos comerciales reales y scripts de captura/despliegue ligados a un cliente
no se copiaron. El proceso general se describe en FLUJO-WEB.md y en el plugin propio.
No se copiaron los sitios, la plantilla derivada de clientes, los repositorios de productos,
el catálogo comercial original ni las configuraciones de cuentas. Los ejemplos genéricos
incluidos por los autores de skills sí forman parte de sus bibliotecas.

La verificación del paquete no prueba cada script de terceros ni acredita compatibilidad de
cada integración. El perfil web se instala sin contactar servicios. No se ejecutan despliegues.
