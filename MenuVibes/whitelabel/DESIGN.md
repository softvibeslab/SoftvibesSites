---
version: 1.0
name: MenuVibes-design-system
description: "Sistema de diseño de MenuVibes — hospitalidad cálida sobre lienzo blanco, inspirado en el lenguaje visual de Airbnb (library/airbnb del skill design-md), aprobado por Roger en el Checkpoint 1 del rebrand (2026-07-18, Propuesta C). Coral MenuVibes (#ff385c) como único voltaje de marca en CTAs, ratings y acentos; tinta #222 sobre blanco; tipografía Nunito Sans redondeada en pesos 400/600/700; radios amables (8/14/20/9999) y sombras suaves en vez de bordes duros. Aplica a TODAS las superficies de plataforma: dashboard, POS, mesero, guías y landing. NO aplica al menú del cliente final (menu.html), que respeta el branding de cada negocio — ahí este sistema solo aporta estructura, jerarquía y espaciado."
colors:
  primary: "#ff385c"          # Coral MenuVibes — CTAs primarios, acentos, logo
  primary-active: "#e00b41"   # Pressed / énfasis fuerte (scores malos, alertas de marca)
  primary-soft: "#fff0f3"     # Fondo suave para chips/badges de marca
  ink: "#222222"              # Titulares, cifras, texto fuerte
  body: "#3f3f3f"             # Texto de párrafo
  muted: "#6a6a6a"            # Texto secundario, labels
  muted-soft: "#929292"       # Terciario, placeholders
  hairline: "#dddddd"         # Bordes de cards e inputs
  hairline-soft: "#ebebeb"    # Divisores internos
  canvas: "#ffffff"           # Fondo de página
  surface-soft: "#f7f7f7"     # Fondos suaves (quejas, filas alternas, wells)
  surface-strong: "#f2f2f2"   # Barras de progreso vacías, hover de tabs
  on-primary: "#ffffff"
  success: "#008a05"          # Confirmaciones, "arriba del umbral", cobros
  success-soft: "#e8f5e9"
  warning: "#c25e00"          # Avisos (corte sin abrir, rating frágil)
  warning-soft: "#fff3e6"
  danger: "#c13515"           # Errores, cancelar, detractores
  link: "#428bff"
  scrim: "rgba(0,0,0,.6)"     # Overlay de modales
typography:
  family: "'Nunito Sans', 'Circular', -apple-system, system-ui, sans-serif"
  display: { size: 28px, weight: 700, lh: 1.25 }      # Cifras KPI, total del ticket
  rating: { size: 42px, weight: 700, lh: 1.1 }        # Rating grande del umbral
  h2: { size: 20px, weight: 700, lh: 1.25 }           # Títulos de pantalla
  h3: { size: 16px, weight: 700, lh: 1.25 }           # Títulos de card
  body: { size: 14px, weight: 400, lh: 1.5 }          # Texto general
  label: { size: 12px, weight: 600, lh: 1.3, transform: uppercase, tracking: .6px } # Labels de inputs y métricas
  button: { size: 14px, weight: 700, lh: 1.25 }
  caption: { size: 12px, weight: 400, lh: 1.4 }
rounded:
  xs: 4px       # chips mínimos
  sm: 8px       # botones, inputs
  md: 14px      # cards, tiles de producto
  lg: 20px      # modales, paneles grandes
  pill: 9999px  # tabs activos, pills de estado, badges
spacing: { xs: 4px, sm: 8px, md: 12px, base: 16px, lg: 24px, xl: 32px, section: 48px }
shadows:
  card: "rgba(0,0,0,.05) 0 2px 8px"        # cards en reposo
  lifted: "rgba(0,0,0,.08) 0 6px 20px"     # ticket, modales, paneles protagonistas
  none-on-soft: true                        # nada de sombra sobre surface-soft
---

# MenuVibes Design System — "Hospitalidad cálida"

Fuente de verdad del rebrand (Propuesta C aprobada). Toda superficie nueva o retocada de la
plataforma usa estos tokens. El menú del cliente (`menu.html`) queda FUERA: es whitelabel y
respeta los colores/tipografías del negocio; de aquí solo toma estructura y espaciado.

## Principios

1. **Blanco generoso.** El lienzo es `canvas` blanco; la jerarquía la dan sombras suaves y
   `surface-soft`, no bordes gruesos ni fondos oscuros.
2. **Un solo voltaje.** El coral `primary` se reserva para: logo, CTA primario de la pantalla,
   rating/reputación y estados de marca. Nunca dos CTAs corales compitiendo en una vista.
3. **Semáforo honesto.** `success` para dinero cobrado y umbrales superados; `warning` para
   fragilidad; `danger` para detractores y cancelaciones. No se mezclan con el coral.
4. **Redondez amable.** Botones e inputs `sm` (8px); cards `md` (14px); tabs activos y pills
   `pill`. Ninguna esquina dura.
5. **Tipografía que abraza.** Nunito Sans; cifras en 700, labels en 12px uppercase con
   tracking suave. Sin tracking negativo agresivo — esto no es fintech.
6. **Touch primero.** Targets ≥44px en POS y menú; los botones de producto del POS son tiles
   `md` con sombra `card`.

## Componentes canónicos

- **Topbar:** blanca, borde inferior `hairline-soft`, logo "Menu**Vibes**" (Vibes en coral),
  negocio en `muted`. CTA primario coral a la derecha.
- **Tabs:** pills; activo = fondo `ink` texto blanco; inactivo = texto `muted`, hover
  `surface-soft`. (El pill activo es tinta, NO coral — el coral es del CTA.)
- **KPI card:** blanca, borde `hairline`, radio `md`, sombra `card`; cifra `display` en `ink`,
  label `caption` en `muted`.
- **Card estándar:** igual que KPI con padding `lg` y título `h3`.
- **Queja/detractor:** fila sobre `surface-soft`, radio 12px, score en `primary-active` 700.
- **Barra de progreso:** track `surface-strong`, fill coral, altura 8px, radio pill.
- **Botón primario:** coral, blanco, radio `sm`, padding 11-14px vert; pressed `primary-active`.
- **Botón secundario:** blanco, borde 1px `ink`, texto `ink`.
- **Botón cobrar/success:** `success` de fondo cuando la acción es dinero confirmado.
- **Input:** borde `hairline`, radio `sm`, focus borde `ink` (no coral), padding 11-12px.
- **Modal:** blanco, radio `lg`, sombra `lifted`, scrim `scrim`.
- **Pill de estado:** `pill`; success-soft/verde, warning-soft/naranja, surface-soft/neutro.

## Don'ts

- No fondos oscuros en superficies de plataforma (el dark anterior queda retirado).
- No amarillo #FFD700 ni Bebas Neue — son del sistema viejo.
- No coral como fondo de secciones o cards; solo acento.
- No más de un CTA coral por vista.
- No bordes duros (0px) ni radios gigantes en botones (los botones NO son pill; los tabs sí).
