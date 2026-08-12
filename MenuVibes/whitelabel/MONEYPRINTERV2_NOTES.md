# MoneyPrinterV2 ideas aplicables a MenuVibes

Repositorio revisado: `FujiwaraChoki/MoneyPrinterV2`, clonado localmente en `MoneyPrinterV2/`.

## Que si aplica

1. **Pipeline de prospectos desde Google Maps**
   - `MoneyPrinterV2/src/classes/Outreach.py` descarga, compila y ejecuta `google-maps-scraper`.
   - Para MenuVibes conviene adaptar la idea, no copiarla tal cual:
     - input: nicho + zona (`restaurantes quinta avenida playa del carmen`);
     - output: JSON normalizado para `MenuVibes-private/prospectos`;
     - enriquecimiento: website, telefono, maps link, rating, reviews, categoria;
     - luego generar demo en Supabase como borrador.

2. **Preflight antes de automatizar**
   - `MoneyPrinterV2/scripts/preflight_local.py` valida dependencias y llaves antes de correr.
   - En MenuVibes necesitamos algo similar:
     - Supabase URL/key presentes;
     - conexion a Supabase;
     - tablas esperadas existen;
     - usuario admin/super_admin existe;
     - bucket `menuvibes` existe;
     - `prospectos` no esta dentro de `whitelabel`.

3. **Config externa**
   - `config.example.json` separa proveedores, llaves, scraper, email y automatizaciones.
   - MenuVibes deberia tener `config.example.json` para scripts privados:
     - Supabase service role key solo local;
     - Google Maps scraper;
     - plantillas outreach;
     - dominio base del menu;
     - limites de rate/timeout.

4. **Cache local de resultados**
   - `src/cache.py` usa `.mp/` para archivos generados.
   - MenuVibes puede usar `MenuVibes-private/.cache/` para resultados de scraping, menus detectados, demos generadas y logs.

5. **Generacion de contenido de marketing**
   - La parte de YouTube Shorts/Post Bridge no va al core del CMS, pero sirve para marketing premium:
     - generar reels/shorts de demo para cada restaurante;
     - publicar/crosspostear casos de uso;
     - crear assets visuales para outreach.

## Que no conviene copiar directo

1. **Codigo AGPL**
   - MoneyPrinterV2 usa AGPL-3. Podemos inspirarnos en patrones, pero copiar codigo al producto puede imponer obligaciones de licencia.

2. **SMTP frio sin control**
   - El envio por `yagmail` debe adaptarse con consentimiento, opt-out, limites y cumplimiento local. Para primeras ventas, mejor WhatsApp/manual o CRM.

3. **Automatizacion social con Selenium**
   - Es fragil y puede chocar con terminos de plataformas. Para MenuVibes conviene APIs oficiales o integraciones tipo Post Bridge.

## Propuesta de siguiente modulo privado

Crear `MenuVibes-private/tools/prospect_pipeline/`:

1. `config.example.json`
2. `preflight.py`
3. `scrape_maps.py`
4. `normalize_prospects.py`
5. `generate_demo_payload.py`
6. `push_demo_to_supabase.py`
7. `render_outreach_messages.py`

El resultado ideal: de una busqueda por zona/nicho a negocios demo en estado `borrador`, con link `menu.html?n=<slug>` listo para revisar antes de contactar.
