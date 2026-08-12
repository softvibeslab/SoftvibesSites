# 🚀 Guía de Implementación - Landing Mario Villanueva

**Fecha Creación:** 2026-07-28  
**Status:** ANÁLISIS + HTML LISTOS PARA DEPLOY  

---

## 📋 Resumen Ejecutivo

Hemos creado:
- ✅ **Análisis estratégico** de perfiles (Instagram, Linktree, sitio web)
- ✅ **Landing page HTML** responsive y funcional
- ⏭️ Falta: videos, testimonios reales, integración de pagos

**Tiempo para deploy:** 2-3 semanas (con testimonios + Stripe)

---

## 📁 Archivos Entregables

### 1. **Mario_Eco_Analysis.md**
Documento estratégico con:
- Análisis de persona, propuesta de valor, voz/tono
- Estética visual recomendada
- Arquetipos de marca
- Insights de qué funciona + oportunidades
- Tabla de prioridades (qué hacer primero)

**Uso:** Referencia para copywriting, diseño, decisiones estratégicas

### 2. **mario-landing.html**
Landing page completa en un archivo (HTML + CSS + JS inline)
- Hero emocional con pregunta resonadora
- Proof section (ecosistema empresarial)
- Product section (BEAT EXPRESS + features)
- Testimonials (3 casos reales)
- FAQ (6 preguntas clave)
- Final CTA

**Uso:** Abrir en navegador, personalizar, publicar

---

## 🎯 Fase 1: Setup Inmediato (Hoy)

### Paso 1: Revisar Landing Page
```bash
# Abrir en navegador
open mario-landing.html
```
- Verifica que se vea bien
- Revisa responsive (resize browser)
- Prueba FAQs (click para expandir)

### Paso 2: Personalizar Contenido
En `mario-landing.html`, busca y reemplaza:

```html
<!-- Reemplazar estos placeholders: -->

<!-- Link real del producto/checkout -->
<a href="[AQUÍ VA ENLACE STRIPE O PAGO]" class="cta-primary">

<!-- Testimonios reales -->
<div class="testimonial">
    <div class="testimonial-text">"REEMPLAZAR CON TESTIMONIO REAL"</div>
    <div class="testimonial-author">NOMBRE REAL</div>
    <div class="testimonial-role">ROL/EMPRESA</div>
    <div class="result">MÉTRICA: $X → $Y</div>
</div>

<!-- Links en footer -->
<a href="[INSTAGRAM DE MARIO]">Instagram</a>
<a href="[LINKTREE DE MARIO]">LinkTree</a>
<a href="[SITIO REAL]">Del Ser Al Vender</a>
```

### Paso 3: Testear Localmente
- Verifica todos los links
- Prueba mobile en DevTools
- Comprueba que footers/headers se ven bien

---

## 🎥 Fase 2: Integración de Contenido (Semana 1-2)

### Paso 1: Obtener Testimonios Video
Contacta a 3 clientes reales con BEAT que paguen dinero y:
1. Pídeles grabar 30-45 segundos
2. Pregunta: "¿Cuál fue tu resultado específico? (métrica)"
3. Cómo se sentían antes vs. después

**Script recomendado:**
> "Hola [Nombre], Mario me pidió que te contate. ¿Podrías grabar un video corto (30 seg) diciendo tu nombre, tu rol, y cuál fue tu resultado con BEAT? Por ejemplo: cantidad de clientes, ingresos, o cambio en tu proceso."

**Ubicación en landing:** 
- Antes de testimonials section, agregar embed video
- O thumbnail que abra video modal

### Paso 2: Integrar Video Hero (Opcional pero Recomendado)
En la sección Hero, reemplazar emoji 🎯 con video:
```html
<div class="hero-image">
    <video width="100%" height="100%" controls>
        <source src="[VIDEO MARIO PRESENTANDO BEAT]" type="video/mp4">
    </video>
</div>
```

**Qué debe mostrar el video:**
- Mario presentando el problema ("¿Te sientes falso al vender?")
- Breve demostración del framework BEAT
- Llamada a la acción
- Máximo 60 segundos

### Paso 3: Lead Magnet - BEAT Guide PDF
Crear PDF con:
- Guía visual del framework BEAT (1 página)
- 3 ejemplos de conversación BEAT (2-3 páginas)
- Checklist de aplicación (1 página)
- Link a descargar: CTA secundaria en Hero

**Usar para:** Email capture, building list

---

## 💳 Fase 3: Pagos & Email (Semana 2-3)

### Opción A: Stripe + Hosted Checkout
```javascript
// En mario-landing.html, reemplazar links CTA:
<a href="https://buy.stripe.com/[TU_STRIPE_LINK]" class="cta-primary">
    Acceder a BEAT EXPRESS
</a>
```

**Setup:**
1. Crear producto en Stripe dashboard ($27)
2. Generar payment link
3. Reemplazar href en landing

### Opción B: Gumroad (Más fácil)
```
1. Subir BEAT EXPRESS a Gumroad ($27)
2. Copiar link compartible
3. Pegar en CTA landing
```

### Email Sequences (Usar Mailchimp/ConvertKit)
Crear secuencia automática:

**Email 0 - Welcome (Inmediato después de pago)**
```
Asunto: "¡Acceso a BEAT EXPRESS! 🎯"
- Link a curso
- Cómo empezar (primer módulo)
- Expectativa: "Verás cambios en tu próxima venta"
```

**Email 1 - Day 3**
```
Asunto: "¿Ya viste tu primer cambio con BEAT?"
- Testimonios de otros usuarios
- Recordatorio de garantía 7 días
```

**Email 2 - Day 7**
```
Asunto: "¿Duda sobre BEAT? Responde a este email"
- Soporte directo
- Oferta upsell: BEAT Intensive ($297)
```

---

## 📊 Fase 4: Analytics & Optimization (Semana 3+)

### Setup Analytics
```html
<!-- En <head> de mario-landing.html -->
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>

<!-- Reemplazar GA_ID con tu ID de Google Analytics -->
```

### Métricas a Trackear
- Visitor count (sesiones)
- Click rate en CTA (Hero, Product, Final)
- Email signups (si tienes lead magnet)
- Conversion rate (visitas → compras)
- Bounce rate por sección

**Objetivos iniciales:**
- 3% click-through rate en CTA hero
- 2-5% conversion (visitas → compra)
- 15-20% email signup rate

### A/B Testing (Semana 3+)
Después de 2 semanas de datos, testea:

**Variación 1: Hero copy**
- A: "¿Te sientes falso al vender?" (actual)
- B: "Vende sin sentir que estás manipulando"

**Variación 2: CTA color**
- A: Naranja #d97706 (actual)
- B: Rosa/Magenta #ec4899

**Variación 3: Testimonios**
- A: 3 testimonios (actual)
- B: 1 testimonios muy detallado (video)

---

## 🌐 Hosting & Deploy

### Opción 1: Hostinger (Recomendado)
1. Ir a tu panel Hostinger
2. Crear nuevo sitio en subdomain: `beat.delseralvender.com`
3. Upload `mario-landing.html` vía FTP/File Manager
4. Ajustar SSL certificate (automático)
5. Test en `beat.delseralvender.com`

### Opción 2: VPS (Tu servidor actual)
```bash
# SSH a tu VPS
ssh root@[VPS_IP]

# Navegar a raíz
cd /var/www/menuvibes

# Crear directorio
mkdir -p beat
cd beat

# Upload archivo (desde tu máquina)
scp mario-landing.html root@[VPS_IP]:/var/www/menuvibes/beat/

# Configurar nginx
sudo nano /etc/nginx/sites-available/beat.rovicrm.com
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name beat.rovicrm.com;
    root /var/www/menuvibes/beat;
    index mario-landing.html;
    
    location / {
        try_files $uri $uri/ /mario-landing.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/beat.rovicrm.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Checklist de Implementación

### Semana 1
- [ ] Revisar landing page localmente
- [ ] Personalizar contenido placeholder
- [ ] Contactar a 3 clientes para testimonios video
- [ ] Crear BEAT Guide PDF

### Semana 2
- [ ] Recibir y editar videos de testimonios
- [ ] Integrar videos en landing
- [ ] Setup Stripe/Gumroad payment
- [ ] Configurar Mailchimp/ConvertKit

### Semana 3
- [ ] Deploy a Hostinger o VPS
- [ ] Testear checkout end-to-end
- [ ] Configurar Google Analytics
- [ ] Enviar email de lanzamiento

### Semana 4+
- [ ] Monitorear conversiones
- [ ] A/B testing hero copy
- [ ] Optimizar based on data

---

## 📞 Soporte & Troubleshooting

### Landing no se ve bien en mobile?
Abre DevTools (F12) → Toggle device toolbar → Revisa responsiveness
El CSS está optimizado pero verifica:
```css
/* Media query mínimo:  */
@media (max-width: 768px) {
    .hero-grid { grid-template-columns: 1fr; }
}
```

### Links no funcionan?
Busca en mario-landing.html:
```html
<a href="[AQUÍ VA ENLACE]">
```
Y reemplaza con tu URL real

### ¿Dónde cambio los colores?
En CSS, sección `:root`:
```css
:root {
    --primary: #d97706;      /* Cambiar este para color principal */
    --accent: #ec4899;       /* Color secundario */
}
```

### ¿Agregar más secciones?
Copiar estructura:
```html
<section class="[nombre-section]">
    <div class="container">
        <h2 class="section-title">Título</h2>
        <p class="section-subtitle">Subtítulo</p>
        <!-- Contenido -->
    </div>
</section>
```

---

## 🎓 Recursos Útiles

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Google Analytics:** https://analytics.google.com
- **Mailchimp:** https://mailchimp.com
- **Gumroad:** https://gumroad.com

---

## 📈 Proyección de Resultados

Con ejecución adecuada (testimonios reales + traffic):

**Mes 1:**
- 500-1000 visitors
- 10-15 conversiones ($270-$405 revenue)
- 50-100 email signups

**Mes 2:**
- 1500-2500 visitors (organic + paid ads)
- 30-50 conversiones ($810-$1350)
- 150-300 email signups

**Mes 3+:**
- Email list permite upsell a BEAT Intensive ($297)
- AOV sube a $300+ (EXPRESS + extras)
- Runway para más productos

---

**Siguiente:** Una vez deployed, monitorear conversión y estar listo para A/B testing en semana 3.
