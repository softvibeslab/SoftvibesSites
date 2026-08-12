# Plan White-Label — "Softvibes MVP Kit"

Objetivo: convertir el caso Vive Mar en una línea de producción donde cada prospecto
recibe (1) sitio MVP con su marca, (2) análisis interactivo personalizado y (3) kit de
outreach — en horas, no semanas, y sin que nada delate que salió de una plantilla.

## 1. Los 3 templates parametrizados

Todo el sistema se reduce a plantillas + un archivo de variables por cliente.

### `cliente.config.json` (el corazón del white-label)

```json
{
  "slug": "vivemar",
  "marca": "Vive Mar Real Estate",
  "persona": { "nombre": "Viridiana", "titulo": "Realtor", "retrato": "img/retrato.jpg" },
  "nicho": "bienes-raices",
  "ciudad": "Playa del Carmen",
  "paleta": { "oscuro": "#0e2a3a", "claro": "#f1efe8", "acento": "#b08a57" },
  "redes": {
    "instagram": ["@viridianamarrealtor", "@vivemarrealestate"],
    "tiktok": "@viridianamarrealtor", "facebook": "vivemarrealestate",
    "linktree": "vivemarrealestate", "whatsapp": "529842541127"
  },
  "cifras": { "posts": 219, "seguidores": 1174, "competidores_analizados": 14 },
  "hallazgos": [ { "icono": "🔗", "titulo": "...", "detalle": "...", "solucion": "..." } ],
  "productos_estrella": ["Penthouse Corasol $18 MDP", "Lotes Selva Serena"],
  "tour": [ { "etiqueta": "Inicio", "url": "/", "nota": "..." } ],
  "tiers": { "t1_link": "https://mpago.la/...", "t2_precio": 3500, "t3_precio": 7000 },
  "deploy": { "dominio_demo": "xxx.hostingersite.com" },
  "grupos_comunes": ["Vende Sin Límites", "Círculo de Poder"]
}
```

### Template A — Sitio MVP (base: `vivemar/`)
- Extraer a repo plantilla `mvp-site-template/`: variables en `src/data/site.ts`,
  contenido en Markdown (propiedades/servicios/menú según nicho), paleta en tokens CSS.
- **Variantes por nicho** (mismo esqueleto, distinto vocabulario): inmobiliaria,
  restaurante, coach/consultor, estética/salud, e-commerce local. Cada variante define
  qué es una "ficha" (propiedad / platillo / programa / servicio / producto).
- Lo invariante: botón WhatsApp precargado por ficha, /links propio, páginas de zona
  SEO, formulario ≤3 campos, panel CMS con login.

### Template B — Análisis interactivo (base: `analisis-vivemar/index.html`)
- Ya es un solo archivo: convertir textos/fotos/cifras/hallazgos/tour/tiers en
  placeholders `{{variable}}` que se rellenan desde `cliente.config.json`.
- Las tarjetas del "caos" (Antes) se arman con los screenshots reales del prospecto +
  mockups CSS (WhatsApp, Calendly, Google) parametrizados por nicho.

### Template C — Outreach kit (base: mensajes + email de Vive Mar)
- Mensajes WA/IG/FB/TikTok y email HTML con placeholders: nombre, gancho de contenido
  reciente (SIEMPRE manual — es lo que da autenticidad), grupos en común, fugas top 3,
  URLs de demo y análisis.

## 2. Identidad del producto

- **Nombre de trabajo:** Softvibes MVP Kit (interno) / para el cliente nunca es un
  "kit": es "aplicamos nuestra metodología a tu marca".
- La marca visible en los entregables es SIEMPRE la del prospecto; Softvibes firma
  discreto en el footer ("Hecho con 🤍 por Softvibes"). White-label real: ese footer
  es variable — si un partner/agencia revende el servicio, va su marca.
- Storytelling fijo (metodología ser·hacer·tener):
  **ser** = reconocer lo que el prospecto ya es → **hacer** = las fugas y cómo el MVP
  las resuelve → **tener** = dominio propio, patrimonio digital, tiers.

## 3. Infraestructura

- **Hosting:** cuenta Hostinger (u641670749) — un subdominio `hostingersite.com` por
  demo. Regla de deploy: SIEMPRE un solo zip completo (sitio + /analisis/) porque el
  deploy vacía public_html.
- **Pagos:** links de Mercado Pago por tier (crear los 3 una vez; genéricos, no por
  cliente). El tier 2-3 puede cerrar por WhatsApp si no hay link.
- **Pipeline de clientes:** el Excel de entrada + una hoja de estatus por fase
  (ver checkpoints en la skill). A futuro: Notion/CRM.
- **Métricas del producto:** tasa de respuesta al WA-1, visitas al /analisis/
  (agregar GA4 o contador simple), demos → cierres por tier.

## 4. Precios estándar (ajustables por nicho/país)

| Tier | Precio | Margen de entrega |
|---|---|---|
| 🌱 Pruébala | $1,500 MXN | ~0 costo marginal (subdominio existente, 3 meses) |
| 🌴 Hazla tuya ⭐ | $3,500 MXN | dominio ~$300 + hosting compartido ya pagado |
| 👑 Lidera tu nicho | $7,000 MXN | + horas de contenido/SEO/mentoría |

Escala white-label para partners: licencia del kit + fee por sitio generado, o
rev-share por cierre. (Definir cuando haya 10+ casos propios cerrados.)

## 5. Legal y ética (no negociable)

- Solo material PÚBLICO de las redes del prospecto; declararlo con orgullo en cada
  entregable y ofrecer ajustar/retirar de inmediato.
- Demo con `noindex` (ya lo tiene el template) para no competir en Google con su marca.
- La historia de "seleccionado entre N" debe ser verificable (el Excel ES la lista).
- Baja del demo a los 3 meses si no hay respuesta (está prometido en la cadencia).

## 6. Ruta de implementación

| Fase | Entregable | Criterio de listo |
|---|---|---|
| 1. Templatizar | `mvp-site-template/` + `analisis-template.html` + `outreach-templates/` con placeholders | Regenerar Vive Mar 100% desde `cliente.config.json` sin editar a mano |
| 2. Skill del agente | `skills/prospecta-mvp/SKILL.md` operando en Hermes | Procesar un Excel de 3 prospectos de prueba end-to-end |
| 3. Piloto | 5 prospectos reales del Excel | ≥2 respuestas, ≥1 llamada |
| 4. Ajuste | Iterar copys/tiers según datos del piloto | Tasa de respuesta >20% |
| 5. Escala | Lotes de 10-20/semana + variantes de nicho | 1 cierre/semana sostenido |
