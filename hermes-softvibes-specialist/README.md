# Softvibes Sites Specialist para Hermes

Distribución de perfil que transfiere el conocimiento operativo del workspace Softvibes Sites a un especialista de Hermes. Incluye selección de proyectos, workflows por familia, variables validables, auditoría de contaminación entre clientes y guardas para despliegue o contacto externo.

## Contenido

- `SOUL.md`: identidad y límites del especialista.
- `ANALYSIS.md`: diagnóstico del workspace, arquitectura objetivo y plan de adopción.
- `skills/operate-softvibes-sites/`: workflow, referencias y herramientas deterministas.
- `skills/explore-envato-templates/`: búsqueda, comparación y decisión visual previa a `selection.json`.
- `growth-handoff` 1.0: contrato validable con Vibes Growth Architect.
- `skills/agency-playbooks/`: router hacia la biblioteca agency-agents (217 playbooks indexados; ruta configurable con `AGENCY_AGENTS_ROOT`).
- Skills temáticas adaptadas desde agency-agents con guardas Softvibes: `auditoria-seo`, `paid-media-tracking`, `ofertas-y-outbound`, `propuestas-comerciales`, `diseno-landing-ux`, `qa-evidencia`, `soporte-clientes`. Plan de adopción: `LandingVibes/analysis/agency-agents-adoption/PLAN.md`.
- `wiki/`: base de conocimiento interconectada ([índice](wiki/index.md), leer `wiki/SCHEMA.md` primero).
- `distribution.yaml`: manifest instalable por Hermes 0.14+.

No contiene credenciales, sesiones, memoria, URLs privadas de APIs ni configuración activa de gateways.

Empieza por [ANALYSIS.md](ANALYSIS.md) para entender qué se consolidó y qué decisiones todavía requieren aprobación humana.

## Validación local

```bash
python3 skills/operate-softvibes-sites/scripts/softvibes_context.py list
python3 skills/operate-softvibes-sites/scripts/softvibes_context.py reconcile \
  --workspace /Users/rogergv/Documents/SoftvibesLab/SoftvibesSites
python3 -m unittest discover -s tests -v
```

## Probar sin instalar

```bash
python3 skills/operate-softvibes-sites/scripts/softvibes_context.py init \
  --project valmadero \
  --operation maintain \
  --output /tmp/softvibes-selection.json

python3 skills/operate-softvibes-sites/scripts/softvibes_context.py validate \
  /tmp/softvibes-selection.json
```

## Recibir una estrategia de Vibes Growth Architect

```bash
python3 skills/operate-softvibes-sites/scripts/softvibes_context.py \
  validate-handoff /ruta/growth-handoff.json

python3 skills/operate-softvibes-sites/scripts/softvibes_context.py \
  validate-design-review /ruta/envato-template-review.json --require-decision

python3 skills/operate-softvibes-sites/scripts/softvibes_context.py \
  from-handoff /ruta/growth-handoff.json \
  --design-review /ruta/envato-template-review.json \
  --output /tmp/softvibes-selection.json
```

Para `create`/`adapt`, el especialista compara primero al menos tres referencias Envato y espera una elección humana. La importación conserva evidencia y criterios de aceptación, pero reinicia todas las aprobaciones en `false` y nunca importa comandos ejecutables.

## Instalar en Hermes

La instalación crea un perfil separado; no modifica el perfil `softvibes-sites` existente:

```bash
hermes profile install \
  /Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/hermes-softvibes-specialist \
  --alias
```

Configura `SOFTVIBES_SITES_ROOT` solamente si el workspace vive en otra ruta. La instalación y activación del gateway se realizan por separado y requieren decisión humana.

## Uso esperado

- “Muéstrame los proyectos Astro + CMS que tienen contaminación de template.”
- “Inicializa las variables para un nuevo sitio inmobiliario bilingüe.”
- “Busca plantillas Envato para este brief y déjame elegir una o una mezcla.”
- “Audita Valmadero y propón el siguiente paso seguro.”
- “Prepara el plan de publicación de Emir24 Fit, sin desplegar.”
- “Compara Vivemar con Vivemar Alt y conserva ambas versiones.”
