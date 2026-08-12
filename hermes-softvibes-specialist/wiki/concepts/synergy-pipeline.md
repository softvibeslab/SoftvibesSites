---
title: Pipeline de sinergia Softvibes
created: 2026-08-06
updated: 2026-08-07
type: concept
tags: [synergy, handoff, specialist-architecture]
sources: [/Users/rogergv/Documents/SoftvibesLab/LandingVibes/dataset/contentcreator-vibes-growth-agent/PROJECT_CONTEXT.md, ../skills/operate-softvibes-sites/SKILL.md]
confidence: high
---

# Pipeline de sinergia Softvibes

Arquitectura de dos agentes con frontera de aprobación humana, conectada el 2026-08-06.

```
LandingVibes (investigación + wiki)
        ↓
Vibes Growth Architect (perfil contentcreator_vibes — ACTIVO)
  Telegram @landingvibes_bot · gpt-5.6-sol vía OpenAI Codex · cwd → LandingVibes
  Produce: auditoría, embudo, brief de landing, plan de medición
        ↓  growth-handoff.json v1.0 (validado antes de entregar)
Softvibes Sites Specialist (paquete listo; instalación pendiente)
  Compara: Envato → shortlist → elección humana (una / mezcla / ninguna)
  Ejecuta: crear/adaptar sitio, QA con evidencia, publicación con aprobación
        ↓
Métricas y aprendizajes → de vuelta a la wiki de LandingVibes
```

## Hechos (verificados 2026-08-06)

- Estrategia y ejecución separadas por el [[growth-handoff-contract]]: el Growth Architect no puede publicar; el [[sites-specialist]] no acepta autoridad externa (aprobaciones siempre en `false` al importar).
- Para `create`/`adapt`, `envato-template-review.json` se decide entre el handoff y `selection.json`; `pending` bloquea el plan.
- El perfil `contentcreator_vibes` tiene SOUL aplicado, gateway Telegram activo restringido a un usuario, y las skills `softvibes/emit-growth-handoff` y `softvibes/agency-playbooks`.
- Ambos agentes comparten la biblioteca agency-playbooks (ver [[skill-ecosystem]]).

## Pendientes conocidos

- `/start` en el bot (Telegram no permite que el bot inicie conversación).
- Regenerar el token de Telegram (quedó expuesto en chat durante la configuración) y sustituirlo en el `.env` del perfil.
- Instalar el specialist como perfil Hermes y correr los cinco casos de prueba de Fase 1.

## Recomendación

Cerrar el ciclo de mejora: cada handoff ejecutado debe devolver baseline y resultados a la wiki de LandingVibes para alimentar la siguiente iteración (regla de mejora continua del ecosistema).
