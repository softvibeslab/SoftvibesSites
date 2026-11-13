# Perfil Hermes · `detailbox-pad` (perfil B, Copiloto PAD)

Asistente de los **alumnos** dentro del Workshop PAD (`workshop/`). Se abre como popup en la app del alumno y responde con el contexto de su workbook: diagnóstico, segmento, paquetes con márgenes ya calculados, ventas, calendario, plan y revisión.

## Cómo se conecta

```
App del alumno (popup) → POST /api/copiloto → backend del workshop
  → arma reglas + contexto SOLO de ese alumno
  → hermes_bridge.py → hermes_worker.py (Python de Hermes, perfil detailbox-pad)
  → una inferencia, sin herramientas, terminal, archivos ni memoria → texto
```

- **Identidad:** `SOUL.md` de este folder (copiado al perfil). Incluye el conocimiento esencial del Método PAD porque el worker no lee archivos.
- **Reglas por petición:** `COPILOT_RULES` en `workshop/backend/app.py`.
- **Contexto:** `progress.context_text()`. Solo datos del alumno con sesión; los cálculos los hace el servidor, no el modelo.
- **Sin perfil o sin autenticación:** la app lo muestra como «no conectado» y ofrece copiar el prompt con la información del alumno (alternativa funcional que pide el workbook §6).

## Instalar

```sh
python3 agentes/pad/hermes/preparar_perfil.py                 # vista previa
HERMES_BIN=~/.hermes/hermes-agent/venv/bin/hermes \
  python3 agentes/pad/hermes/preparar_perfil.py --install     # crea el perfil y fija el modelo
```

El modelo se fija con `DETAILBOX_PAD_MODEL` y `DETAILBOX_PAD_PROVIDER` (por defecto `gpt-6-astra` vía `openai-codex`, el único transporte que soporta el worker hoy). El instalador:

- no clona otros perfiles;
- no instala skills;
- no inicia gateway;
- no sobrescribe un `SOUL.md` existente.

## Estado (13-nov-2026)

- Instalado en `~/.hermes/profiles/detailbox-pad` (Mac de Roger).
- `status` del worker → `configured: true`.
- **Consulta real verificada** (≈39 s) con un alumno de ejemplo y el acceso «Mejorar mis paquetes y precios»:
  - usó los márgenes de la plataforma y etiquetó hipótesis;
  - no inventó precios;
  - pidió solo dos datos faltantes.
- En local usa la autenticación global de Hermes en modo solo lectura. **En producción debe llevar la llave propia de Detailbox (decisión D4)** y su propio límite de gasto.

## Pruebas

```sh
python3 -m unittest discover -s agentes/pad/hermes/tests -p 'test_*.py' -v
```
