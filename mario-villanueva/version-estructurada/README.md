# Mario Villanueva · versión estructurada

Segunda versión local del proyecto. Adopta la arquitectura multipágina que se repite
en los proyectos recientes de Softvibes, sin sustituir la primera propuesta ubicada
en `../sitio/`.

## Arquitectura

- `cliente.config.json`: datos verificados, posicionamiento y mapa de rutas.
- `fuentes/`: notas sobre la investigación y la estructura comparada.
- `outreach/`: estado de contacto; no contiene mensajes ni automatizaciones.
- `sitio/`: sitio estático multipágina.

## Rutas

- `/`: portada de marca personal.
- `/programas/`: arquitectura de ofertas.
- `/programas/beat-express/`: página de conversión del producto vigente.
- `/conferencias/`: propuesta para equipos y escenarios.
- `/contacto/`: destinos oficiales de contacto.
- `/links/`: enlace en bio.
- `/en/`: resumen en inglés.
- `/analisis/`: diagnóstico ejecutivo.
- `/aviso-de-privacidad/`, `/gracias/` y `/404.html`: páginas operativas.

## Vista local

```bash
python3 -m http.server 4174 -d sitio
```

Abrir `http://127.0.0.1:4174/`.

No se publicó ni desplegó esta versión. Los botones externos apuntan únicamente a
propiedades oficiales ya existentes.
