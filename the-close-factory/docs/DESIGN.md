# DESIGN.md — THE CLOSE FACTORY · «La Línea»

Plano industrial nocturno. La página es una línea de producción: un lead entra crudo y sale como propuesta con sello de evidencia.

## Principios
1. **La experiencia es la demo.** Cada sección es una estación; el ticket manila es el único objeto cálido.
2. **Métricas, no promesas.** Ningún número de exhibición. Las cifras las pone el visitante (calculadora) o el piloto.
3. **Contraste de turnos.** Noche (azul plano + retícula) para el producto y el método; papel para leer.

## Tokens
| Token | Valor | Uso |
|---|---|---|
| `--night` | `#0b1726` | Fondo de hero, línea, método, cierre |
| `--night-2` | `#112338` | Tarjetas sobre noche |
| `--steel` | `#8fa7ba` | Texto secundario sobre noche, piezas del diorama |
| `--paper` | `#e8eef2` | Fondo de lectura |
| `--paper-2` | `#dbe5eb` | Bandas alternas |
| `--ink` | `#0f1d2c` | Texto sobre papel |
| `--muted` | `#465a6c` | Texto secundario sobre papel (AA sobre `--paper`) |
| `--manila` / `--manila-ink` | `#f3e6cf` / `#3a2c1e` | Ticket, hoja de control |
| `--lime` | `#c6f24e` | Estación activa, CTA principal (texto `--night`). Hereda la marca pública de Vercel |
| `--stamp` | `#d4533c` | Sellos y grúa. Nunca como fondo de texto pequeño |
| `--oxide` | `#a8321f` | Texto/enlace de acción sobre papel |
| `--brass` | `#8a6233` | Etiquetas mono sobre papel |

## Tipografía
- Display: **Big Shoulders Display** 800/900, mayúsculas solo en etiquetas cortas; titulares en caja normal, `letter-spacing: -.01em`, `line-height: .92`.
- Texto: **IBM Plex Sans** 400/500/600. Etiquetas, datos y sellos: **IBM Plex Mono** 500.
- Escala: `h1 clamp(3.6rem, 9vw, 7.6rem)`, `h2 clamp(2.4rem, 5vw, 4.2rem)`, cuerpo 17px/1.55.

## Componentes
- **Botón principal:** lima, texto noche, radio 999px, borde 1px noche. **Secundario:** contorno.
- **Ticket:** manila, esquina inferior izquierda redondeada 1.4rem, sombra dura `8px 10px 0`, perforación superior.
- **Sello:** borde doble `--stamp`, mono 700, rotado −8°, entra con escala 1.6→1 y opacidad (efecto «golpe»).
- **Etiqueta de lote:** mono 0.72rem, `letter-spacing .14em`, mayúsculas.

## Movimiento
- Firma: `#linea` es sticky; el progreso de scroll mueve el ticket por 4 estaciones y aplica un sello en cada una.
- Método: el trazo del plano se dibuja con `animation-timeline: view()` (sin soporte: queda dibujado).
- `prefers-reduced-motion`: sin sticky ni SMIL; las estaciones son botones y el ticket cambia al instante.

## Accesibilidad
Foco visible lima/óxido de 3px, estaciones operables con teclado, ticket `aria-live="polite"`, calculadora con `<output>` y etiquetas reales, contraste AA verificado en QA.
