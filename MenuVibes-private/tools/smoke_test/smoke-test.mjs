#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DEFAULT_MENU_HTML = path.join(ROOT, 'MenuVibes/whitelabel/menu.html');
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const menuHtmlPath = path.resolve(args.menu || DEFAULT_MENU_HTML);
const localConfig = readLocalSupabaseConfig(menuHtmlPath);
const supabaseUrl = trimSlash(args.url || process.env.SUPABASE_URL || localConfig.url);
const supabaseKey = args.key || process.env.SUPABASE_ANON_KEY || localConfig.key;
const slug = args.slug || 'localito';
const writeMode = Boolean(args.write);
const writeOrder = Boolean(args['write-order']);
const jsonMode = Boolean(args.json);

if (!supabaseUrl || !supabaseKey) {
  console.error('Falta Supabase URL/key. Usa --url/--key, env SUPABASE_URL/SUPABASE_ANON_KEY o menu.html.');
  process.exit(2);
}

const checks = [];
let tenant = null;

await main();

async function main() {
  if (!jsonMode) {
    console.log('MenuVibes smoke test');
    console.log(`Target: ${supabaseUrl}`);
    console.log(`Key: ${maskKey(supabaseKey)}`);
    console.log(`Slug: ${slug}`);
    console.log(`Mode: ${writeMode ? 'write smoke' : 'read-only'}`);
    console.log('');
  }

  checkLocalMenuFilter(menuHtmlPath);
  await checkConnection();
  tenant = await checkPublishedTenant(slug);
  await checkDraftsHiddenFromAnon();
  await checkPublicTables();
  await checkSensitiveTables();
  await checkPremiumTables(tenant);
  await checkFeatureColumns(tenant);
  await checkRpcs();

  if (writeMode) {
    await runWriteSmoke(tenant);
  }

  finish();
}

function parseArgs(raw) {
  const parsed = {};
  for (let i = 0; i < raw.length; i += 1) {
    const current = raw[i];
    if (!current.startsWith('--')) continue;
    const key = current.slice(2);
    const next = raw[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug localito
  node MenuVibes-private/tools/smoke_test/smoke-test.mjs --slug demo-premium --write

Options:
  --slug <slug>       Tenant slug to test. Default: localito
  --url <url>         Supabase URL. Default: read from menu.html
  --key <anon key>    Supabase anon key. Default: read from menu.html
  --menu <path>       Path to menu.html. Default: MenuVibes/whitelabel/menu.html
  --write             Create a synthetic client, visit and NPS response
  --write-order       With --write, also creates a zero-total synthetic order
  --json              Print JSON result
`);
}

function readLocalSupabaseConfig(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const html = fs.readFileSync(filePath, 'utf8');
  return {
    url: matchOne(html, /supabase_url:\s*['"]([^'"]+)['"]/),
    key: matchOne(html, /supabase_key:\s*['"]([^'"]+)['"]/),
  };
}

function checkLocalMenuFilter(filePath) {
  if (!fs.existsSync(filePath)) {
    addCheck('local.menu_html', 'warn', `No existe ${filePath}`);
    return;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const hasPublishedFilter = /\.from\(['"]negocios['"]\)[\s\S]{0,180}\.eq\(['"]estado['"],\s*['"]publicado['"]\)/.test(html);
  addCheck(
    'local.menu_published_filter',
    hasPublishedFilter ? 'ok' : 'fail',
    hasPublishedFilter
      ? 'menu.html filtra negocios con estado=publicado'
      : 'menu.html no parece filtrar estado=publicado al cargar el negocio'
  );
}

async function checkConnection() {
  const result = await restGet('/rest/v1/negocios', {
    select: 'id,slug,nombre,estado',
    limit: '1',
  });
  addCheck(
    'supabase.connection',
    result.ok ? 'ok' : 'fail',
    result.ok ? 'REST responde correctamente' : explainFailure(result)
  );
}

async function checkPublishedTenant(targetSlug) {
  const result = await restGet('/rest/v1/negocios', {
    select: 'id,slug,nombre,estado',
    slug: `eq.${targetSlug}`,
    estado: 'eq.publicado',
    limit: '1',
  });

  if (!result.ok) {
    addCheck('tenant.published', 'fail', explainFailure(result));
    return null;
  }

  const row = Array.isArray(result.data) ? result.data[0] : null;
  addCheck(
    'tenant.published',
    row ? 'ok' : 'fail',
    row ? `Tenant publicado encontrado: ${row.slug} (${row.id})` : `No hay tenant publicado con slug=${targetSlug}`
  );
  return row || null;
}

async function checkDraftsHiddenFromAnon() {
  const result = await restGet('/rest/v1/negocios', {
    select: 'id,slug,estado',
    limit: '100',
  });

  if (!result.ok) {
    addCheck('rls.negocios_drafts_hidden', 'fail', explainFailure(result));
    return;
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  const drafts = rows.filter((row) => row.estado && row.estado !== 'publicado');
  if (drafts.length > 0) {
    const sample = drafts.slice(0, 5).map((row) => `${row.slug}:${row.estado}`).join(', ');
    addCheck(
      'rls.negocios_drafts_hidden',
      'fail',
      `La anon key puede ver negocios no publicados (${sample})`
    );
    return;
  }

  addCheck('rls.negocios_drafts_hidden', 'ok', 'La anon key no ve negocios en borrador en /negocios');
}

async function checkPublicTables() {
  const tables = ['branding', 'features', 'secciones', 'productos', 'niveles'];
  for (const table of tables) {
    const result = await restGet(`/rest/v1/${table}`, {
      select: '*',
      limit: '1',
    });
    addCheck(
      `table.public.${table}`,
      result.ok ? 'ok' : 'fail',
      result.ok ? 'Tabla publica responde' : explainFailure(result)
    );
  }
}

async function checkSensitiveTables() {
  const tables = ['usuarios', 'pedidos', 'cupones_canjeados'];
  for (const table of tables) {
    const result = await restGet(`/rest/v1/${table}`, {
      select: '*',
      limit: '1',
    });

    if (!result.ok) {
      addCheck(`rls.sensitive.${table}`, isMissingRelation(result) ? 'fail' : 'ok', explainFailure(result));
      continue;
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    addCheck(
      `rls.sensitive.${table}`,
      rows.length > 0 ? 'fail' : 'ok',
      rows.length > 0
        ? `La anon key puede leer filas de ${table}`
        : `La anon key no recibio filas de ${table}`
    );
  }
}

async function checkPremiumTables(currentTenant) {
  const publicPremium = ['beneficios_premium', 'canales_resena'];
  const privatePremium = ['visitas_clientes', 'nps_respuestas', 'acciones_resena'];

  for (const table of publicPremium) {
    const params = {
      select: '*',
      limit: '3',
    };
    if (currentTenant?.id) params.negocio_id = `eq.${currentTenant.id}`;
    const result = await restGet(`/rest/v1/${table}`, params);
    addCheck(
      `table.premium.${table}`,
      result.ok ? 'ok' : 'fail',
      result.ok ? `Tabla premium responde (${rowCount(result)} filas visibles)` : explainFailure(result)
    );
  }

  for (const table of privatePremium) {
    const result = await restGet(`/rest/v1/${table}`, {
      select: '*',
      limit: '1',
    });
    if (!result.ok) {
      addCheck(`table.premium.${table}`, 'fail', explainFailure(result));
      continue;
    }
    const rows = Array.isArray(result.data) ? result.data : [];
    addCheck(
      `table.premium.${table}`,
      rows.length > 0 ? 'fail' : 'ok',
      rows.length > 0
        ? `La anon key puede leer filas privadas de ${table}`
        : 'Tabla premium existe y no expone filas privadas a anon'
    );
  }
}

async function checkFeatureColumns(currentTenant) {
  if (!currentTenant?.id) {
    addCheck('features.premium_columns', 'skip', 'Sin tenant publicado no se pueden validar features premium');
    return;
  }

  const result = await restGet('/rest/v1/features', {
    select: 'lealtad,fidelizacion_premium,nps_visitas,resenas_premium',
    negocio_id: `eq.${currentTenant.id}`,
    limit: '1',
  });
  addCheck(
    'features.premium_columns',
    result.ok ? 'ok' : 'fail',
    result.ok ? 'Columnas premium disponibles en features' : explainFailure(result)
  );
}

async function checkRpcs() {
  const fakeHash = crypto.createHash('sha256').update('menuvibes-smoke-test').digest('hex');
  const rpcChecks = [
    {
      name: 'cliente_register',
      body: { p_negocio_id: ZERO_UUID, p_nickname: 'smoke_probe', p_password_hash: fakeHash },
    },
    {
      name: 'cliente_login',
      body: { p_negocio_id: ZERO_UUID, p_nickname: 'smoke_probe', p_password_hash: fakeHash },
    },
    {
      name: 'cliente_resumen',
      body: { p_negocio_id: ZERO_UUID, p_usuario_id: ZERO_UUID },
    },
    {
      name: 'registrar_visita_cliente',
      body: { p_negocio_id: ZERO_UUID, p_usuario_id: ZERO_UUID, p_nickname: 'smoke_probe', p_beneficio_id: null },
    },
    {
      name: 'responder_nps_cliente',
      body: {
        p_negocio_id: ZERO_UUID,
        p_visita_id: ZERO_UUID,
        p_usuario_id: ZERO_UUID,
        p_nickname: 'smoke_probe',
        p_score: 10,
        p_comentario: 'smoke',
        p_beneficio_id: null,
      },
    },
    {
      name: 'registrar_accion_resena_cliente',
      body: {
        p_negocio_id: ZERO_UUID,
        p_visita_id: ZERO_UUID,
        p_usuario_id: ZERO_UUID,
        p_nickname: 'smoke_probe',
        p_canal_id: ZERO_UUID,
        p_plataforma: 'google',
        p_accion: 'smoke',
        p_beneficio_id: null,
      },
    },
    {
      name: 'crear_pedido_cliente',
      body: {
        p_negocio_id: ZERO_UUID,
        p_usuario_id: null,
        p_nickname: 'smoke_probe',
        p_items: [],
        p_total: 0,
        p_cupon_aplicado: null,
        p_descuento_pct: 0,
      },
    },
  ];

  for (const rpc of rpcChecks) {
    const result = await rpcPost(rpc.name, rpc.body);
    const missing = isMissingRpc(result);
    addCheck(
      `rpc.${rpc.name}`,
      missing ? 'fail' : 'ok',
      missing ? explainFailure(result) : rpcExistsDetail(result)
    );
  }
}

async function runWriteSmoke(currentTenant) {
  if (!currentTenant?.id) {
    addCheck('write.tenant', 'fail', 'No se puede escribir sin tenant publicado');
    return;
  }

  const stamp = Date.now();
  const nickname = `smoke_${stamp}`;
  const passwordHash = crypto.createHash('sha256').update(`menuvibes-smoke-${stamp}`).digest('hex');

  const register = await rpcPost('cliente_register', {
    p_negocio_id: currentTenant.id,
    p_nickname: nickname,
    p_password_hash: passwordHash,
  });
  if (!register.ok || !Array.isArray(register.data) || !register.data[0]?.id) {
    addCheck('write.register_client', 'fail', explainFailure(register));
    return;
  }
  const user = register.data[0];
  addCheck('write.register_client', 'ok', `Cliente sintetico creado: ${user.nickname}`);

  const login = await rpcPost('cliente_login', {
    p_negocio_id: currentTenant.id,
    p_nickname: nickname,
    p_password_hash: passwordHash,
  });
  addCheck('write.login_client', login.ok && login.data?.[0]?.id === user.id ? 'ok' : 'fail', login.ok ? 'Login RPC responde' : explainFailure(login));

  const visit = await rpcPost('registrar_visita_cliente', {
    p_negocio_id: currentTenant.id,
    p_usuario_id: user.id,
    p_nickname: nickname,
    p_beneficio_id: null,
  });
  if (!visit.ok || !visit.data?.[0]?.id) {
    addCheck('write.register_visit', 'fail', explainFailure(visit));
    return;
  }
  const visitRow = visit.data[0];
  addCheck('write.register_visit', 'ok', `Visita registrada: ${visitRow.id}`);

  const nps = await rpcPost('responder_nps_cliente', {
    p_negocio_id: currentTenant.id,
    p_visita_id: visitRow.id,
    p_usuario_id: user.id,
    p_nickname: nickname,
    p_score: 10,
    p_comentario: 'Smoke test MenuVibes',
    p_beneficio_id: null,
  });
  addCheck('write.nps', nps.ok && nps.data?.[0]?.id ? 'ok' : 'fail', nps.ok ? 'NPS registrado' : explainFailure(nps));

  const channels = await restGet('/rest/v1/canales_resena', {
    select: 'id,plataforma,activo',
    negocio_id: `eq.${currentTenant.id}`,
    activo: 'eq.true',
    limit: '1',
  });
  const channel = Array.isArray(channels.data) ? channels.data[0] : null;
  if (!channel) {
    addCheck('write.review_action', 'skip', 'No hay canal de resena activo para el tenant');
  } else {
    const action = await rpcPost('registrar_accion_resena_cliente', {
      p_negocio_id: currentTenant.id,
      p_visita_id: visitRow.id,
      p_usuario_id: user.id,
      p_nickname: nickname,
      p_canal_id: channel.id,
      p_plataforma: channel.plataforma || 'google',
      p_accion: 'smoke',
      p_beneficio_id: null,
    });
    addCheck('write.review_action', action.ok ? 'ok' : 'fail', action.ok ? `Accion registrada en ${channel.plataforma}` : explainFailure(action));
  }

  if (writeOrder) {
    const order = await rpcPost('crear_pedido_cliente', {
      p_negocio_id: currentTenant.id,
      p_usuario_id: user.id,
      p_nickname: nickname,
      p_items: [{ nombre: 'Smoke test', cantidad: 1, precio: 0 }],
      p_total: 0,
      p_cupon_aplicado: null,
      p_descuento_pct: 0,
    });
    addCheck('write.order', order.ok ? 'ok' : 'fail', order.ok ? 'Pedido sintetico creado' : explainFailure(order));
  }
}

async function restGet(endpoint, params = {}) {
  return request('GET', endpoint, params);
}

async function rpcPost(name, body) {
  return request('POST', `/rest/v1/rpc/${name}`, null, body);
}

async function request(method, endpoint, params = null, body = null) {
  const url = new URL(endpoint, `${supabaseUrl}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  };

  const init = { method, headers };
  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    headers.Prefer = 'return=representation';
    init.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, init);
    const text = await response.text();
    const data = text ? safeJson(text) : null;
    return {
      ok: response.ok,
      status: response.status,
      data,
      text,
      url: url.toString(),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      text: error.message,
      url: url.toString(),
    };
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function addCheck(name, status, detail) {
  const item = { name, status, detail };
  checks.push(item);
  if (!jsonMode) {
    const label = status.toUpperCase().padEnd(4, ' ');
    console.log(`${label} ${name} - ${detail}`);
  }
}

function finish() {
  const totals = checks.reduce(
    (acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    },
    { ok: 0, warn: 0, fail: 0, skip: 0 }
  );

  if (jsonMode) {
    console.log(JSON.stringify({ target: supabaseUrl, slug, writeMode, totals, checks }, null, 2));
  } else {
    console.log('');
    console.log(`Summary: ${totals.ok || 0} ok, ${totals.warn || 0} warn, ${totals.fail || 0} fail, ${totals.skip || 0} skip`);
  }

  if ((totals.fail || 0) > 0) process.exitCode = 1;
}

function explainFailure(result) {
  if (!result) return 'Sin resultado';
  const code = result.data?.code ? ` ${result.data.code}` : '';
  const message = result.data?.message || result.text || 'sin detalle';
  return `HTTP ${result.status}${code}: ${message}`;
}

function rpcExistsDetail(result) {
  if (result.ok) return `RPC responde HTTP ${result.status}`;
  return `RPC existe; llamada de prueba bloqueo por regla de negocio (${explainFailure(result)})`;
}

function isMissingRelation(result) {
  return result.status === 404 && result.data?.code === 'PGRST205';
}

function isMissingRpc(result) {
  return result.status === 404 && result.data?.code === 'PGRST202';
}

function rowCount(result) {
  return Array.isArray(result.data) ? result.data.length : 0;
}

function maskKey(key) {
  if (!key || key.length < 18) return '(hidden)';
  return `${key.slice(0, 8)}...${key.slice(-6)}`;
}

function trimSlash(value) {
  return value ? value.replace(/\/+$/, '') : value;
}

function matchOne(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : '';
}
