# Perfil de Hermes — MenuVibes Operator

Paquete para dar de alta en **Hermes Workspace** (`https://hermes.rovicrm.com`, el
workspace de agentes Claude self-hosted en el VPS `31.220.63.211`) un perfil que:

1. Conoce toda la arquitectura de MenuVibes (proyecto `MenuVibes/whitelabel`).
2. Se conecta a la información de **todos los negocios** (24+ en Supabase).
3. Puede crear/editar/publicar menús, branding, NPS→reseñas y kits de prospección.

## Contenido
| Archivo | Qué es |
|---|---|
| `menuvibes-operator.md` | El **perfil/agente** (frontmatter + system prompt), formato Claude Agent SDK. |
| `negocios.py` | Toolkit de datos: `list`, `get <slug>`, `features`, `canal`. Acceso a todos los negocios vía REST service_role. |
| `README.md` | Este archivo. |

## Cómo instalarlo en Hermes (VPS)
Hermes carga agentes con la convención Claude Agent SDK (archivos `.md` en su carpeta de
agentes, igual que `~/.claude/agents/`). Instalación:

1. **Sube el perfil** a la carpeta de agentes de Hermes en el VPS (vía hPanel → VPS →
   Browser Terminal, o SSH):
   ```bash
   # en el VPS, dentro del workspace de Hermes (ajusta la ruta a tu instalación):
   mkdir -p ~/hermes/agents && cd ~/hermes/agents
   # pega menuvibes-operator.md aquí (nano/vim o scp)
   ```
2. **Sube el proyecto MenuVibes** (o móntalo) para que el agente tenga contexto:
   el repo `MenuVibes/` con `whitelabel/schema.sql`, `menu.html`, `dashboard.html`,
   y `MenuVibes-private/prospectos/` (scripts `build-*.py`).
3. **Configura las credenciales** como variables de entorno del workspace/job
   (NO en archivos):
   ```bash
   export SUPABASE_URL=https://supabase.rovicrm.com
   export SUPABASE_SERVICE_KEY=<service_role>     # rotar tras usar
   ```
4. **Verifica** desde Hermes:
   ```bash
   python3 agents/negocios.py list          # debe listar los 24 negocios
   python3 agents/negocios.py get sicilia-amo
   ```

## Opción MCP (acceso a DB nativo)
Hermes puede conectarse al Supabase vía MCP en lugar del toolkit REST. El servidor MCP
existe en `https://supabase.rovicrm.com/mcp` pero requiere **OAuth interactivo**
(estado "Needs authentication" en pruebas previas). Config sugerida:
```json
{
  "mcpServers": {
    "supabase-rovicrm": {
      "type": "http",
      "url": "https://supabase.rovicrm.com/mcp"
    }
  }
}
```
Autoriza una vez desde la sesión interactiva de Hermes (`/mcp`) y el agente tendrá
lectura/escritura de todas las tablas sin manejar la service_role a mano.

## Ganchos de agente ya presentes en la DB
La tabla `features` en vivo incluye columnas que sugieren integración agente↔negocio:
`agente_activo`, `agente_orquestador`, `agente_ventas`, `agente_atencion`.
Si Hermes debe **activarse por negocio**, este perfil puede togglear esos flags
(extender `negocios.py` con un subcomando `agente <slug> --activo on`).

## Seguridad
- La **service_role key** da acceso total: pásala por entorno, nunca en archivos ni chat, y rótala periódicamente (Supabase → Settings → API → Reset service_role).
- Para acceso de solo-lectura, considera crear una API key/rol restringido en Supabase en vez de service_role.
