# 🔮 Mystic Nails Art · Guía de Upload a Hostinger

**Archivo ZIP:** `mystic-nails-art-hostinger.zip` (18 KB)

---

## 📋 Instrucciones para Subir a Hostinger

### Paso 1: Acceder a Hostinger Panel
1. Ve a https://hpanel.hostinger.com
2. Inicia sesión con tu cuenta

### Paso 2: Crear Nuevo Sitio (o usar existente)
**Opción A - Crear nuevo sitio:**
1. Click en **"Crear nuevo sitio"** o **"Add Website"**
2. Elige dominio: `mysticnailsart.hostingersite.com` (o tu dominio propio)
3. Selecciona datacenter (recomendado: América Latina)
4. Confirmar

**Opción B - Usar sitio existente:**
1. Selecciona un sitio de los que ya tienes

### Paso 3: Subir Archivos via FTP o File Manager

#### Método 1: File Manager (Más fácil, sin software adicional)
1. Accede a tu sitio en Hostinger
2. Click en **"File Manager"** o **"Administrador de archivos"**
3. Navega a la carpeta **public_html** (raíz del sitio)
4. Click en **"Subir archivos"** (Upload)
5. Selecciona el ZIP: `mystic-nails-art-hostinger.zip`
6. Hostinger descomprimirá automáticamente
7. **Importante:** Mueve el contenido de `sitio/index.html` a `public_html/index.html`

**Estructura correcta en public_html:**
```
public_html/
├── index.html              ← Landing principal
├── analisis/
│   └── index.html         ← Análisis (accesible en /analisis/)
├── README.md
└── ANALISIS.md
```

#### Método 2: FTP (Si prefieres cliente FTP)
1. Obtén credenciales FTP de Hostinger
2. Conecta con cliente FTP (Filezilla, Transmit, etc.)
3. Sube contenido del ZIP a `/public_html/`
4. Asegúrate que `index.html` esté en la raíz

### Paso 4: Verificar Sitio

Accede a tu URL:
- **Principal:** https://mysticnailsart.hostingersite.com
- **Análisis:** https://mysticnailsart.hostingersite.com/analisis/

---

## 🔍 Verificar Que Todo Funciona

Después de subir, verifica:

✅ **Landing carga correctamente**
- [ ] Hero section visible
- [ ] Imágenes de portafolio cargan
- [ ] Botón WhatsApp funciona
- [ ] Mobile responsive (abrir en móvil)

✅ **Análisis accesible**
- [ ] URL /analisis/ carga
- [ ] Links internos funcionan
- [ ] Estilos se ven correctos

✅ **Performance**
- [ ] Página carga en <3 segundos
- [ ] No hay errores en consola (F12 → Console)
- [ ] Imágenes se cargan

---

## ⚙️ Configuración Adicional (Opcional)

### SSL Certificate
- Hostinger proporciona SSL gratis con Let's Encrypt
- Debe activarse automáticamente
- Verifica que URL sea `https://` (no `http://`)

### DNS (Si usas dominio propio, ej: mysticnailsart.com)
1. Apunta tu dominio a Hostinger nameservers:
   - NS1: ns1.hostinger.com
   - NS2: ns2.hostinger.com
   - NS3: ns3.hostinger.com
2. Espera 24-48 horas para propagación DNS

### Email (Futuro)
Si necesitas email @mysticnailsart.com:
1. Ve a Email en Hostinger
2. Crea cuenta de email
3. Configura en cliente de email

---

## 🐛 Troubleshooting

### "404 Not Found" al acceder
**Causa:** index.html no está en la raíz (public_html)
**Solución:** 
- Verifica estructura de carpetas
- Mueve `index.html` a `public_html/`

### Imágenes no cargan
**Causa:** URLs de Unsplash bloqueadas o inactivas
**Solución:**
- Las imágenes son de Unsplash (externas, requieren conexión)
- Si necesitas imágenes locales, descarga las fotos y súbelas manualmente

### Estilos no se ven correctamente
**Causa:** CSS inline no se cargó
**Solución:**
- Limpia caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
- Verifica que el archivo index.html se subió completo

### WhatsApp botón no funciona
**Causa:** Problema de permisos o enlaces
**Solución:**
- Verifica que el número esté correcto: +52 984 310 8186
- Prueba el link directamente: https://wa.me/529843108186

---

## 📊 Después de Subir

### 1. Verificar Analytics
- Hostinger proporciona estadísticas de tráfico
- Monitorea visitas diarias
- Reporte inicial debe mostrar 0 errores 404

### 2. Actualizar Bio Instagram
```
🔮 Mystic Nails Art
ARTE EFÍMERO · Playa del Carmen
✨ Link en bio 👇

mysticnailsart.hostingersite.com
```

### 3. Enviar a Clientes
- Comparte link en WhatsApp a clientes existentes
- Prueba en grupos de referencia
- Pide feedback sobre landing

---

## 🚀 Próximos Pasos (Semana 2-4)

1. **Google Business** (Semana 2)
   - Crear perfil verificado
   - Agregar fotos
   - Link a landing

2. **TikTok + Reels** (Semana 3)
   - Grabar 3 videos de proceso
   - Agregar link a bio

3. **Email + WhatsApp** (Semana 4+)
   - Setup Brevo/Mailchimp
   - Crear secuencias de follow-up

---

## 📞 Support

Si tienes problemas:
1. Contacta al soporte de Hostinger (en tu panel hay chat)
2. Verifica documentación de Hostinger
3. Revisa caché del navegador

**Email de soporte Softvibes:** teamworkmobility@gmail.com

---

## ✅ Checklist Final

- [ ] ZIP descargado y listo
- [ ] Sitio creado en Hostinger
- [ ] Archivos subidos a public_html
- [ ] Landing accesible en URL
- [ ] Análisis accesible en /analisis/
- [ ] Imágenes cargan correctamente
- [ ] WhatsApp botón funciona
- [ ] Mobile responsive OK
- [ ] Bio Instagram actualizada
- [ ] Compartir link con primeros clientes

---

**¡Listo para lanzar! 🚀**
