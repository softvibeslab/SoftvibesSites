# Checklist antes de publicar

## Bloqueadores

- [ ] Confirmar el nombre comercial y quién aprobará el contenido.
- [ ] Configurar el WhatsApp real con código de país.
- [ ] Confirmar precio, moneda, tamaño, aroma, materiales y disponibilidad por pieza.
- [ ] Definir zonas, costo, tiempos y modalidad de entrega o recolección.
- [ ] Sustituir las capturas públicas por archivos originales autorizados.
- [ ] Validar ingredientes, uso, advertencias y etiquetado de los jabones.
- [ ] Revisar encendido, cuidado y seguridad de cada vela.
- [ ] Completar aviso de privacidad, cambios/cancelaciones y datos comerciales.
- [ ] Definir dominio, analítica y responsable de responder pedidos.

## CMS y servidor

- [ ] PHP 8.1+ disponible.
- [ ] `DIANA_CMS_USER` definido fuera de `public_html`.
- [ ] `DIANA_CMS_PASSWORD_HASH` definido fuera de `public_html`.
- [ ] HTTPS activo y cookies seguras verificadas.
- [ ] Carpeta `data/` escribible por PHP y no listable.
- [ ] Login, CSRF, cierre de sesión y respaldo JSON probados.

## QA final

- [ ] `npm run build` termina sin errores.
- [ ] `npm test` pasa.
- [ ] Filtros y CTA por producto funcionan en móvil y escritorio.
- [ ] Cada CTA abre el número correcto y menciona el producto correcto.
- [ ] No quedan etiquetas “por confirmar” que deban resolverse.
- [ ] Análisis y admin permanecen `noindex`.
