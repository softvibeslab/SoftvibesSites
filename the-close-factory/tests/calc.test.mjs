// node --test tests/calc.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { calcularFuga, mensajeFuga } from "../calc.js";

test("caso de ejemplo de la página", () => {
  const r = calcularFuga({ leads: 150, atendidosDe10: 6, citaPct: 20, cierrePct: 10, comision: 90000 });
  assert.equal(r.esperanMes, 60);
  assert.equal(r.citasMes, 12);
  assert.equal(r.cierresAnio, 14.4);
  assert.equal(r.comisionAnio, 1296000);
});

test("cero prospectos no produce fuga", () => {
  assert.deepEqual(calcularFuga({ leads: 0, atendidosDe10: 3, citaPct: 50, cierrePct: 50, comision: 1 }), {
    esperanMes: 0, citasMes: 0, cierresAnio: 0, comisionAnio: 0,
  });
});

test("todos atendidos: nadie espera", () => {
  assert.equal(calcularFuga({ leads: 500, atendidosDe10: 10, citaPct: 30, cierrePct: 10 }).esperanMes, 0);
});

test("vacíos, texto y NaN se tratan como cero", () => {
  const r = calcularFuga({ leads: "", atendidosDe10: "abc", citaPct: undefined, cierrePct: NaN, comision: null });
  assert.deepEqual(r, { esperanMes: 0, citasMes: 0, cierresAnio: 0, comisionAnio: 0 });
});

test("valores fuera de rango se limitan", () => {
  const r = calcularFuga({ leads: 1e9, atendidosDe10: -5, citaPct: 400, cierrePct: 400, comision: -10 });
  assert.equal(r.esperanMes, 100000);
  assert.equal(r.citasMes, 100000);
  assert.equal(r.cierresAnio, 1200000);
  assert.equal(r.comisionAnio, 0);
});

test("sin argumentos no truena", () => {
  assert.equal(calcularFuga().esperanMes, 0);
});

test("el mensaje lleva los números del visitante y el origen", () => {
  const entrada = { leads: 150, atendidosDe10: 6 };
  const msg = mensajeFuga(entrada, calcularFuga(entrada));
  assert.match(msg, /150 prospectos al mes/);
  assert.match(msg, /unos 60 no reciben respuesta/);
  assert.match(msg, /Vengo de: calculadora\./);
});
