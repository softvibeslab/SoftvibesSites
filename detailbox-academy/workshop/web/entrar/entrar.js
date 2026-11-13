import { api, session } from '/assets/api.js';

const loginView = document.getElementById('login-view');
const passwordView = document.getElementById('password-view');
const loginForm = document.getElementById('login-form');
const passwordForm = document.getElementById('password-form');

function destination(user) {
  const next = new URLSearchParams(location.search).get('siguiente');
  if (next && /^\/(app|cms)\/[^/]*/.test(next) && !next.startsWith('//')) return next;
  return user.rol === 'admin' ? '/cms/' : '/app/';
}

function showPasswordStep(user, temporary = '') {
  loginView.hidden = true;
  passwordView.hidden = false;
  passwordForm.dataset.next = destination(user);
  if (temporary) passwordForm.actual.value = temporary;
  (temporary ? passwordForm.nueva : passwordForm.actual).focus();
}

function setError(form, message) {
  form.querySelector('[data-error]').textContent = message || '';
}

function busy(form, value) {
  const button = form.querySelector('button[type=submit]');
  button.disabled = value;
  button.textContent = value ? 'Un momento…' : button.dataset.label || button.textContent;
}

for (const form of [loginForm, passwordForm]) {
  const button = form.querySelector('button[type=submit]');
  button.dataset.label = button.textContent;
}

document.querySelector('[data-toggle]').addEventListener('click', (event) => {
  const input = loginForm.password;
  const visible = input.type === 'text';
  input.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? 'Mostrar' : 'Ocultar';
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(loginForm, '');
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  if (!email || !password) return setError(loginForm, 'Escribe tu correo y tu contraseña.');
  busy(loginForm, true);
  try {
    const { user } = await api('/api/auth/login', { method: 'POST', json: { email, password } });
    if (user.cambiar_password) return showPasswordStep(user, password);
    location.href = destination(user);
  } catch (error) {
    setError(loginForm, error.message);
  } finally {
    busy(loginForm, false);
  }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError(passwordForm, '');
  const { actual, nueva, confirmar } = passwordForm;
  if (nueva.value.length < 8) return setError(passwordForm, 'La nueva contraseña debe tener al menos 8 caracteres.');
  if (nueva.value !== confirmar.value) return setError(passwordForm, 'Las contraseñas no coinciden.');
  busy(passwordForm, true);
  try {
    await api('/api/auth/password', { method: 'POST', json: { actual: actual.value, nueva: nueva.value } });
    location.href = passwordForm.dataset.next || '/app/';
  } catch (error) {
    setError(passwordForm, error.message);
  } finally {
    busy(passwordForm, false);
  }
});

const user = await session().catch(() => null);
if (user) {
  if (user.cambiar_password) showPasswordStep(user);
  else location.replace(destination(user));
} else {
  loginForm.email.focus();
}
