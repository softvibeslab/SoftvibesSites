(() => {
  const menuButton = document.querySelector('.menu');
  const nav = document.querySelector('.topbar nav');
  menuButton?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('.finding button').forEach((button) => {
    button.addEventListener('click', () => {
      const finding = button.closest('.finding');
      const open = finding.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });
})();
