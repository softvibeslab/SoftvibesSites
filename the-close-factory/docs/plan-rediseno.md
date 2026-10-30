# Plan de rediseño — THE CLOSE FACTORY

- Fecha: 2026-10-29
- Punto de partida: `index.html` local (rediseño «fábrica» en papel plano, sin imágenes) y la versión pública en https://theclosefactory.vercel.app/ (SaaS oscuro con verde lima y un mockup de panel).
- Workflow: el de `/chamba` (`~/.claude/skills/chamba/SKILL.md`), adaptado. The Close Factory es un producto en sociedad (Grupo Zamna + ROVI CRM), no un prospecto. Por eso se quitan el outreach en frío y los 3 tiers, y el Paso 6 se convierte en un kit de lanzamiento.
- Insumos ya hechos hoy: `docs/inventario-previo.md` (nicho nuevo, referencias de Envato) y `docs/analisis.md` / `analisis/` (8 fugas con evidencia).

## Diagnóstico de lo que hay

| | Vercel (pública) | Local (actual) |
|---|---|---|
| Lo que funciona | Se ve producto. Panel en el hero, iconos, contraste alto | Concepto propio: «línea de turno» con estaciones y ticket interactivo. WhatsApp por sección, teléfono visible, FAQ sin JS |
| Lo que falla | Plantilla SaaS genérica (podría ser cualquier CRM). Seis CTA con un solo mensaje. Sin pruebas | Syne 750 muy expandida: titulares pesados que parten mal las líneas. Tarjetas planas e iguales, sin imágenes ni movimiento. La «fábrica» se ve en el vocabulario, no en la experiencia |
| Comunes | Cero imágenes, cero evidencia (fuga 4), sin `og:image` (fuga 2), sin formulario (fuga 6) | |

**Tesis del rediseño:** la página no debe *describir* una línea de producción, debe *serlo*. El visitante hace scroll y ve cómo un lead entra crudo, pasa por las estaciones y sale como propuesta con sello de evidencia. Esa experiencia es la demo del producto.

## Concepto: «La Línea»

- **Movimiento firma (signature move).** Un riel fijo (sticky) recorre la página. Al inicio entra un mensaje de WhatsApp («Hola, vi el depa de 2 recámaras…»). En cada sección, el scroll lo lleva a una estación y el ticket recibe un sello: `REGISTRADO → CALIFICADO → VISITA → PROPUESTA`. Al final cae en la bandeja con el sello `CON EVIDENCIA`. Sustituye a los 4 botones de estación actuales y conserva su contenido.
- **Pico emocional: la «Calculadora de fuga».** El visitante escribe sus leads al mes, cuánto tarda la primera respuesta y cuántos llegan a cita. La página calcula cuántas oportunidades se le enfrían al mes. Los supuestos van a la vista y se pueden editar: son *sus* números, no una estadística inventada. El resultado lleva al CTA con el número ya cargado en el mensaje de WhatsApp. Esto cierra la fuga 4 sin fabricar pruebas.
- **Dirección visual: «plano industrial nocturno».** Mantiene el ADN de la fábrica (sello, ticket manila, plano), pero con más contraste y oficio:
  - Hero y método sobre azul plano de noche (`#0b1726`) con retícula técnica. Las secciones de lectura van en papel (`#e6edf1`). El ticket manila queda como único objeto cálido.
  - Display: **Big Shoulders Display** (letrero industrial condensado, resuelve el problema de Syne) + IBM Plex Sans/Mono (se conservan).
  - Acentos: óxido/sello (`#d4533c`) para acción y un verde de «estación activa» que retoma el lima de Vercel, para no romper con la marca pública. **Esto lo decides tú (ver Decisiones).**
- **Imágenes (hoy hay 0):** dioramas isométricos generados de «la fábrica» (desarrollo vertical, piso de ventas, red de brokers). Uno por audiencia, más el `og:image`. Son ilustración, no fotos falsas de equipo ni de clientes.

## Fases (mapeadas al /chamba)

Cada fase termina en algo verificable. Solo hay pausas donde el workflow ya las tiene.

### Fase 0 — Arranque · *ya hecho en parte*
- Rama propia antes de tocar nada: `git switch -c feat/the-close-factory` (hoy estamos en `feat/cisne-negro-responsive` y la carpeta no tiene seguimiento en git).
- Se mantiene la estructura plana actual (`index.html` en la raíz). No conviene migrar a `sitio/` porque el README y el análisis ya apuntan a estas rutas.

### Fase 1 — Captura de marca y socios
- Bajar de Vercel el logo «C.», los colores y los textos exactos, más los logos públicos de Grupo Zamna y ROVI CRM, a `fuentes/`.
- Capturas de escritorio y móvil de Vercel para el «Antes» del análisis.
- **Skills:** `ads-dna` (extrae paleta, tipografía y voz de theclosefactory.vercel.app → `brand-profile.json`), `browser-automation`/`full-page-screenshot`.

### Fase 2 — Investigación y benchmark
- 5-8 referentes de proptech/CRM inmobiliario en LatAm (EasyBroker, Wiggot, Pulppo, Tokko Broker, Kommo para real estate, etc.): promesa del hero, prueba social que usan, CTA y si tienen calculadora o demo. Sacar 3 patrones ganadores y 2 huecos (casi ninguno vende *proceso* en vez de *software*: ese es el hueco de TCF).
- **Skills:** `competitor-analysis` / `competitive-teardown` (versión exprés), `marketing-psychology` (aversión a la pérdida para la calculadora), `copywriting` + `content-humanizer` para reescribir el copy con la voz del método.
- Salida: `docs/benchmark.md` y copy v2 en `docs/copy-v2.md`, con lo que queda igual y lo que cambia.

### Fase 3 — Base y sistema de diseño
- El inventario de hoy sigue vigente (menos de 30 días), así que no se repite.
- `design-md`: tomar la jerarquía y la densidad de **Linear** y la retícula y las tarjetas técnicas de **Vercel/ClickHouse**, y cruzarlas con la estética industrial propia.
- `ui-ux-pro-max` + `ui-design-system`: tokens en `:root` (color, espacio, radios, sombras de «papel»), escala tipográfica fluida y estados de foco.
- Salida: `docs/DESIGN.md` de The Close Factory (como el de MenuVibes) y una lámina de muestra (`docs/design-board.html`) con tipografía, colores, ticket, sello y botones. **Primera revisión visual contigo** antes de maquetar la página.

### Fase 4 — Construcción de la landing
HTML/CSS/JS estático, sin build (regla del /chamba). Orden de secciones:

1. **Hero:** titular + entra el mensaje de WhatsApp al riel. Con CTA doble: diagnóstico y «Ver la línea».
2. **La Línea (sticky):** 4 estaciones con sello por scroll. En móvil se convierte en un carrusel horizontal con snap.
3. **El problema:** 3 fugas como tarjetas de «defecto de producción» con un número de lote.
4. **Calculadora de fuga** (pico) → CTA con el resultado en el mensaje.
5. **Método:** 4 pasos como un plano técnico que se dibuja con el scroll (trazos SVG).
6. **Solución:** 6 pilares en una cuadrícula asimétrica (no seis tarjetas iguales).
7. **Respaldo:** Grupo Zamna + ROVI CRM con logo y lo que aporta cada uno. Los enlaces se abren en una pestaña nueva (fuga 8).
8. **Para quién:** 3 audiencias con un diorama cada una y un CTA con su mensaje propio.
9. **Métricas, no promesas:** la bitácora del piloto como hoja de control con casillas vacías. Se deja la honestidad como argumento.
10. **FAQ** (se conserva) → **Cierre** con formulario de 3 campos (nombre, tipo de operación, WhatsApp) que arma el mensaje y abre wa.me. Así queda una ruta aunque no se use el botón directo (fuga 6).

- **Skills:** `frontend-design` (dirección y oficio), `epic-design` (scroll con sticky, reveals con clip-path y palabras que se encienden, sin WebGL), `scroll-craft` (planos del hero, composición móvil aparte, verificación de movimiento reducido), `free-tool-strategy` (calculadora), `form-cro` (formulario), `page-cro` (jerarquía de CTA).
- **Técnica:** CSS `animation-timeline: view()` con respaldo de `IntersectionObserver`, sin librerías pesadas (GSAP solo si el riel lo exige), `prefers-reduced-motion` respetado y presupuesto de menos de 150 KB de JS+CSS.
- **SEO/compartir** (fugas 1, 2, 7): `og:image` 1200×630, `twitter:card=summary_large_image`, una sola descripción que nombra las tres audiencias, JSON-LD `Organization` + `ProfessionalService` + `FAQPage`, `canonical`, y `robots.txt`/`sitemap.xml` preparados. El `noindex` se queda hasta tener un dominio definitivo. **Skills:** `schema-markup`, `seo-audit`.
- **Atribución** (fuga 3): se conserva el WhatsApp por sección y se agregan `utm_*` leídos de la URL al mensaje (por ejemplo, «Vengo de: campaña X»). **Skill:** `analytics-tracking` (plan de eventos, sin instalar nada aún).

### Fase 4b — Imágenes (en paralelo con la Fase 4)
- `comfy` + `comfy-relay`: proyecto en `the-close-factory/comfy/` (no en /tmp). Primero se revisa qué modelos hay y después una receta t2i con estilo fijo («diorama isométrico, noche azul, luces de estación, sin texto») → 4 escenas + `og:image`. Cada toma se te enseña antes de usarla.
- Alternativa más ambiciosa: `scroll-world` (vuelo continuo por un diorama con Higgsfield/Seedance). Se paga por clip, así que solo va si lo apruebas (ver Decisiones).
- Optimización: `sips`/WebP, menos de 200 KB por imagen y `width`/`height` declarados para evitar CLS.

### Fase 5 — Análisis «Antes / Ahora»
- Actualizar `analisis/index.html`: cada una de las 8 fugas con su estado («✓ resuelta en la v2» o «pendiente: requiere dominio/permiso»), capturas Antes (Vercel) / Ahora (v2) y un iframe de la v2 con selector de laptop, tablet e iPhone.
- **Skills:** la base es `analisis-vivemar` según el /chamba, con la paleta de TCF y `dataviz` si se grafica algo.

### Fase 6 — Kit de lanzamiento (reemplaza el outreach)
- Tarjeta para compartir (`og:image`), mensaje de WhatsApp para que los socios reenvíen el enlace y 3 piezas cortas para LinkedIn e Instagram con la calculadora como gancho.
- **Skills:** `social-content`, `ad-creative` (solo copy, sin campaña). Se queda en borrador: nada se envía.

### Fase 7 — QA
- Capturas de escritorio (1440), tablet (834) y móvil (390, con el iframe del /chamba), una más con `prefers-reduced-motion`, y lectura de cada una.
- `a11y-audit` (WCAG 2.2 AA: contraste del ticket manila, foco y el riel accesible con teclado y lector de pantalla) y `web-design-guidelines`.
- Lighthouse de rendimiento y SEO: LCP < 2.5 s y CLS < 0.05.
- Pruebas mínimas de la calculadora (casos límite: 0 leads, valores vacíos o enormes) en `docs/qa.md` o en una página de prueba, como pide AGENTS.md («verificación mínima para lógica no trivial»).
- `grep`: wa.me con `text=`, ningún `href="#"` roto, `noindex` presente y cero datos de otros clientes.
- **Skill:** `adversarial-reviewer` o `roast` como última mirada crítica antes de mostrarlo.

### Fase 8 — La pausa: revisión y publicación
Te muestro las capturas y un brief de 6 líneas, con la lista de `[PENDIENTE]`. Publicar requiere tu «sí» y que se decida el destino (ver Decisiones).

### Fase 9 — Cierre
README actualizado, ficha en el `index.html` raíz del workspace y memoria del proyecto.

## Decisiones que necesito de ti

1. **Identidad visual.** (a) «Plano industrial nocturno» con un toque de lima: lo recomiendo, porque une lo distintivo de la local con la marca pública. (b) Volver al navy + lima de Vercel y solo pulirlo. (c) Quedarse en el papel claro de la local y solo arreglar tipografía e imágenes.
2. **Nivel de «wow».** (a) Scroll con CSS/JS + imágenes generadas con Comfy: lo recomiendo por costo bajo, peso ligero y control total. (b) `scroll-world` con video continuo, que impresiona más pero se paga por clip y pesa más en móvil.
3. **Dónde vive.** Vercel es el sitio público, pero ¿quién tiene acceso? Las alternativas son un demo en `closefactory.softvibes.art` (VPS, patrón Gaby/Zamna) o reemplazar Vercel si me das el repositorio.
4. **Formulario.** ¿Solo arma el mensaje de WhatsApp (estático, hoy mismo) o lo conectamos a ROVI CRM? Conectarlo sería el producto demostrándose a sí mismo, pero requiere backend.
5. **Pruebas.** ¿Hay permiso para citar un caso o cifra real de Grupo Zamna? Sin eso, la página se queda en «métricas, no promesas» más la calculadora.

## Lo que no cambia
El método de 4 pasos, la FAQ, la honestidad sobre lo que la IA no hace, el WhatsApp de diagnóstico como conversión principal y el `noindex` mientras no haya un dominio definitivo.
