# Esquema de la wiki

## Dominio

Operación del Softvibes Sites Specialist: ejecución segura de proyectos web multi-cliente, contrato de handoff con el Vibes Growth Architect, ecosistema de skills adaptadas desde agency-agents y guardas de aprobación humana.

## Convenciones

Idénticas a la wiki de LandingVibes (`LandingVibes/dataset/contentcreator-vibes-growth-agent/wiki/SCHEMA.md`):

- Archivos en minúsculas y con guiones.
- Toda página de conocimiento lleva frontmatter YAML.
- Cada página enlaza al menos dos páginas con `[[wikilinks]]`.
- Los hechos, hipótesis y recomendaciones deben distinguirse.
- Toda página nueva se agrega a `index.md` y toda acción a `log.md` (append-only).
- Actualizar `updated` cuando cambie una página.
- Dividir páginas de más de 200 líneas; archivar lo superado en `_archive/`.

## Frontmatter

```yaml
---
title: Título
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: entity | concept | comparison | query | summary
tags: [taxonomia]
sources: [ruta/al/archivo.md]
confidence: high | medium | low
---
```

## Taxonomía

- specialist-architecture
- workflows
- handoff
- skills
- agency-adoption
- safety
- verification
- synergy

## Política de actualización

1. La documentación no equivale a configuración activa: verificar el perfil Hermes antes de marcar algo como instalado.
2. Los archivos del paquete (SOUL, skills, scripts) son la fuente primaria; la wiki los explica, no los sustituye.
3. Conservar decisiones superadas con fecha en `_archive/`, no borrarlas.
