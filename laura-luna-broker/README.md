# Laura Luna Broker · Landing personal bilingüe

Landing personal de confianza para convertir la presencia pública de Laura Luna en conversaciones atribuibles, sin competir con el respaldo de Grupo 28.

## Despliegue temporal

- Hostinger: <https://orchid-eagle-927050.hostingersite.com/>
- Análisis: <https://orchid-eagle-927050.hostingersite.com/analisis/>
- Publicado el 9 de agosto de 2026.

## Contenido

- `index.html`: landing bilingüe, credenciales, trayectoria, referencia histórica y formulario de WhatsApp.
- `analisis/`: diagnóstico de presencia, scorecard, arquitectura recomendada y hoja de ruta.
- `data/`: copia del CSV histórico entregado.
- `assets/`: fotografías y logotipo obtenidos de fuentes públicas verificadas.

## Fuentes y criterios

- Grupo 28 publica a Laura con 14 años de experiencia en la Riviera Maya.
- El padrón oficial de SEDETUS identifica a Laura Luna del Mazo en Playa del Carmen con matrícula `12221312HDAABFFS008000765`; el estado se observó vigente el 9 de agosto de 2026.
- Instagram, Facebook y WhatsApp corresponden a los enlaces confirmados en el brief.
- Modelo Lantana se presenta únicamente como una publicación histórica del 11 de noviembre de 2025.
- La carpeta histórica de Drive devolvió 404 durante la revisión del 9 de agosto de 2026; no se incorporaron fotografías de propiedad sin atribución verificable.
- El formulario no almacena datos; prepara un mensaje de WhatsApp con fuente, objetivo, presupuesto y plazo.
- El prototipo emite eventos a `window.dataLayer`, pero no incluye una plataforma analítica externa.

## Verificación mínima

```sh
node --check script.js
node --check analisis/script.js
node tests/smoke.mjs
```

El sitio es estático y no requiere build ni dependencias.
