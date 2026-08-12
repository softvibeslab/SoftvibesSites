# 🚀 DEPLOYMENT A HOSTINGER - MARIO VILLANUEVA

**Status:** ✅ SITIO COMPLETO LISTO  
**Fecha:** 2026-07-28  
**Estructura:** `/sitio-completo/`

---

## 📁 QUÉ ESTÁ LISTO

### Archivos Generados

```
sitio-completo/
├── index.html           ← Landing page (inicio)
├── analisis.html        ← Página de análisis
├── styles.css           ← Estilos compartidos
├── .htaccess            ← Configuración Apache
├── README.md            ← Instrucciones detalladas
└── [DEPLOYMENT.md]      ← Este archivo
```

**Ubicación local:** 
```
/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/mario-villanueva/sitio-completo/
```

---

## 🎯 QUÉ CONTIENE

### 1. Landing Page (index.html)
- Hero con headline claro
- About: Quién es Mario (foto + stats)
- Método BEAT (4 cards visuales)
- Testimonios (3-6 cards)
- Oferta BEAT EXPRESS ($27)
- Footer con links

**Líneas:** ~350 | **Size:** ~20KB

### 2. Página de Análisis (analisis.html)
- Hero con análisis title
- 5 Hallazgos ejecutivos
- Arquitectura recomendada (4 tiers)
- Timeline de implementación
- Conclusión
- Footer

**Líneas:** ~250 | **Size:** ~18KB

### 3. Estilos CSS (styles.css)
- Variables de color (brand)
- Responsive (desktop, tablet, mobile)
- Animaciones suaves
- Grid layouts
- Mobile-first design

**Líneas:** ~700 | **Size:** ~25KB

### 4. Configuración (.htaccess)
- HTTPS redirect
- Gzip compression
- Cache headers
- Security settings

---

## ⚡ PASOS RÁPIDOS DE DEPLOY

### Paso 1: Acceder a Hostinger (2 min)

```
1. Ir a https://hpanel.hostinger.com
2. Login con tus credenciales
3. Seleccionar tu plan/sitio
```

### Paso 2: Abrir File Manager (1 min)

```
Panel izquierdo → Files → File Manager
```

### Paso 3: Navegar a public_html (1 min)

```
Doble-click en "public_html"
(Si es tu primer sitio, estará vacío o con index.html default)
```

### Paso 4: Subir Archivos (2-3 min)

**Opción A: Drag & Drop**
```
Desde tu compu:
/Users/rogergv/Documents/.../sitio-completo/

Arrastra y suelta en File Manager:
- index.html
- analisis.html
- styles.css
- .htaccess
```

**Opción B: Upload Button**
```
File Manager → Upload
Selecciona los 4 archivos
Click "Upload"
```

### Paso 5: Verificar en Navegador (1 min)

```
Abre: https://tudominio.com

Debería ver:
- Hero claro
- "Aprendí a vender. Ahora enseño cómo."
- Landing completa
```

**Verificar análisis:**
```
Abre: https://tudominio.com/analisis.html

Debería ver:
- Página de análisis
- 5 hallazgos
- Arquitectura
```

---

## 🔧 CAMBIOS POST-DEPLOY (Importantes)

### 1. Actualizar Link de Hotmart

**En `index.html`, busca línea ~150:**

```html
<!-- ANTES -->
<a href="https://pay.hotmart.com/" class="btn btn-primary btn-large" target="_blank">

<!-- DESPUÉS (con tu producto ID) -->
<a href="https://pay.hotmart.com/[TU-PRODUCTO-ID]" class="btn btn-primary btn-large" target="_blank">
```

**Cómo conseguir el link:**
1. Ve a https://hotmart.com
2. Dashboard → Productos
3. BEAT EXPRESS → Ver producto
4. Copiar link de checkout

### 2. Agregar Foto de Mario

**En `index.html`, busca línea ~80:**

```html
<!-- ANTES -->
<div style="background: linear-gradient(135deg, #2d3436, #ff6b6b); ...">
    [Foto Mario]
</div>

<!-- DESPUÉS -->
<img src="mario-foto.jpg" alt="Mario Villanueva" style="width: 100%; max-width: 400px; border-radius: 12px;">
```

**Luego:**
1. Descarga tu foto de Mario
2. Renombra a: `mario-foto.jpg`
3. Sube a `public_html` (misma carpeta que HTML)

### 3. Actualizar Links Sociales

**En `index.html` y `analisis.html`, busca footer:**

```html
<!-- Cambiar estos links por los reales -->
<a href="https://instagram.com/mariovillanueva.mx" target="_blank">Instagram</a>
<a href="https://linkedin.com/in/mariovillanueva" target="_blank">LinkedIn</a>
```

---

## 📊 TESTING CHECKLIST

Después de subir, verifica:

```
FUNCIÓN
[ ] Landing carga en < 3 segundos
[ ] Análisis carga sin errores
[ ] Botón "Ver BEAT Express" funciona
[ ] Botón "¿Cómo funciona?" lleva a #beat
[ ] CTA de precio lleva a Hotmart
[ ] Link "Análisis" en header funciona
[ ] Volver a inicio desde análisis funciona

VISUAL
[ ] Desktop se ve bien (1920px+)
[ ] Tablet se ve bien (768px-1200px)
[ ] Mobile se ve bien (< 768px)
[ ] Fotos cargan correctamente
[ ] Colores son consistentes
[ ] No hay texto cortado
[ ] Botones son clickeables

SEGURIDAD
[ ] URL es HTTPS (candado)
[ ] .htaccess bloquea acceso a directorios
[ ] Sin errores 404
[ ] Sin errores de console (F12)

PERFORMANCE
[ ] PageSpeed > 70 (Google PageSpeed Insights)
[ ] Email se envía rápido (si aplica)
[ ] Analytics trackea (si configuraste)
```

---

## 🌍 CONFIGURACIÓN DE DOMINIO

### Si compras dominio en Hostinger

1. **Panel → Domains**
2. **Register New Domain**
3. Buscar: `mariovillanueva.com`
4. Agregar al carrito
5. Checkout
6. **Apunta automáticamente** a tu hosting

**Time:** 24-48h para propagación DNS

### Si ya tienes dominio (en otro registrador)

1. **Hostinger → Domains → External Domains**
2. **Add External Domain**
3. Hostinger te dará nameservers
4. Actualiza en tu registrador actual
5. Espera 24-48h

---

## 📧 EMAIL SETUP (Opcional)

Si quieres `mario@mariovillanueva.com`:

1. **Hostinger → Email**
2. **Create New Email Account**
3. Usuario: `mario`
4. Dominio: `mariovillanueva.com`
5. Password: Strong password
6. Crear

**Usar en:**
- Footer del sitio
- Email firma
- Email de bienvenida Hotmart

---

## 🔗 URLS FINALES

```
Landing:        https://mariovillanueva.com/
Análisis:       https://mariovillanueva.com/analisis.html
Email:          mario@mariovillanueva.com
Instagram:      https://instagram.com/mariovillanueva.mx
LinkedIn:       https://linkedin.com/in/mariovillanueva
Hotmart:        [Link producto]
```

---

## 📈 PRÓXIMOS PASOS (Después de Deploy)

### Semana 1 Post-Deploy
```
[ ] Verificar landing en navegadores (Chrome, Safari, Firefox)
[ ] Prueba compra en Hotmart (transacción test)
[ ] Email de bienvenida funciona
[ ] Analytics trackea visitors
[ ] Share en Instagram + LinkedIn (nuevo sitio live)
```

### Semana 2-4
```
[ ] Recolectar testimonios (actualizar en landing)
[ ] Publicar posts sobre BEAT
[ ] Email sequences iniciados
[ ] Primeras conversiones registradas
[ ] Optimizar basado en data
```

### Mes 2+
```
[ ] Lanzar ads (Meta/Google)
[ ] Crear BEAT PRO landing (página adicional)
[ ] Agregar más testimonios video
[ ] Escalar
```

---

## 🆘 TROUBLESHOOTING

### "Página muestra HTML en texto"
**Solución:**
```
Espera 5 min
Limpia cache del navegador (Ctrl+Shift+Del)
Intenta en navegador diferente
```

### "Styles no cargan (se ve fea)"
**Solución:**
```
Verifica que styles.css esté en public_html
En inspección (F12), check Network tab
Si error 404 → archivo no subió bien
```

### "Botón de Hotmart no funciona"
**Solución:**
```
Verificar link está actualizado
Probar link en incógnito
Contactar Hotmart support
```

### "Análisis.html dice 404"
**Solución:**
```
Verificar archivo existe en carpeta
URL debe ser exacta: /analisis.html
Esperar propagación de cambios
```

---

## 📞 SOPORTE

- **Hostinger:** https://support.hostinger.com
- **Hotmart:** https://support.hotmart.com
- **Contacto:** mario@mariovillanueva.com

---

## ✅ DEPLOYMENT COMPLETADO

**Archivos listos en:**
```
/Users/rogergv/Documents/SoftvibesLab/SoftvibesSites/mario-villanueva/sitio-completo/
```

**Siguientes pasos:**
1. Descargar carpeta `sitio-completo/` a tu compu
2. Abrir Hostinger File Manager
3. Subir los 4 archivos
4. Verificar en navegador
5. Actualizar Hotmart link + foto Mario
6. LIVE ✅

---

**Listo para deployment. ¡Adelante!** 🚀

Actualizado: 2026-07-28
