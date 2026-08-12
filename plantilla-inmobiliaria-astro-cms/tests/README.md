# Verificación

La comprobación automatizada se ejecuta con `npm test` e incluye:

1. validación de colecciones y TypeScript con `astro check`;
2. análisis sintáctico de todos los archivos PHP;
3. auditoría de estructura y datos de cliente;
4. compilación completa de Astro;
5. smoke test de rutas, enlaces internos, salidas PHP y marcadores CMS.

Cuando PHP esté disponible, valida además:

```bash
find public -name '*.php' -print0 | xargs -0 -n1 php -l
```
