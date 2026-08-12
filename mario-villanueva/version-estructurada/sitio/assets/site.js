const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

const updateHeader = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 12);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
  });

  nav.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-open');
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealNodes = document.querySelectorAll('[data-reveal]');

if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -35px' }
  );

  revealNodes.forEach((node) => {
    node.classList.add('reveal');
    observer.observe(node);
  });
} else {
  revealNodes.forEach((node) => node.classList.add('visible'));
}
