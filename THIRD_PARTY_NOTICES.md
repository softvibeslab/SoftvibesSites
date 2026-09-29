# Procedencia y licencias

Este paquete reúne copias locales de instrucciones y recursos de múltiples autores. No se
relicencia el conjunto como si fuera una única obra propia. Conserva estos avisos y las licencias
incluidas al compartirlo. La autorización para reutilizar cada recurso procede de sus términos,
no de este archivo. Las skills sin licencia identificada no reciben permisos adicionales aquí.

- `catalog/skills.json`: origen conocido, ruta de origen, hash disponible y variante de cada skill.
- `catalog/third-party.json`: licencias obtenidas de los repositorios de origen identificados.
- `licenses/`: copias de esos avisos; son versiones consultadas al preparar la entrega, no una
  garantía de que correspondan al commit exacto de cada instalación.
- `library/skills/openai-reference`: snapshot local de https://github.com/openai/skills;
  conserva las licencias por skill. Ese snapshot indica que el repositorio fue deprecado.
- `library/skills/design`: https://github.com/hursh-shah/codex-design-skill, Apache-2.0.
- `library/agency-agents`: https://github.com/msitarzewski/agency-agents, licencia incluida.
- `library/awesome-cursorrules`: https://github.com/PatrickJS/awesome-cursorrules, licencia incluida.
- `library/skills/plugin-*`: recursos de plugins presentes en la caché local; se conservan avisos
  disponibles. Dependen de los términos y del runtime de su proveedor, que no se exporta.
- `library/skills/codex` y algunas entradas `agents`: habilidades locales, con procedencia
  externa cuando pudo identificarse. No se infiere una licencia a partir de su disponibilidad.

Modificaciones de portabilidad: generalización de rutas locales y endpoints propios, eliminación
de archivos de entorno/caché y conservación de variantes por origen. Consulta el informe de
exportación. No se ejecutaron las utilidades de terceros durante el empaquetado.
