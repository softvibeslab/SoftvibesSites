# KLH · Hub de rentas

Prototipo estático bilingüe para ordenar el inventario público de KLH y convertir consultas genéricas en conversaciones contextuales por propiedad.

## Contenido

- `index.html`: hub con 15 publicaciones y filtros.
- `propiedad/`: ficha dinámica por propiedad mediante `?id=`.
- `analisis/`: diagnóstico ejecutivo de presencia digital e inventario.
- `data.js`: inventario usado por el hub y las fichas.
- `data/klh-inventario-actual-2026-08-05.csv`: copia del archivo fuente entregado.
- `assets/properties/`: fotografías obtenidas de las carpetas públicas de Drive vinculadas en el inventario.

## Criterios de datos

- Fuente fechada: 5 de agosto de 2026.
- 15 publicaciones y 14 carpetas únicas.
- Rango reportado: $14,000 a $35,000 MXN mensuales.
- Electricidad adicional en las 15 publicaciones.
- Depósito, estancia mínima, mascotas, estacionamiento y servicios incluidos se muestran como pendientes de confirmación.
- Singular Joy 302 conserva sus dos publicaciones y muestra la ambigüedad de categoría/precio.

## Verificación mínima

```sh
node --check script.js
node --check propiedad/detail.js
node --check analisis/script.js
```

El sitio no requiere proceso de build ni dependencias.
