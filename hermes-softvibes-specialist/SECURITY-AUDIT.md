# Security Audit: Hermes Softvibes Specialist

**Evaluador**: Security Engineer  
**Fecha**: 2026-08-06  
**Clasificación**: Internal Review

---

## Matriz de Amenazas (Probabilidad × Impacto)

| Amenaza | Prob. | Impacto | Riesgo | Controles Hoy | Estado |
|---------|-------|--------|--------|---------------|--------|
| **Data leakage entre clientes** (copiar JSON A→B) | 0.8 | 5 (crítico) | 🔴 **CRÍTICO** | Validación JSON; audit manual | Sin prevención runtime |
| **Secrets versionados en Git** (.env, tokens) | 0.6 | 5 (crítico) | 🔴 **CRÍTICO** | Detectados post-commit | Reactivo; breach posible |
| **Aprobador malicioso autopublica** (deploy=true sin autorización) | 0.7 | 5 (crítico) | 🔴 **CRÍTICO** | Ninguno | Sin firma, sin auditoría |
| **Operador copia proyecto sin autorización** | 0.6 | 4 (alto) | 🟠 **ALTO** | Schema validation | Sin separación de deberes |
| **Post-deploy integrity**: sitio ≠ validado en producción | 0.5 | 4 (alto) | 🟠 **ALTO** | Ninguno | Sin checksums |
| **Rollback fallido** → downtime conversiones | 0.5 | 4 (alto) | 🟠 **ALTO** | Manual extremadamente lento | RTO = horas |
| **Contaminación de template** (referencias Vivemar) | 0.3 | 4 (alto) | 🟡 **MEDIO** | Detectada por audit | No bloqueada automáticamente |
| **Acceso sin RBAC** (si tienes código, lo ejecutas) | 0.8 | 3 (medio) | 🟡 **MEDIO** | Ninguño | Scripts públicos en repo |

---

## 🔴 REMEDIACIONES CRÍTICAS (Esta semana)

### 1. Detección Pre-Commit de Secretos

**Problema**: `.env` y credenciales pueden comprometerse antes de que `audit` lo detecte.

**Solución**:
```bash
# Instalar en root del workspace
pip install pre-commit gitleaks detect-secrets
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/gitleaks/gitleaks-action
    rev: v3.17.0
    hooks:
      - id: gitleaks
        args: ['--verbose', '--exit-code', '1']
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline', '--no-verify']
EOF

# Generar baseline (primer run)
detect-secrets scan > .secrets.baseline

# Instalar en todos los repos del workspace
for repo in MenuVibes softvibes-flow vivemar fabiola-mvp valmadero; do
  cd "$repo"
  pre-commit install
  pre-commit run --all-files  # validar antes
done
```

**GitHub Branch Protection**:
```yaml
# En Settings → Branches → main
- Require status checks to pass before merging
  - gitleaks
  - detect-secrets
```

**Impacto**: Cero secrets pueden commitearse; catch immediate en `git commit`.

---

### 2. Trazabilidad de Aprobaciones (Firmas HMAC)

**Problema**: `approvals.deploy=true` no tiene evidencia de quién autorizó, cuándo, ni por qué.

**Solución en softvibes_context.py**:
```python
import hmac
import hashlib
from datetime import datetime, timezone

APPROVAL_KEY = os.environ.get("SOFTVIBES_APPROVAL_KEY")  # 32-byte secret, rotado mensualmente

def sign_approval(approval_dict: dict) -> str:
    """Generar firma HMAC-SHA256 de aprobación."""
    payload = json.dumps(approval_dict, sort_keys=True, separators=(',', ':'))
    sig = hmac.new(
        APPROVAL_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return sig

def validate_approval(selection: dict) -> bool:
    """Rechazar si aprobación no tiene firma válida o es autofirmada."""
    approvals = selection.get("approvals", {})
    
    for action, details in approvals.items():
        if isinstance(details, bool):
            # Formato antiguo; rechazar
            raise ValueError(f"approvals.{action} debe ser objeto con firma")
        
        if not details.get("signature"):
            raise ValueError(f"approvals.{action} falta firma HMAC")
        
        # Validar firma
        expected_sig = sign_approval({
            "value": details["value"],
            "approved_by": details["approved_by"],
            "approved_at": details["approved_at"],
            "reason": details.get("reason", "")
        })
        
        if details["signature"] != expected_sig:
            raise ValueError(f"approvals.{action} firma inválida (¿modificado después de firmar?)")
        
        # Validar separación de deberes: quién creó ≠ quién aprobó
        if selection["metadata"]["created_by"] == details["approved_by"]:
            raise ValueError(
                f"approvals.{action}: creador no puede ser su propio aprobador. "
                f"Requiere 2nd reviewer diferente."
            )
        
        # Validar timestamp no es de futuro
        approved_dt = datetime.fromisoformat(details["approved_at"])
        if approved_dt > datetime.now(timezone.utc):
            raise ValueError(f"approvals.{action}: timestamp en el futuro (?)")
    
    return True

# En command_plan():
def command_plan(args: argparse.Namespace) -> int:
    selection = load_json(args.selection)
    
    try:
        validate_approval(selection)
    except ValueError as e:
        emit({"error": str(e), "code": "APPROVAL_INVALID"})
        return 1
    
    # Proceder a generar plan
    # ...
```

**Schema actualizado** (variable-schema.json):
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
            "description": "HMAC-SHA256 del payload"
          },
          "reason": {
            "type": "string",
            "minLength": 10,
            "description": "Por qué se aprueba esta acción"
          }
        }
      }
    }
  }
}
```

**Auditoría**:
```bash
# Ver quién aprobó qué, cuándo y por qué
$ grep -r "approved_by" deployments/ | jq '.approvals.deploy.reason'

# Verificar que no hay auto-firmas
$ jq -r '.metadata.created_by as $creator | .approvals.deploy.approved_by as $approver | 
    if $creator == $approver then "AUTO-FIRMA: " + $creator else "✓ OK" end' \
    deployments/**/*.json
```

**Impacto**: Toda aprobación es trazable, verificable, irrepudiable.

---

### 3. Rollback Automático Post-Deploy (5 min RTO)

**Problema**: Si deploy rompe, RTO = horas (manual). Sin garantía de integridad.

**Solución - GitHub Actions** (crear `.github/workflows/deploy-with-rollback.yml`):
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
          
          ssh deploy@vps.softvibes.mx "
            tar -czf $BACKUP_DIR/backup-$TIMESTAMP.tar.gz \
              /var/www/$PROJECT --exclude=node_modules --exclude=.git
            echo $TIMESTAMP > $BACKUP_DIR/CURRENT_BACKUP
          "
          echo "BACKUP_ID=$TIMESTAMP" >> $GITHUB_ENV
      
      - name: Build & Deploy
        run: |
          cd ${{ github.event.inputs.project }}
          npm ci
          npm run build
          npm run test:integration  # tests antes de deployar
          
          # Sync a VPS
          rsync -avz --delete dist/ deploy@vps.softvibes.mx:/var/www/${{ github.event.inputs.project }}/dist/
      
      - name: Health Check + Smoke Tests
        id: health
        run: |
          PROJECT=${{ github.event.inputs.project }}
          SITE_URL="https://$PROJECT.softvibes.mx"
          
          # Esperar 30s a que nginx recargue
          sleep 30
          
          # Health check
          if ! curl -f "$SITE_URL/health" 2>/dev/null; then
            echo "❌ Health check failed"
            exit 1
          fi
          
          # Smoke test: landing page carga
          if ! curl -f "$SITE_URL/" 2>/dev/null | grep -q "<title>"; then
            echo "❌ Landing page error"
            exit 1
          fi
          
          echo "✅ Deployment healthy"
      
      - name: Auto-Rollback on Failure
        if: failure() && steps.health.outcome == 'failure'
        run: |
          PROJECT=${{ github.event.inputs.project }}
          BACKUP_ID=$(cat /mnt/backups/$PROJECT/CURRENT_BACKUP)
          
          echo "🚨 ROLLBACK INICIADO: reviriendo a backup $BACKUP_ID"
          ssh deploy@vps.softvibes.mx "
            BACKUP_DIR='/mnt/backups/$PROJECT'
            tar -xzf $BACKUP_DIR/backup-$BACKUP_ID.tar.gz -C /
            systemctl reload nginx
          "
          
          # Verificar rollback exitoso
          sleep 15
          if curl -f "$SITE_URL/health" 2>/dev/null; then
            echo "✅ Rollback exitoso"
          else
            echo "🔴 ROLLBACK FALLÓ - Escalación manual requerida"
            exit 1
          fi
      
      - name: Notify
        if: always()
        run: |
          # Enviar a Slack
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d "{"text":"Deploy ${{ job.status }}: ${{ github.event.inputs.project }}"}"
```

**Métricas post-deploy**:
- RTO: 5 minutos (automático vs. horas manual)
- RPO: 0 (snapshot inmediato pre-deploy)
- Detectabilidad: <30 segundos (health check automático)

---

## 🟠 REMEDIACIONES ALTAS (Próximas 2 semanas)

### 4. Checksums Post-Deploy (Integridad de Sitio)

```bash
# Pre-deploy en CI/CD
SITE_HASH=$(find dist/ -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1)
echo "$SITE_HASH" > .build-hash
git add .build-hash && git commit -m "Build: $SITE_HASH"

# Post-deploy en VPS
ssh deploy@vps.softvibes.mx "
  cd /var/www/$PROJECT
  LIVE_HASH=$(find dist/ -type f -exec sha256sum {} \; | sha256sum | cut -d' ' -f1)
  EXPECTED_HASH=$(cat .build-hash)
  
  if [ '$LIVE_HASH' != '$EXPECTED_HASH' ]; then
    echo 'MISMATCH: tampering detectado'
    exit 1
  fi
"
```

**Impacto**: Detecta cambios no autorizados en producción.

---

### 5. Validación Multi-Tenant Runtime

```python
# audit --project X debe rechazar acceso a archivos de Cliente Y
def audit_project(project_id: str, workspace: Path) -> dict:
    project_path = workspace / project_id
    
    if not project_path.exists():
        raise ValueError(f"Project not found: {project_id}")
    
    issues = []
    
    for file_path in project_path.rglob("*"):
        # Validar que archivo pertenece a este proyecto
        if not str(file_path).startswith(str(project_path)):
            issues.append({
                "severity": "CRITICAL",
                "type": "PATH_TRAVERSAL",
                "message": f"Cross-project access detected: {file_path}"
            })
        
        # Validar datos
        if file_path.suffix in ['.json', '.ts', '.js']:
            content = file_path.read_text()
            
            # Buscar referencias de otros proyectos
            for other_project in project_map().keys():
                if other_project != project_id and other_project in content:
                    issues.append({
                        "severity": "HIGH",
                        "type": "DATA_LEAKAGE",
                        "file": str(file_path),
                        "message": f"Reference to {other_project} found"
                    })
    
    return {"project": project_id, "issues": issues}
```

---

### 6. RBAC Básico por Operador

```json
{
  "roles.json": {
    "operator@softvibes.mx": {
      "permissions": [
        "inspect",
        "research", 
        "create:astro-client-site",
        "maintain:*"
      ],
      "delegatable": false,
      "expires": "2026-12-31"
    },
    "junior@softvibes.mx": {
      "permissions": [
        "inspect",
        "research"
      ],
      "delegatable": false,
      "expires": "2026-12-31"
    }
  }
}
```

Validar en `command_plan()`:
```python
operator = os.environ.get("SOFTVIBES_OPERATOR")
operation = selection["metadata"]["operation"]
family = selection["metadata"]["family"]

required_permission = f"{operation}:{family}"

if not has_permission(operator, required_permission):
    raise PermissionError(f"Operator {operator} cannot {required_permission}")
```

---

## SLA de Respuesta: Incidente de Contaminación Cliente

| Fase | Tiempo | Acción |
|------|--------|--------|
| **Detección** | <5 min | Hash mismatch OR audit fallido. Alerta Slack. |
| **Contención** | <15 min | Rollback automático. Verificar contenido correcto. |
| **Investigación** | <2 h | Revisar logs de aprobación, quién editó, qué cambió. Auditar BD. |
| **Comunicación** | <4 h | Notificar Cliente A + Cliente B (si data expuesta). |
| **Remediación** | <24 h | Auditar integridad completa de BD. Report post-mortem. |
| **Escalación** | <1 h | Si datos sensibles (email, teléfono, bancarios) → Compliance. |

---

## Matriz de Controles: Build vs. Accept Risk

| Control | Build | Aceptar | Justificación |
|---------|-------|---------|---|
| Pre-commit secrets detection | ✅ | - | Crítico; prevenible |
| Signed approvals (HMAC) | ✅ | - | Irrepudiable; no negotiable |
| Post-deploy checksums | ✅ | - | Detecta tampering |
| Rollback automático | ✅ | - | 5 min vs. horas |
| Rate limit (5 ops/día) | ⊙ | ✅ | Manual; previene spam |
| Encriptación secretos | - | ✅ | Confiar SO (`chmod 600`) |
| SIEM centralizado | ⊙ | ✅ | CloudWatch hoy; Datadog si >10K logs/día |
| Biometric auth | - | ✅ | Overengineering para operación interna |

---

## Checklist de Implementación

- [ ] Pre-commit hooks instalados en 5+ repos
- [ ] `.pre-commit-config.yaml` versionado en root
- [ ] GitHub branch protection activa (gitleaks + detect-secrets required)
- [ ] Approval HMAC integrado en variable-schema.json
- [ ] `softvibes_context.py` valida firmas antes de `plan`
- [ ] Rollback workflow en `.github/workflows/`
- [ ] Smoke tests post-deploy
- [ ] Checksums `.build-hash` en CI/CD
- [ ] RBAC en `roles.json` + validación en runtime
- [ ] SLA de respuesta documentado en runbook
- [ ] Alerta Slack ante detección de contaminación
- [ ] Audit trail en CloudWatch

---

## Referencias

- OWASP Top 10: Injection, Broken Auth, Sensitive Data
- CWE-639: Authorization Bypass
- CWE-434: Unrestricted File Upload (multi-tenant)
- PCI-DSS 3.2: Secrets Management

