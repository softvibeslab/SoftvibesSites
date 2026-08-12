const header = document.querySelector('[data-header]');
const nav = document.querySelector('#nav-principal');
const navToggle = document.querySelector('.nav-toggle');

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

navToggle?.addEventListener('click', () => {
  const open = nav?.classList.toggle('is-open') ?? false;
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
});

nav?.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  nav.classList.remove('is-open');
  navToggle?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
}

const accordion = document.querySelector('[data-accordion]');
accordion?.addEventListener('toggle', (event) => {
  const opened = event.target;
  if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
  accordion.querySelectorAll('details[open]').forEach((detail) => {
    if (detail !== opened) detail.open = false;
  });
}, true);

document.querySelector('[data-lead-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const message = [
    `Hola Detailbox Academy, soy ${data.get('nombre')}.`,
    `Me interesa: ${data.get('curso')}.`,
    `Mi punto de partida: ${data.get('perfil')}.`,
    '¿Me comparten próxima fecha, duración, sede e inversión?'
  ].join('\n');
  window.open(`https://wa.me/529841799401?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
});
