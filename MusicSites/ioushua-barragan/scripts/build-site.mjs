import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'content', 'site.json');
const SRC_CSS = path.join(ROOT, 'src', 'site.css');
const SRC_JS = path.join(ROOT, 'src', 'site.js');
const ASSETS_DIR = path.join(ROOT, 'assets');
const DIST_DIR = path.join(ROOT, 'dist');
const EXTRA_PUBLIC_DIRS = ['analisis', 'rhoman'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDir(source, target) {
  if (!fs.existsSync(source)) return;
  ensureDir(target);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rich(value = '') {
  return esc(value).replaceAll('&lt;br&gt;', '<br>');
}

function attr(value = '') {
  return esc(value);
}

function externalAttrs(href = '') {
  return /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener"' : '';
}

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function renderBrand(data) {
  return `${esc(data.artist.brandFirst)} <span>${esc(data.artist.brandLast)}</span>`;
}

function renderSchema(data) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.artist.name,
    alternateName: data.artist.alternateName,
    jobTitle: data.artist.jobTitle,
    homeLocation: { '@type': 'Place', name: data.artist.location },
    memberOf: data.schema.memberOf.map((name) => ({ '@type': 'MusicGroup', name })),
    sameAs: data.schema.sameAs
  };
  return JSON.stringify(schema, null, 2).replaceAll('<', '\\u003c');
}

function renderNav(data) {
  return `
<nav>
  <div class="wrap nav-inner">
    <a class="nav-brand" href="#top">${renderBrand(data)}</a>
    <ul class="nav-links">
      ${data.navigation.map((item) => `<li><a href="${attr(item.href)}">${esc(item.label)}</a></li>`).join('\n      ')}
    </ul>
    <a class="nav-cta" href="#booking">Booking</a>
  </div>
</nav>`;
}

function renderHero(data) {
  const hero = data.hero;
  const line2 = esc(hero.title.line2).replace(
    esc(hero.title.emphasis),
    `<em>${esc(hero.title.emphasis)}</em>`
  );
  const slides = hero.slides.map((slide, index) => {
    const active = index === 0 ? ' active' : '';
    const style = `--slide-img: url('${attr(slide.image)}'); background-image: url('${attr(slide.image)}');`;
    return `<div class="hero-slide${active}" style="${style}" aria-label="${attr(slide.label || '')}" aria-hidden="true"></div>`;
  }).join('\n  ');

  return `
<header class="hero" id="top">
  ${slides}
  <div class="hero-strings" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="hero-eq" id="heroEq" aria-hidden="true"></div>
  <div class="wrap hero-inner">
    <p class="eyebrow"><span class="clef" aria-hidden="true">𝄢</span> ${esc(hero.eyebrow)}</p>
    <h1>
      <span class="beat beat-1">${esc(hero.title.line1)}</span>
      <span class="beat beat-2">${line2}</span>
    </h1>
    <p class="hero-sub">${esc(hero.subtitle)}</p>
    <div class="hero-ctas">
      ${hero.ctas.map((cta) => `<a class="btn btn-${cta.style === 'primary' ? 'primary' : 'ghost'}" href="${attr(cta.href)}"${externalAttrs(cta.href)}>${esc(cta.label)}</a>`).join('\n      ')}
    </div>
    <div class="hero-staff">
      <span class="staff-lines" aria-hidden="true"></span>
      ${hero.badges.map((badge, index) => `<span class="badge nota-${(index % 3) + 1}"><b>${esc(badge.title)}</b> · ${esc(badge.text)}</span>`).join('\n      ')}
    </div>
  </div>
</header>`;
}

function renderBio(data) {
  const bio = data.bio;
  return `
<section id="bio">
  <div class="wrap bio-grid">
    <div class="reveal">
      <p class="eyebrow">${esc(bio.eyebrow)}</p>
      <h2 class="section-title">${rich(bio.title)}</h2>
      ${bio.paragraphs.slice(0, 1).map((text) => `<p class="lead">${esc(text)}</p>`).join('\n      ')}
      <blockquote class="bio-quote">${esc(bio.quote)}</blockquote>
      ${bio.paragraphs.slice(1).map((text) => `<p class="lead">${esc(text)}</p>`).join('\n      ')}
    </div>
    <div class="bio-photo reveal">
      <img src="${attr(bio.image)}" alt="${attr(bio.imageAlt)}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
    </div>
  </div>
</section>`;
}

function renderTimeline(data) {
  const timeline = data.timeline;
  return `
<section id="trayectoria" style="background: var(--panel);">
  <div class="wrap">
    <p class="eyebrow reveal">${esc(timeline.eyebrow)}</p>
    <h2 class="section-title reveal">${rich(timeline.title)}</h2>
    <div class="timeline">
      ${timeline.items.map((item) => `
      <div class="t-item reveal">
        <span class="t-year">${esc(item.period)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
        ${(item.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}
      </div>`).join('\n')}
    </div>
  </div>
</section>`;
}

function renderMusic(data) {
  const music = data.music;
  return `
<section id="musica">
  <img class="vinyl" src="${attr(music.vinylImage)}" alt="" aria-hidden="true">
  <div class="wrap">
    <p class="eyebrow reveal"><span class="mini-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>${esc(music.eyebrow)}</p>
    <h2 class="section-title reveal">${esc(music.title)}</h2>
    <p class="lead reveal">${esc(music.lead)}</p>
    <div class="media-grid">
      ${music.videos.map((video) => `
      <div class="media-card reveal">
        <button class="yt-facade" data-yt="${attr(video.youtubeId)}" data-title="${attr(video.title)}" aria-label="Reproducir: ${attr(video.title)}">
          <img src="${attr(video.thumbnail)}" alt="${attr(video.alt)}" loading="lazy">
          <span class="yt-play" aria-hidden="true">▶</span>
        </button>
        <div class="media-meta">
          <h3>${esc(video.title)}</h3>
          <p>${esc(video.subtitle)}</p>
        </div>
      </div>`).join('\n')}
    </div>
    <div class="listen-row">
      ${music.links.map((link) => `
      <a class="listen-link reveal" href="${attr(link.href)}"${externalAttrs(link.href)}>
        <span class="icon">${esc(link.icon || '')}</span>
        <span><span class="t">${esc(link.title)}</span><br><span class="s">${esc(link.subtitle)}</span></span>
      </a>`).join('\n')}
    </div>
  </div>
</section>`;
}

function renderEvents(data) {
  const events = data.events;
  return `
<section id="fechas" class="dates">
  <div class="wrap">
    <p class="eyebrow reveal">${esc(events.eyebrow)}</p>
    <h2 class="section-title reveal">${esc(events.title)}</h2>
    <p class="lead reveal">${esc(events.lead)} <a href="#booking" style="color: var(--amber);">Agenda una fecha</a>.</p>
    <div style="margin-top: 40px;">
      ${events.items.map((event) => {
        const statusClass = classNames('date-status', event.statusStyle);
        const status = event.href
          ? `<a class="${statusClass}" href="${attr(event.href)}"${externalAttrs(event.href)}>${esc(event.status)}</a>`
          : `<span class="${statusClass}">${esc(event.status)}</span>`;
        return `
      <div class="date-row reveal">
        <div class="date-cal"><div class="d">${esc(event.day)}</div><div class="m">${esc(event.month)}</div></div>
        <div class="date-info">
          <h3>${esc(event.title)}</h3>
          <p>${esc(event.description)}</p>
        </div>
        ${status}
      </div>`;
      }).join('\n')}
    </div>
  </div>
</section>`;
}

function renderGallery(data) {
  const gallery = data.gallery;
  return `
<section id="galeria">
  <div class="wrap">
    <p class="eyebrow reveal">${esc(gallery.eyebrow)}</p>
    <h2 class="section-title reveal">${rich(gallery.title)}</h2>
    <div class="gallery-grid">
      ${gallery.images.map((image) => `
      <div class="${classNames('g-item', image.variant, 'reveal')}">
        <img src="${attr(image.src)}" alt="${attr(image.alt)}" loading="lazy">
        <span class="g-cap">${esc(image.caption)}</span>
      </div>`).join('\n')}
    </div>
    <div class="reels-row">
      ${gallery.reels.map((reel) => `
      <div class="reel reveal">
        <video src="${attr(reel.src)}" controls playsinline preload="metadata"></video>
        <span class="g-cap">${esc(reel.caption)}</span>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;
}

function renderServices(data) {
  const services = data.services;
  return `
<section id="servicios">
  <div class="wrap">
    <p class="eyebrow reveal">${esc(services.eyebrow)}</p>
    <h2 class="section-title reveal">${esc(services.title)}</h2>
    <div class="services-grid">
      ${services.items.map((service) => `
      <div class="service reveal" data-glyph="${attr(service.glyph)}">
        <span class="num">${esc(service.number)}</span>
        <h3>${esc(service.title)}</h3>
        <p>${esc(service.description)}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;
}

function renderBooking(data) {
  const booking = data.booking;
  const whatsappHref = `https://wa.me/${encodeURIComponent(booking.whatsappNumber)}?text=${encodeURIComponent(booking.whatsappText)}`;
  return `
<section id="booking" class="booking">
  <div class="wrap">
    <p class="eyebrow reveal"><span class="mini-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>${esc(booking.eyebrow)}</p>
    <h2 class="section-title reveal">${esc(booking.title)}</h2>
    <p class="lead reveal">${esc(booking.lead)}</p>
    <div class="booking-ctas reveal">
      <a class="btn btn-primary" href="${attr(whatsappHref)}" target="_blank" rel="noopener">WhatsApp directo</a>
      <a class="btn btn-ghost" href="mailto:${attr(booking.email)}">${esc(booking.emailLabel)}</a>
      <a class="btn btn-ghost" href="${attr(booking.instagram)}" target="_blank" rel="noopener">${esc(booking.instagramLabel)}</a>
    </div>
  </div>
</section>`;
}

function renderFooter(data) {
  return `
<footer>
  <div class="wrap foot-inner">
    <a class="nav-brand" href="#top">${renderBrand(data)}</a>
    <ul class="foot-links">
      ${data.footerLinks.map((link) => `<li><a href="${attr(link.href)}"${externalAttrs(link.href)}>${esc(link.label)}</a></li>`).join('\n      ')}
    </ul>
    <p class="foot-note">${esc(data.artist.footerNote)}</p>
  </div>
</footer>`;
}

function renderSpotify(data) {
  return `
<div class="spotify-panel" id="spotifyPanel" aria-label="${attr(data.spotify.panelTitle)}"></div>
<button class="spotify-fab" id="spotifyFab" aria-expanded="false" aria-label="${attr(data.spotify.label)}">
  <svg viewBox="0 0 496 512" aria-hidden="true"><path fill="currentColor" d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/></svg>
  <span>${esc(data.spotify.label)}</span>
</button>`;
}

function renderIndex(data) {
  const settings = {
    spotifyEmbedUrl: data.spotify.embedUrl,
    spotifyPanelTitle: data.spotify.panelTitle
  };
  return `<!DOCTYPE html>
<html lang="${attr(data.meta.lang)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(data.meta.title)}</title>
<meta name="description" content="${attr(data.meta.description)}">
<meta property="og:title" content="${attr(data.meta.ogTitle)}">
<meta property="og:description" content="${attr(data.meta.ogDescription)}">
<meta property="og:type" content="${attr(data.meta.ogType)}">
<meta property="og:locale" content="${attr(data.meta.ogLocale)}">
<meta property="og:image" content="${attr(data.meta.ogImage)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<script type="application/ld+json">
${renderSchema(data)}
</script>
</head>
<body>
${renderNav(data)}
${renderHero(data)}
${renderBio(data)}
<div class="staff-divider" aria-hidden="true"><span class="sd-note">♪</span></div>
${renderTimeline(data)}
${renderMusic(data)}
<div class="staff-divider" aria-hidden="true"><span class="sd-note">♫</span></div>
${renderEvents(data)}
${renderGallery(data)}
${renderServices(data)}
<div class="staff-divider" aria-hidden="true"><span class="sd-note">♩</span></div>
${renderBooking(data)}
${renderFooter(data)}
${renderSpotify(data)}
<script>window.SITE_SETTINGS = ${JSON.stringify(settings).replaceAll('<', '\\u003c')};</script>
<script src="assets/site.js" defer></script>
</body>
</html>
`;
}

function validateLocalPath(warnings, fieldName, value) {
  if (!value || /^https?:\/\//.test(value) || value.startsWith('#') || value.startsWith('mailto:')) return;
  const absolute = path.join(ROOT, value);
  if (!absolute.startsWith(ROOT) || !fs.existsSync(absolute)) {
    warnings.push(`${fieldName}: no existe ${value}`);
  }
}

function validate(data) {
  const warnings = [];
  const required = [
    ['meta.title', data.meta?.title],
    ['meta.description', data.meta?.description],
    ['artist.name', data.artist?.name],
    ['hero.title.line1', data.hero?.title?.line1],
    ['booking.whatsappNumber', data.booking?.whatsappNumber]
  ];
  for (const [field, value] of required) {
    if (!value) warnings.push(`${field}: requerido`);
  }

  validateLocalPath(warnings, 'meta.ogImage', data.meta?.ogImage);
  for (const [index, slide] of (data.hero?.slides || []).entries()) validateLocalPath(warnings, `hero.slides[${index}].image`, slide.image);
  validateLocalPath(warnings, 'bio.image', data.bio?.image);
  validateLocalPath(warnings, 'music.vinylImage', data.music?.vinylImage);
  for (const [index, event] of (data.events?.items || []).entries()) validateLocalPath(warnings, `events.items[${index}].href`, event.href);
  for (const [index, image] of (data.gallery?.images || []).entries()) validateLocalPath(warnings, `gallery.images[${index}].src`, image.src);
  for (const [index, reel] of (data.gallery?.reels || []).entries()) validateLocalPath(warnings, `gallery.reels[${index}].src`, reel.src);
  return warnings;
}

export function buildSite() {
  const data = readJson(CONTENT_PATH);
  const warnings = validate(data);

  copyFile(SRC_CSS, path.join(ASSETS_DIR, 'site.css'));
  copyFile(SRC_JS, path.join(ASSETS_DIR, 'site.js'));

  const html = renderIndex(data);
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);

  ensureDir(DIST_DIR);
  copyFile(path.join(ROOT, 'index.html'), path.join(DIST_DIR, 'index.html'));
  copyDir(ASSETS_DIR, path.join(DIST_DIR, 'assets'));
  for (const dir of EXTRA_PUBLIC_DIRS) {
    if (fs.existsSync(path.join(ROOT, dir))) {
      copyDir(path.join(ROOT, dir), path.join(DIST_DIR, dir));
    }
  }

  const report = {
    builtAt: new Date().toISOString(),
    output: ['index.html', 'dist/index.html', 'dist/assets/', ...EXTRA_PUBLIC_DIRS.map((dir) => `dist/${dir}/`)],
    warnings
  };
  fs.writeFileSync(path.join(ROOT, 'dist', 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildSite();
  console.log(`Build complete: ${report.output.join(', ')}`);
  if (report.warnings.length) {
    console.log('Warnings:');
    for (const warning of report.warnings) console.log(`- ${warning}`);
  }
}
