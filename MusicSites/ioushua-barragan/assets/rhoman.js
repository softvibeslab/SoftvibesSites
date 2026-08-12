(function () {
  document.querySelectorAll('.yt-facade').forEach((button) => {
    button.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.yt}?autoplay=1`;
      iframe.title = button.dataset.title || 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      button.replaceWith(iframe);
    });
  });

  const revealEls = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  revealEls.forEach((el) => observer.observe(el));
})();
