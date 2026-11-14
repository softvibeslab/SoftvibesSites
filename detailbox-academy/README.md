# Detailbox Academy

Prototipo estático de conversión para la oferta de capacitación automotriz de
Detailbox Academy.

## Entregables

- `index.html`: landing de captación con rutas por curso y formulario a WhatsApp.
- `analisis/index.html`: diagnóstico público, comparativo y prioridades.
- `docs/RESEARCH.md`: evidencia, límites y decisiones de contenido.
- `docs/SOCIAL-SOURCES.md`: trazabilidad de las imágenes tomadas de redes oficiales.
- `tests/check-site.mjs`: verificación mínima de estructura y afirmaciones sensibles (incluye `/pad/` y `/ecosistema/`).

### Detailbox AI Ecosystem (desde 13-nov-2026)

- `curso/`: fuentes del cliente. `masterprompt.md` es el encargo, `skill.md` el rol y la Base de Conocimiento Método PAD la metodología.
- `pad/`: landing del curso **Método PAD**, con diagnóstico rápido de 3 preguntas que arma un mensaje de WhatsApp.
- `ecosistema/`: landing de **Detailbox AI Ecosystem** con los niveles PAD Starter, Growth y Business Intelligence. Se presenta como acceso anticipado y sin precios.
- `docs/arquitectura-maestra/`: Diagnóstico y Arquitectura Maestra (masterprompt §17) y `DECISIONES.md` (D1–D11, todas pendientes de aprobación por Detailbox).
- `docs/inventario-previo.md`: inventario de landings y bases elegidas.
- `agentes/arquitecto/hermes/`: perfil Hermes `detailbox-arquitecto` (perfil A, interno), con instalador y pruebas.
- `agentes/pad/hermes/`: perfil Hermes `detailbox-pad` (perfil B, Copiloto PAD de los alumnos).
- `agentes/ventas/hermes/`: perfil Hermes `detailbox-ventas` (Asesor de admisiones). Embudo de ventas de las landings: conocer, nutrir, cualificar, agendar y WhatsApp con la ficha.
- `agente/`: botón flotante «Asesor IA» y chat del asesor. Lo cargan `/`, `/pad/` y `/ecosistema/`, y habla con `/api/ventas` del workshop.
- `workshop/`: **Workshop PAD**, la plataforma del `curso/workbook.pdf`:
  - login por usuario;
  - app del alumno con las 10 herramientas del workbook;
  - CMS de contenido, usuarios y talleres, con **registro por QR**;
  - popup del Copiloto PAD conectado a Hermes.

  Flask + SQLite; no se publica en el Hostinger estático. Ver `workshop/README.md`.

## Vista local

```bash
npm run dev
```

Abre `http://localhost:4173/` y `http://localhost:4173/analisis/`.

## Verificación

```bash
npm test
```

## Despliegue temporal

- URL: https://magenta-mule-617475.hostingersite.com/
- Proveedor: Hostinger
- Publicado: 11 de agosto de 2026
- El paquete publicado contiene únicamente los archivos estáticos necesarios para la
  landing y la página `/analisis/`.

## Datos pendientes antes de publicar

- Próximas fechas y precios vigentes.
- Dirección exacta de la sede presencial.
- Alcance y emisor del certificado.
- Nombre y credenciales de instructores.
- Confirmación de permisos para reutilizar las fotografías sociales seleccionadas.
- Dominio canónico definitivo y herramienta de analítica.

No desplegar ni publicar sin autorización explícita.
