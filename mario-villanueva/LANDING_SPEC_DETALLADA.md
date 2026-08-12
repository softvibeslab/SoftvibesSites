# 🎯 ESPECIFICACIÓN LANDING PAGE - MARIO VILLANUEVA

**Versión:** 1.0  
**Baseado en:** ANALISIS_MARIO_VILLANUEVA.md  
**Objetivo:** Arquitectura de página + copy + elementos visuales + technical specs

---

## 📐 ESTRUCTURA GENERAL

```
┌─────────────────────────────────────────────────┐
│         HEADER / NAVEGACIÓN                      │
├─────────────────────────────────────────────────┤
│  1. HERO (Problema + Solución + CTA)             │
├─────────────────────────────────────────────────┤
│  2. AUTORIDAD (Bio + Proofs)                     │
├─────────────────────────────────────────────────┤
│  3. MÉTODO BEAT (Visual + Explicación)           │
├─────────────────────────────────────────────────┤
│  4. OFERTA BEAT EXPRESS ($27)                    │
├─────────────────────────────────────────────────┤
│  5. TESTIMONIOS (5-10 con foto)                  │
├─────────────────────────────────────────────────┤
│  6. FAQ (8-10 preguntas)                         │
├─────────────────────────────────────────────────┤
│  7. ECOSYSTEM (Casa Xtao + Xtao Exp)             │
├─────────────────────────────────────────────────┤
│  8. FINAL CTA + Garantía                         │
├─────────────────────────────────────────────────┤
│         FOOTER                                   │
└─────────────────────────────────────────────────┘
```

---

## 🎬 SECCIÓN 1: HERO

### Objetivo
Capturar atención en 3 segundos. Planteamiento del problema + propuesta de solución.

### Layout
- **Video background** (60-90 seg, opcional) O **imagen hero**
- **Text overlay:** Headline (grande), subheadline, CTA primario
- **Copy direction:** Emotion → Logic → Action

### Copy Recomendada

**Headline (H1):**
```
"¿Vendés sin saber por qué algunos clientes dicen sí y otros se van?"
```

**Alternativas:**
- "Aprendí a vender. Ahora construyo empresas."
- "Lleva 60 minutos. Cambia tu forma de vender."
- "Vende sin convencer. Guía sin presionar."

**Subheadline (H2):**
```
"Mario comparte el método que pasó de cero a $100K/mes. 
60 minutos. $27. Acceso de por vida."
```

**CTA Principal (Botón):**
```
"Ver BEAT Express → $27"
```

**Secondary CTA:**
```
"¿Cómo funciona? ↓"
```

### Visual Elements
- [ ] Video 60-90 seg (B-roll de Mario, clientes, retiros)
- [ ] O imagen hero (Mario + fondo Huatulco)
- [ ] Logo de "Garantía Hotmart" pequeño
- [ ] Countdown (opcional): "Oferta válida 30 días"

### Technical Specs
- Altura: 100vh (full screen)
- Breakpoint mobile: Stack vertical, responsive
- Fuente: Headline grande (4rem desktop, 1.8rem mobile)
- Color: Dark bg, white text (máximo contraste)

---

## 📍 SECCIÓN 2: AUTORIDAD

### Objetivo
Establecer credibilidad. "¿Por qué Mario?"

### Layout
- Grid 3 columnas: Bio + Números + Empresas

### Copy

**Subheadline:**
```
"Más de 15 años vendiendo. 
3 empresas operando. 1 método probado."
```

**Bio Card:**
```
MARIO VILLANUEVA
Empresario | Trainer | Speaker

✓ 11.1K followers (Instagram verificado)
✓ Speaker en conferencias de ventas
✓ Mentor de coaches y emprendedores
✓ Fundador de 3 ecosistemas

"Aprendí a vender y construí activos"
```

**Social Proof (3 Cards):**

Card 1:
```
CASA XTAO
Hotel Boutique | Bahías de Huatulco
🏨 1,613 followers
⭐ Lujo accesible
Proof: Operando 3+ años
```

Card 2:
```
XTAO EXPEDITIONS
Viajes + Red + Inversión
✈️ 3,428 followers
💰 Club vacacional activo
Proof: 100+ miembros anuales
```

Card 3:
```
DEL SER AL VENDER
Método BEAT
🎓 $27 entrada, vitalicio
✅ 98% satisfacción (Hotmart)
Proof: 1000+ estudiantes
```

### Visual Elements
- [ ] Foto de Mario (profesional, 400x400px)
- [ ] Logos de Instagram, LinkedIn, verificados
- [ ] Números grandes: 11.1K followers, 15+ años, 3 empresas
- [ ] Badges: "Verified", "Hotmart", "Google Reviews"
- [ ] Colores: Brand primary + accent

### Technical Specs
- 3-column grid (desktop)
- Stack en mobile
- Foto cuadrada (aspect ratio 1:1)
- Font weight: bold para números

---

## 🎓 SECCIÓN 3: MÉTODO BEAT

### Objetivo
Explicar la diferencia. "¿Qué es BEAT?"

### Layout
- Visual central (4 pasos conectados)
- Explicación debajo de cada paso

### Copy

**Subheadline:**
```
"El Método BEAT"
De vendedor a guía. 60 minutos que cambian todo.
```

**4 Pasos (B-E-A-T):**

```
Step 1: ALÍNEA EL SER
└─ No vendes productos. Alineas personas con sus objetivos.
   La venta empieza contigo, no con el cliente.

Step 2: GENERA CONFIANZA  
└─ La gente compra a quien confía.
   Confianza = vulnerabilidad + resultados.

Step 3: DESCUBRE LA NECESIDAD
└─ No preguntes "¿Te interesa?" Escucha realmente.
   La necesidad real es diferente a lo que dicen.

Step 4: GUÍA LA DECISIÓN
└─ No presiones. Guía. Hay diferencia.
   Decisión clara = cliente satisfecho = referencia.
```

### Visual Elements
- [ ] Infografía (4 círculos conectados)
- [ ] Iconos para cada paso (Be, Trust, Need, Decide)
- [ ] Colores graduales (entrar a salir)
- [ ] Video 2-3 min de Mario explicando BEAT (opcional)

### Technical Specs
- Section color: Light background
- Typography: Serif headlines, sans-serif body
- Spacing: Generoso (80px gaps)
- Mobile: Stack vertical con línea conectora

---

## 🎁 SECCIÓN 4: OFERTA BEAT EXPRESS

### Objetivo
Conversión. Mostrar exactamente qué compran por $27.

### Layout
- Card central (pricing focus)
- Lista de inclusiones
- Checkbox visual

### Copy

**Subheadline:**
```
"BEAT EXPRESS
$27 USD • Acceso vitalicio • 60 minutos"
```

**Headline Card:**
```
Deja de perseguir clientes.
Vende mejor en 60 minutos.
```

**Price Card:**
```
$27 USD (Pago único, sin suscripción)

Acceso VITALICIO
Lo compras hoy, lo tienes para siempre.
```

**What's Included:**
```
✓ Módulo 1: Del Ser al Vender (15 min)
  Video + ejercicio de alineación personal
  
✓ Módulo 2: BEAT - El método (15 min)
  Desglose de cada paso con ejemplos reales
  
✓ Módulo 3: BEAT en Acción (15 min)
  3 casos de éxito documentados
  
✓ Módulo 4: Microherramientas BEAT (15 min)
  Plantillas, scripts, checklist

BONUS:
🎁 Audio BEAT en 1 minuto (referencia rápida)
🎁 Descarga: "Checklist BEAT" (PDF)
🎁 Acceso a grupo privado (comunidad)
🎁 Actualizaciones futuras (gratis para siempre)
```

**Guarantee:**
```
GARANTÍA 100% SIN RIESGO

Si en los primeros 7 días no te encanta, 
devolvemos tu dinero. Sin preguntas.
Garantía Hotmart verificada.
```

**CTA (Botón grande):**
```
Acceso Ahora • $27 USD
```

**Trust Line:**
```
Pago seguro con Hotmart | SSL | 7 días dinero atrás
```

### Visual Elements
- [ ] Precio en tamaño grande (#ff6b6b o #d4af37)
- [ ] Checkmarks para cada elemento (✓)
- [ ] Icono de Hotmart
- [ ] Icono de garantía (shield)
- [ ] Badge: "Limited time"
- [ ] Timer (opcional): Días restantes

### Technical Specs
- Card: Box shadow, padding generoso
- Button: 48px height mín, hover effect
- Font size: Headline 2.5rem, body 1rem
- Color: Dark card on light background
- Mobile: Full width, stack elementos

---

## 💬 SECCIÓN 5: TESTIMONIOS

### Objetivo
Social proof. "¿Qué dicen otros?"

### Layout
- Carousel o grid 3 columnas
- Cada testimonio: foto + quote + nombre + resultado

### Copy Template

**Testimonio 1:**
```
FOTO: [Avatar circular 80x80]

"Vendía 1 cliente al mes. Aplicaba BEAT y en mes 2 ya eran 5.
El método es simple pero genera resultados."

— Juan López, Coach de Ventas | CDMX

Resultado: De 1 a 5 clientes/mes en 30 días
```

**Testimonio 2:**
```
"No sabía explicar mi valor sin parecer arrogante.
BEAT me enseñó a alineارme primero. Ahora vengo confianza."

— María García, Consultora | Guadalajara

Resultado: Cerró 3 clientes en 2 semanas post-curso
```

**Testimonio 3:**
```
"Tenía miedo a vender. BEAT convirtió el miedo en confianza.
Hoy llevo 20 clientes nuevos y referencias todos los meses."

— Carlos Rodríguez, Freelancer | Buenos Aires

Resultado: Ingresos 3x en 3 meses
```

[+ 5-7 testimonios más]

### Visual Elements
- [ ] Foto real (no stock)
- [ ] Nombre + título + ubicación
- [ ] Rating (⭐⭐⭐⭐⭐)
- [ ] Resultado cuantificado (número visible)
- [ ] Video testimonio (30-60 seg, opcional)

### Technical Specs
- Card: 300px width, border-radius
- Carousel: Infinite scroll o 3-col grid
- Font: Quote es italics, serif
- Color: Accent para resultado (rojo/oro)
- Mobile: Full width, 1 col stack

---

## ❓ SECCIÓN 6: FAQ

### Objetivo
Resolver objeciones. "¿Funciona? ¿Para quién? ¿Cómo?"

### Questions & Answers

**Q1: ¿Es realmente acceso vitalicio?**
```
Sí. Pagas $27 una sola vez. Tienes acceso para siempre, 
incluyendo actualizaciones futuras. Sin suscripción oculta 
ni cobros recurrentes. Garantizado por Hotmart.
```

**Q2: ¿Funciona si soy vendedor principiante?**
```
Sí, de hecho es perfecto para ti. BEAT está diseñado 
para vendedores sin formación formal. Los que venden 
por WhatsApp, llamadas e Instagram. Si ya eres coach 
o consultor, también te servirá para mejorar cierre.
```

**Q3: ¿Qué pasa si no me gusta?**
```
Devolvemos el 100% en 7 días. Sin preguntas incómodas.
Tu satisfacción es lo importante. Dinero atrás garantizado
por Hotmart, procesador verificado.
```

**Q4: ¿Es solo video o hay interacción?**
```
Es video grabado (60 minutos). Acceso inmediato, ves 
cuando quieras. Además tienes: grupo privado, descargables
en PDF y email de soporte. No es en vivo, es flexible.
```

**Q5: ¿Cuánto puedo ganar aplicando BEAT?**
```
Depende de ti, de tu industria y de cuánto apliques.
Nuestros estudiantes reportan entre +$500 a +$10,000/mes
en ingresos nuevos dentro de 3 meses. Algunos más, algunos
menos. Funciona si estás dispuesto a practicar.
```

**Q6: ¿Necesito experiencia previa?**
```
No. BEAT funciona para vendedores, coaches, consultores,
freelancers, emprendedores o cualquiera que necesite 
convencer a otros de su valor. Si hablas con clientes
potenciales, BEAT te ayuda.
```

**Q7: ¿Hay seguimiento después de comprar?**
```
Sí. Acceso inmediato a grupo privado, email semanal
con tips y descuentos en próximas ofertas. Si lo quieres,
hay mentorship adicional en BEAT PRO ($97/mes).
```

**Q8: ¿Puedo compartir acceso con otros?**
```
El acceso es personal. No está permitido compartir 
la contraseña. Una licencia = una persona. Si quieres 
que tu equipo lo haga, hay descuentos de grupo.
```

### Visual Elements
- [ ] Accordion expandible (click to open)
- [ ] Icono de pregunta/respuesta
- [ ] Alternating colors (Q dark, A light)
- [ ] Link a "Contactar Mario" si nada aplica

### Technical Specs
- Accordion: Smooth expand/collapse
- Font: Q es bold, A es normal
- Mobile: Full width, stack
- Behavior: Uno expandido por default

---

## 🌐 SECCIÓN 7: ECOSISTEMA

### Objetivo
"Hay más." Mostrar qué viene después (upsell softly).

### Layout
- 3 cards con CTA propios
- Narrative: BEAT → Xtao → Community

### Copy

**Subheadline:**
```
"Esto es solo el comienzo"
Después de BEAT EXPRESS, hay más oportunidades.
```

**Card 1: BEAT PRO**
```
BEAT PRO
$97 /mes

✓ Coaching mensual (grupal)
✓ Email semanal con casos nuevos
✓ Descuento 25% en Casa Xtao
✓ Acceso prioritario a viajes Xtao Exp
✓ Comunidad privada más activa

"Para quien quiere ir más profundo"

[Botón: "Saber más"]
```

**Card 2: XTAO EXPEDITIONS**
```
CLUB XTAO
$297-597 por viaje

✓ Viajes premium (Disney, Universal, destinos)
✓ Networking en vivo (conocer a miembros)
✓ Retiros en Bahías de Huatulco
✓ Acceso a programa de Advisors
✓ Descuentos en Casa Xtao

"Prueba el ecosistema. Viaja. Conecta."

[Botón: "Ver próximos viajes"]
```

**Card 3: COMUNIDAD**
```
COMUNIDAD BEAT
Gratis con BEAT EXPRESS

✓ Grupo privado (200+ miembros)
✓ Compartir resultados
✓ Networking con otros vendedores
✓ Acceso a Mario ocasionalmente
✓ Descuentos en ofertas futuras

"No estás solo. Hay 1000+ usando BEAT."

[Botón: "Unirse al grupo"]
```

### Visual Elements
- [ ] Card design con gradient sutil
- [ ] Icono para cada tier (learn, travel, community)
- [ ] Números: Precio grande, beneficios checkmarks
- [ ] CTA consistente pero diferenciado

### Technical Specs
- 3 cards, grid or carousel
- Mobile: Stack full width
- Padding: Generoso (40px)
- Shadow: Hover effect lift

---

## 🎯 SECCIÓN 8: FINAL CTA + GARANTÍA

### Objetivo
Convertir. Último empujón antes del checkout.

### Copy

**Headline:**
```
"¿Listo para cambiar tu forma de vender?"
```

**Subheadline:**
```
60 minutos. $27. Acceso de por vida.
Garantía 100% o dinero atrás en 7 días.
```

**Button (GRANDE):**
```
ACCESO AHORA • $27 USD →
```

**Trust Line (Debajo del botón):**
```
✓ Pago seguro | ✓ Garantía Hotmart | ✓ Sin riesgo
```

### Visual Elements
- [ ] Button color: #ff6b6b (rojo) o #d4af37 (oro)
- [ ] Button tamaño: 60px height mín
- [ ] Background: Gradiente o color sólido
- [ ] Trust icons: SSL, Hotmart, Money-back

### Technical Specs
- Section: Full width, contrasting color
- Button: 60px height, 48px padding x/y
- Font: Headline 2rem, body 1.1rem
- Hover: Scale up, glow effect

---

## 🔧 FOOTER

### Copy

**Links Principales:**
- [Home]
- [Análisis Digital]
- [Contacto]
- [Privacidad]

**Social:**
- Instagram @mariovillanueva.mx
- LinkedIn Mario Villanueva
- YouTube (si existe)

**Legal:**
```
© 2026 Mario Villanueva. Todos los derechos reservados.
Powered by Softvibes Lab.

Términos de Servicio | Aviso de Privacidad | Contacto
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (1200px+)
- 3-4 columnas donde aplique
- Hero full screen
- Testimonios grid 3 cols
- FAQ 2 cols

### Tablet (768px-1199px)
- 2 columnas generalmente
- Hero ajustado
- Stack en autoridad

### Mobile (< 768px)
- 1 columna todo
- Hero text más pequeño
- Botones full width
- Testimonios 1 col carousel
- FAQ accordion obligatorio

---

## 🎨 ESPECIFICACIONES VISUALES

### Paleta de Colores
```
Primary:      #2d3436 (Dark navy)
Accent:       #ff6b6b (Coral red)
Gold:         #d4af37 (For premium)
Light:        #f8f9fa (Background)
Text:         #2d3436 (Dark)
Success:      #27ae60 (Green checkmarks)
```

### Tipografía
```
Headlines:    Playfair Display (serif, bold)
Body:         System stack (-apple-system, sans-serif)
Weights:      400 (regular), 600 (bold), 700 (extra bold)
Line height:  1.6 (body), 1.2 (headlines)
```

### Spacing
```
XS: 8px
SM: 16px
MD: 24px
LG: 40px
XL: 60px
XXL: 80px
```

### Shadows
```
Light:   0 2px 8px rgba(0,0,0,0.08)
Medium:  0 4px 16px rgba(0,0,0,0.12)
Heavy:   0 12px 32px rgba(0,0,0,0.16)
```

---

## 🔌 INTEGRACIONES TÉCNICAS

### Must-Have
- [ ] Hotmart checkout (iframe o redirect)
- [ ] Google Analytics 4
- [ ] Meta Pixel (Facebook tracking)
- [ ] Email capture (Mailchimp webhook)

### Nice-to-Have
- [ ] Calendly (para demos)
- [ ] Typeform (para quiz)
- [ ] Intercom chat (customer support)
- [ ] Zapier (automation)

---

## 📊 TESTING & OPTIMIZATION

### A/B Tests Prioritarios

**Test 1: Hero CTA (Semana 1)**
```
Variante A: "Acceso Ahora • $27"
Variante B: "Ver BEAT Express"
Variante C: "Empezar en 60 minutos"
→ Métrica: CTR hero button
```

**Test 2: Pricing (Semana 2)**
```
Variante A: "$27 USD"
Variante B: "$27 USD (Desde $0.45/día)"
Variante C: "$27 USD vs $497 (94% off)"
→ Métrica: Conversion rate
```

**Test 3: Testimonios (Semana 3)**
```
Variante A: 3 testimonios (actuales)
Variante B: 10 testimonios
Variante C: Video testimonios
→ Métrica: Conversion rate
```

### Performance Targets
- PageSpeed: > 80 (Google)
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1
- Conversion rate: 5%+
- Mobile conversion: 3%+

---

## 🚀 CHECKLIST PRE-LAUNCH

- [ ] Toda copy revisada por Mario
- [ ] Hotmart checkout probado (test purchase)
- [ ] Email bienvenida funciona
- [ ] Analytics configurado
- [ ] Pixel Meta verificado
- [ ] Mobile teseteado (iPhone 12, Pixel 6)
- [ ] Links internos todos working
- [ ] Garantía Hotmart visible
- [ ] Trust badges presentes
- [ ] Testimonios con permiso escrito
- [ ] SSL certificate OK
- [ ] Speedtest > 80
- [ ] Domain DNS ok
- [ ] Backups configurados

---

## 📈 POST-LAUNCH

**Day 1-7:** Monitor crashes, email flow, testimonios
**Week 2:** A/B test hero + pricing
**Week 3:** Analyze data, optimize copy
**Week 4:** Launch ads (Meta + Google)
**Month 2:** Escalado de presupuesto

---

**Especificación completada:** 2026-07-28  
**Pronto:** HTML build + implementation

