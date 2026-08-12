const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(willOpen));
  menu.classList.toggle('is-open', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
});

menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('[data-reveal]');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty('--reveal-delay', `${entry.target.dataset.delay || 0}ms`);
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .13 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const mainImage = gallery.querySelector('[data-gallery-main]');
  const thumbnails = [...gallery.querySelectorAll('[data-gallery-src]')];

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener('click', () => {
      if (thumbnail.classList.contains('is-active')) return;

      const nextImage = new Image();
      mainImage.classList.add('is-swapping');
      nextImage.addEventListener('load', () => {
        mainImage.src = thumbnail.dataset.gallerySrc;
        mainImage.alt = thumbnail.dataset.galleryAlt;
        thumbnails.forEach((item) => {
          const isCurrent = item === thumbnail;
          item.classList.toggle('is-active', isCurrent);
          item.setAttribute('aria-pressed', String(isCurrent));
        });
        requestAnimationFrame(() => mainImage.classList.remove('is-swapping'));
      }, { once: true });
      nextImage.src = thumbnail.dataset.gallerySrc;
    });
  });
});

const tourModal = document.querySelector('#tour-modal');
const tourForm = document.querySelector('[data-tour-form]');

if (tourModal && tourForm) {
  const closeButton = tourModal.querySelector('[data-close-tour]');
  const vehicleField = tourForm.querySelector('[name="vehiculo"]');
  const dateField = tourForm.querySelector('[name="fecha"]');
  const result = tourModal.querySelector('[data-tour-result]');
  const messageField = tourModal.querySelector('[data-tour-message]');
  const listingLink = tourModal.querySelector('[data-open-listing]');
  const copyButton = tourModal.querySelector('[data-copy-tour]');
  const resetButton = tourModal.querySelector('[data-reset-tour]');
  const status = tourModal.querySelector('[data-tour-status]');
  let lastFocused = null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  dateField.min = `${year}-${month}-${day}`;

  function showForm() {
    tourForm.hidden = false;
    result.hidden = true;
    status.textContent = '';
  }

  function openTour(trigger) {
    lastFocused = trigger || document.activeElement;
    showForm();
    if (trigger?.dataset.vehicle) vehicleField.value = trigger.dataset.vehicle;
    tourModal.hidden = false;
    document.body.classList.add('tour-open');
    requestAnimationFrame(() => tourForm.querySelector('input, select')?.focus());
  }

  function closeTour() {
    tourModal.hidden = true;
    document.body.classList.remove('tour-open');
    lastFocused?.focus();
  }

  document.querySelectorAll('[data-open-tour]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      closeMenu();
      openTour(trigger);
    });
  });

  closeButton.addEventListener('click', closeTour);
  tourModal.addEventListener('click', (event) => {
    if (event.target === tourModal) closeTour();
  });

  document.addEventListener('keydown', (event) => {
    if (tourModal.hidden) return;
    if (event.key === 'Escape') {
      closeTour();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...tourModal.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')]
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  tourForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const requiredFields = [...tourForm.querySelectorAll('[required]')];
    let firstInvalid = null;

    requiredFields.forEach((field) => {
      const error = tourForm.querySelector(`[data-error-for="${field.id}"]`);
      const isValid = field.value.trim().length > 0 && field.checkValidity();
      field.setAttribute('aria-invalid', String(!isValid));
      if (error) error.textContent = isValid ? '' : 'Este campo es necesario.';
      if (!isValid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const data = new FormData(tourForm);
    const selectedOption = vehicleField.options[vehicleField.selectedIndex];
    const lines = [
      `Hola, quiero agendar un recorrido para conocer el ${data.get('vehiculo')}.`,
      '',
      `Nombre: ${data.get('nombre')}`,
      `WhatsApp: ${data.get('telefono')}`,
      `Fecha preferida: ${data.get('fecha')}`,
      `Horario: ${data.get('horario')}`,
      `Uso: ${data.get('uso') || 'Por definir'}`,
      '',
      '¿Me confirman disponibilidad, ubicación y horario?'
    ];

    messageField.value = lines.join('\n');
    listingLink.href = selectedOption.dataset.listing;
    tourForm.hidden = true;
    result.hidden = false;
    messageField.focus();
  });

  copyButton.addEventListener('click', async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(messageField.value);
      copied = true;
    } catch (error) {
      messageField.select();
      try {
        copied = document.execCommand?.('copy') === true;
      } catch (fallbackError) {
        copied = false;
      }
    }
    status.textContent = copied
      ? 'Solicitud copiada. Abre la publicación y pégala en el chat del vendedor.'
      : 'Selecciona el texto, cópialo y pégalo en el chat de la publicación.';
  });

  resetButton.addEventListener('click', () => {
    showForm();
    tourForm.querySelector('input')?.focus();
  });
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();
