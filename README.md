# Softvibes · Ecosistema de creación web

Paquete portable de habilidades, agentes, reglas y procesos para investigar, diseñar,
construir y verificar sitios web. No incluye las páginas desarrolladas, sus activos,
contenido comercial, credenciales ni historial Git.

## Empezar

Requiere Python 3.10+ y macOS o Linux para el instalador con enlaces simbólicos.
Git es opcional si descargas el ZIP. No necesita pip ni npm para instalar el paquete.

```bash
git clone --single-branch --branch devecositem --depth 1 https://github.com/softvibeslab/SoftvibesSites.git softvibes-ecosistema
cd softvibes-ecosistema
python3 scripts/ecosystem.py verify
python3 scripts/ecosystem.py list --profile web
python3 scripts/ecosystem.py init --project ../mi-estudio
python3 scripts/ecosystem.py install --project ../mi-estudio --profile web
```

Abre `mi-estudio` en tu agente, inicia una sesión nueva y usa este encargo:

> Aplica softvibes-web-workflow para crear un sitio. Primero lee el brief y el inventario,
> confirma qué datos faltan y documenta la elección de base. Luego implementa y verifica
> la conversión principal. Usa exclusivamente contenido autorizado para este proyecto.

El repositorio original puede requerir acceso. Para compartir solo el ecosistema, entrega el
ZIP de esta rama. Dar acceso al repositorio también permite consultar sus otras ramas.

## Qué incluye

- Catálogo completo en [catalog/SKILLS.md](catalog/SKILLS.md), con origen, variantes y rutas.
- Perfil `web` seleccionado para investigación, requisitos, copy, diseño, desarrollo, SEO,
  conversión, accesibilidad, pruebas y entrega. Perfil `all` para explorar el catálogo completo.
- Plugin `plugins/softvibes-web` con el flujo de trabajo, revisión y entrega.
- Bibliotecas de perfiles en `library/agency-agents` y reglas en `library/awesome-cursorrules`.
  Son referencias; el instalador no activa cientos de perfiles simultáneamente.
- Scripts y recursos auxiliares de las skills, conservando su estructura de carpetas.
- Plantilla de workspace sin páginas: brief, inventario vacío, checklist y reglas operativas.
- Verificación SHA-256, pruebas del instalador y generador de ZIP.

```bash
# Buscar una habilidad
python3 scripts/ecosystem.py list --search diseño
# Instalar el catálogo completo (una variante preferida por nombre)
python3 scripts/ecosystem.py install --project ../otro-estudio --profile all
# Exportar un archivo compartible sin Git
python3 scripts/ecosystem.py pack --output ../softvibes-devecositem.zip
# Pruebas del paquete
python3 -m unittest discover -s tests -v
```

La instalación copia un snapshot a `.agents/.softvibes-ecosystem/` del destino y crea enlaces
relativos en `.agents/skills/`. No cambia tus skills globales ni sobrescribe skills existentes.
Puedes mover todo el workspace y conservar los enlaces. Para actualizar, revisa los conflictos
indicados y retira únicamente los enlaces del paquete anterior que quieras reemplazar.

## Alcance y requisitos externos

Las skills son instrucciones y utilidades; no incluyen el modelo de IA, las herramientas
privadas de Codex, las cuentas de Figma/hosting/Envato, licencias comerciales ni claves API.
Las variantes `plugin-*` dependen del plugin original. El perfil completo las conserva para
consulta; instalarlas como instrucciones no habilita sus herramientas. Consulta
[COMPATIBILIDAD.md](docs/COMPATIBILIDAD.md) antes de usarlas.

[Plan y alcance](docs/PLAN.md) · [Proceso web](docs/FLUJO-WEB.md) ·
[Integraciones](docs/INTEGRACIONES.md) · [Procedencia y licencias](THIRD_PARTY_NOTICES.md)
