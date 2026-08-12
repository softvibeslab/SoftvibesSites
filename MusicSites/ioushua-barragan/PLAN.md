# Plan — Landing de Ieoushua Barragán

Primer sitio del proyecto **MusicSites** (landings para músicos, bandas y artistas).

## 1. Posicionamiento (actualizado 19-jul-2026)
Ieoushua es un **contrabajista/bajista de jazz de la Riviera Maya** que acaba de dar el salto de sideman a **líder del Barragán Quintet** (debut: 11-jul-2026, Foro Luna del CECUT, Tijuana, ciclo "Tardes de Jazz"). Trayectoria previa: Obed Orozco Trío (PDC Jazz Fest 2025, Teatro de la Ciudad), Zoar Miranda Quartet (álbum _Esoteric Fat Dog_, Chancla Records 2022 + gira CDMX), Mapaná Music.

- **Narrativa central**: "Del Caribe a la frontera — contrabajista y director del Barragán Quintet".
- **Conversión principal**: contrataciones/booking (Barragán Quintet para festivales/venues + sesiones y sideman). ✅ confirmado por el usuario.
- **Conversión secundaria**: seguir en Instagram / escuchar colaboraciones.
- El sitio es un **EPK vivo** (electronic press kit), no una tienda de música.

## 2. Aprendizajes del análisis de loscafres.net (referencia)
**Tomar:**
- Navegación simple y jerarquizada (Historia / Agenda / Media / Prensa / Contrataciones).
- Paleta oscura + logo minimalista → mood profesional que le queda al jazz.
- Integración directa a Spotify/YouTube en vez de reproducir contenido propio.

**Evitar (errores de Los Cafres):**
- Agenda vacía visible ("no future events" mata la percepción de actividad) → si no hay fechas, mostrar "Fechas recientes" en su lugar.
- Sin newsletter ni captura de contacto → nosotros sí ponemos CTA de booking por WhatsApp.
- Sección de prensa sin desarrollar → nuestro press kit debe ser descargable y completo.

## 3. Secciones de la landing (orden)
1. **Hero** — foto en vivo (contrabajo, escenario), nombre + "Contrabajista · Jazz · Riviera Maya", CTA doble: `Booking por WhatsApp` + `Escuchar`.
2. **Bio corta** — 3-4 líneas emocionales + credenciales (PDC Jazz Fest, Teatro de la Ciudad, escena CDMX).
3. **Trayectoria / Colaboraciones** — cards: Obed Orozco Trío, Zoar Miranda Quartet, Mapaná Music, PDC Jazz Fest 2025.
4. **Música y video** — embeds: Bandcamp ("A Happy Day For A Sad Bird"), YouTube (Calle 44 Jazz Club, Esoteric Fat Dog), podcast Sonidos Independientes.
5. **Fechas** — próximos shows; fallback "fechas recientes" si no hay agenda.
6. **Servicios** — bajista/contrabajista para: eventos y venues, festivales, sesiones de estudio, ensambles de jazz latino.
7. **Galería** — fotos de prensa (pedir a Ieoushua; hay foto de Emmanuel Santana en PDC Jazz Fest).
8. **Press kit (EPK)** — bio descargable + fotos HR + rider técnico.
9. **Contacto/Booking** — WhatsApp directo + email + Instagram.
10. **Footer** — redes + smart links (Apple Music, Discogs, Bandcamp).

## 4. Dirección visual
- **Mood**: jazz nocturno, elegante, caribeño-sutil. Paleta oscura (casi negro azulado), acento ámbar/dorado cálido (luz de escenario), tipografía serif display para títulos + sans limpia para cuerpo.
- Usar skill **design-md** para partir de un sistema premium de referencia.
- Fotografía en B/N o tonos cálidos de escenario como lenguaje principal.

## 5. Stack y deploy
- **HTML/CSS/JS estático** (mismo enfoque que fabiola-mvp y vivemar): un `index.html` + assets, cero build.
- SEO: schema.org `Person` + `MusicGroup`/`PerformingGroup`, Open Graph con foto de escenario.
- Deploy: subdominio en Hostinger (mismo flujo VPS/hosting que los MVPs anteriores).

## 6. Agentes/skills a usar por fase
| Fase | Recurso |
|---|---|
| Identidad visual | Brand Guardian + design-md |
| Narrativa/copy | Visual Storyteller |
| UI + build | UI Designer + Frontend Developer |
| Detalles de deleite | Whimsy Injector |
| SEO/schema | SEO Specialist |
| Outreach a Ieoushua | playbook prospecta-mvp (WhatsApp + email) |

## 6b. Análisis de `alternative/` (prototipos existentes)
Dos HTML tipo "informe interactivo de trayectoria" (no landing de conversión):
- **info.html** — estilo infografía corporativa (azul #2563eb + dorado, Tailwind CDN, Chart.js + Plotly, radar/heatmap con métricas inventadas tipo "Descentralización 94%"). Descartar como landing: mood tech-report, no jazz; los datos de gráficas son decorativos.
- **site.html** — paleta "Bosque de Marfil" (crema #FDFCF8, madera/latón #C5A16F, Playfair Display + Inter). Mood mucho más cercano a jazz elegante. **Rescatar**: paleta cálida, serif display, timeline de giras, cards de pistas con análisis interpretativo.
- Ninguno tiene CTA de booking, WhatsApp, embeds reales (Bandcamp/YouTube) ni fotos. La landing final se construye nueva; estos quedan como referencia/moodboard.

## 7. Fases con checkpoints (estilo playbook MVP)
1. **Contexto** ✅ investigación web + deepresearch.md del usuario. **Falta**: fotos, bio oficial, WhatsApp de booking, logo si existe. ⬅ CHECKPOINT
2. **Dirección visual** — moodboard/paleta + wireframe de secciones. ⬅ CHECKPOINT aprobación
3. **Build** — landing completa con contenido real + embeds.
4. **QA** — móvil primero (tráfico vendrá de Instagram), performance, links.
5. **Deploy + outreach** — subir a subdominio y preparar mensaje de presentación para Ieoushua. ⬅ CHECKPOINT

## Pendientes de información (pedir al usuario o a Ieoushua)
- ~~Fotos~~ ✅ media/ de Instagram integrado (hero slider, bio, galería, reels).
- ~~WhatsApp booking~~ ✅ +52 984 156 8693 integrado en CTA.
- ~~deepresearch.md~~ ✅ recibido e integrado.
- **Correo de booking** (CTA sigue con placeholder `booking@…`).
- Bio oficial / historia personal (formación, años tocando, influencias).
- ~~Comprimir reel~~ ✅ 5 MB → 3 MB (ffmpeg, solo en dist/).
- ~~Deploy~~ ✅ **EN VIVO**: https://plum-hyena-228473.hostingersite.com (19-jul-2026).
- Siguiente: aprobación de Ieoushua + outreach (playbook prospecta-mvp) + dominio propio si compra.
