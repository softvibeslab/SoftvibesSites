# Investigación de diseño — Sitios inmobiliarios Riviera Maya (julio 2026)

Síntesis de 4 análisis paralelos: marcas de lujo internacionales, agencias locales,
desarrolladores y mejores prácticas UX/conversión 2025-2026.

## Sitios analizados

- **Lujo internacional:** Riviera Maya Sotheby's (rivieramayasir.com), Engel & Völkers,
  The Agency (corporativo + oficina Riviera Maya)
- **Agencias locales:** Top Mexico Real Estate, BuyPlaya, Maya Ocean, PIM Riviera Maya,
  OKAN Real Estate, Jaguar Tulum, Century 21 México
- **Desarrolladores:** Inmobilia, SIMCA, Corasol (donde Vive Mar vende), Ekasa

## Patrones ganadores (convergencia entre los 4 análisis)

### Conversión
1. **WhatsApp con mensaje prellenado como CTA primario** — caso documentado: 15% de
   completado en formulario web vs 72% con flujo de WhatsApp. Mejor ejecución: botón de
   WhatsApp DENTRO de cada tarjeta de propiedad (Jaguar Tulum).
2. **Formularios de máximo 3 campos** (10.1% conversión vs 3.6% con 9 campos).
   Corasol es la excepción deliberada: formulario largo que CALIFICA al inversionista
   (presupuesto en rangos, plazo de enganche, timeline) — correcto para ticket alto.
3. **Sticky CTA en fichas:** barra inferior fija en móvil con WhatsApp + Agendar.
4. **Respuesta < 5 minutos** multiplica conversión 5-10x (automatizar primer contacto).
5. Benchmarks: 1-3% sitewide, 3-5% landing optimizada, 5-10% herramientas de alta intención.

### Presentación de producto
6. **Precio "desde $X" visible + escasez numérica verificable** (SIMCA: "desde
   $289,560 USD", "¡Último PH disponible!", "27 penthouses"). Transparencia + escasez
   real > misterio total. El lujo (Sotheby's, Corasol) oculta precio en tarjeta para
   forzar la conversación — válido solo para ticket muy alto.
7. **Badges de estatus en tarjetas:** Preventa / Entrega inmediata / Frente al mar /
   Oportunidad. Permiten escanear inventario en segundos.
8. **La propiedad como instrumento financiero:** ROI explícito en el hero ("8-15%
   renta anual"), planes de pago publicados, educación sobre fideicomiso para
   extranjeros. El comprador de Riviera Maya es mayormente inversionista.
9. **Masterplan/contexto de comunidad** (Corasol): ubicar la unidad dentro del
   ecosistema de amenidades es más persuasivo que mostrarla aislada.

### Marca y diseño visual
10. **"Quiet luxury":** la fotografía manda, la interfaz desaparece. Fondo
    blanco/crema, UN solo color de acento usado con contención (rojo E&V, dorado
    Sotheby's). Nada saturado — el turquesa chillón mata lo premium.
11. **Paleta validada para lujo costero:** teal océano profundo (#0e2a3a / #1b4d5c) +
    sea glass (#7fa6a8) + off-white (#f1efe8) + latón (#b08a57). Oro + oscuro + blanco
    eleva el valor percibido ~30%.
12. **Tipografía:** serif refinada oversized para titulares (Playfair Display /
    Cormorant) + sans limpia para cuerpo. Titulares en mayúsculas espaciadas con
    itálicas en palabras aspiracionales (The Agency).
13. **Video hero full-bleed** (drone costero, sin sonido) es el estándar del lujo;
    la imagen estática ya no basta en ese segmento.
14. **El agente con rostro como CTA, no un formulario genérico** — tarjeta de asesora
    con foto, nombre, título y contacto directo en cada ficha (Sotheby's). En un
    negocio de marca personal como Vive Mar, Viridiana ES el diferenciador.

### Confianza
15. **Prueba social distribuida,** no en página aparte: rating Google above-the-fold,
    testimonio con nombre+foto junto a cada CTA, video testimoniales (+80% conversión
    vs texto). Cifras verificables ("X propiedades", "$XM en transacciones").
16. **Credenciales por asociación:** desarrollos/desarrolladores con los que trabaja
    (Corasol, firmas de arquitectos), prensa. En preventa, la confianza es el producto.

### SEO local
17. **Hiperlocal gana:** 72% de búsquedas geo mencionan barrio/zona, no ciudad.
    Hub-and-spoke: página pilar por ciudad → 10-20 páginas de zona/barrio profundas
    (datos reales, no plantilla). URLs: /propiedades/[ciudad]/[zona].
18. **Google Business Profile** pesa ~32% del ranking local; meta 2-4 reseñas/mes.
19. Schema RealEstateListing + BreadcrumbList; listados en subdirectorio, nunca subdominio.

## Errores a evitar (vistos en competidores)
- Monolingüismo en cualquier dirección: los sitios "gringos" pierden al mexicano, los
  mexicanos pierden al anglo. Nacer bilingüe ES/EN con rutas /es/ /en/ y doble moneda
  USD/MXN (patrón PIM).
- Prometer ROI en el hero y no sostenerlo en la ficha (NINGUNO de los 7 locales muestra
  yield en tarjeta ni calculadora ROI — hueco de diferenciación).
- Cero urgencia en un mercado de preventas donde la escasez es real.
- Testimonios sin foto/métrica, logos de prensa sin enlace, buscador escondido.

## Decisiones de diseño para Vive Mar (v2)
1. Paleta nueva: teal profundo + arena/off-white + acento latón/oro (sustituir el
   turquesa brillante actual).
2. Serif display (Playfair/Cormorant vía fontsource) para titulares oversized;
   mayúsculas espaciadas en etiquetas.
3. Hero: preparado para video/foto full-bleed con overlay oscuro (placeholder gradiente
   mientras no haya material), titular aspiracional + cifra de ROI de zona.
4. Tarjetas: badges (Preventa/Entrega inmediata/Frente al mar/Oportunidad), precio
   visible, botón WhatsApp directo en tarjeta.
5. Ficha: sticky bar móvil (WhatsApp + Agendar), tarjeta de Viridiana con foto y título,
   planes de pago como tabla destacada, propiedades similares.
6. Bloque "los números" en ficha de inversión: precio/m², plan de pagos, renta estimada.
7. Prueba social junto a cada CTA + contadores verificables.
8. Urgencia verificable: campo "unidades disponibles" en el frontmatter de propiedades.
9. Fase posterior: bilingüe ES/EN + selector USD/MXN, calculadora ROI, valuación
   "¿Cuánto vale tu propiedad?" como segunda landing de captación.
