// Calculadora de fuga. Los números son del visitante; el único supuesto es que
// los prospectos que hoy esperan se comportarían como los que sí se atienden.

const limitar = (valor, min, max) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export function calcularFuga({ leads, atendidosDe10, citaPct, cierrePct, comision } = {}) {
  const l = Math.round(limitar(leads, 0, 100000));
  const r = limitar(atendidosDe10, 0, 10) / 10;
  const c = limitar(citaPct, 0, 100) / 100;
  const k = limitar(cierrePct, 0, 100) / 100;
  const m = limitar(comision, 0, 100000000);

  const esperanMes = Math.round(l * (1 - r));
  const citasMes = esperanMes * c;
  const cierresAnio = citasMes * k * 12;

  return {
    esperanMes,
    citasMes: Math.round(citasMes * 10) / 10,
    cierresAnio: Math.round(cierresAnio * 10) / 10,
    comisionAnio: Math.round(cierresAnio * m),
  };
}

export function mensajeFuga(entrada, resultado) {
  const l = Math.round(limitar(entrada.leads, 0, 100000));
  return (
    `Hola, quiero solicitar un diagnóstico comercial de THE CLOSE FACTORY. ` +
    `Hice la calculadora: recibimos ${l} prospectos al mes y unos ${resultado.esperanMes} ` +
    `no reciben respuesta el mismo día. Vengo de: calculadora.`
  );
}
