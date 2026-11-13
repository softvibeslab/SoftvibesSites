// Diagnóstico rápido del curso PAD: sin backend; solo prepara un mensaje de WhatsApp.
const WHATSAPP = 'https://wa.me/529841799401';

const ETAPAS = {
  idea: 'Idea',
  inicio: 'Inicio',
  operacion: 'Operación',
  crecimiento: 'Crecimiento',
  expansion: 'Expansión'
};

const MODALIDADES = {
  local: 'Local o taller',
  movil: 'Móvil o a domicilio',
  mixta: 'Mixta',
  'sin-definir': 'Aún no definida'
};

const RETOS = {
  precios: { label: 'No sé cuánto cobrar', stage: 'P' },
  oferta: { label: 'Mi oferta no está clara', stage: 'P' },
  contenido: { label: 'Publico y no llegan clientes', stage: 'A' },
  cierre: { label: 'Me escriben y no cierran', stage: 'D' },
  recompra: { label: 'Los clientes no regresan', stage: 'D' }
};

const STAGES = {
  P: {
    name: 'Prepara',
    reason: 'Tu reto está en los fundamentos: oferta, cliente y precios. Ordénalos antes de invertir en promoción.',
    deliverables: ['Diagnóstico empresarial', 'Perfil de cliente ideal y segmento prioritario', 'Propuesta de valor', 'Catálogo, paquetes y matriz básica de costos y precios']
  },
  A: {
    name: 'Apunta',
    reason: 'Tu reto está en atraer al público adecuado: mensaje, contenido y canales que coincidan con lo que puedes entregar.',
    deliverables: ['Mensaje de posicionamiento', 'Pilares de contenido y calendario editorial', 'Ideas y guiones de Reels', 'Selección de canales, presupuesto e indicadores']
  },
  D: {
    name: 'Dispara',
    reason: 'Tu reto está en convertir y retener: atención, cotización, seguimiento y postventa.',
    deliverables: ['Protocolo de atención y guiones de WhatsApp', 'Preguntas de calificación y guía de objeciones', 'Formato de cotización y pipeline de prospectos', 'Secuencia de seguimiento y proceso de postventa']
  }
};

const EARLY = new Set(['idea', 'inicio']);

export function diagnose({ etapa, modalidad, reto }) {
  if (!ETAPAS[etapa] || !MODALIDADES[modalidad] || !RETOS[reto]) return null;
  const challengeStage = RETOS[reto].stage;
  // La etapa anterior condiciona la siguiente: un negocio en idea o inicio prioriza Prepara.
  const stage = EARLY.has(etapa) ? 'P' : challengeStage;
  const info = STAGES[stage];
  let reason = info.reason;
  if (stage !== challengeStage) {
    reason = `Tu reto se trabaja en ${STAGES[challengeStage].name}, pero en etapa de ${ETAPAS[etapa].toLowerCase()} conviene empezar por Prepara: la etapa anterior condiciona los resultados de la siguiente.`;
  } else if (stage !== 'P') {
    reason += ' Confirma también que tu oferta y tus precios estén claros: Prepara condiciona lo que sigue.';
  }
  const message = [
    'Hola Detailbox Academy, me interesa el Curso PAD.',
    `Etapa de mi negocio: ${ETAPAS[etapa]}.`,
    `Modalidad: ${MODALIDADES[modalidad]}.`,
    `Mi reto principal: ${RETOS[reto].label}.`,
    `Resultado del diagnóstico rápido: priorizar ${stage} · ${info.name}.`,
    '¿Me comparten próxima fecha, sede e inversión?'
  ].join('\n');
  return {
    stage,
    name: info.name,
    reason,
    deliverables: info.deliverables,
    message,
    url: `${WHATSAPP}?text=${encodeURIComponent(message)}`
  };
}

const form = typeof document !== 'undefined' ? document.querySelector('[data-pad-quiz]') : null;

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const result = diagnose({ etapa: data.get('etapa'), modalidad: data.get('modalidad'), reto: data.get('reto') });
  const error = form.querySelector('[data-quiz-error]');
  const panel = form.querySelector('[data-quiz-result]');
  if (!result) {
    error.hidden = false;
    panel.hidden = true;
    const firstMissing = ['etapa', 'modalidad', 'reto'].find((name) => !data.get(name));
    form.querySelector(`input[name="${firstMissing}"]`)?.focus();
    return;
  }
  error.hidden = true;
  panel.querySelector('[data-result-letter]').textContent = result.stage;
  panel.querySelector('[data-result-name]').textContent = result.name;
  panel.querySelector('[data-result-reason]').textContent = result.reason;
  const list = panel.querySelector('[data-result-deliverables]');
  list.replaceChildren(...result.deliverables.map((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  }));
  panel.querySelector('[data-result-whatsapp]').href = result.url;
  panel.hidden = false;
  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
});
