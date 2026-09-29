# Compatibilidad

| Componente | Incluido | Requisito del receptor |
|---|---|---|
| Instrucciones SKILL.md | Sí, catálogo y variantes | Agente que interprete el formato |
| Instalador, verificador y ZIP | Sí, biblioteca estándar | Python 3.10+, macOS/Linux |
| Scripts de terceros | Sí | Revisar dependencias del SKILL.md antes de ejecutar |
| UI, marketing, SEO, QA | Sí, perfil web | Navegador y herramientas según el proyecto |
| Skills de plugins de Codex | Documentación y recursos | Instalar el plugin original y sus herramientas |
| Nirvana, harness, squads, businesses | Instrucciones y auxiliares disponibles | Runtime/CLI/configuración propios; no se incluye un entorno operativo |
| BeGlobal y otras habilidades específicas | Copia de instrucciones/utilidades generalizada | Adaptar rutas, endpoints y sistemas propios; fuera del perfil web |
| Agentes y reglas externas | Referencias | Elegir y adaptar los perfiles necesarios |
| Documentos, presentaciones y plantillas genéricas | Recursos de las skills | Runtime del proveedor cuando lo exija la skill |

Las rutas personales se generalizaron a `~` o `${WORKSPACE}`. En código que no expanda esas
expresiones debes configurar una ruta explícita. Los endpoints propios se sustituyeron por
`service.example.invalid`. No se garantiza ejecución de esas integraciones sin adaptación.
Algunas skills externas hacen referencia a utilidades de un repositorio o runtime mayor;
conservar su carpeta no instala automáticamente ese runtime.

El perfil web evita skills de runtime privado y usa una selección concreta. El perfil all activa
una variante por nombre, prefiriendo skills locales de Codex, luego agents, diseño, referencia
OpenAI y finalmente plugins. Las demás variantes permanecen consultables en la biblioteca.
El instalador no ejecuta sus scripts, descarga dependencias, instala plugins ni conecta cuentas.
En Windows puedes consultar manualmente la biblioteca; no se ha probado el instalador allí.
