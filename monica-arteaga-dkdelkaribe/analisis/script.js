(() => {
  const findings = document.querySelectorAll('.finding');

  findings.forEach((finding) => {
    const button = finding.querySelector('button');
    const panel = finding.querySelector('.finding-panel');

    button.addEventListener('click', () => {
      const willOpen = !finding.classList.contains('is-open');

      findings.forEach((item) => {
        item.classList.remove('is-open');
        item.querySelector('button').setAttribute('aria-expanded', 'false');
        item.querySelector('.finding-panel').hidden = true;
      });

      if (willOpen) {
        finding.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    });
  });

  const beforeButton = document.querySelector('#before-button');
  const afterButton = document.querySelector('#after-button');
  const beforeScene = document.querySelector('#before-scene');
  const afterScene = document.querySelector('#after-scene');
  const siteFrame = document.querySelector('#site-frame');

  function showMode(mode) {
    const isAfter = mode === 'after';
    beforeScene.hidden = isAfter;
    afterScene.hidden = !isAfter;
    beforeButton.classList.toggle('is-active', !isAfter);
    afterButton.classList.toggle('is-active', isAfter);
    beforeButton.setAttribute('aria-selected', String(!isAfter));
    afterButton.setAttribute('aria-selected', String(isAfter));

    if (isAfter && siteFrame.src === 'about:blank') {
      siteFrame.src = siteFrame.dataset.src;
    }

    if (isAfter) requestAnimationFrame(resizeDevice);
  }

  beforeButton.addEventListener('click', () => showMode('before'));
  afterButton.addEventListener('click', () => showMode('after'));

  const device = document.querySelector('#device');
  const deviceScreen = document.querySelector('#device-screen');
  const deviceButtons = document.querySelectorAll('[data-device]');
  const devices = {
    mobile: { width: 390, height: 760, max: 410 },
    tablet: { width: 834, height: 900, max: 670 },
    desktop: { width: 1280, height: 760, max: 980 }
  };
  let currentDevice = 'mobile';

  function resizeDevice() {
    if (afterScene.hidden) return;
    const config = devices[currentDevice];
    const available = Math.min(config.max, Math.max(270, afterScene.clientWidth - 54));
    const maxHeight = window.innerHeight * .68;
    const scale = Math.min(available / config.width, maxHeight / config.height);

    siteFrame.style.width = `${config.width}px`;
    siteFrame.style.height = `${config.height}px`;
    siteFrame.style.transform = `scale(${scale})`;
    deviceScreen.style.width = `${Math.round(config.width * scale)}px`;
    deviceScreen.style.height = `${Math.round(config.height * scale)}px`;
  }

  deviceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentDevice = button.dataset.device;
      device.className = `device ${currentDevice}`;
      deviceButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      resizeDevice();
    });
  });

  window.addEventListener('resize', resizeDevice, { passive: true });

  const tourButtons = document.querySelectorAll('.tour-tabs button');
  const tourNote = document.querySelector('#tour-note');

  tourButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tourButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      siteFrame.src = button.dataset.url;
      tourNote.textContent = button.dataset.note;
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const floatingBar = document.querySelector('#floating-bar');
  const hero = document.querySelector('.hero');
  const barObserver = new IntersectionObserver(([entry]) => {
    floatingBar.classList.toggle('is-visible', !entry.isIntersecting);
  }, { threshold: .05 });
  barObserver.observe(hero);

  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  let lastTrigger = null;

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('locked');
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      lastTrigger = trigger;
      lightboxImage.src = trigger.dataset.lightbox;
      lightboxImage.alt = trigger.dataset.caption;
      lightboxCaption.textContent = trigger.dataset.caption;
      lightbox.hidden = false;
      document.body.classList.add('locked');
      lightboxClose.focus();
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
})();
