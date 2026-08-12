# Mejoras Recomendadas: Hermes Softvibes Specialist

**Fecha**: 2026-08-06  
**Evaluadores**: Software Architect, Security Engineer, Account Strategist, Developer Advocate  
**Score actual**: 5.2/10 (conceptualmente sólido, operacionalmente frágil)

## Resumen Ejecutivo

El Hermes Softvibes Specialist funciona perfectamente para 46 proyectos internos con operadores experientes. Pero escala en:
- **Operabilidad**: Sin trazabilidad de aprobaciones, rollback automático, auditlog centralizado
- **Seguridad**: Secretos detectados post-commit, sin separación de deberes, sin checksums post-deploy
- **Developer Experience**: 35 minutos de fricción al onboarding; 60 horas anuales desperdiciadas en 20 operadores
- **Escalabilidad técnica**: O(n*m) en reconciliación; 10 minutos para auditar 46 repos

**Inversión**: 2-3 sprints (40-60 horas) en fixes críticos.  
**ROI**: Desbloquea $500K ARR potencial en 18 meses con modelo SaaS + revenue share a agencias externas.

---

## 🔴 BRECHAS CRÍTICAS (Esta semana - 13 horas)

### 1. Sin Trazabilidad de Aprobaciones
**Riesgo**: Operador malicioso puede autopublicar sin evidencia.

**Hoy**:
```json
"approvals": {
  "deploy": true,
  "external_contact": false
}
```

**Mejorado**:
```json
"approvals": {
  "deploy": {
    "value": true,
    "approved_by": "operator@softvibes.mx",
    "approved_at": "2026-08-06T14:32:15Z",
    "signature": "hmac_sha256_hash",
    "reason": "Cliente autorizado en call 2026-08-06"
  }
}
```

**Implementación**: 
- Modificar `variable-schema.json` para requerir `approved_by`, `approved_at`, `signature`
- En `softvibes_context.py`, validar firma HMAC antes de permitir deploy
- Rechazar si `approval.edited_by == selection.created_by` (separación de deberes)

**Tiempo**: 4 horas

---

### 2. Secretos Detectados Post-Commit (vs. Pre-Commit)
**Riesgo**: `.env`, `google_token.json` pueden comprometerse antes de audit.

**Implementación**:
```bash
# Root del workspace
pip install pre-commit gitleaks detect-secrets

# Crear .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks-action
    rev: v3.17.0
    hooks:
      - id: gitleaks
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Instalar en todos los repos
for repo in MenuVibes softvibes-flow vivemar fabiola-mvp; do
  cd "$repo" && pre-commit install
done

# GitHub branch protection rule: require gitleaks + detect-secrets pass
```

**Tiempo**: 3 horas

---

### 3. Sin Rollback Automático Post-Deploy
**Riesgo**: Si un deploy rompe, RTO = horas (manual). Sin garantía de integridad.

**Implementación** (Hostinger/VPS):
```bash
# Pre-deploy
BACKUP_DIR="/var/backups/sitio"
TIMESTAMP=$(date +%s)
tar -czf "$BACKUP_DIR/backup-$TIMESTAMP.tar.gz" /var/www/sitio/

# Deploy + verificación
npm run build
curl -s https://sitio.com/health | jq .status

# Post-deploy: si tests fallan, revertir
if [ $? -ne 0 ]; then
  tar -xzf "$BACKUP_DIR/backup-$TIMESTAMP.tar.gz" -C /
  systemctl restart nginx
  curl -s https://sitio.com/health  # verificar rollback exitoso
  ALERT="ROLLBACK EJECUTADO: sitio revirtió a $TIMESTAMP"
  # Enviar a Slack
fi
```

**Tiempo**: 6 horas (incluir en CI/CD GitHub Actions)

---

## 🟠 FRICCIONES EN EXPERIENCE (Próximas 2 semanas - 28 horas)

**Impacto**: 60 horas anuales desperdiciadas en onboarding; operadores nuevos tardan 35 min en `init` vs. 10 min ideal.

### Fricción 1: `init` sin Guía (35 min → 10 min)

**Hoy**:
```bash
$ softvibes_context.py init --project valmadero --operation create
# Genera selection.json con 500 líneas de estructura vacía
# Operador debe conocer variable-schema.json de memoria
```

**Mejorado** - Reemplazar `init` con `guide` interactivo:
```bash
$ softvibes_context.py guide --project valmadero
¿Operación? [1] maintain [2] analyze [3] create
→ 3
¿Idiomas? [1] es [2] es+en [3] es+en+fr
→ 1
¿Hosting? [1] none [2] hostinger-static-php [3] vps [4] aws
→ 2
¿CMS? [y/n]
→ y
✅ selection.json generado con comentarios + $schema incrustado
```

**Código**:
```python
# softvibes_context.py
def command_guide(args: argparse.Namespace) -> int:
    """Flujo interactivo para generar selecciones."""
    
    questions = [
        ("operation", "Operación", OPERATIONS),
        ("bilingual", "¿Bilingüe? [y/n]", ["y", "n"]),
        ("cms_enabled", "¿CMS PHP? [y/n]", ["y", "n"]),
        ("hosting", "Hosting", ["none", "hostinger-static-php", "vps"]),
    ]
    
    answers = {}
    for key, prompt, choices in questions:
        while True:
            choice = input(f"{prompt} [{'/'.join(str(c) for c in choices)}]> ").strip()
            if choice in [str(c) for c in choices]:
                answers[key] = choice
                break
    
    # Generar selection.json mínimo con comentarios
    selection = generate_minimal_selection(args.project, answers)
    selection['$schema'] = 'references/variable-schema.json'
    
    # Guardar con VS Code hints
    # ...
```

**Tiempo**: 8 horas

---

### Fricción 2: Errores sin Prioridad (8 simultáneos → 2 bloqueadores)

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

**Mejorado**:
```json
{
  "errors_prioritized": [
    {
      "priority": 1,
      "field": "selection.project_id",
      "severity": "blocker",
      "message": "Desconocido: 'valmadiro'",
      "hint": "¿Quisiste 'valmadero'? Ver: softvibes_context.py list --query valm",
      "action": "Corrige este primero; el resto depende de él"
    },
    {
      "priority": 2,
      "field": "identity.brand_name",
      "severity": "blocker",
      "message": "Requerido para operación 'create'",
      "hint": "Encontrado en index.html#valmadero: 'Val Madero'. Cópialo.",
      "dependencies": ["project_id válido"]
    },
    {
      "priority": 3,
      "field": "infrastructure.cms_password",
      "severity": "warning",
      "message": "Secreto expuesto en JSON plano",
      "action": "Usa nombre de variable ($ENV_CMS_PASSWORD), no el valor",
      "blocker": false
    }
  ],
  "roadmap": "Arregla 2 bloqueadores. Luego: softvibes_context.py validate nuevamente"
}
```

**Tiempo**: 6 horas

---

### Fricción 3-5: Documentación integrada + Contexto retenido

**3. Incrustar $schema en JSON**:
```json
{
  "$schema": "file:///referencias/variable-schema.json",
  "$comment": "VS Code autocomplete habilitado"
}
```

**4. Feedback accionable** - Agregar reasoning a errores:
```
❌ media_permission='unauthorized'
   Razón: Solo 'authorized' acepta deploy automático
   Contexto: Tu cliente NO autorizó cambios sin aviso
   Fix: Primero obtén approval.external_contact=true
```

**5. Heredar contexto entre comandos**:
```bash
$ softvibes_context.py init --project valmadero
→ (genera selection.json)

$ softvibes_context.py validate  # heredado: --project valmadero
→ (valida el JSON del paso anterior)

$ softvibes_context.py plan  # heredado: --project valmadero
→ (genera pasos)
```

**Tiempo**: 14 horas (combined)

---

## 🟡 ESCALABILIDAD: 46 → 500 Proyectos (Q3 - 40 horas)

**Hoy rompe**:
- Reconciliación O(n*m): `git status` × búsqueda de fugas en todos archivos = 10 minutos
- Sin índices: cada `audit` busca "vivemar" en texto normalizado
- Serialización manual

**Arquitectura objetivo**:

```python
# Índice de proyectos (SQLite, 15 min TTL)
projects_index.db:
  id | project_id | family | status | paths | last_git_hash | updated_at
  
# Caché de reconciliación
reconcile_cache.json:
  {
    "workspace_hash": "abc123",
    "catalog_matches": [...],
    "disk_state": {...},
    "drift": {...},
    "cached_at": "2026-08-06T15:00:00Z"
  }

# Audits parallelizados
ThreadPoolExecutor(max_workers=8)
  Para cada proyecto → worker independiente
  Resultado: 10 min → 90 segundos
```

**Tiempo**: 40 horas (Q3)  
**Métrica de éxito**: `reconcile --workspace` < 2 minutos (hoy 10 min)

---

## 💚 LO QUE FUNCIONA BIEN (No cambiar)

✅ Separación de fuentes de verdad  
✅ Gates humanos explícitos (no automatización ciega)  
✅ Auditoría de contaminación cliente-a-cliente  
✅ 17 familias, 9 workflows (sin copy-paste)  
✅ Variables explícitas sin secretos en JSON  

---

## 📋 PRÓXIMOS PASOS

1. **Esta semana**: Implementar 3 brechas críticas (13h)
2. **Próximas 2 semanas**: DX improvements (28h)
3. **Q3**: Escalabilidad (40h)
4. **Q4**: Modelo de negocio + primer cliente externo

Ver `SECURITY-AUDIT.md` para matriz de amenazas.  
Ver `DX-ROADMAP.md` para curva de aprendizaje mejorada.  
Ver `BUSINESS-MODEL.md` para estrategia SaaS.  
Ver `IMPLEMENTATION-PLAN.md` para semana a semana.

