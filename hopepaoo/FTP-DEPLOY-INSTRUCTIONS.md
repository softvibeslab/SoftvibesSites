# 📤 INSTRUCCIONES DE DEPLOY VÍA FTP - HOPEPAOO

## Opción 2: Deploy Manual en Hostinger

### Paso 1: Obtén tus Credenciales FTP
```
En Hostinger Dashboard:
1. Ir a Hosting → Tu dominio/hosting
2. Buscar "File Manager" o "FTP"
3. Copiar:
   - Host: [FTP_HOST]
   - Usuario: [FTP_USER]
   - Contraseña: [FTP_PASSWORD]
   - Puerto: 21 (o 22 si es SFTP)
```

### Paso 2: Conecta vía FTP
**Opción A: FileZilla (Recomendado)**
```
1. Descargar FileZilla: https://filezilla-project.org/
2. Abrir → Site Manager
3. Crear nuevo sitio:
   - Nombre: "Hopepaoo"
   - Host: [Tu FTP_HOST]
   - Usuario: [Tu FTP_USER]
   - Contraseña: [Tu FTP_PASSWORD]
   - Puerto: 21
4. Conectar
```

**Opción B: Terminal (Mac/Linux)**
```bash
# Conectar
ftp [FTP_HOST]
# Ingresar usuario y contraseña

# Navegar a la raíz pública
cd public_html
# o
cd www
# o
cd /var/www/html

# Subir archivo ZIP
put hopepaoo-site.zip

# Salir
quit
```

### Paso 3: Descomprimir en Hostinger
**Opción A: Panel de Control Hostinger**
1. Ir a File Manager
2. Buscar `hopepaoo-site.zip`
3. Click derecho → Extract/Descomprimir

**Opción B: Terminal SSH (si tienes acceso)**
```bash
ssh [usuario]@[host]
cd public_html
unzip hopepaoo-site.zip
rm hopepaoo-site.zip
```

### Paso 4: Acceder al Sitio
```
URL: https://[tu-dominio].hostingersite.com
o
URL: https://[subdominio].tu-dominio.com
```

### Paso 5: Verificar Estructura
Debería ver en `public_html/`:
```
landing.html
analisis/
  └─ index.html
cms/
  └─ index.html
profile.jpg
config.json
README.md
```

---

## Archivo Descargable

**Descargar**: `hopepaoo-site.zip` (26 KB)

```
hopepaoo-site.zip contiene:
├── landing.html          (Landing principal)
├── analisis/index.html   (Análisis estratégico)
├── cms/index.html        (Panel CMS)
├── profile.jpg           (Foto de perfil)
├── config.json           (Configuración)
├── README.md             (Documentación)
├── LINKS.md              (Enlaces)
└── REELS-STRATEGY.md     (Estrategia IG)
```

---

## ⚠️ Troubleshooting

### "Forbidden 403"
- Revisar permisos de carpeta (chmod 755)
- Asegurar que `landing.html` es público
- Verificar que no hay .htaccess bloqueando

### "File not found 404"
- Verificar que el ZIP se descomprimió correctamente
- Confirmar que `landing.html` está en el root
- Limpiar caché del navegador

### "Conexión FTP rechazada"
- Verificar credenciales FTP
- Confirmar que FTP está habilitado en Hostinger
- Usar puerto 21 para FTP (no 22)

---

## 🎯 Próximos Pasos Después de Deploy

1. ✅ Landing accesible en URL pública
2. ✅ Probar botón WhatsApp (+52 998 762 7884)
3. ✅ Verificar que CMS funciona (LocalStorage)
4. ✅ Compartir link en Instagram bio
5. ✅ Crear 12 reels con link en bio

---

## 📞 Soporte Hostinger

Si necesitas ayuda:
- Chat en vivo: Hostinger Dashboard
- Email: support@hostinger.com
- Knowledge Base: https://support.hostinger.com/
