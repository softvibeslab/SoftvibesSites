document.body.classList.add('has-js');

const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const header = document.querySelector('[data-header]');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  });
}

const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  reveals.forEach((item) => observer.observe(item));
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});
