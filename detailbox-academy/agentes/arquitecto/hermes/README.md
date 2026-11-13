# Perfil Hermes · `detailbox-arquitecto` (perfil A)

Socio estratégico y técnico **interno** de Detailbox Academy. Sigue `curso/masterprompt.md` y `curso/skill.md` para producir y mantener los 15 entregables de arquitectura de Detailbox AI Ecosystem (§15) y el registro de decisiones. **No atiende alumnos**: eso le corresponde al perfil B `detailbox-pad`, que se construye cuando se aprueben D1–D4 (ver `docs/arquitectura-maestra/DECISIONES.md`).

## Contenido

| Archivo | Uso |
|---|---|
| `SOUL.md` | Identidad, orden de fuentes, forma de trabajo y límites |
| `skills/detailbox-arquitectura/SKILL.md` | Mapa de los 15 entregables, plantillas (ficha de agente, decisión) y control de calidad |
| `preparar_perfil.py` | Instalador: vista previa por defecto; `--install` crea el perfil y copia solo los archivos que falten |
| `tests/test_preparar_perfil.py` | Pruebas del instalador con un Hermes simulado y carpetas temporales |

El conocimiento **no se duplica** dentro del perfil. El directorio de trabajo (`terminal.cwd`) apunta a `detailbox-academy/`, y el agente lee de ahí `curso/`, `docs/RESEARCH.md` y `docs/arquitectura-maestra/`. Si se edita la Base PAD o el masterprompt, el perfil usa la versión nueva sin reinstalar.

## Instalar

```sh
python3 agentes/arquitecto/hermes/preparar_perfil.py                  # vista previa
HERMES_BIN=~/.hermes/hermes-agent/venv/bin/hermes \
  python3 agentes/arquitecto/hermes/preparar_perfil.py --install      # crear
hermes --profile detailbox-arquitecto setup model                    # proveedor/modelo
```

`DETAILBOX_REPO_PATH` es opcional: por defecto se usa la carpeta `detailbox-academy/` que contiene este archivo. El instalador:

- no clona otros perfiles, memorias ni credenciales;
- no sobrescribe un `SOUL.md` ni una skill que ya existan;
- no inicia gateway.

Si se actualiza `SOUL.md` o la skill en el repositorio, hay que copiarlos al perfil a mano después de revisar el cambio.

## Estado (13-nov-2026)

- **Instalado** en `~/.hermes/profiles/detailbox-arquitecto` (Mac de Roger), con `terminal.cwd` apuntando a este repositorio.
- **Modelo:** `gpt-6-astra` vía `openai-codex`, igual que los perfiles internos de Softvibes. Usa la autenticación global de Hermes en modo solo lectura. Es un perfil interno; el perfil B de alumnos llevará la llave propia de Detailbox (decisión D4).
- **Prueba de humo real** (sesión `20261113_011845_a25400`, solo lectura):
  - leyó las 6 fuentes y listó D1–D10 como pendientes;
  - propuso revisar el documento maestro antes de diseñar pantallas;
  - **se negó a programar el dashboard** antes de las decisiones (§17);
  - detectó la discrepancia de alcance que ahora es la decisión D11;
  - no escribió archivos ni marcó decisiones como aprobadas.
- No está conectado a Telegram ni a ninguna web.

## Uso

```sh
hermes --profile detailbox-arquitecto                 # conversación
hermes --profile detailbox-arquitecto chat -q "Redacta la ficha técnica de la función 2 · Paquetes y Precios"
```

Para comprobar el instalador:

```sh
python3 -m unittest discover -s agentes/arquitecto/hermes/tests -p 'test_*.py' -v
```
