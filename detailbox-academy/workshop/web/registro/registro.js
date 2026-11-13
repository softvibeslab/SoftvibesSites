import { api } from '/assets/api.js';

const code = (new URLSearchParams(location.search).get('c') || '').trim().toUpperCase();
const loading = document.getElementById('loading');
const invalid = document.getElementById('invalid');
const register = document.getElementById('register');
const form = document.getElementById('register-form');

function showInvalid(message) {
  loading.hidden = true;
  register.hidden = true;
  invalid.hidden = false;
  invalid.querySelector('[data-message]').textContent = message;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

if (!code) {
  showInvalid('Este enlace no trae código de registro. Escanea de nuevo el QR que te mostró el equipo de Detailbox.');
} else {
  try {
    const { taller, aviso_privacidad: aviso } = await api(`/api/registro/${encodeURIComponent(code)}`);
    register.querySelector('[data-taller-nombre]').textContent = taller.nombre;
    register.querySelector('[data-taller-detalle]').textContent = [formatDate(taller.fecha), taller.sede].filter(Boolean).join(' · ') || 'Fecha por confirmar';
    register.querySelector('[data-aviso]').textContent = `Acepto el aviso de privacidad: ${aviso || 'mis datos se usan solo para mi acompañamiento en el Workbook PAD.'}`;
    loading.hidden = true;
    register.hidden = false;
    form.nombre.focus();
  } catch (error) {
    showInvalid(error.message);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorBox = form.querySelector('[data-error]');
  errorBox.textContent = '';
  const payload = {
    codigo: code,
    nombre: form.nombre.value.trim(),
    negocio: form.negocio.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    acepta: form.acepta.checked,
  };
  if (!payload.nombre) return (errorBox.textContent = 'Escribe tu nombre.');
  if (!payload.email) return (errorBox.textContent = 'Escribe tu correo.');
  if (payload.password.length < 8) return (errorBox.textContent = 'La contraseña debe tener al menos 8 caracteres.');
  if (!payload.acepta) return (errorBox.textContent = 'Debes aceptar el aviso de privacidad para continuar.');
  const button = form.querySelector('button[type=submit]');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Creando tu cuenta…';
  try {
    await api('/api/registro', { method: 'POST', json: payload });
    location.href = '/app/?bienvenida=1';
  } catch (error) {
    errorBox.textContent = error.message;
    button.disabled = false;
    button.textContent = label;
  }
});
