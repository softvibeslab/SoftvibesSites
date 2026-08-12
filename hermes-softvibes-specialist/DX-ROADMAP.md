# DX Roadmap: Developer Experience Improvements

**Evaluador**: Developer Advocate  
**Fecha**: 2026-08-06  
**Impacto**: 60 horas anuales desperdiciadas en onboarding de operadores

---

## Diagnóstico Actual

### Curva de Aprendizaje: 35 Minutos (vs. 10 min ideal)

**Flujo actual de operador nuevo**:
1. Leer SOUL.md (2 min) - identidad, reglas, precedencia
2. Leer SKILL.md (5 min) - procedimiento obligatorio
3. `softvibes_context.py list` (1 min) - exploración
4. `softvibes_context.py show <proyecto>` (2 min) - detalles
5. `softvibes_context.py init --project X --operation Y` (2 min)
   - Genera JSON de 500+ líneas vacío
   - Operador ve estructura incomprensible
6. Editar selection.json manualmente (12 min)
   - Abre el archivo
   - Scroll infinito sin contexto
   - Confundido por estructura anidada
7. `softvibes_context.py validate` (3 min)
   - 8 errores simultáneos
   - Sin prioridad
   - "¿Por qué falla esto?"
8. Editar ciegamente (6 min)
   - Introduce tipos incorrectos
   - Confunde array vs object
9. Re-run validate → más errores → ??? (2 min)

**Total: 35 minutos** para un proyecto simple.

---

## Top 5 Fricciones (Ranked por impacto)

| # | Fricción | Impact | Causa | Solución |
|---|----------|--------|-------|----------|
| 1 | Sin wizard interactivo | 35% | `init` genera plano sin guía | Interactive `guide` command |
| 2 | Errores acumulativos no priorizados | 28% | Validate tira 8 errores sin orden | Errores priorizados + roadmap |
| 3 | Documentación aislada | 22% | variable-schema.json desacoplado del CLI | Incrustar $schema en JSON |
| 4 | Feedback no accionable | 18% | "media_permission debe ser authorized" | Agregar reason + hint |
| 5 | Pérdida de contexto inter-comandos | 12% | Ejecuta show → init → validate (re-copiar datos) | Heredar --project flag |

---

## Mejora 1: Interactive Guide (8 horas)

**Hoy**:
```bash
$ softvibes_context.py init --project valmadero --operation create
# Genera 500 líneas de JSON vacío
# Operador debe memorizar variable-schema.json
```

**Mejorado**:
```bash
$ softvibes_context.py guide --project valmadero
```

**UX mejorada**:
```
🚀 Hermes Softvibes Specialist - Guía Interactiva

Proyecto: valmadero
¿Operación? 
  [1] inspect    - Ver estado, no editar
  [2] research   - Investigar y proponer
  [3] analyze    - Análisis profundo
  [4] create     - Crear nuevo sitio
  [5] adapt      - Adaptar existente
  [6] maintain   - Mantener/actualizar
→ 6

¿Idioma(s)?
  [1] Español (es)
  [2] Español + Inglés (es+en)
  [3] Español + Inglés + Francés (es+en+fr)
→ 1

¿Ubicación/Hosting?
  [1] Ninguno (solo código fuente)
  [2] Hostinger (static/PHP)
  [3] VPS propio
  [4] AWS
→ 2

¿Sitio con CMS?
  [y/n] 
→ y

¿Analytics?
  [1] Google Analytics 4
  [2] Plausible
  [3] No hay
→ 1

✅ selection.json generado en /tmp/valmadero-selection.json
💡 Comentarios integrados. Abre en VS Code para ver autocomplete.
🔍 Próximo paso: softvibes_context.py validate /tmp/valmadero-selection.json
```

**Implementación en Python**:
```python
def command_guide(args: argparse.Namespace) -> int:
    """Flujo interactivo para generar selecciones."""
    
    project = project_map().get(args.project)
    if not project:
        emit({"error": f"Project not found: {args.project}"})
        return 1
    
    # Preguntas ordenadas por dependencia
    questions = [
        {
            "key": "operation",
            "prompt": "¿Operación?",
            "choices": list(OPERATIONS),
            "default": "maintain"
        },
        {
            "key": "languages",
            "prompt": "¿Idiomas?",
            "choices": ["es", "es+en", "es+en+fr"],
            "default": "es",
            "condition": lambda a: a["operation"] in ["create", "adapt"]
        },
        {
            "key": "hosting",
            "prompt": "¿Hosting?",
            "choices": ["none", "hostinger-static-php", "vps", "aws"],
            "default": "none",
            "condition": lambda a: a["operation"] in ["create", "adapt", "publish"]
        },
        {
            "key": "cms_enabled",
            "prompt": "¿Sitio con CMS?",
            "choices": ["y", "n"],
            "default": "n",
            "condition": lambda a: a["operation"] in ["create", "adapt"]
        },
        {
            "key": "analytics",
            "prompt": "¿Analytics?",
            "choices": ["ga4", "plausible", "none"],
            "default": "ga4",
            "condition": lambda a: a["operation"] in ["create", "publish"]
        }
    ]
    
    answers = {}
    for q in questions:
        # Evaluar condition
        if "condition" in q and not q["condition"](answers):
            continue
        
        # Preguntar
        while True:
            prompt_text = f"{q['prompt']} [{'/'.join(q['choices'])}]"
            if q.get("default"):
                prompt_text += f" (default: {q['default']})"
            
            response = input(f"{prompt_text} → ").strip().lower()
            
            if not response and q.get("default"):
                response = q["default"]
            
            if response in q["choices"]:
                answers[q["key"]] = response
                break
            else:
                print(f"❌ Opción inválida. Válidas: {q['choices']}")
    
    # Generar selection.json mínimo
    selection = {
        "$schema": "file:../references/variable-schema.json",
        "$comment": "Generado por 'guide'. Autocomplete habilitado en VS Code.",
        "metadata": {
            "project_id": args.project,
            "operation": answers["operation"],
            "created_by": os.environ.get("SOFTVIBES_OPERATOR", "unknown@softvibes.mx"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        "selection": {
            "project_id": args.project,
            "family": project["family"],
            "operation": answers["operation"],
            "source": project["path"],
            "destination": None if answers["operation"] != "create" else f"output-{args.project}"
        },
        "identity": {
            "brand_name": f"{project['name']} (actualizar aquí)",
            "short_name": args.project,
            "domain": "example.com (actualizar)",
            "industry": "real-estate (actualizar)",
            "location": "México (actualizar)",
            "languages": answers["languages"].split("+") if "languages" in answers else ["es"]
        },
        "infrastructure": {
            "stack": "astro" if project["family"].startswith("astro") else "html+php",
            "cms_enabled": answers.get("cms_enabled") == "y",
            "hosting_type": answers.get("hosting", "none"),
            "analytics": answers.get("analytics", "none")
        },
        "approvals": {
            "deploy": {
                "value": False,
                "approved_by": None,
                "approved_at": None,
                "signature": None,
                "reason": None
            },
            "external_contact": {
                "value": False,
                "approved_by": None,
                "approved_at": None,
                "signature": None,
                "reason": None
            }
        }
    }
    
    # Guardar
    output_path = Path(args.output or f"/tmp/{args.project}-selection.json")
    output_path.write_text(json.dumps(selection, ensure_ascii=False, indent=2))
    
    emit({
        "status": "success",
        "path": str(output_path),
        "message": f"✅ selection.json generado",
        "next_step": f"softvibes_context.py validate {output_path}"
    })
    
    return 0
```

---

## Mejora 2: Errores Priorizados (6 horas)

**Hoy**:
```
❌ media_permission must be authorized
❌ bilingual requires languages array
❌ brand_name empty
❌ operation invalid
❌ project_id not found
❌ hosting_type unknown
❌ deploy_date missing
❌ cms_password exposed
```

**Mejorado** - Errores con prioridad + hints:
```json
{
  "errors_prioritized": [
    {
      "priority": 1,
      "severity": "blocker",
      "field": "selection.project_id",
      "message": "Desconocido: 'valmadiro'",
      "hint": "¿Quisiste 'valmadero'? Ver: softvibes_context.py list --query valm",
      "action": "Corrige este primero; todo depende de él"
    },
    {
      "priority": 2,
      "severity": "blocker",
      "field": "identity.brand_name",
      "message": "Requerido para operación 'create'",
      "action": "Actualiza con nombre de cliente. Encontrado en index.html#valmadero",
      "example": "Val Madero",
      "dependencies": ["project_id válido"]
    },
    {
      "priority": 3,
      "severity": "error",
      "field": "infrastructure.cms_password",
      "message": "Secreto expuesto en JSON plano",
      "action": "Usa nombre de variable ENV, no el valor.",
      "before": "\"cms_password\": \"super-secret-123\"",
      "after": "\"cms_password_var\": \"$SOFTVIBES_CMS_PASSWORD\""
    },
    {
      "priority": 4,
      "severity": "warning",
      "field": "infrastructure.hosting_type",
      "message": "Desconocido: 'heroku'",
      "action": "Válidas: hostinger-static-php, vps, aws, none",
      "suggestion": "¿Quisiste 'vps'?"
    }
  ],
  "roadmap": "⚠️ Tienes 3 bloqueadores. Arregla priority 1-2 primero. Luego: softvibes_context.py validate nuevamente",
  "stats": {
    "blockers": 2,
    "errors": 1,
    "warnings": 1
  }
}
```

**Implementación**:
```python
def validate_selection(selection: dict) -> dict:
    """Validar con errores priorizados."""
    
    errors = []
    
    # Validación 1: proyecto existe (bloqueador crítico)
    project_id = selection.get("selection", {}).get("project_id")
    if not project_id or project_id not in project_map():
        errors.append({
            "priority": 1,
            "severity": "blocker",
            "field": "selection.project_id",
            "message": f"Desconocido: '{project_id}'",
            "hint": f"Válidos: {list(project_map().keys())[:5]}...",
            "action": "Usa softvibes_context.py list para ver todos"
        })
        # No continuar si falta proyecto
        return {"valid": False, "errors": errors}
    
    # Validación 2: operación es válida (bloqueador)
    operation = selection.get("metadata", {}).get("operation")
    if operation not in OPERATIONS:
        errors.append({
            "priority": 2,
            "severity": "blocker",
            "field": "metadata.operation",
            "message": f"Operación inválida: '{operation}'",
            "action": f"Válidas: {OPERATIONS}"
        })
    
    # Validación 3: dependencias según operación
    if operation == "create":
        if not selection.get("identity", {}).get("brand_name"):
            errors.append({
                "priority": 3,
                "severity": "blocker",
                "field": "identity.brand_name",
                "message": "Requerido para operación 'create'",
                "action": "Ingresa nombre del cliente"
            })
    
    # Validación 4: secretos no exponerlos
    secrets_found = check_secrets(selection)
    for secret in secrets_found:
        errors.append({
            "priority": 10,
            "severity": "error",
            "field": f"infrastructure.{secret['key']}",
            "message": "Secreto expuesto en JSON plano",
            "action": f"Usa nombre de variable, no valor: ${secret['var_name']}"
        })
    
    # Ordenar por prioridad
    errors.sort(key=lambda e: e["priority"])
    
    return {
        "valid": len([e for e in errors if e["severity"] == "blocker"]) == 0,
        "errors_prioritized": errors,
        "roadmap": generate_fix_roadmap(errors),
        "stats": {
            "blockers": len([e for e in errors if e["severity"] == "blocker"]),
            "errors": len([e for e in errors if e["severity"] == "error"]),
            "warnings": len([e for e in errors if e["severity"] == "warning"])
        }
    }
```

---

## Mejora 3: Documentación Integrada ($schema en JSON)

**Implementar**:
```json
{
  "$schema": "file:../references/variable-schema.json",
  "$comment": "VS Code autocomplete habilitado. Cmd+Space para sugerencias.",
  "metadata": {
    "project_id": "valmadero",
    "operation": "maintain"
  }
}
```

**Crear `.vscode/settings.json`** en root:
```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/softvibes-selection.json"],
      "url": "./references/variable-schema.json"
    }
  ]
}
```

**Resultado**: Operador abre JSON en VS Code, presiona Cmd+Space, ve:
- Descripción de cada campo
- Ejemplos
- Tipos
- Valores permitidos

---

## Mejora 4-5: Feedback Accionable + Contexto Heredado

**Feedback mejorado**:
```
❌ media_permission='unauthorized'
   Razón: Solo 'authorized' permite deploy automático sin escalación
   Contexto: Tu cliente todavía no autorizó cambios sin aviso
   Acción: 
     1. Obtén approval.external_contact=true de Roger
     2. Actualiza media_permission='authorized'
   Impacto: Sin esto, deploy requiere manual review
```

**Contexto heredado**:
```bash
# Ejecuta guide
$ softvibes_context.py guide --project valmadero
→ genera selection.json

# Valida heredando --project
$ softvibes_context.py validate  # Detecta selection.json más reciente de valmadero
→ reporta errores

# Plan heredando --project
$ softvibes_context.py plan  # Reutiliza valmadero
→ genera pasos sin re-ingresar datos
```

---

## Métricas de Éxito

| Métrica | Hoy | Meta | Impacto |
|---------|-----|------|---------|
| Time-to-first-validation | 35 min | <10 min | Reduce fricción 70% |
| Error rate (gente) | 6/10 | <1/10 | Menos escalaciones |
| Re-runs validate | 3.2x | <1.5x | Menos debugging |
| Operadores autónomos % | 30% | 60% | Autoservicio real |
| Aha moment (pasos) | 6 | 3 | Comprensión 50% |
| Customer CSAT (DX) | 2.8/5 | >4.0 | Satisfacción → retención |

---

## Implementación Timeline

| Semana | Tarea | Esfuerzo |
|--------|-------|----------|
| 1 | Implementar `guide` interactivo | 8h |
| 2 | Errores priorizados + hints | 6h |
| 3 | $schema + VS Code integration | 2h |
| 3 | Feedback accionable | 4h |
| 4 | Contexto heredado (--project) | 4h |
| 4-5 | Testing con 3 operadores nuevos | 6h |

**Total: 30 horas anuales de DX improvements = 30 horas/año ahorradas en onboarding × 20 operadores = 600 horas/año potenciales de recuperación**

---

## Success Criteria

- [ ] Operador nuevo completa `guide` sin escalación
- [ ] Validate errors son priorizados + accionables
- [ ] VS Code autocomplete funciona en selection.json
- [ ] Heredar --project entre comandos (list→init→validate→plan)
- [ ] <10 min total time-to-first-validate
- [ ] <1.5 iterations de validate (hoy 3.2x)
- [ ] 60% de operadores autónomos (hoy 30%)

