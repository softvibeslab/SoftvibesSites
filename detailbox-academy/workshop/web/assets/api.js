// Cliente compartido del Workshop PAD: sesión, CSRF y errores legibles.
let csrf = null;

export class ApiError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', json, form } = {}) {
  const headers = {};
  if (method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  let response;
  try {
    response = await fetch(path, { method, headers, body, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Sin conexión. Revisa tu internet e intenta de nuevo.');
  }
  const type = response.headers.get('Content-Type') || '';
  const data = type.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new ApiError(response.status, data?.error || 'Algo salió mal. Intenta de nuevo.', data || {});
  if (data?.csrf) csrf = data.csrf;
  return data;
}

// Devuelve el usuario con sesión o null. Guarda el token CSRF.
export async function session() {
  try {
    const data = await api('/api/auth/me');
    return data.user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } finally { location.href = '/entrar/'; }
}

export function setCsrf(value) { csrf = value; }

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value);
}

export function toast(message, kind = 'ok') {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const item = document.createElement('div');
  item.className = `toast toast--${kind}`;
  item.textContent = message;
  host.append(item);
  setTimeout(() => item.remove(), 4200);
}
