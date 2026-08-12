# Playbook Softvibes MVP — Caso Vive Mar (documentación completa)

Documentación de todo el proceso ejecutado con Viridiana / Vive Mar Real Estate
(julio 2026), que sirve de base para el producto white-label y la skill del agente.

## El flujo completo que ejecutamos

```
INVESTIGACIÓN → SITIO MVP → ANÁLISIS INTERACTIVO → OUTREACH KIT → ENVÍO → CIERRE (tiers)
```

### 1. Investigación (la base de todo el valor)

**Fuentes usadas:**
- Instagram (2 cuentas: @viridianamarrealtor y @vivemarrealestate), TikTok, Facebook,
  Linktree, Calendly, búsquedas en Google.
- Screenshots de perfiles y 60 fotos de posts descargadas (`/tmp/vivemar-ig/`).
- Benchmarking de 14 sitios inmobiliarios de la Riviera Maya (lujo internacional,
  agencias locales, desarrolladores) → `vivemar/docs/investigacion-diseno.md`.

**El hallazgo que vende: las "fugas del embudo".** En Vive Mar encontramos 5:
1. Todo el ecosistema termina en Linktree (terreno rentado, sin patrimonio digital).
2. Los links de WhatsApp van SIN mensaje precargado ("hola" sin contexto).
3. Calendly sin eventos públicos (nadie puede agendar).
4. Marca dividida: contenido en una cuenta, Linktree apuntando a otra.
5. Invisible en Google (sin sitio, sin SEO local, sin Google Business Profile).

> Regla de oro: el análisis debe encontrar fugas ESPECÍFICAS y verificables, no
> genéricas. Eso es lo que hace que el prospecto sienta "me estudiaron de verdad".

### 2. Sitio MVP (la prueba tangible)

- **Stack:** Astro estático + PHP para formulario y panel admin (editor visual CMS).
- **Estructura:** landing de conversión, catálogo con filtros (content collections en
  Markdown), fichas con botón WhatsApp precargado por propiedad, páginas de zona para
  SEO local, blog, `/links` que reemplaza Linktree, aviso de privacidad.
- **Diseño:** paleta "quiet luxury" derivada de la investigación (teal profundo
  #0e2a3a + crema #f1efe8 + oro latón #b08a57), serif display (Playfair) + sans (Inter).
- **Contenido real del prospecto:** su logo, sus fotos, sus propiedades con precios y
  planes de pago reales. Solo material público de sus redes (transparencia declarada).
- **Deploy:** Hostinger, subdominio temporal `darkgreen-sparrow-923810.hostingersite.com`
  vía MCP `hosting_deployStaticWebsite`.
- Proyectos: `vivemar/` (principal) y `vivemar-alt/` (variante de home).

### 3. Página de análisis interactivo (`/analisis/`)

Archivo: `analisis-vivemar/index.html` (autocontenida + `img/`). Secciones:
1. **Hero** con foto de marca de fondo + retrato del prospecto en círculo dorado.
2. **Contadores animados** (200 proyectos analizados, 219 posts, 14 competidores, 5 fugas).
3. **Galería polaroid** con fotos reales de sus redes.
4. **5 hallazgos en acordeones** (problema en rojo → "✓ Resuelto" en verde).
5. **Interruptor Antes/Ahora**: "Antes" = collage del caos real (feeds de IG con
   cifras, Linktree, chat WhatsApp en frío, Calendly cerrado, Google sin resultados);
   "Ahora" = el sitio VIVO en un dispositivo con selector Laptop/Tablet/iPhone
   (iframe escalado con transform) + visita guiada de 5 pasos.
6. **CTA dorado con pulso** + **barra flotante** sticky (aparece tras el embudo,
   se oculta en planes y footer).
7. **3 tiers de precio** (ancla psicológica, el medio destacado "Más elegido").
8. Nota para probar el editor CMS + footer con transparencia de material.

**Técnicas clave:** carga diferida del iframe, imágenes optimizadas con `sips`
(3 MB → 75 KB), responsive total, wa.me con mensaje precargado que dice qué plan quiere.

### 4. Outreach kit

- **Mensajes** (`vivemar/docs/mensajes-viridiana-comunidad.md`): WhatsApp en 3 burbujas
  + seguimiento día 3 + IG DM + FB Messenger + TikTok. Tono: reconexión genuina,
  regalo sin venta visible, cero palabras comerciales. La pregunta final siempre es
  de opinión, nunca de compra.
- **Email HTML** (`analisis-vivemar/email-viridiana.html`): compatible Gmail/Outlook
  (tablas + estilos inline, imágenes con URL absoluta del sitio vivo). Envío: extraer
  el fragmento del `<body>` → portapapeles como «class HTML» → pegar en Gmail
  (o copiar desde la página renderizada con Cmd+A/C).
- **Cadencia 14 días** (`vivemar/docs/embudo-outreach.md`): WA día 1 → WA día 3 →
  IG día 5 → Email día 7 → WA+video CMS día 10 → FB día 12 → Email ruptura día 14.
  Un canal a la vez. Precalentamiento previo (comentar 2-3 posts con aporte real).

### 5. Cierre — los 3 tiers

| Tier | Precio | Incluye |
|---|---|---|
| 🌱 Pruébala | $1,500 MXN | Página en subdominio, llamada de configuración, portal de gestión. Vigencia 3 meses. Pago directo (Mercado Pago). |
| 🌴 Hazla tuya ⭐ | $3,500 MXN | Todo lo anterior sin caducidad + dominio propio + hosting 1 año + 10 correos + pack de contenido 1 mes. |
| 👑 Lidera tu nicho | $7,000 MXN | Todo + sitio bilingüe ES/EN + SEO local activado (GBP + Search Console) + embudo automatizado (Calendly + WA precargado en posts) + contenido 3 meses + mentoría Softvibes 1:1 + reporte mensual de leads. |

Reglas: precio ancla en la página/llamada, nunca en el primer mensaje. Tiers 2-3
cierran por WhatsApp con mensaje precargado (lead auto-calificado).

## Lecciones aprendidas (no repetir errores)

1. **El deploy de Hostinger MCP VACÍA `public_html`** y aplana zips con carpeta única.
   → Siempre desplegar UN solo zip con TODO (sitio + `/analisis/`), nunca parciales.
2. Los screenshots de perfiles hay que capturarlos CON el encabezado (seguidores/posts)
   — los de solo-feed obligan a recrear el header en CSS.
3. El email debe ser documento aparte del análisis: sin JS, tablas, estilos inline,
   imágenes absolutas. El análisis interactivo vive en el hosting y el email enlaza.
4. Verificar SIEMPRE con curl tras deploy: home, una ficha, /links, /admin, /analisis/.
5. El editor CMS debe pedir login (verificado: redirige 302) antes de compartir el link.
6. wa.me para México: funciona `52` + 10 dígitos (ej. `527295493319`).

## Ubicación de los activos

| Activo | Ruta |
|---|---|
| Sitio MVP (fuente) | `vivemar/` (build en `vivemar/dist/`) |
| Variante de home | `vivemar-alt/` |
| Página de análisis | `analisis-vivemar/index.html` + `img/` |
| Email HTML | `analisis-vivemar/email-viridiana.html` |
| Mensajes outreach | `vivemar/docs/mensajes-viridiana-comunidad.md` |
| Cadencia completa | `vivemar/docs/embudo-outreach.md` |
| Investigación diseño | `vivemar/docs/investigacion-diseno.md` |
| Redirect de cortesía | `redirect-vivemar/index.html` |
| Demo en vivo | https://darkgreen-sparrow-923810.hostingersite.com |
| Análisis en vivo | https://darkgreen-sparrow-923810.hostingersite.com/analisis/ |

## Siguientes documentos de este playbook

- [plan-whitelabel.md](plan-whitelabel.md) — cómo convertir esto en producto replicable.
- [skills/prospecta-mvp/SKILL.md](skills/prospecta-mvp/SKILL.md) — la skill del agente
  (Excel de prospectos → sitios MVP + análisis + correo, con checkpoints).
