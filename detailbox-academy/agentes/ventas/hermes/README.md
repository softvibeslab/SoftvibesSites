# Perfil Hermes · `detailbox-ventas` (Asesor de admisiones)

Es el agente de ventas de las landings públicas: `/`, `/pad/` y `/ecosistema/`. Se abre desde el botón flotante **«Asesor IA»**, en la esquina inferior derecha, encima del botón de WhatsApp.

Conduce al prospecto por un embudo de cinco etapas:

1. **Conocerte:** nombre y qué busca.
2. **Orientarte (nutrir):** qué ruta le conviene y por qué, con información real de la academia.
3. **Tu perfil (cualificar):** experiencia, objetivo, ciudad, cuándo quiere empezar, inversión y quién decide.
4. **Agenda:** día, horario y medio para la cita con admisiones.
5. **WhatsApp:** el botón «Enviar mi ficha por WhatsApp» abre el chat de admisiones (+52 984 179 9401) con toda la ficha ya escrita.

## Cómo se conecta

```
Botón «Asesor IA» (agente/agente.js) → POST /api/ventas → backend del workshop (mismo dominio)
  → SALES_RULES + página de origen + ficha actual
  → hermes_bridge.py → hermes_worker.py (perfil detailbox-ventas)
  → una inferencia, sin herramientas, internet ni memoria
  → texto + bloque <ficha>{etapa, opciones, campos}</ficha>
  → el servidor limpia la ficha y arma el mensaje y el enlace wa.me (el modelo no escribe el enlace)
```

- **Identidad, oferta y manejo de objeciones:** `SOUL.md`.
- **Protocolo del canal:** `SALES_RULES` en `workshop/backend/app.py`.
- **Privacidad:** la conversación vive solo en la pestaña del visitante (`sessionStorage`). El servidor no la guarda y no usa la cookie de sesión. El agente no pide teléfono, correo ni documentos.
- **Límites:**
  - 40 mensajes por hora por IP y 1,500 por día en total;
  - 3 respuestas simultáneas;
  - si Hermes falla, siempre ofrece WhatsApp con lo que ya se recopiló.
- **Sin servidor** (por ejemplo, la copia estática de magenta-mule): el botón responde «no disponible» y lleva a WhatsApp.

## Instalar

```sh
python3 agentes/ventas/hermes/preparar_perfil.py                 # vista previa
HERMES_BIN=~/.hermes/hermes-agent/venv/bin/hermes \
  python3 agentes/ventas/hermes/preparar_perfil.py --install     # crea el perfil y fija el modelo
```

En el VPS hay que instalarlo dentro del Hermes home del workshop (`/var/lib/detailbox-workshop/hermes`), junto a `detailbox-pad`, para que use la misma credencial de la raíz. El backend lo encuentra en `profiles/detailbox-ventas`, al lado del perfil del copiloto. También puede indicarse otra ruta con `DETAILBOX_VENTAS_PROFILE_DIR`.

## Estado (13-nov-2026)

- Instalado en `~/.hermes/profiles/detailbox-ventas` (Mac de Roger). `status` → `configured: true`.
- Conversaciones reales verificadas desde la landing de cursos y desde la de PAD:
  - unos 6 s por respuesta;
  - no inventó precios;
  - llegó a «listo» con nombre, ciudad, interés, experiencia, objetivo, momento, inversión, decisión y cita.
- **En producción debe llevar la llave propia de Detailbox (decisión D4),** porque este canal es público.

## Pruebas

```sh
python3 -m unittest discover -s agentes/ventas/hermes/tests -p 'test_*.py' -v
cd workshop/backend && ../.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
npm test
```
