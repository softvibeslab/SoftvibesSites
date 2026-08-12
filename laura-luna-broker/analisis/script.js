(() => {
  const menuButton = document.querySelector('.menu');
  const navigation = document.querySelector('.topbar nav');

  menuButton?.addEventListener('click', () => {
    const open = navigation?.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  });

  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  document.querySelectorAll('.finding button').forEach((button) => button.addEventListener('click', () => {
    const finding = button.closest('.finding');
    const open = finding.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  }));
})();
