/* Pruebas de "Mi pedido" (sitio/assets/js/pedido.js). Uso: node --test tests/pedido.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const P = require('../sitio/assets/js/pedido.js');
const MENU_REAL = require('../sitio/data/menu.json');

// Menú mínimo y controlado (mismo esquema que sitio/data/menu.json).
const menuBase = () => ({
  vuelo: { nombre: 'Vuelo del Cisne' },
  barril: [
    { id: 'alarma', nombre: '¡Alarma!', precios: [{ medida: '12 oz', precio: 100 }, { medida: '4 oz', precio: 35 }] },
    { id: 'henry-ix', nombre: 'Henry IX', precios: [{ medida: '14 oz', precio: 110 }, { medida: '4 oz', precio: 35 }] },
    { id: 'guamaica', nombre: 'Guamaica', precios: [{ medida: '12 oz', precio: 110 }, { medida: '4 oz', precio: 40 }] },
    { id: 'agua-puerca', nombre: 'Agua Puerca', precios: [{ medida: '12 oz', precio: 100 }, { medida: '4 oz', precio: 35 }] },
  ],
  latas: [{ id: 'lata-loba-negra', nombre: 'Loba Negra', precio: 120 }],
  comida: [
    { seccion: 'Entradas', items: [
      { id: 'chips-camote', nombre: 'Chips de Camote', precio: 75, variantes: [{ id: '55g', nombre: '55 g', precio: 75 }, { id: '110g', nombre: '110 g', precio: 135 }] },
      { id: 'papas-cisne', nombre: 'Papas Cisne Negro', precio: 75 },
    ] },
    { seccion: 'Hamburguesas', items: [{ id: 'hamburguesa-res', nombre: 'De Res', precio: 135, img: 'hamburguesa_res.jpg' }] },
  ],
  sin_alcohol: [
    { id: 'bebida-agua-mineral', nombre: 'Agua mineral', precio: 35, variantes: [{ id: 'natural', nombre: 'Natural', precio: 35 }, { id: 'rusa', nombre: 'Preparada (rusa)', precio: 45 }] },
    { id: 'bebida-cafe', nombre: 'Café', precio: 50 },
  ],
});
const T0 = Date.parse('2026-10-06T20:00:00-06:00');
const H = 60 * 60 * 1000;
const congelar = (o) => JSON.parse(JSON.stringify(o));

test('agrupa iguales y separa medida o nota distinta', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2 }, m, T0);
  assert.equal(p.lineas.length, 1);
  assert.equal(p.lineas[0].cantidad, 3);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '4 oz' }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', nota: 'sin espuma' }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', nota: '  sin   espuma ' }, m, T0);
  assert.equal(p.lineas.length, 3, 'medida distinta y nota distinta van en líneas separadas');
  assert.deepEqual(p.lineas.map((l) => [l.variante, l.nota, l.cantidad]), [['12 oz', '', 3], ['4 oz', '', 1], ['12 oz', 'sin espuma', 2]]);
  assert.equal(p.lineas[1].precio, 35);
  // Variantes de comida y bebida
  p = P.agregar(p, { tipo: 'comida', id: 'chips-camote', variante: '110g' }, m, T0);
  p = P.agregar(p, { tipo: 'comida', id: 'chips-camote', variante: '55g' }, m, T0);
  assert.deepEqual(p.lineas.slice(3).map((l) => [l.variante, l.precio]), [['110g', 135], ['55g', 75]]);
  assert.throws(() => P.agregar(p, { tipo: 'comida', id: 'chips-camote' }, m, T0), /medida o presentación/);
  assert.throws(() => P.agregar(p, { tipo: 'lata', id: 'lata-loba-negra', variante: 'xl' }, m, T0), /medida o presentación/);
  assert.throws(() => P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '14 oz' }, m, T0), /medida/);
  // La nota se recorta a 40 caracteres
  const larga = P.agregar(P.vacio(T0), { tipo: 'bebida', id: 'bebida-cafe', nota: 'x'.repeat(60) }, m, T0);
  assert.equal(larga.lineas[0].nota.length, 40);
  // Nombre con contexto para "De X"
  assert.equal(P.agregar(P.vacio(T0), { tipo: 'comida', id: 'hamburguesa-res' }, m, T0).lineas[0].nombre, 'Hamburguesa de Res');
});

test('agregar no muta el pedido recibido', () => {
  const m = menuBase();
  const p = P.agregar(P.vacio(T0), { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0);
  const antes = congelar(p);
  const q = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0);
  assert.deepEqual(p, antes);
  assert.equal(q.lineas[0].cantidad, 2);
  P.cambiarCantidad(q, 0, 5); P.cambiarNota(q, 0, 'fría'); P.quitar(q, 0); P.ponerMesa(q, '7');
  assert.equal(q.lineas[0].cantidad, 2);
  assert.equal(q.lineas[0].nota, '');
  assert.equal(q.mesa, '');
});

test('rechaza cantidad 0, 21, 1.5 y texto sin mutar', () => {
  const m = menuBase();
  const p = P.agregar(P.vacio(T0), { tipo: 'lata', id: 'lata-loba-negra', cantidad: 3 }, m, T0);
  const antes = congelar(p);
  for (const c of [0, 21, 1.5, 'dos', '2', -1, NaN, null]) {
    assert.throws(() => P.agregar(p, { tipo: 'lata', id: 'lata-loba-negra', cantidad: c }, m, T0), /entero del 1 al 20/, `agregar ${c}`);
    assert.throws(() => P.cambiarCantidad(p, 0, c), /entero del 1 al 20/, `cambiar ${c}`);
  }
  assert.deepEqual(p, antes);
  // La suma tampoco puede pasar de 20
  assert.throws(() => P.agregar(p, { tipo: 'lata', id: 'lata-loba-negra', cantidad: 18 }, m, T0), /hasta 20/);
  assert.deepEqual(p, antes);
  assert.equal(P.cambiarCantidad(p, 0, 20).lineas[0].cantidad, 20);
});

test('máximo 40 líneas', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  for (let i = 0; i < 40; i++) p = P.agregar(p, { tipo: 'bebida', id: 'bebida-cafe', nota: 'taza ' + i }, m, T0);
  assert.equal(p.lineas.length, 40);
  assert.throws(() => P.agregar(p, { tipo: 'bebida', id: 'bebida-cafe', nota: 'una más' }, m, T0), /hasta 40/);
});

test('restaurar: caduca a las 12 h y respeta el pedido reciente', () => {
  const m = menuBase();
  const p = P.ponerMesa(P.agregar(P.vacio(T0), { tipo: 'barril', id: 'alarma', variante: '12 oz', nota: 'fría' }, m, T0), '12');
  const raw = P.serializar(p);
  const r = P.restaurar(raw, T0 + 11 * H + 59 * 60 * 1000);
  assert.equal(r.lineas.length, 1);
  assert.equal(r.mesa, '12');
  assert.equal(r.lineas[0].nota, 'fría');
  const viejo = P.restaurar(raw, T0 + 12 * H + 1000);
  assert.equal(viejo.lineas.length, 0, 'a las 12 h el pedido se vacía');
  assert.equal(viejo.mesa, '');
  assert.ok(P.caducado(p, T0 + 13 * H));
  // creado_at se fija al agregar la primera línea de un pedido vacío
  const tarde = P.agregar(P.vacio(T0), { tipo: 'bebida', id: 'bebida-cafe' }, m, T0 + 5 * H);
  assert.equal(Date.parse(tarde.creado_at), T0 + 5 * H);
});

test('restaurar tolera JSON corrupto o manipulado', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{"lineas":5}', '{"creado_at":"ayer","lineas":[]}', 'undefined']) {
    const r = P.restaurar(raw, T0);
    assert.deepEqual(r.lineas, [], String(raw));
  }
  const raw = JSON.stringify({
    creado_at: new Date(T0).toISOString(), mesa: 'Mesa\n 3 con texto muy largo',
    lineas: [
      { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2, precio: 100, nombre: '¡Alarma!' },
      { tipo: 'hack', id: 'x', cantidad: 1, precio: 1 },
      { tipo: 'lata', id: '<script>', cantidad: 1, precio: 1 },
      { tipo: 'lata', id: 'lata-loba-negra', cantidad: 99, precio: 120 },
      { tipo: 'lata', id: 'lata-loba-negra', cantidad: 1, precio: -5 },
      { tipo: 'vuelo', id: 'vuelo', cantidad: 1, precio: 145, cervezas: ['alarma'] },
      null, 'texto',
      { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 1, precio: 100, nombre: '¡Alarma!' },
    ],
  });
  const r = P.restaurar(raw, T0);
  assert.equal(r.lineas.length, 1, 'solo sobrevive la línea válida (y se junta con su igual)');
  assert.equal(r.lineas[0].cantidad, 3);
  assert.equal(r.mesa, 'Mesa 3 con');
});

test('revalida un barril que ya no está y un precio cambiado', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  p = P.agregar(p, { tipo: 'barril', id: 'agua-puerca', variante: '12 oz' }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2 }, m, T0);
  p = P.agregar(p, { tipo: 'comida', id: 'papas-cisne' }, m, T0);
  p = P.agregar(p, { tipo: 'vuelo', cervezas: ['alarma', 'henry-ix', 'guamaica', 'agua-puerca'] }, m, T0);
  const m2 = menuBase();
  m2.barril = m2.barril.filter((b) => b.id !== 'agua-puerca');    // el barril rotó
  m2.barril[0].precios[0].precio = 105;                            // ¡Alarma! 12 oz sube
  m2.comida[0].items[1].disponible = false;                        // papas agotadas
  const r = P.revalidar(p, m2);
  assert.equal(r.lineas[0].no_disponible, true);
  assert.equal(r.lineas[0].motivo, 'no_existe');
  assert.equal(r.lineas[1].precio_cambiado, true);
  assert.equal(r.lineas[1].precio_nuevo, 105);
  assert.equal(r.lineas[1].precio, 100, 'conserva el precio que vio el cliente hasta que acepte');
  assert.equal(r.lineas[2].no_disponible, true);
  assert.equal(r.lineas[2].motivo, 'agotado');
  assert.equal(r.lineas[3].no_disponible, true, 'un vuelo con un barril que rotó ya no está disponible');
  assert.equal(P.pendientes(r), 4);
  assert.equal(p.lineas[0].no_disponible, undefined, 'revalidar no muta');
  // Aceptar el precio nuevo
  const a = P.aceptarPrecio(r, 1);
  assert.equal(a.lineas[1].precio, 105);
  assert.equal(a.lineas[1].precio_cambiado, undefined);
  assert.equal(P.revalidar(a, m2).lineas[1].precio_cambiado, undefined);
  // Barril que dejó de servirse en 4 oz o se marcó agotado
  const m3 = menuBase();
  m3.barril[0].disponible = false;
  assert.equal(P.revalidar(p, m3).lineas[1].motivo, 'agotado');
  // Sin cambios: nada marcado
  assert.equal(P.pendientes(P.revalidar(p, menuBase())), 0);
});

test('total exacto (incluidos el vuelo y las variantes)', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2 }, m, T0);         // 200
  p = P.agregar(p, { tipo: 'barril', id: 'henry-ix', variante: '4 oz' }, m, T0);                     // 35
  p = P.agregar(p, { tipo: 'comida', id: 'chips-camote', variante: '110g' }, m, T0);                 // 135
  p = P.agregar(p, { tipo: 'bebida', id: 'bebida-agua-mineral', variante: 'rusa', cantidad: 3 }, m, T0); // 135
  p = P.agregar(p, { tipo: 'vuelo', cervezas: ['alarma', 'henry-ix', 'guamaica', 'agua-puerca'] }, m, T0); // 35+35+40+35 = 145
  assert.equal(p.lineas[4].precio, 145);
  assert.equal(P.total(p), 200 + 35 + 135 + 135 + 145);
  assert.equal(P.contar(p), 2 + 1 + 1 + 3 + 1);
  // Lo no disponible no suma; el precio cambiado usa el nuevo
  const m2 = menuBase();
  m2.barril[1].precios[1].precio = 38;               // Henry IX 4 oz: 35 → 38 (también sube el vuelo a 148)
  m2.comida[0].items[0].disponible = false;          // chips agotados
  const r = P.revalidar(p, m2);
  assert.equal(P.total(r), 200 + 38 + 135 + 148);
  // Vuelo inválido
  assert.throws(() => P.agregar(p, { tipo: 'vuelo', cervezas: ['alarma', 'henry-ix'] }, m, T0), /Elige 4 cervezas/);
  // Con el menú publicado real: el vuelo de cuatro 4 oz cuesta lo mismo que la suma de sus precios
  const ids = MENU_REAL.barril.slice(0, 4).map((b) => b.id);
  const esperado = MENU_REAL.barril.slice(0, 4).reduce((s, b) => s + b.precios.find((x) => x.medida === '4 oz').precio, 0);
  assert.equal(P.agregar(P.vacio(T0), { tipo: 'vuelo', cervezas: ids }, MENU_REAL, T0).lineas[0].precio, esperado);
});

test('la tarjeta tiene el orden y los datos correctos', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  p = P.agregar(p, { tipo: 'comida', id: 'chips-camote', variante: '110g', nota: 'con salsa aparte' }, m, T0);
  p = P.agregar(p, { tipo: 'bebida', id: 'bebida-agua-mineral', variante: 'rusa' }, m, T0);
  p = P.agregar(p, { tipo: 'lata', id: 'lata-loba-negra' }, m, T0);
  p = P.agregar(p, { tipo: 'vuelo', cervezas: ['guamaica', 'alarma', 'henry-ix', 'agua-puerca'] }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2, nota: 'una sin espuma' }, m, T0);
  p = P.agregar(p, { tipo: 'comida', id: 'hamburguesa-res' }, m, T0);
  p = P.agregar(p, { tipo: 'barril', id: 'agua-puerca', variante: '4 oz' }, m, T0);
  p = P.ponerMesa(p, '7');
  const m2 = menuBase();
  m2.barril = m2.barril.filter((b) => b.id !== 'agua-puerca');   // rotó: excluye su línea y el vuelo
  const t = P.tarjeta(p, m2);
  assert.equal(t.mesa, '7');
  assert.deepEqual(t.secciones.map((s) => s.titulo), ['Bebidas', 'Comida']);
  assert.deepEqual(t.secciones[0].lineas.map((l) => [l.tipo, l.cantidad, l.nombre, l.detalle, l.nota]), [
    ['barril', 2, '¡Alarma!', '12 oz', 'una sin espuma'],
    ['lata', 1, 'Loba Negra', '', ''],
    ['bebida', 1, 'Agua mineral', 'Preparada (rusa)', ''],
  ]);
  assert.deepEqual(t.secciones[1].lineas.map((l) => [l.cantidad, l.nombre, l.detalle, l.nota, l.importe]), [
    [1, 'Chips de Camote', '110 g', 'con salsa aparte', 135],
    [1, 'Hamburguesa de Res', '', '', 135],
  ]);
  assert.equal(t.omitidas, 2);
  assert.equal(t.total, 200 + 120 + 45 + 135 + 135);
  assert.equal(t.productos, 6);
  // Con el menú completo el vuelo entra después del barril y lista sus 4 cervezas en orden
  const t2 = P.tarjeta(p, m);
  const vuelo = t2.secciones[0].lineas.find((l) => l.tipo === 'vuelo');
  assert.deepEqual(t2.secciones[0].lineas.map((l) => l.tipo), ['barril', 'barril', 'vuelo', 'lata', 'bebida']);
  assert.deepEqual(vuelo.cervezas, ['Guamaica', '¡Alarma!', 'Henry IX', 'Agua Puerca']);
  assert.equal(vuelo.detalle, '4 × 4 oz');
  assert.equal(vuelo.importe, 40 + 35 + 35 + 35);
  // Precio cambiado sin aceptar: tampoco entra
  const m3 = menuBase();
  m3.sin_alcohol[0].variantes[1].precio = 50;
  assert.equal(P.tarjeta(p, m3).secciones[0].lineas.some((l) => l.tipo === 'bebida'), false);
  // Pedido vacío
  assert.deepEqual(P.tarjeta(P.vacio(T0), m).secciones, []);
});

test('editar nota junta líneas que quedan iguales', () => {
  const m = menuBase();
  let p = P.vacio(T0);
  p = P.agregar(p, { tipo: 'bebida', id: 'bebida-cafe', cantidad: 2 }, m, T0);
  p = P.agregar(p, { tipo: 'bebida', id: 'bebida-cafe', nota: 'sin azúcar' }, m, T0);
  const q = P.cambiarNota(p, 1, '');
  assert.equal(q.lineas.length, 1);
  assert.equal(q.lineas[0].cantidad, 3);
  assert.equal(P.quitar(p, 0).lineas.length, 1);
  assert.throws(() => P.quitar(p, 5), /ya no está/);
});

test('cadena del Wi-Fi para el QR', () => {
  assert.equal(P.cadenaWifi({ ssid: 'CisneNegro-Invitados', password: 'CuentaloEnElCisne', seguridad: 'WPA' }), 'WIFI:T:WPA;S:CisneNegro-Invitados;P:CuentaloEnElCisne;;');
  assert.equal(P.cadenaWifi({ ssid: 'a;b,c:d"e\\f', password: 'p;1', seguridad: 'WEP' }), 'WIFI:T:WEP;S:a\\;b\\,c\\:d\\"e\\\\f;P:p\\;1;;');
  assert.equal(P.cadenaWifi({ ssid: 'Abierta', password: 'ignorada', seguridad: 'nopass' }), 'WIFI:T:nopass;S:Abierta;;');
});

// ── QR del pedido para el mesero ─────────────────────────────────────────────
/** Pedido realista de 10 líneas con notas largas (acentos, ñ y emoji) contra el menú publicado. */
function pedidoDiez(menu) {
  const comida = menu.comida.flatMap((s) => s.items).filter((i) => !i.variantes && i.disponible !== false);
  const barriles = menu.barril.filter((b) => b.disponible !== false);
  const vuelo = barriles.filter((b) => b.precios.some((x) => x.medida === '4 oz')).slice(0, 4).map((b) => b.id);
  let p = P.ponerMesa(P.vacio(T0), 'Terraza 12');
  const notas = ['Sin cebolla, por favor y bien dorada', 'Una sin espuma 🍺 y otra con poquita', 'Salsa aparte; la piña bien asada',
    'Para compartir: cortada en cuatro', 'Muy fría, con limón y sal de gusano', 'Sin chile ni cilantro (alergia)', 'La más amarga que tengan, ¡gracias!',
    'Doble porción de papas, sin mayonesa', 'Al centro de la mesa, con dos platos', 'Término medio y sin pepinillos'];
  const items = [
    { tipo: 'barril', id: barriles[0].id, variante: barriles[0].precios[0].medida, cantidad: 2 },
    { tipo: 'barril', id: barriles[1].id, variante: '4 oz' },
    { tipo: 'vuelo', cervezas: vuelo },
    { tipo: 'lata', id: menu.latas[0].id },
    { tipo: 'bebida', id: 'bebida-agua-mineral', variante: 'rusa', cantidad: 3 },
    ...comida.slice(0, 5).map((c, i) => ({ tipo: 'comida', id: c.id, cantidad: i + 1 })),
  ];
  items.forEach((it, i) => { p = P.agregar(p, { ...it, nota: notas[i] }, menu, T0); });
  return p;
}

test('paraQR → desdeQR conserva mesa, líneas, cantidades, variantes, vuelo y notas con acentos', () => {
  const m = menuBase();
  let p = P.ponerMesa(P.vacio(T0), 'Barra ñ');
  p = P.agregar(p, { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2, nota: 'Una sin espuma, ¿sí?' }, m, T0);
  p = P.agregar(p, { tipo: 'vuelo', cervezas: ['alarma', 'henry-ix', 'guamaica', 'agua-puerca'] }, m, T0);
  p = P.agregar(p, { tipo: 'comida', id: 'chips-camote', variante: '110g', nota: 'Piña y jalapeño 🌶️' }, m, T0);
  const q = P.paraQR(p);
  assert.match(q.datos, /^[A-Za-z0-9_-]+$/, 'base64url sin + / ni =');
  assert.equal(q.recortado, false);
  assert.equal(q.cabe, true);
  const d = P.desdeQR('https://cisnenegro.softvibes.art/v2/equipo/#d=' + q.datos);
  assert.deepEqual(d, {
    t: Math.floor(T0 / 1000).toString(36),
    mesa: 'Barra ñ',
    lineas: [
      { tipo: 'barril', id: 'alarma', variante: '12 oz', cantidad: 2, nota: 'Una sin espuma, ¿sí?' },
      { tipo: 'vuelo', id: 'vuelo', variante: null, cantidad: 1, nota: '', cervezas: ['alarma', 'henry-ix', 'guamaica', 'agua-puerca'] },
      { tipo: 'comida', id: 'chips-camote', variante: '110g', cantidad: 1, nota: 'Piña y jalapeño 🌶️' },
    ],
  });
  // Mismas líneas que se envían al servidor
  assert.deepEqual(d.lineas, P.lineasParaServidor(p));
  // También acepta "#d=…" o solo los datos
  assert.deepEqual(P.desdeQR('#d=' + q.datos), d);
  assert.deepEqual(P.desdeQR(q.datos), d);
  // Omite los valores por defecto para que el QR sea más ligero
  const json = Buffer.from(q.datos, 'base64url').toString('utf8');
  assert.ok(!json.includes('"cantidad":1') && !json.includes('"variante":null') && !json.includes('"nota":""'), json);
});

test('desdeQR rechaza datos inválidos o manipulados', () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64url');
  assert.equal(P.desdeQR(''), null);
  assert.equal(P.desdeQR('no es base64!'), null);
  assert.equal(P.desdeQR(b64({ lineas: [] })), null);
  assert.equal(P.desdeQR(b64({ lineas: [{ tipo: 'pizza', id: 'x' }] })), null);
  assert.equal(P.desdeQR(b64({ lineas: [{ tipo: 'lata', id: '../../etc' }] })), null);
  assert.equal(P.desdeQR(b64({ lineas: [{ tipo: 'lata', id: 'lata-x', cantidad: 21 }] })), null);
  assert.equal(P.desdeQR(b64({ lineas: [{ tipo: 'vuelo', cervezas: ['a', 'b'] }] })), null);
  assert.equal(P.desdeQR(Buffer.from([0xff, 0xfe, 0x00]).toString('base64url')), null, 'UTF-8 inválido');
  // Limpia mesa y nota (control y longitud)
  const d = P.desdeQR(b64({ mesa: '  7\n ', lineas: [{ tipo: 'lata', id: 'lata-x', nota: 'a\u0007b' + 'x'.repeat(80) }] }));
  assert.equal(d.mesa, '7');
  assert.equal(d.lineas[0].nota.length, P.MAX_NOTA);
});

test('un pedido de 10 líneas con notas cabe en un QR legible (< 1,000 caracteres)', () => {
  const p = pedidoDiez(MENU_REAL);
  assert.equal(p.lineas.length, 10);
  const q = P.paraQR(p);
  const url = 'https://cisnenegro.softvibes.art/v2/equipo/#d=' + q.datos;
  assert.ok(q.cabe && url.length < 1000, `URL de ${url.length} caracteres`);
  const d = P.desdeQR(url);
  assert.equal(d.lineas.length, 10);
  assert.equal(d.mesa, 'Terraza 12');
  assert.deepEqual(d.lineas.map((l) => [l.tipo, l.id, l.variante, l.cantidad]), P.lineasParaServidor(p).map((l) => [l.tipo, l.id, l.variante, l.cantidad]));
  // Las notas pueden venir recortadas, pero siempre son el inicio de la original
  d.lineas.forEach((l, i) => { const o = p.lineas[i].nota; assert.ok(l.nota === o || o.startsWith(l.nota.replace(/…$/, '')), `${l.nota} / ${o}`); });
});

test('si no cabe, corta las notas antes que las líneas', () => {
  const p = pedidoDiez(MENU_REAL);
  const completo = P.paraQR(p, { max: 5000 });
  assert.equal(completo.recortado, false);
  assert.deepEqual(P.desdeQR(completo.datos).lineas.map((l) => l.nota), p.lineas.map((l) => l.nota));
  const corto = P.paraQR(p, { max: completo.datos.length - 40 });
  assert.equal(corto.recortado, true);
  assert.equal(corto.cabe, true);
  assert.ok(corto.datos.length <= completo.datos.length - 40);
  assert.ok(P.desdeQR(corto.datos).lineas.some((l) => l.nota.endsWith('…')));
  const sinNotas = P.paraQR(p, { max: 10 });
  assert.equal(sinNotas.cabe, false);
  assert.ok(P.desdeQR(sinNotas.datos).lineas.every((l) => l.nota === ''), 'en el último intento ya no lleva notas');
  assert.equal(P.desdeQR(sinNotas.datos).lineas.length, 10);
});

test('huella y código reutilizable: mismo pedido → mismo código; si cambia, uno nuevo', () => {
  const m = menuBase();
  let p = P.agregar(P.vacio(T0), { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0);
  const h1 = P.huellaPedido(p);
  const g = { huella: h1, codigo: 'K7M2Q9AB', expira_at: new Date(T0 + 3 * H).toISOString() };
  assert.equal(P.codigoVigente(g, h1, T0), 'K7M2Q9AB');
  assert.equal(P.codigoVigente(JSON.stringify(g), h1, T0), 'K7M2Q9AB', 'acepta lo guardado en texto');
  assert.equal(P.huellaPedido(P.revalidar(p, m)), h1, 'revalidar no cambia la huella');
  assert.notEqual(P.huellaPedido(P.cambiarCantidad(p, 0, 2)), h1);
  assert.notEqual(P.huellaPedido(P.cambiarNota(p, 0, 'sin espuma')), h1);
  assert.notEqual(P.huellaPedido(P.ponerMesa(p, '4')), h1);
  assert.equal(P.codigoVigente(g, P.huellaPedido(P.ponerMesa(p, '4')), T0), null);
  assert.equal(P.codigoVigente(g, h1, T0 + 3 * H - 60 * 1000), null, 'a punto de caducar → uno nuevo');
  assert.equal(P.codigoVigente({ ...g, codigo: 'x<script>' }, h1, T0), null);
  assert.equal(P.codigoVigente('{roto', h1, T0), null);
  assert.equal(P.codigoVigente(null, h1, T0), null);
  // Las líneas por revisar no viajan
  const m2 = menuBase(); m2.barril[0].precios[0].precio = 120;
  assert.deepEqual(P.lineasParaServidor(P.revalidar(p, m2)), []);
});

test('código en grupos de 4', () => {
  assert.equal(P.formatoCodigo('K7M2Q9AB'), 'K7M2-Q9AB');
  assert.equal(P.formatoCodigo('k7m2-q9ab'), 'K7M2-Q9AB');
  assert.equal(P.formatoCodigo('ABCDEF'), 'ABCD-EF');
  assert.equal(P.formatoCodigo(''), '');
});

test('el módulo funciona sin DOM (patrón UMD)', () => {
  assert.equal(typeof P.agregar, 'function');
  assert.equal(P.CLAVE, 'cisne-pedido-v1');
  assert.ok(path.basename(require.resolve('../sitio/assets/js/pedido.js')) === 'pedido.js');
});

test('paraQR lleva la marca de creación t: una segunda ronda idéntica da otro QR', () => {
  const m = menuBase();
  const p = P.agregar(P.vacio(T0), { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0);
  const q = P.paraQR(p);
  assert.equal(P.desdeQR(q.datos).t, Math.floor(T0 / 1000).toString(36));
  const otra = P.agregar(P.vacio(T0 + 3600e3), { tipo: 'barril', id: 'alarma', variante: '12 oz' }, m, T0 + 3600e3);
  assert.notEqual(P.paraQR(otra).datos, q.datos);
  assert.equal(P.desdeQR(Buffer.from(JSON.stringify({ t: 'NO!', lineas: [{ tipo: 'lata', id: 'lata-x' }] })).toString('base64url')).t, undefined, 't inválida se ignora');
});
