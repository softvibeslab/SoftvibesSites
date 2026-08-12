# Softvibes Sites

Workspace local de productos, sitios de clientes, análisis, agentes y herramientas de Softvibes.

Este repositorio raíz funciona como un monorepo privado de código fuente. Cada cliente permanece
aislado en su propia carpeta. Dependencias, builds, credenciales, prospectos, conversaciones,
material bruto, archivos comprimidos y repositorios externos de referencia no forman parte del
snapshot publicado; consulta `.gitignore` para conocer las exclusiones.

Algunos subproyectos conservan su propio repositorio Git local y pueden seguir usando sus remotos
independientes. El repositorio raíz incorpora su contenido fuente, pero no copia los directorios
`.git` ni combina sus historiales.

## Abrir el catálogo

Abre `index.html` directamente en el navegador o ejecuta:

```bash
open /Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/index.html
```

## Guiar al agente de Telegram

Copia el prompt de `PROMPT-TELEGRAM.md` al bot de Hermes en Telegram. Usa `/goal` antes del prompt si quieres mantenerlo como objetivo de la sesión.

## Regla operativa

El catálogo organiza los proyectos sin mover ni renombrar sus carpetas. Antes de editar un subproyecto, revisa su documentación y su estado Git.
