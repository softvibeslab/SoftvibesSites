---
title: Contrato Growth Handoff
created: 2026-08-06
updated: 2026-08-07
type: concept
tags: [handoff, synergy, safety]
sources: [../skills/operate-softvibes-sites/references/growth-handoff.schema.json, ../skills/operate-softvibes-sites/SKILL.md]
confidence: high
---

# Contrato Growth Handoff

Contrato JSON versionado (1.0) que transfiere una estrategia del Vibes Growth Architect al [[sites-specialist]] para su ejecución. Es la frontera formal entre estrategia y ejecución del [[synergy-pipeline]].

## Hechos

- Campos requeridos: `contract_version`, `handoff_id`, `created_at`, `producer`, `client`, `request`, `evidence`, `strategy`, `landing`, `brand`, `contact`, `measurement`, `delivery`.
- La evidencia distingue `claims` con status `observed` | `hypothesis`, `confidence` numérica y `source_ids`; los faltantes van en `unknowns`.
- El plan de medición viaja en el contrato: se define antes de que exista la landing.
- Validación determinista: `softvibes_context.py validate-handoff <archivo>`; para `create`/`adapt`, la conversión `from-handoff` exige un `envato-template-review.json` decidido.
- **La importación reinicia todas las aprobaciones en `false` y nunca importa comandos ejecutables** — el handoff transfiere evidencia y criterios, no autoridad.
- La búsqueda Envato ocurre después del brief y antes de la selección técnica; permite elegir una referencia, una mezcla o rechazarlas todas.

## Emisión (lado Growth Architect)

La skill `emit-growth-handoff` (paquete LandingVibes, copiada al perfil `contentcreator_vibes` bajo `skills/softvibes/`) instruye: leer el schema, etiquetar claims con honestidad, citar fuentes con fecha, validar antes de entregar, nunca incluir secretos, un handoff por cliente y activo.

## Recomendación

Guardar cada handoff emitido junto al proyecto del cliente y tratarlo como artefacto versionable: permite auditar qué evidencia sustentó cada landing.
