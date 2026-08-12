---
title: Ecosistema de skills del specialist
created: 2026-08-06
updated: 2026-08-07
type: concept
tags: [skills, agency-adoption, workflows]
sources: [../skills/, ../distribution.yaml]
confidence: high
---

# Ecosistema de skills del specialist

Diez skills en el paquete, en tres capas funcionales. El detalle de la adopción desde agency-agents está en [[agency-adoption]]; la identidad que las gobierna en [[sites-specialist]].

## Núcleo operativo

- `operate-softvibes-sites` — selección de proyecto, variables, workflows por familia, ingesta del [[growth-handoff-contract]], guardas de publicación/outreach. Única skill con scripts deterministas y tests.
- `explore-envato-templates` — búsqueda pública de Envato, rúbrica uniforme, shortlist y gate humano antes de la selección técnica de una landing/CMS.

## Skills temáticas (metodología adaptada de agency-agents, español + guardas Softvibes)

| Skill | Aporta |
|---|---|
| `auditoria-seo` | Regla obligatoria anti-canibalización, umbrales Core Web Vitals, flujo de auditoría |
| `paid-media-tracking` | "Tracking malo es peor que no tener"; plan de medición pre-publicación; umbrales duros |
| `ofertas-y-outbound` | Ecuación de valor, lead magnets, outbound por señales con aprobación por contacto |
| `propuestas-comerciales` | Win themes, narrativa en tres actos, estándares anti-genéricos |
| `diseno-landing-ux` | Tokens, escalas, breakpoints, estados de componente, protocolo de usabilidad |
| `qa-evidencia` | FAIL automático anti-fantasía, certificación honesta, auditoría WCAG 2.2 |
| `soporte-clientes` | SLAs realistas, ciclo de interacción, ticket repetido → documentación |

## Biblioteca de referencia

- `agency-playbooks` — router hacia los 217 playbooks de agency-agents indexados en `agency-index.json`; carga máximo 2–3 por tarea; en conflicto ganan las reglas Softvibes. Ruta configurable con `AGENCY_AGENTS_ROOT`.

## Hechos de verificación

- `tests/test_agency_skills.py` valida frontmatter, correspondencia nombre/directorio, existencia de fuentes citadas y consistencia del índice.
- Regenerar índice tras cambios upstream: `skills/agency-playbooks/scripts/build_agency_index.py`.
