import { calcularFuga, mensajeFuga } from "./calc.js";

const WA = "https://wa.me/529841362816?text=";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nf = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

/* ---------- Menú móvil ---------- */
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }),
  );
}

/* ---------- Atribución: la campaña viaja en el mensaje ---------- */
const params = new URLSearchParams(location.search);
const campana = ["utm_campaign", "utm_source", "utm_medium"].map((k) => params.get(k)).filter(Boolean).join(" / ");
const conCampana = (texto) => (campana ? `${texto} Campaña: ${campana.slice(0, 80)}.` : texto);
const waHref = (texto) => WA + encodeURIComponent(conCampana(texto));

if (campana) {
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
    const url = new URL(a.href);
    a.href = waHref(url.searchParams.get("text") || "");
  });
}

/* ---------- La línea ---------- */
const ETAPAS = [
  {
    kicker: "Estación 01 · Captura", name: "Nuevo contacto",
    detail: "Acaba de escribir por WhatsApp. Nadie lo ha tomado.",
    owner: "Sin asignar", intent: "Aún sin calificar", state: "Registrado", next: "Asignar responsable",
    assist: "La IA registra el origen y propone a quién asignarlo.",
  },
  {
    kicker: "Estación 02 · Calificación", name: "Prospecto interesado",
    detail: "Busca 2 recámaras para vivir. Pidió precio y fechas de entrega.",
    owner: "Asesor asignado", intent: "Compra de vivienda", state: "Calificación inicial", next: "Agendar visita",
    assist: "La IA resume intención, presupuesto y urgencia para el asesor.",
  },
  {
    kicker: "Estación 03 · Seguimiento", name: "Visita agendada",
    detail: "Hay intención y fecha. El responsable confirma un día antes.",
    owner: "Asesor asignado", intent: "Compra de vivienda", state: "Cita confirmada", next: "Hacer la visita",
    assist: "La IA recuerda la cita y prepara la ficha de la unidad.",
  },
  {
    kicker: "Estación 04 · Cierre", name: "Propuesta en mesa",
    detail: "La visita ocurrió. La decisión es del cliente y del equipo.",
    owner: "Asesor + gerente", intent: "Compra de vivienda", state: "Propuesta enviada", next: "Registrar evidencia",
    assist: "Cada paso queda registrado: origen, tiempos y responsable.",
  },
];

const linea = document.querySelector("#linea");
const ticket = document.querySelector("#ticket");
const stations = [...document.querySelectorAll(".station")];
const seals = [...document.querySelectorAll(".stamps .seal")];
let etapa = -1;

function setEtapa(i) {
  if (i === etapa || !ticket) return;
  etapa = i;
  const datos = ETAPAS[i];
  ticket.querySelectorAll("[data-field]").forEach((el) => {
    el.textContent = datos[el.dataset.field] ?? "";
  });
  stations.forEach((st, n) => {
    st.classList.toggle("is-now", n === i);
    st.classList.toggle("is-done", n < i);
    st.setAttribute("aria-pressed", String(n === i));
  });
  seals.forEach((s, n) => s.classList.toggle("is-on", n <= i));
  if (!reduce) {
    ticket.classList.remove("jolt");
    void ticket.offsetWidth;
    ticket.classList.add("jolt");
  }
}

if (linea && ticket) {
  const scrolly = !reduce;
  if (scrolly) linea.classList.add("is-scrolly");
  else {
    const hint = document.querySelector("#linea-hint");
    if (hint) hint.textContent = "Elige una estación y mira cómo cambia la orden. Cada estación deja un sello: nada pasa sin responsable ni siguiente paso.";
  }

  const progreso = () => {
    const r = linea.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    return recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
  };

  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const p = progreso();
    linea.style.setProperty("--p", p.toFixed(3));
    setEtapa(Math.min(3, Math.floor(p * 4.4)));
  };

  if (scrolly) {
    window.addEventListener("scroll", () => {
      if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); }
    }, { passive: true });
    window.addEventListener("resize", pintar);
    pintar();
  } else {
    setEtapa(0);
  }

  stations.forEach((st) =>
    st.addEventListener("click", () => {
      const i = Number(st.dataset.i);
      if (!scrolly) {
        linea.style.setProperty("--p", String(i / 3));
        setEtapa(i);
        return;
      }
      const top = window.scrollY + linea.getBoundingClientRect().top;
      const recorrido = linea.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + recorrido * ((i + 0.5) / 4.4), behavior: "smooth" });
    }),
  );
}

// SMIL del diorama: quieto si el usuario pidió menos movimiento
if (reduce) document.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations?.());

/* ---------- Revelado suave de secciones ---------- */
document.querySelectorAll(".defect, .bento article, .roles article, .sheet").forEach((el) => el.classList.add("reveal"));

/* ---------- Calculadora de fuga ---------- */
const calcForm = document.querySelector("#calc-form");
if (calcForm) {
  const out = {
    espera: document.querySelector("#o-espera"),
    citas: document.querySelector("#o-citas"),
    cierres: document.querySelector("#o-cierres"),
    dinero: document.querySelector("#o-dinero"),
  };
  const cta = document.querySelector("#calc-cta");
  const orderLeads = document.querySelector("#order-form [name='leads']");

  const pintarSalida = (el, valor) => {
    if (el.textContent === valor) return;
    el.textContent = valor;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  };

  const recalcular = () => {
    const f = new FormData(calcForm);
    const entrada = Object.fromEntries(f.entries());
    calcForm.elements.atendidosOut.value = entrada.atendidosDe10;
    const r = calcularFuga(entrada);
    pintarSalida(out.espera, nf.format(r.esperanMes));
    pintarSalida(out.citas, nf.format(r.citasMes));
    pintarSalida(out.cierres, nf.format(r.cierresAnio));
    out.dinero.textContent = r.comisionAnio > 0 ? ` · ${mxn.format(r.comisionAnio)} MXN` : "";
    cta.href = waHref(mensajeFuga(entrada, r));
    const leads = Math.round(Number(entrada.leads));
    if (orderLeads && !orderLeads.dataset.tocado) orderLeads.value = leads > 0 ? String(leads) : "";
  };

  calcForm.addEventListener("input", recalcular);
  calcForm.addEventListener("submit", (e) => e.preventDefault());
  orderLeads?.addEventListener("input", () => { orderLeads.dataset.tocado = "1"; });
  recalcular();
}

/* ---------- Orden de diagnóstico ---------- */
const order = document.querySelector("#order-form");
if (order) {
  const error = document.querySelector("#order-error");
  const note = document.querySelector("#order-note");

  const mensaje = () => {
    const f = new FormData(order);
    const nombre = String(f.get("nombre") || "").trim().slice(0, 80);
    const tipo = String(f.get("tipo") || "");
    if (!nombre || !tipo) return null;
    const leads = Math.round(Number(f.get("leads")));
    const volumen = leads > 0 ? ` Recibimos aprox. ${leads} prospectos al mes.` : "";
    return conCampana(
      `Hola, soy ${nombre} (${tipo.toLowerCase()}). Quiero solicitar un diagnóstico comercial de THE CLOSE FACTORY.${volumen} Vengo de: formulario.`,
    );
  };

  const validar = () => {
    const m = mensaje();
    error.hidden = Boolean(m);
    if (!m) (order.elements.nombre.value.trim() ? order.elements.tipo : order.elements.nombre).focus();
    return m;
  };

  order.addEventListener("submit", (e) => {
    e.preventDefault();
    const m = validar();
    if (!m) return;
    const url = WA + encodeURIComponent(m);
    const ventana = window.open(url, "_blank", "noopener");
    if (!ventana) location.href = url;
  });

  document.querySelector("#order-copy")?.addEventListener("click", async () => {
    const m = validar();
    if (!m) return;
    try {
      await navigator.clipboard.writeText(m);
      note.textContent = "Mensaje copiado. Pégalo en WhatsApp o mándalo al +52 984 136 2816.";
    } catch {
      note.textContent = m;
    }
  });
}
