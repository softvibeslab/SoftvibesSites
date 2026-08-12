# Mario Villanueva - Sitio Web Completo

**Status:** ✅ Listo para deploy  
**Fecha:** 2026-07-28  
**Estructura:** Landing + Análisis integrados

---

## 📁 Estructura de Archivos

```
sitio-completo/
├── index.html           (Landing page principal)
├── analisis.html        (Página de análisis)
├── styles.css           (Estilos compartidos)
├── README.md            (Este archivo)
└── .htaccess            (Opcional: configuración Apache)
```

---

## 🚀 Cómo Subir a Hostinger

### Opción 1: Usando Hostinger File Manager (Recomendado)

1. **Accede a tu cuenta Hostinger**
   - Ir a: https://hpanel.hostinger.com
   - Login con tus credenciales

2. **Navega a File Manager**
   - Panel izquierdo → Files → File Manager
   - Abre carpeta `public_html`

3. **Sube los archivos**
   - Crea carpeta: `mario-villanueva` (si quieres subdirectorio)
   - O sube directamente a `public_html` (raíz)
   - Sube: `index.html`, `analisis.html`, `styles.css`

4. **Verifica en navegador**
   - www.tudominio.com (debería mostrar landing)
   - www.tudominio.com/analisis.html (debería mostrar análisis)

---

### Opción 2: Usando FTP (Si prefieres)

1. **Descarga FileZilla** (gratis)
   - https://filezilla-project.org/

2. **Conecta con FTP**
   - Host: `ftp.tudominio.com` (o IP que Hostinger da)
   - Usuario: Tu usuario FTP
   - Password: Tu password FTP
   - Puerto: 21

3. **Navega a `public_html`**

4. **Sube archivos**
   - Arrastra: `index.html`, `analisis.html`, `styles.css`

5. **Verifica en navegador**

---

### Opción 3: Usando SSH/Terminal (Avanzado)

```bash
# Conectar a servidor
ssh usuario@tudominio.com

# Navegar a público
cd public_html

# Descargar archivos (si tienes en GitHub o Drive)
wget https://link-a-tu-carpeta/index.html
wget https://link-a-tu-carpeta/analisis.html
wget https://link-a-tu-carpeta/styles.css

# O copiar local (si tienes acceso local)
scp index.html usuario@tudominio.com:/public_html/
scp analisis.html usuario@tudominio.com:/public_html/
scp styles.css usuario@tudominio.com:/public_html/
```

---

## ⚙️ Configuración en Hostinger

### 1. Dominio (si es nuevo)

Si compras `mariovillanueva.com`:
- Panel Hostinger → Domains
- Agregar dominio
- Apuntar a tu hosting
- Esperar 24-48h para propagación DNS

### 2. Email (opcional)

Si quieres `mario@mariovillanueva.com`:
- Panel → Email
- Crear cuenta de email
- Usar en formularios/contacto

### 3. SSL Certificate (HTTPS)

- Debería estar automático en Hostinger
- Verificar: URL debería ser `https://`
- Si no: Panel → Security → SSL → Install Free SSL

### 4. Redirección (si tienes dominio viejo)

Si tenías otro dominio:
- Panel → Domains → Redirects
- Redirigir antiguo → nuevo

---

## 🔗 URLs Después del Deploy

```
Página principal:      https://mariovillanueva.com/
Análisis:             https://mariovillanueva.com/analisis.html
```

**Opcional (para links más limpios):**
- Renombrar `analisis.html` → `analisis/index.html`
- URL quedaría: `https://mariovillanueva.com/analisis/`

---

## 📝 Cambios Recomendados Post-Deploy

Una vez vivo, actualiza estos placeholders:

### En `index.html`

**Línea ~150 (botón de compra):**
```html
<!-- Cambiar esto: -->
<a href="https://pay.hotmart.com/" class="btn btn-primary btn-large" target="_blank">

<!-- Por tu link real de Hotmart -->
<a href="https://pay.hotmart.com/[TU-PRODUCTO-ID]" class="btn btn-primary btn-large" target="_blank">
```

**Línea ~50 (foto de Mario):**
```html
<!-- Cambiar esto: -->
<div style="background: linear-gradient(135deg, #2d3436, #ff6b6b); ...">
    [Foto Mario]
</div>

<!-- Por esto: -->
<img src="mario-foto.jpg" alt="Mario Villanueva" style="width: 100%; max-width: 400px; border-radius: 12px;">
```

### En `styles.css` (Opcional)

Si quieres cambiar colores de marca:
```css
--primary: #2d3436;    /* Navy principal */
--accent: #ff6b6b;    /* Coral */
--gold: #d4af37;      /* Dorado (premium) */
```

---

## 📊 Testing Post-Deploy

Después de subir, verifica:

- [ ] Landing loads rápido (< 3 seg)
- [ ] Mobile se ve bien (probar en iPhone + Android)
- [ ] Links funcionan (Home, Análisis, CTA)
- [ ] Botón "Acceso Ahora" lleva a Hotmart
- [ ] Responsivo (desktop, tablet, mobile)
- [ ] No hay errores 404
- [ ] HTTPS funciona (candado en URL)
- [ ] Analytics tracking (si lo configuraste)

---

## 🔧 Troubleshooting

### Problema 1: "Página muestra HTML crudo"
**Solución:** 
- Verifica que `index.html` esté en `public_html` (raíz)
- No en subcarpeta
- Espera 5 min para cache

### Problema 2: "Styles no cargan (página se ve fea)"
**Solución:**
- Verifica que `styles.css` esté en misma carpeta que HTML
- Path en HTML debe ser: `<link rel="stylesheet" href="styles.css">`
- Si en subcarpeta, cambiar a: `<link rel="stylesheet" href="/mario-villanueva/styles.css">`

### Problema 3: "Botón de compra no funciona"
**Solución:**
- Verificar link de Hotmart es correcto
- Probar link en navegador incógnito
- Contactar Hotmart support

### Problema 4: "Análisis.html no se ve"
**Solución:**
- Verificar archivo existe en carpeta
- URL debe ser exacta: `/analisis.html`
- Si error 404: archivo no subió bien

---

## 📱 Configuración de Analytics (Opcional)

Si quieres trackear conversiones:

### Google Analytics 4

1. Ir a: https://analytics.google.com
2. Crear propiedad: "Mario Villanueva"
3. Copiar tracking ID
4. Agregar antes de `</head>` en index.html y analisis.html:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
</script>
```

### Meta Pixel (Si usas ads después)

1. Ir a: https://business.facebook.com/pixels
2. Crear pixel
3. Copiar ID
4. Agregar al HTML (similar a Google Analytics)

---

## 📧 Email (Formulario de contacto)

Actualmente no hay formulario de contacto en el sitio.

**Si quieres agregar:**

1. Opción simple: Link a email
```html
<a href="mailto:mario@mariovillanueva.com">Contactar</a>
```

2. Opción con formulario: Usar Formspree (gratis)
   - https://formspree.io/
   - Crear formulario
   - HTML auto-generate

---

## 🎨 Personalizaciones Futuras

Cosas que puedes cambiar sin "romper" nada:

- **Colores:** Editar `:root` en `styles.css`
- **Textos:** Editar directo en HTML
- **Fotos:** Reemplazar URLs
- **Links:** Actualizar href en botones
- **Fuentes:** Cambiar `font-family` en CSS

---

## ✅ Checklist Final

```
[ ] Archivos subidos a Hostinger (index + analisis + styles)
[ ] Dominio apuntando correctamente
[ ] HTTPS funcionando
[ ] Landing se ve bien en desktop
[ ] Landing se ve bien en mobile
[ ] Análisis se carga
[ ] Botón de compra funciona
[ ] Sin errores 404
[ ] Analytics configurado (si aplica)
[ ] Links correctos (Instagram, LinkedIn, etc)
[ ] Hotmart link actualizado con tu producto
```

---

## 📞 Soporte

Si tienes issues:

1. **Hostinger Support:** https://support.hostinger.com
2. **Hotmart Support:** https://support.hotmart.com
3. **Contacto:** mario@mariovillanueva.com

---

**Sitio listo. Let's go!** 🚀

Actualizado: 2026-07-28
