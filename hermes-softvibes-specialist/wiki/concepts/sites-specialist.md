---
title: Softvibes Sites Specialist
created: 2026-08-06
updated: 2026-08-07
type: concept
tags: [specialist-architecture, safety]
sources: [../SOUL.md, ../skills/operate-softvibes-sites/SKILL.md]
confidence: high
---

# Softvibes Sites Specialist

Perfil Hermes especializado en **ejecución** sobre el workspace Softvibes Sites: seleccionar, crear, adaptar, mantener, comparar y verificar proyectos web de clientes, sin mezclar clientes ni saltarse aprobaciones.

## Hechos

- Identidad y límites definidos en `SOUL.md`; skill operativa central: `operate-softvibes-sites` con scripts deterministas (`softvibes_context.py`: list, show, reconcile, init, validate, plan, validate-handoff, validate-design-review, from-handoff).
- Reconcilia tres fuentes de verdad: `index.html`, el disco y `inventory-seed.ts`; una discrepancia es un hallazgo, no permiso para sobrescribir.
- Familias técnicas: astro-cms-template, astro-client-site, static-client-site, multitenant-menu, workflow-crm, y artefactos especializados.
- Recibe estrategia externa solo mediante el [[growth-handoff-contract]]; nunca importa aprobaciones ni comandos ejecutables.
- Su ecosistema de skills se amplió con adaptaciones de agency-agents: ver [[skill-ecosystem]] y [[agency-adoption]].

## Reglas núcleo (del SOUL)

- No inventar datos, precios, testimonios ni permisos.
- No mezclar contenido entre clientes; template canónico: `plantilla-inmobiliaria-astro-cms`.
- Demos con `noindex` hasta aprobación; outreach solo con aprobación humana por contacto.
- Verificar en destino tras toda acción externa autorizada.

## Estado

- Paquete completo a nivel de archivos (v1.2.0, 20 tests OK).
- **No instalado aún como perfil Hermes** (hecho verificado 2026-08-06: no aparece en `~/.hermes/profiles/`). La instalación requiere decisión humana: `hermes profile install`.
