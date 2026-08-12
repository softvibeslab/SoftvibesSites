(function () {
  const settings = window.SITE_SETTINGS || {};

  const fab = document.getElementById('spotifyFab');
  const panel = document.getElementById('spotifyPanel');
  if (fab && panel) {
    fab.addEventListener('click', () => {
      if (!panel.querySelector('iframe') && settings.spotifyEmbedUrl) {
        const sp = document.createElement('iframe');
        sp.src = settings.spotifyEmbedUrl;
        sp.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        sp.loading = 'lazy';
        sp.title = settings.spotifyPanelTitle || 'Playlist en Spotify';
        panel.appendChild(sp);
      }
      const abierto = panel.classList.toggle('open');
      fab.setAttribute('aria-expanded', abierto);
    });
  }

  const eq = document.getElementById('heroEq');
  if (eq) {
    for (let i = 0; i < 44; i += 1) {
      const bar = document.createElement('span');
      const centro = Math.abs(i - 22) / 22;
      bar.style.setProperty('--h', (0.12 + Math.random() * 0.3).toFixed(2));
      bar.style.setProperty('--h2', (0.45 + Math.random() * 0.5 * (1 - centro * 0.5)).toFixed(2));
      bar.style.setProperty('--d', `${(0.9 + Math.random() * 1.4).toFixed(2)}s`);
      bar.style.setProperty('--delay', `${(Math.random() * 1.2).toFixed(2)}s`);
      eq.appendChild(bar);
    }
  }

  document.querySelectorAll('.yt-facade').forEach((btn) => {
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1`;
      iframe.title = btn.dataset.title || 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });

  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 7000);
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => obs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }
})();
