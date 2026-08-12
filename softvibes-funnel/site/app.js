/* ===========================================================
   Softvibes · Test del Embudo Fantasma
   =========================================================== */
const WA_SOFTVIBES = "527295493319"; // +52 729 549 3319

/* URL del webhook de Google Apps Script conectado a tu Google Sheet.
   Instrucciones para obtenerla en: google-sheets-webhook.gs (mismo folder).
   Mientras esté vacía, los leads solo se muestran en consola. */
const SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycbzdMXICwa7VmxFj8SHewXWd89aZQrBRBtcHaMYixbPW0GYsB5TzkilUHShSPk4p-NozMw/exec";

/* ---------- Dimensiones ---------- */
const DIMS = [
  { key: "A", title: "Casa propia", icon: "🏠", label: "casa propia",
    fuga: "🏠 No tienes una casa propia (dominio) que centralice tu marca." },
  { key: "B", title: "Ruta de decisión", icon: "🧭", label: "ruta de decisión clara",
    fuga: "🧭 Tu visitante no tiene una ruta clara ni un siguiente paso obvio." },
  { key: "C", title: "Contexto en el contacto", icon: "💬", label: "contexto en el contacto",
    fuga: "💬 Tus contactos llegan sin contexto → pierdes tiempo filtrando a mano." },
  { key: "D", title: "Captación (lista propia)", icon: "📥", label: "captación / lista propia",
    fuga: "📥 No capturas datos → dependes 100% del algoritmo." },
  { key: "E", title: "Biblioteca de contenido", icon: "📚", label: "biblioteca de contenido",
    fuga: "📚 Tu contenido no se vuelve un activo propio (ni te encuentra en Google)." },
];

/* ---------- Preguntas (15) ---------- */
const QUESTIONS = [
  { dim: "A", text: "¿Tienes UN sitio propio (dominio tuyo) que funcione como centro de tu marca?",
    opts: [["No tengo", 0], ["Tengo, pero no lo uso como centro", 1], ["Sí, es mi centro", 2]] },
  { dim: "A", text: "Cuando alguien te busca en Google, ¿aparece tu marca ordenada o perfiles sueltos?",
    opts: [["Perfiles sueltos", 0], ["Algo mezclado", 1], ["Marca ordenada", 2]] },
  { dim: "A", text: "¿Tu bio manda a UN solo lugar o a varios (Linktree + landing + WhatsApp)?",
    opts: [["A varios destinos", 0], ["A dos", 1], ["A uno claro", 2]] },

  { dim: "B", text: "¿Un visitante nuevo sabe en 5 segundos qué hacer contigo?",
    opts: [["No, se pierde", 0], ["Más o menos", 1], ["Sí, clarísimo", 2]] },
  { dim: "B", text: "¿Tienes un \"siguiente paso\" obvio (aplicar / agendar / cotizar)?",
    opts: [["Depende de que me escriban", 0], ["A veces", 1], ["Sí, siempre visible", 2]] },
  { dim: "B", text: "¿Tu contenido lleva a una acción o solo informa?",
    opts: [["Solo informa", 0], ["A veces lleva a algo", 1], ["Siempre lleva a una acción", 2]] },

  { dim: "C", text: "Cuando te escriben, ¿llega ya con contexto (origen, tema, intención)?",
    opts: [["Llega \"hola\" pelón", 0], ["A veces con contexto", 1], ["Siempre con contexto", 2]] },
  { dim: "C", text: "¿Filtras antes de invertir tu tiempo o atiendes a todos por igual?",
    opts: [["Atiendo a todos igual", 0], ["Filtro a medias", 1], ["Filtro antes de responder", 2]] },
  { dim: "C", text: "¿Tienes mensajes/respuestas pre-armados o improvisas cada conversación?",
    opts: [["Improviso siempre", 0], ["Algunos armados", 1], ["Sistema de mensajes armado", 2]] },

  { dim: "D", text: "¿Capturas email o WhatsApp de tus interesados en una lista tuya?",
    opts: [["No capturo nada", 0], ["A veces, sin orden", 1], ["Sí, en una lista propia", 2]] },
  { dim: "D", text: "Si mañana pierdes tu cuenta de Instagram, ¿sigues pudiendo contactar a tu gente?",
    opts: [["No, los pierdo", 0], ["A algunos", 1], ["Sí, tengo sus datos", 2]] },
  { dim: "D", text: "¿Tienes un \"imán\" (recurso gratis) que la gente pida a cambio de sus datos?",
    opts: [["No tengo", 0], ["Algo informal", 1], ["Sí, un imán claro", 2]] },

  { dim: "E", text: "¿Tu contenido bueno vive solo en redes o también en tu sitio (artículos/recursos)?",
    opts: [["Solo en redes", 0], ["Algo en el sitio", 1], ["Vive en mi sitio también", 2]] },
  { dim: "E", text: "¿Un cliente potencial puede encontrar tu contenido en Google meses después?",
    opts: [["No", 0], ["Algo", 1], ["Sí, me encuentran", 2]] },
  { dim: "E", text: "¿Reutilizas tu contenido en un embudo o cada post muere en 24h?",
    opts: [["Muere en 24h", 0], ["Reutilizo a veces", 1], ["Vive dentro de un embudo", 2]] },
];

/* ---------- Estado ---------- */
const answers = new Array(QUESTIONS.length).fill(null);
let lastResult = null;

/* ---------- Render de preguntas ---------- */
const form = document.getElementById("quizForm");
let currentDim = null;
QUESTIONS.forEach((q, i) => {
  if (q.dim !== currentDim) {
    currentDim = q.dim;
    const d = DIMS.find((x) => x.key === q.dim);
    const head = document.createElement("div");
    head.className = "quiz-dim";
    head.innerHTML = `<div class="quiz-dim-title">${d.icon} ${d.title}</div>`;
    form.appendChild(head);
  }
  const wrap = document.createElement("div");
  wrap.className = "quiz-q";
  wrap.innerHTML =
    `<p>${i + 1}. ${q.text}</p>` +
    `<div class="quiz-opts">` +
    q.opts
      .map(
        ([t, p]) =>
          `<label class="quiz-opt"><input type="radio" name="q${i}" value="${p}" /> <span>${t}</span></label>`
      )
      .join("") +
    `</div>`;
  form.appendChild(wrap);
});

/* ---------- Interacción de opciones ---------- */
form.addEventListener("change", (e) => {
  if (e.target.type !== "radio") return;
  const idx = parseInt(e.target.name.slice(1), 10);
  answers[idx] = parseInt(e.target.value, 10);
  // resaltar seleccionada
  form
    .querySelectorAll(`input[name="${e.target.name}"]`)
    .forEach((r) => r.closest(".quiz-opt").classList.toggle("sel", r.checked));
  updateProgress();
});

function updateProgress() {
  const done = answers.filter((a) => a !== null).length;
  document.getElementById("quizCount").textContent = done;
  document.getElementById("quizBar").style.width = (done / QUESTIONS.length) * 100 + "%";
}

/* ---------- Cálculo ---------- */
function computeResult() {
  const dimScore = {}; // key -> puntos (0..6)
  DIMS.forEach((d) => (dimScore[d.key] = 0));
  QUESTIONS.forEach((q, i) => (dimScore[q.dim] += answers[i]));

  const totalRaw = Object.values(dimScore).reduce((a, b) => a + b, 0); // 0..30
  const score = Math.round((totalRaw / 30) * 100); // 0..100

  const band = bandFor(score);

  // 3 dimensiones más bajas (empate: orden natural A..E)
  const fugas = [...DIMS]
    .sort((a, b) => dimScore[a.key] - dimScore[b.key])
    .slice(0, 3);

  return { score, band, fugas, dimScore };
}

function bandFor(s) {
  if (s <= 39)
    return { nombre: "Embudo Fantasma total", verdict: "Tienes presencia, pero cero embudo. Cada cliente que llega es suerte, no sistema. Estás regalando la mayoría de tu tráfico." };
  if (s <= 59)
    return { nombre: "Presencia bonita, fuga grande", verdict: "Te ves profesional, pero tu presencia trabaja para las plataformas, no para ti. Se te escapan los clientes en el paso del interés al contacto." };
  if (s <= 79)
    return { nombre: "Embudo a medias", verdict: "Ya tienes piezas, pero desconectadas. Un poco de estructura y tu presencia empezaría a filtrar y cerrar sola." };
  return { nombre: "Embudo sólido", verdict: "Vas muy bien. Tu oportunidad ahora es automatizar y construir autoridad de nicho para escalar." };
}

/* ---------- Botón: ver puntaje ---------- */
document.getElementById("quizCalc").addEventListener("click", () => {
  const err = document.getElementById("quizError");
  if (answers.some((a) => a === null)) {
    err.hidden = false;
    // llevar a la primera sin responder
    const firstIdx = answers.findIndex((a) => a === null);
    form.querySelectorAll(".quiz-q")[firstIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  err.hidden = true;
  lastResult = computeResult();

  // mostrar peek del puntaje y abrir gate
  document.getElementById("gatePeek").textContent = lastResult.score;
  const gate = document.getElementById("gateCard");
  gate.hidden = false;
  gate.classList.add("visible");
  gate.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- Gate: capturar y revelar resultado ---------- */
document.getElementById("gateForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!lastResult) return;

  const nombre = document.getElementById("gName").value.trim();
  const wa = document.getElementById("gWa").value.trim();
  const nicho = document.getElementById("gNicho").value;

  const { score, band, fugas } = lastResult;

  // Pintar resultado
  document.getElementById("resultScore").textContent = score;
  document.getElementById("resultRing").style.setProperty("--pct", score + "%");
  document.getElementById("resultBand").textContent = band.nombre;
  document.getElementById("resultVerdict").textContent = band.verdict;

  const ul = document.getElementById("resultFugas");
  ul.innerHTML = fugas.map((f) => `<li>${f.fuga}</li>`).join("");

  // Link de WhatsApp con contexto cargado (predicamos lo que vendemos)
  const fugasCorto = fugas.map((f) => f.label).join(", ");
  const msg =
    `Hola Softvibes 👋 Hice el Test del Embudo Fantasma.\n` +
    `Nombre: ${nombre}\n` +
    `Puntaje: ${score}/100 (${band.nombre})\n` +
    `Nicho: ${nicho}\n` +
    `Mis 3 fugas: ${fugasCorto}.\n` +
    `Quiero mi análisis personalizado gratis.`;
  const waLink = `https://wa.me/${WA_SOFTVIBES}?text=${encodeURIComponent(msg)}`;
  document.getElementById("resultWa").href = waLink;

  // Guardar lead (placeholder para integrar Hostinger Reach / Sheets / webhook)
  saveLead({ nombre, wa, nicho, score, band: band.nombre, fugas: fugasCorto });

  // Mostrar resultado, ocultar gate y quiz
  document.getElementById("gateCard").hidden = true;
  document.getElementById("quizForm").style.display = "none";
  document.getElementById("quizCalc").style.display = "none";
  const rc = document.getElementById("resultCard");
  rc.hidden = false;
  rc.classList.add("visible");
  rc.scrollIntoView({ behavior: "smooth", block: "start" });

  // Abrir WhatsApp automáticamente (opcional; comenta si no lo quieres)
  window.open(waLink, "_blank");
});

/* ---------- Guardar lead en Google Sheets ---------- */
function saveLead(data) {
  const lead = { ...data, fecha: new Date().toISOString(), origen: "Test Embudo Fantasma" };
  console.log("LEAD:", lead);
  if (!SHEETS_WEBHOOK) return; // aún sin configurar el webhook
  // no-cors + text/plain: evita el preflight CORS; es fire-and-forget (no leemos respuesta).
  fetch(SHEETS_WEBHOOK, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(lead),
  }).catch((err) => console.warn("No se pudo guardar el lead:", err));
}

/* ---------- Reveal al hacer scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Acordeón FAQ ---------- */
document.querySelectorAll(".faq button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".faq");
    const ans = card.querySelector(".a");
    const open = card.classList.contains("abierto");
    card.classList.toggle("abierto", !open);
    ans.style.maxHeight = open ? "0px" : ans.scrollHeight + "px";
  });
});
