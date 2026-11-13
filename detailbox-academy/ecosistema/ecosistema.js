// Detailbox AI Ecosystem · formulario de acceso anticipado (sin backend).
const WHATSAPP = '529841799401';
const form = document.querySelector('[data-eco-form]');
const errorBox = document.querySelector('[data-form-error]');

export function buildMessage({ nombre, ciudad, etapa, nivel }) {
  return [
    `Hola Detailbox Academy, soy ${nombre}, de ${ciudad}.`,
    'Origen: Ecosistema.',
    `Etapa de mi negocio: ${etapa}.`,
    `Nivel de interés: ${nivel}.`,
    'Quiero solicitar acceso anticipado a Detailbox AI Ecosystem.'
  ].join('\n');
}

export function buildWhatsAppUrl(fields) {
  const message = buildMessage(fields);
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// Los botones de cada nivel preseleccionan el nivel en el formulario.
document.querySelectorAll('[data-tier]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = form?.elements.namedItem('nivel');
    if (select) select.value = link.dataset.tier;
  });
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = {};
  let firstInvalid = null;
  for (const name of ['nombre', 'ciudad', 'etapa', 'nivel']) {
    const control = form.elements.namedItem(name);
    const value = String(control.value || '').trim();
    const invalid = value === '';
    control.setAttribute('aria-invalid', String(invalid));
    if (invalid && !firstInvalid) firstInvalid = control;
    fields[name] = value;
  }
  if (firstInvalid) {
    if (errorBox) errorBox.hidden = false;
    firstInvalid.focus();
    return;
  }
  if (errorBox) errorBox.hidden = true;
  window.open(buildWhatsAppUrl(fields), '_blank', 'noopener');
});
