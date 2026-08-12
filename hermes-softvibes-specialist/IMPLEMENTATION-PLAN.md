# Implementation Plan: 12-Week Sprint

**Owner**: You (Roger)  
**Start**: 2026-08-06  
**End**: 2026-10-29  
**Total Effort**: 40-50 hours (distributed across 3 months)  
**Outcome**: Production-ready, customer-safe, scalable

---

## WEEK 1-2: CRITICAL SECURITY (13 hours)

### Goal
Cierre las 3 brechas críticas de seguridad operativa. Zero secretos en Git, trazabilidad de aprobaciones, rollback automático.

### Deliverables

#### Task 1.1: Pre-Commit Hooks (3 hours)
**What**: Instalar gitleaks + detect-secrets en todos los repos.

```bash
# 1. Instalar dependencias
pip install pre-commit gitleaks detect-secrets

# 2. Crear .pre-commit-config.yaml en raíz del workspace
cat > /Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/.pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks-action
    rev: v3.17.0
    hooks:
      - id: gitleaks
        args: ['--verbose', '--exit-code', '1']
        stages: [commit]
  
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        stages: [commit]
EOF

# 3. Generar baseline (primer run)
cd /Users/rogergv/Documents/SoftvibesLab/SoftvibesSites
detect-secrets scan --baseline .secrets.baseline

# 4. Instalar en repos clave
for repo in MenuVibes softvibes-flow vivemar fabiola-mvp valmadero plantilla-inmobiliaria-astro-cms; do
  cd "$repo"
  pre-commit install
  pre-commit run --all-files  # Validar antes de activar
done

# 5. GitHub branch protection (Settings → Branches → main)
# Agregar checks requeridos:
#   - gitleaks
#   - detect-secrets
```

**Acceptance**: 
- [ ] `.pre-commit-config.yaml` versionado en root
- [ ] `pre-commit install` funciona en 5+ repos
- [ ] Intento de commit `.env` es rechazado automáticamente
- [ ] GitHub branch protection enforcement activo

**Owner**: You

---

#### Task 1.2: Approval Signatures (HMAC) (6 hours)
**What**: Agregar firma cryptográfica a todas las aprobaciones.

**Step 1: Generar APPROVAL_KEY** (1 hora)
```bash
# Generar secreto de 32 bytes
APPROVAL_KEY=$(openssl rand -base64 32)
echo $APPROVAL_KEY

# Guardar en ~/.bashrc o ~/.zshrc (para desarrollo local)
# Producción: guardar en Hermes Secrets Manager o AWS Secrets Manager
echo "export SOFTVIBES_APPROVAL_KEY='$APPROVAL_KEY'" >> ~/.zshrc
```

**Step 2: Modificar variable-schema.json** (2 horas)
```json
{
  "approvals": {
    "type": "object",
    "properties": {
      "deploy": {
        "type": "object",
        "required": ["value", "approved_by", "approved_at", "signature"],
        "properties": {
          "value": { "type": "boolean" },
          "approved_by": {
            "type": "string",
            "pattern": "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
            "description": "Email del aprobador (distinto a creador)"
          },
          "approved_at": {
            "type": "string",
            "format": "date-time",
            "description": "Timestamp ISO 8601 UTC"
          },
          "signature": {
            "type": "string",
            "pattern": "^[a-f0-9]{64}$",
            "description": "HMAC-SHA256"
          },
          "reason": {
            "type": "string",
            "minLength": 10
          }
        }
      },
      "external_contact": {
        "type": "object",
        "required": ["value", "approved_by", "approved_at", "signature"],
        "properties": {
          "value": { "type": "boolean" },
          "approved_by": { "type": "string" },
          "approved_at": { "type": "string", "format": "date-time" },
          "signature": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
          "reason": { "type": "string", "minLength": 10 }
        }
      }
    }
  }
}
```

**Step 3: Modificar softvibes_context.py** (3 horas)
```python
# En validate_selection()
def validate_approval(selection: dict) -> bool:
    """Validar que aprobaciones tienen firmas válidas y cumplan separación de deberes."""
    
    approvals = selection.get("approvals", {})
    creator = selection.get("metadata", {}).get("created_by")
    
    for action, details in approvals.items():
        if isinstance(details, bool):
            raise ValueError(f"approvals.{action}: formato antiguo (bool). Necesita objeto con firma.")
        
        # Validar que está bien formado
        required = ["value", "approved_by", "approved_at", "signature"]
        for field in required:
            if field not in details:
                raise ValueError(f"approvals.{action}.{field}: requerido")
        
        # Validar separación de deberes
        if details["approved_by"] == creator:
            raise ValueError(
                f"approvals.{action}: creador ({creator}) no puede ser su propio aprobador. "
                f"Requiere 2nd reviewer distinto."
            )
        
        # Validar firma
        APPROVAL_KEY = os.environ.get("SOFTVIBES_APPROVAL_KEY")
        if not APPROVAL_KEY:
            raise ValueError("SOFTVIBES_APPROVAL_KEY no configurada. Ver docs/SECURITY-AUDIT.md")
        
        # Reconstruir payload original
        payload = {
            "value": details["value"],
            "approved_by": details["approved_by"],
            "approved_at": details["approved_at"],
            "reason": details.get("reason", "")
        }
        payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        # Calcular firma esperada
        expected_sig = hmac.new(
            APPROVAL_KEY.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if details["signature"] != expected_sig:
            raise ValueError(
                f"approvals.{action}.signature: inválida. "
                f"¿Fue modificado después de firmar? Rehaz la aprobación."
            )
        
        # Validar timestamp
        approved_dt = datetime.fromisoformat(details["approved_at"])
        if approved_dt > datetime.now(timezone.utc):
            raise ValueError(f"approvals.{action}.approved_at: timestamp en futuro (?)")
    
    return True
```

**Acceptance**:
- [ ] variable-schema.json validado contra nuevo schema
- [ ] softvibes_context.py rechaza approve sin firma
- [ ] softvibes_context.py rechaza auto-firma (creator == approver)
- [ ] APPROVAL_KEY guardado seguro (no en Git)

**Owner**: You

---

#### Task 1.3: Rollback Automático (4 horas)
**What**: GitHub Actions workflow que revierte automáticamente si post-deploy tests fallan.

**Create**: `.github/workflows/deploy-with-rollback.yml`
```yaml
name: Deploy + Rollback

on:
  workflow_dispatch:
    inputs:
      project:
        description: Project ID
        required: true
      environment:
        description: staging | production
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Backup pre-deploy
        run: |
          PROJECT=${{ github.event.inputs.project }}
          BACKUP_DIR="/mnt/backups/$PROJECT"
          mkdir -p "$BACKUP_DIR"
          TIMESTAMP=$(date +%s)
          
          ssh -i ${{ secrets.DEPLOY_KEY }} deploy@vps.softvibes.mx "
            tar -czf $BACKUP_DIR/backup-$TIMESTAMP.tar.gz \
              /var/www/$PROJECT --exclude=node_modules --exclude=.git
            echo $TIMESTAMP > $BACKUP_DIR/CURRENT_BACKUP
          "
          echo "BACKUP_ID=$TIMESTAMP" >> $GITHUB_ENV
      
      - name: Build & Test
        run: |
          cd ${{ github.event.inputs.project }}
          npm ci
          npm run build
          npm run test
      
      - name: Deploy
        run: |
          PROJECT=${{ github.event.inputs.project }}
          ssh -i ${{ secrets.DEPLOY_KEY }} deploy@vps.softvibes.mx "
            rsync -avz --delete dist/ /var/www/$PROJECT/dist/
          "
      
      - name: Health Check
        run: |
          PROJECT=${{ github.event.inputs.project }}
          SITE_URL="https://$PROJECT.softvibes.mx"
          
          sleep 30  # Esperar nginx recargue
          
          if ! curl -f "$SITE_URL/health" 2>/dev/null; then
            echo "Health check failed"
            exit 1
          fi
      
      - name: Auto-Rollback on Failure
        if: failure()
        run: |
          PROJECT=${{ github.event.inputs.project }}
          BACKUP_DIR="/mnt/backups/$PROJECT"
          BACKUP_ID=$(ssh -i ${{ secrets.DEPLOY_KEY }} deploy@vps.softvibes.mx cat $BACKUP_DIR/CURRENT_BACKUP)
          
          echo "🚨 ROLLBACK: reviriendo a backup $BACKUP_ID"
          ssh -i ${{ secrets.DEPLOY_KEY }} deploy@vps.softvibes.mx "
            tar -xzf $BACKUP_DIR/backup-$BACKUP_ID.tar.gz -C /
            systemctl reload nginx
          "
          
          sleep 15
          if curl -f "https://$PROJECT.softvibes.mx/health" 2>/dev/null; then
            echo "✅ Rollback exitoso"
          else
            echo "❌ ROLLBACK FALLÓ - Escalación manual requerida"
            curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
              -d '{"text":"ROLLBACK FAILED for '"$PROJECT"' - manual intervention needed"}'
            exit 1
          fi
      
      - name: Notify Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H "Content-type: application/json" \
            -d '{"text":"Deploy ${{ job.status }}: ${{ github.event.inputs.project }}"}'
```

**Acceptance**:
- [ ] GitHub Actions workflow presente en `.github/workflows/`
- [ ] Deploy trigger manual funciona
- [ ] Rollback se ejecuta automáticamente si tests fallan
- [ ] Backup creado pre-deploy
- [ ] Verificación post-rollback funciona
- [ ] Slack notificación enviada

**Owner**: You

---

### Validation Gates (End of Week 2)
```bash
# Test: Intenta comitear un .env
touch test.env && git add test.env
git commit -m "Test: accidental secret"
# → Debe fallar (gitleaks/detect-secrets rechaza)

# Test: Intenta usar softvibes_context.py sin APPROVAL_KEY
unset SOFTVIBES_APPROVAL_KEY
softvibes_context.py plan selection.json
# → Debe fallar (missing APPROVAL_KEY)

# Test: Deploy a staging, simula fallo de tests, verifica rollback
gh workflow run deploy-with-rollback.yml -f project=valmadero -f environment=staging
# → Debe rollback automáticamente en 5 min
```

---

## WEEK 3-4: DEVELOPER EXPERIENCE (14 hours)

### Goal
Reduce operador new time-to-validation from 35 min to <10 min. Implementar `guide`, errores priorizados, autocomplete.

### Task 3.1: Interactive Guide (8 hours)

**Crear**: `skills/operate-softvibes-sites/scripts/guide.py`

```python
#!/usr/bin/env python3
"""Interactive guide para generar selecciones sin leer docs."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

OPERATIONS = ["inspect", "research", "create", "adapt", "maintain", "publish", "outreach"]
LANGUAGES = ["es", "es+en", "es+en+fr"]
HOSTING = ["none", "hostinger-static-php", "vps", "aws"]

def ask(question: str, choices: list, default=None) -> str:
    """Preguntar con validación."""
    prompt_text = f"{question} [{'/'.join(str(c) for c in choices)}]"
    if default:
        prompt_text += f" (default: {default})"
    
    while True:
        response = input(f"\n{prompt_text}\n→ ").strip().lower()
        if not response and default:
            return default
        if response in [str(c).lower() for c in choices]:
            return response
        print(f"❌ Inválido. Válidas: {choices}")

def main():
    print("\n🚀 Hermes Softvibes Specialist - Guía Interactiva")
    print("=" * 60)
    
    # Recopilar respuestas
    project_id = input("\n¿Project ID? → ").strip()
    operation = ask("¿Operación?", OPERATIONS, "maintain")
    
    # Preguntas condicionales
    languages = "es"
    cms_enabled = False
    
    if operation in ["create", "adapt"]:
        languages = ask("¿Idiomas?", LANGUAGES, "es")
        cms_enabled = ask("¿CMS PHP?", ["y", "n"], "n") == "y"
    
    hosting = "none"
    if operation in ["create", "adapt", "publish"]:
        hosting = ask("¿Hosting?", HOSTING, "none")
    
    analytics = "ga4"
    if operation in ["create", "publish"]:
        analytics = ask("¿Analytics?", ["ga4", "plausible", "none"], "ga4")
    
    # Generar selection.json
    selection = {
        "$schema": "file:../references/variable-schema.json",
        "$comment": "Generado por 'guide'. VS Code autocomplete habilitado (Cmd+Space).",
        "metadata": {
            "project_id": project_id,
            "operation": operation,
            "created_by": os.environ.get("SOFTVIBES_OPERATOR", "unknown@softvibes.mx"),
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        "selection": {
            "project_id": project_id,
            "operation": operation,
            "source": f"workspace/{project_id}",
            "destination": None
        },
        "identity": {
            "brand_name": "[ACTUALIZA: nombre del cliente]",
            "short_name": project_id,
            "domain": "[ACTUALIZA: dominio]",
            "industry": "real-estate",
            "location": "México",
            "languages": languages.split("+")
        },
        "infrastructure": {
            "stack": "astro",
            "cms_enabled": cms_enabled,
            "hosting_type": hosting,
            "analytics": analytics
        },
        "approvals": {
            "deploy": {"value": False, "approved_by": None, "approved_at": None, "signature": None, "reason": None},
            "external_contact": {"value": False, "approved_by": None, "approved_at": None, "signature": None, "reason": None}
        }
    }
    
    # Guardar
    output = Path(f"/tmp/{project_id}-selection.json")
    output.write_text(json.dumps(selection, ensure_ascii=False, indent=2))
    
    print(f"\n✅ Generado: {output}")
    print(f"\n📋 Próximos pasos:")
    print(f"   1. Abre en VS Code para autocomplete: code {output}")
    print(f"   2. Actualiza [ACTUALIZA: ...] campos")
    print(f"   3. Valida: softvibes_context.py validate {output}")
    print(f"   4. Plan: softvibes_context.py plan {output}")
    
    return 0

if __name__ == "__main__":
    exit(main())
```

**Integrate into softvibes_context.py**:
```python
# Add to argument parser
subparsers.add_parser('guide', help='Interactive guide to generate selections')

# Add handler
def command_guide(args):
    from guide import main
    return main()
```

**Acceptance**:
- [ ] `softvibes_context.py guide` runs interactively
- [ ] Generates valid selection.json with $schema
- [ ] Output has helpful comments
- [ ] Asks only necessary questions (conditional)

---

### Task 3.2: Error Prioritization (6 hours)

**Modify**: `softvibes_context.py validate`

```python
def command_validate(args: argparse.Namespace) -> int:
    selection = load_json(args.selection)
    errors = validate_selection_detailed(selection)
    
    # Priorizar
    errors.sort(key=lambda e: (e["severity"] != "blocker", e["priority"]))
    
    output = {
        "valid": len([e for e in errors if e["severity"] == "blocker"]) == 0,
        "errors_prioritized": errors,
        "roadmap": generate_roadmap(errors),
        "stats": {
            "blockers": len([e for e in errors if e["severity"] == "blocker"]),
            "errors": len([e for e in errors if e["severity"] == "error"]),
            "warnings": len([e for e in errors if e["severity"] == "warning"])
        }
    }
    
    emit(output)
    return 0 if output["valid"] else 1

def generate_roadmap(errors):
    blockers = [e for e in errors if e["severity"] == "blocker"]
    if blockers:
        return f"⚠️ Tienes {len(blockers)} bloqueadores. Arregla priority 1 primero, luego valida de nuevo."
    return "✅ Sin errores bloqueadores. Procede a: softvibes_context.py plan"
```

**Acceptance**:
- [ ] Validate output includes `errors_prioritized` list
- [ ] Blockers come first
- [ ] Each error has `hint` + `action` fields
- [ ] Roadmap guides fix order

---

### Task 3.3: VS Code Integration ($schema) (2 hours)

**Create**: `.vscode/settings.json`
```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/softvibes-selection.json", "**/*-selection.json"],
      "url": "./references/variable-schema.json"
    }
  ]
}
```

**Create**: `.vscode/extensions.json`
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "redhat.vscode-yaml"
  ]
}
```

**Acceptance**:
- [ ] `.vscode/` folder committed
- [ ] Open selection.json in VS Code
- [ ] Cmd+Space shows autocomplete
- [ ] Hover shows field descriptions

---

## WEEK 5-6: OBSERVABILITY (8 hours)

### Goal
CloudWatch audit log + dashboard. Trazabilidad total de aprobaciones, deploys, errores.

### Task 5.1: CloudWatch Integration (4 hours)

**Add to softvibes_context.py**:
```python
import boto3
import json
from datetime import datetime

CLOUDWATCH = boto3.client('logs', region_name='us-east-1')
LOG_GROUP = '/softvibes/hermes'
LOG_STREAM = f'operations-{date.today()}'

def audit_log(event: dict):
    """Registrar evento en CloudWatch."""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "operator": os.environ.get("SOFTVIBES_OPERATOR"),
        "event_type": event.get("type"),  # approval, deploy, error, audit
        "project_id": event.get("project_id"),
        "details": event.get("details")
    }
    
    try:
        CLOUDWATCH.put_log_events(
            logGroupName=LOG_GROUP,
            logStreamName=LOG_STREAM,
            logEvents=[{
                'timestamp': int(datetime.now().timestamp() * 1000),
                'message': json.dumps(log_entry, ensure_ascii=False)
            }]
        )
    except Exception as e:
        print(f"CloudWatch error: {e}")  # No fallar si CloudWatch no responde

# Call audit_log en cada punto crítico:
# - command_plan: audit_log({"type": "approval_requested", "project_id": ...})
# - command_init: audit_log({"type": "selection_created", "project_id": ...})
# - githubActions rollback: audit_log({"type": "rollback_executed", "project_id": ...})
```

**Acceptance**:
- [ ] audit_log() calls integrated in softvibes_context.py
- [ ] CloudWatch log group created
- [ ] Sample entries visible in CloudWatch Logs Insights

---

### Task 5.2: Dashboard (4 hours)

**Create CloudWatch Dashboard**:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name HermesOperator \
  --dashboard-body file://dashboard.json
```

**dashboard.json**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Logs", "IncomingBytes", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Hermes Activity"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields timestamp, operator, event_type | stats count() by event_type",
        "region": "us-east-1",
        "title": "Events by Type (24h)"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields timestamp, project_id, details.status | filter event_type='deploy' | stats count() by project_id",
        "region": "us-east-1",
        "title": "Deploys by Project"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields timestamp, operator | filter event_type in ['approval_requested', 'deploy'] | stats count() by operator",
        "region": "us-east-1",
        "title": "Operator Activity"
      }
    }
  ]
}
```

**Acceptance**:
- [ ] Dashboard visible in CloudWatch
- [ ] Shows deployments, approvals, errors
- [ ] Operator activity tracked
- [ ] Can filter by project_id

---

## WEEK 7-8: TESTING & CERTIFICATION (8 hours)

### Goal
3 operadores certificados usando Hermes sin escalación. Zero incidents.

### Task 7.1: Operator Handbook (4 hours)

**Create**: `docs/OPERATOR-HANDBOOK.md`
```markdown
# Operator Handbook

## Daily Workflow

1. **Project selection** → `softvibes_context.py list --query <name>`
2. **Generate selection** → `softvibes_context.py guide --project <id>`
3. **Review & edit** → Open selection.json in VS Code (autocomplete!)
4. **Validate** → `softvibes_context.py validate selection.json`
5. **Plan** → `softvibes_context.py plan selection.json`
6. **Request approval** → Send plan to Roger + approval form
7. **Deploy** → Awaitar approval signature + run GitHub Actions
8. **Verify** → curl https://site.softvibes.mx/health

## Common Errors

### "Desconocido: 'valmadiro'"
→ Typo en project_id. Usa `list --query valm` para buscar.

### "cms_password: Secreto expuesto"
→ Reemplaza valor con nombre de variable: `$SOFTVIBES_CMS_PASSWORD`

### "created_by == approved_by"
→ Otro operador debe aprobar. Pide a [operator2@softvibes.mx]

## Security Checklist

- [ ] Nunca commitees .env files
- [ ] Aprobaciones siempre tienen signature (HMAC)
- [ ] Dos operadores distintos: creador ≠ aprobador
- [ ] Post-deploy verify: curl /health en vivo
- [ ] Si algo falla: rollback automático en <5 min
```

**Acceptance**:
- [ ] Handbook written and clear
- [ ] All common errors documented
- [ ] Security checklist included

---

### Task 7.2: Cert Program (4 hours)

**3-step certification**:

**Step 1: Theory (1 hour)**
- Leer SOUL.md + Handbook
- Entender separación de deberes
- Quiz: 10 preguntas (8/10 pass)

**Step 2: Hands-on (2 hours)**
- Ejecuta `guide` y genera selección para proyecto ficticio
- Ejecuta `validate` y arregla 5 errores deliberados
- Deploy a staging
- Verify post-deploy health

**Step 3: Live (1 hour)**
- Co-execute con tú en proyecto real
- Ellos crean sitio, tú lo apruebas
- Verifica todo funcione
- Firma certificado

**Acceptance Criteria**:
- [ ] 3 operadores certificados
- [ ] Quiz score 8+/10
- [ ] Hands-on all passing
- [ ] Live co-execution successful
- [ ] Zero security/data incidents

---

## WEEK 9-10: FIRST CUSTOMER PILOT (Variable)

### Goal
Identificar y firmar primer cliente. Co-execute 5 sites.

### Target Profile
- Real estate boutique agency
- 5-15 sites/year
- Pain: "20 properties toman 60 days; necesitamos 10"
- Budget: $8K pilot (5 sites)

### Execution
1. **Discovery Call** (1 hour)
   - Pain assessment
   - Timeline
   - Budget check

2. **Co-Execution** (40 hours over 4 weeks)
   - Week 1-2: Build 3 sites together (you + client)
   - Week 3-4: Client builds 2 sites solo (you QA)
   - Outcome: Is 20/month achievable?

3. **Proposal** (1 hour)
   - Retainer: $4K/mo
   - Per-site: $800 OR $8K/bulk-10
   - Revenue share: 8% if ARR > $300K in 18 months

4. **Contract** (2 hours)
   - 3-year commitment (not month-to-month)
   - Operator certification included
   - SLA: <24h response, zero data incidents

**Acceptance**:
- [ ] First customer signed
- [ ] 5 sites deployed in pilot
- [ ] NPS > 50
- [ ] Customer commits 3-year renewal

---

## GO/NO-GO GATES

### End of Week 2 (Critical Security)
**Go** if:
- [ ] Pre-commit hooks reject secrets
- [ ] Approval signatures validated
- [ ] Rollback < 5 minutes

### End of Week 4 (DX)
**Go** if:
- [ ] Operador novo: <10 min guide → validate
- [ ] Validate output: prioritized errors with hints
- [ ] VS Code autocomplete works

### End of Week 6 (Observability)
**Go** if:
- [ ] CloudWatch logs visible
- [ ] Dashboard shows 4+ metrics
- [ ] Audit trail queryable by project

### End of Week 8 (Certification)
**Go** if:
- [ ] 3 operators certified
- [ ] Zero escalations on certified tasks
- [ ] All passing Handbook quiz

### End of Week 10 (Customer)
**Go** if:
- [ ] First customer signed
- [ ] 5 sites deployed successfully
- [ ] Revenue share agreement in place

---

## Risks & Contingencies

| Risk | Probability | Mitigation |
|------|---|---|
| APPROVAL_KEY lost | 5% | Backup in 1Password + AWS Secrets Manager |
| GitHub Actions quota exceeded | 10% | Pre-deploy: request approval manually if quota low |
| VPS storage full (backups) | 15% | Cleanup old backups: retention 90 days max |
| Operator leaves mid-cert | 20% | Cross-train 2nd operator in parallel |
| First customer delays pilot | 30% | Have 2nd prospect warmed up as backup |

---

## Success Metrics (End of 12 Weeks)

- ✅ 3 brechas críticas de seguridad cerradas
- ✅ DX improved: <10 min time-to-validate (vs. 35 min)
- ✅ 3 operadores certificados sin escalación
- ✅ Observability: 100% audit trail visible
- ✅ First customer signed + 5 sites deployed
- ✅ Zero data contamination incidents
- ✅ Rollback success rate: 100% (<5 min)

---

## Budget & Resources

**Your time**: ~40-50 hours (distributed)
- Security fixes: 13h
- DX: 14h
- Observability: 8h
- Testing/Cert: 8h
- Customer pilot: 40h (variable, split across weeks 9-10)

**Infrastructure**:
- CloudWatch: ~$5/month
- GitHub Actions: included in free tier
- VPS backup storage: ~$10/month

**No additional hiring needed for Weeks 1-8.**

---

## Next Step

**TODAY**: Start Week 1 (security fixes).
**DELIVERABLE END OF WEEK 2**: All pre-commit hooks active, approval signatures validated, rollback tested.

¿Listo para empezar?

