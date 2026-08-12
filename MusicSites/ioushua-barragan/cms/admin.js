const state = {
  content: null,
  media: { assets: [], media: [] },
  currentPanel: 'live',
  mediaTargetPath: null,
  legacyContent: '',
  legacyPath: '',
  dirty: false,
  saving: false,
  building: false,
  mediaFilterType: 'all',
  selectedUploadFiles: [],
  liveSection: 'hero',
  liveViewport: 'desktop',
  liveCollection: {},
  liveSelectedAsset: '',
  liveFrameReady: false,
  guideQuestion: ''
};

const sectionMeta = {
  meta: { label: 'SEO', group: 'Contenido', icon: 'SE', summary: 'Título, descripción, Open Graph y cómo aparece el sitio al compartirse.' },
  artist: { label: 'Artista', group: 'Contenido', icon: 'AR', summary: 'Nombre público, ubicación, rol profesional y nota del footer.' },
  schema: { label: 'Schema', group: 'Contenido', icon: 'SC', summary: 'Datos estructurados para buscadores y plataformas.' },
  navigation: { label: 'Navegación', group: 'Contenido', icon: 'NV', summary: 'Orden y etiquetas del menú principal.' },
  hero: { label: 'Hero', group: 'Contenido', icon: 'HE', summary: 'Primera impresión: slides, titular, CTAs y credenciales visibles.' },
  bio: { label: 'Bio', group: 'Contenido', icon: 'BI', summary: 'Historia corta, quote editorial y foto principal.' },
  timeline: { label: 'Trayectoria', group: 'Contenido', icon: 'TR', summary: 'Hitos profesionales ordenados como movimientos de carrera.' },
  music: { label: 'Música', group: 'Contenido', icon: 'MU', summary: 'Videos, enlaces de escucha y playlist destacada.' },
  events: { label: 'Fechas', group: 'Contenido', icon: 'FE', summary: 'Próximos shows y fechas presentadas.' },
  gallery: { label: 'Galería', group: 'Contenido', icon: 'GA', summary: 'Fotos, captions, reels y assets visuales publicados.' },
  services: { label: 'Servicios', group: 'Contenido', icon: 'SV', summary: 'Formatos contratables y servicios de booking.' },
  booking: { label: 'Booking', group: 'Contenido', icon: 'BK', summary: 'WhatsApp, correo, Instagram y copy de contacto.' },
  footerLinks: { label: 'Footer', group: 'Contenido', icon: 'FO', summary: 'Links externos al final del sitio.' },
  spotify: { label: 'Spotify', group: 'Contenido', icon: 'SP', summary: 'Playlist flotante y reproductor embebido.' }
};

const guideProfiles = {
  meta: { form: 'Master', lane: 'SEO', color: 'amber', mission: 'Afinar título, descripción y Open Graph como master final para buscadores y redes.' },
  artist: { form: 'Lead sheet', lane: 'Identidad', color: 'cyan', mission: 'Definir nombre, instrumento, territorio y crédito final con precisión de press kit.' },
  schema: { form: 'Liner notes', lane: 'Schema', color: 'steel', mission: 'Convertir proyectos y perfiles en datos estructurados confiables.' },
  navigation: { form: 'Setlist', lane: 'Navegación', color: 'mint', mission: 'Ordenar el recorrido como un set de club: claro, breve y sin cortes raros.' },
  hero: { form: 'Intro', lane: 'Hero', color: 'coral', mission: 'Abrir con identidad, instrumento, territorio y una promesa escénica clara.' },
  bio: { form: 'Tema A', lane: 'Bio', color: 'blue', mission: 'Contar historia sin sonar a CV: origen, sonido, proyectos y momento actual.' },
  timeline: { form: 'Movimientos', lane: 'Trayectoria', color: 'brass', mission: 'Ordenar logros como movimientos de una obra: fecha, escenario, proyecto y peso artístico.' },
  music: { form: 'Solo', lane: 'Música', color: 'violet', mission: 'Llevar rápido a video, playlist o evidencia sonora de alta confianza.' },
  events: { form: 'Puente', lane: 'Fechas', color: 'rose', mission: 'Mostrar actividad real y convertir fechas en prueba social.' },
  gallery: { form: 'Textura', lane: 'Galería', color: 'green', mission: 'Ordenar fotos y reels como un press kit escaneable.' },
  services: { form: 'Coro', lane: 'Servicios', color: 'amber', mission: 'Hacer contratables los formatos: show, sesión, trio/quinteto, dirección musical.' },
  booking: { form: 'Outro', lane: 'Booking', color: 'mint', mission: 'Cerrar con contacto directo, mensaje listo y próximo paso sin fricción.' },
  footerLinks: { form: 'Coda', lane: 'Footer', color: 'steel', mission: 'Cerrar con enlaces limpios que mantengan continuidad de marca y confianza.' },
  spotify: { form: 'Needle drop', lane: 'Spotify', color: 'green', mission: 'Dejar la escucha continua a un click, con embed y link externo consistentes.' }
};

const fieldHints = {
  title: 'Mantén el texto específico y fácil de escanear.',
  description: 'Útil para SEO, tarjetas sociales o contexto de una card.',
  subtitle: 'Apoya el título sin repetirlo.',
  lead: 'Texto breve que abre la sección.',
  href: 'Puede ser una ruta local, un ancla o una URL externa.',
  src: 'Ruta del asset publicado.',
  image: 'Usa una imagen de assets/ para publicar.',
  thumbnail: 'Puede ser una URL externa de YouTube o una ruta local.',
  whatsappNumber: 'Formato wa.me con país, sin espacios.',
  whatsappText: 'Mensaje prellenado para abrir la conversación.',
  email: 'Correo real de booking cuando esté disponible.'
};

const mediaFieldNames = ['image', 'src', 'thumbnail', 'ogimage', 'vinylimage'];
const $ = (selector) => document.querySelector(selector);
const scriptPath = document.currentScript ? new URL(document.currentScript.src).pathname : '/admin/admin.js';
const appBasePath = scriptPath.endsWith('/admin/admin.js') ? scriptPath.slice(0, -'/admin/admin.js'.length) : '';

function appUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appBasePath}${normalizedPath}` || '/';
}

const liveSections = {
  hero: {
    label: 'Hero',
    target: '#top',
    fields: [
      { label: 'Eyebrow', path: ['hero', 'eyebrow'], type: 'text' },
      { label: 'Título línea 1', path: ['hero', 'title', 'line1'], type: 'text' },
      { label: 'Título línea 2', path: ['hero', 'title', 'line2'], type: 'text' },
      { label: 'Palabra destacada', path: ['hero', 'title', 'emphasis'], type: 'text' },
      { label: 'Subtítulo', path: ['hero', 'subtitle'], type: 'textarea' },
      { label: 'Hero slide 1', path: ['hero', 'slides', 0, 'image'], type: 'media' },
      { label: 'Hero slide 2', path: ['hero', 'slides', 1, 'image'], type: 'media' },
      { label: 'CTA principal', path: ['hero', 'ctas', 0, 'label'], type: 'text' },
      { label: 'CTA secundario', path: ['hero', 'ctas', 1, 'label'], type: 'text' }
    ]
  },
  bio: {
    label: 'Bio',
    target: '#bio',
    fields: [
      { label: 'Título', path: ['bio', 'title'], type: 'textarea' },
      { label: 'Párrafo 1', path: ['bio', 'paragraphs', 0], type: 'textarea' },
      { label: 'Quote', path: ['bio', 'quote'], type: 'textarea' },
      { label: 'Párrafo 2', path: ['bio', 'paragraphs', 1], type: 'textarea' },
      { label: 'Foto bio', path: ['bio', 'image'], type: 'media' },
      { label: 'Alt foto', path: ['bio', 'imageAlt'], type: 'text' }
    ]
  },
  music: {
    label: 'Música',
    target: '#musica',
    fields: [
      { label: 'Título sección', path: ['music', 'title'], type: 'text' },
      { label: 'Lead', path: ['music', 'lead'], type: 'textarea' },
      { label: 'Video 1 título', path: ['music', 'videos', 0, 'title'], type: 'text' },
      { label: 'Video 1 subtítulo', path: ['music', 'videos', 0, 'subtitle'], type: 'text' },
      { label: 'Video 2 título', path: ['music', 'videos', 1, 'title'], type: 'text' },
      { label: 'Video 2 subtítulo', path: ['music', 'videos', 1, 'subtitle'], type: 'text' }
    ]
  },
  events: {
    label: 'Fechas',
    target: '#fechas',
    fields: [
      { label: 'Título sección', path: ['events', 'title'], type: 'text' },
      { label: 'Lead', path: ['events', 'lead'], type: 'text' },
      { label: 'Fecha 1 título', path: ['events', 'items', 0, 'title'], type: 'text' },
      { label: 'Fecha 1 detalle', path: ['events', 'items', 0, 'description'], type: 'textarea' },
      { label: 'Fecha 2 título', path: ['events', 'items', 1, 'title'], type: 'text' },
      { label: 'Fecha 2 detalle', path: ['events', 'items', 1, 'description'], type: 'textarea' },
      { label: 'Flyer fecha 1', path: ['events', 'items', 0, 'href'], type: 'media' },
      { label: 'Flyer fecha 2', path: ['events', 'items', 1, 'href'], type: 'media' }
    ]
  },
  gallery: {
    label: 'Galería',
    target: '#galeria',
    fields: [
      { label: 'Título sección', path: ['gallery', 'title'], type: 'textarea' },
      { label: 'Foto 1', path: ['gallery', 'images', 0, 'src'], type: 'media' },
      { label: 'Caption foto 1', path: ['gallery', 'images', 0, 'caption'], type: 'text' },
      { label: 'Foto 2', path: ['gallery', 'images', 1, 'src'], type: 'media' },
      { label: 'Caption foto 2', path: ['gallery', 'images', 1, 'caption'], type: 'text' },
      { label: 'Reel 1', path: ['gallery', 'reels', 0, 'src'], type: 'media' },
      { label: 'Caption reel 1', path: ['gallery', 'reels', 0, 'caption'], type: 'text' }
    ]
  },
  services: {
    label: 'Servicios',
    target: '#servicios',
    fields: [
      { label: 'Título sección', path: ['services', 'title'], type: 'text' },
      { label: 'Servicio 1 título', path: ['services', 'items', 0, 'title'], type: 'text' },
      { label: 'Servicio 1 descripción', path: ['services', 'items', 0, 'description'], type: 'textarea' },
      { label: 'Servicio 2 título', path: ['services', 'items', 1, 'title'], type: 'text' },
      { label: 'Servicio 2 descripción', path: ['services', 'items', 1, 'description'], type: 'textarea' }
    ]
  },
  booking: {
    label: 'Booking',
    target: '#booking',
    fields: [
      { label: 'Título', path: ['booking', 'title'], type: 'text' },
      { label: 'Lead', path: ['booking', 'lead'], type: 'textarea' },
      { label: 'WhatsApp', path: ['booking', 'whatsappNumber'], type: 'text' },
      { label: 'Mensaje WhatsApp', path: ['booking', 'whatsappText'], type: 'textarea' },
      { label: 'Email', path: ['booking', 'email'], type: 'text' },
      { label: 'Etiqueta email', path: ['booking', 'emailLabel'], type: 'text' },
      { label: 'Etiqueta Instagram', path: ['booking', 'instagramLabel'], type: 'text' }
    ]
  }
};

const liveTargetMap = {
  top: 'hero',
  bio: 'bio',
  musica: 'music',
  fechas: 'events',
  galeria: 'gallery',
  servicios: 'services',
  booking: 'booking'
};

const liveCollections = {
  hero: [
    { key: 'slides', label: 'Slides', path: ['hero', 'slides'], title: 'label', media: 'image' },
    { key: 'ctas', label: 'CTAs', path: ['hero', 'ctas'], title: 'label', subtitle: 'href' },
    { key: 'badges', label: 'Credenciales', path: ['hero', 'badges'], title: 'title', subtitle: 'text' }
  ],
  music: [
    { key: 'videos', label: 'Videos', path: ['music', 'videos'], title: 'title', subtitle: 'subtitle', media: 'thumbnail' }
  ],
  events: [
    { key: 'items', label: 'Fechas', path: ['events', 'items'], title: 'title', subtitle: 'date', media: 'href' }
  ],
  gallery: [
    { key: 'images', label: 'Fotos', path: ['gallery', 'images'], title: 'caption', subtitle: 'alt', media: 'src' },
    { key: 'reels', label: 'Reels', path: ['gallery', 'reels'], title: 'caption', media: 'src' }
  ],
  services: [
    { key: 'items', label: 'Servicios', path: ['services', 'items'], title: 'title', subtitle: 'description' }
  ]
};

const liveInlineBindings = {
  hero: [
    { selector: '.hero h1 .beat-1', path: ['hero', 'title', 'line1'] },
    { selector: '.hero-sub', path: ['hero', 'subtitle'] }
  ],
  bio: [
    { selector: '#bio .section-title', path: ['bio', 'title'], rich: true },
    { selector: '#bio .lead', index: 0, path: ['bio', 'paragraphs', 0] },
    { selector: '#bio .bio-quote', path: ['bio', 'quote'] },
    { selector: '#bio .lead', index: 1, path: ['bio', 'paragraphs', 1] }
  ],
  music: [
    { selector: '#musica .section-title', path: ['music', 'title'] },
    { selector: '#musica .lead', path: ['music', 'lead'] },
    { selector: '#musica .media-card .media-meta h3', index: 0, path: ['music', 'videos', 0, 'title'] },
    { selector: '#musica .media-card .media-meta p', index: 0, path: ['music', 'videos', 0, 'subtitle'] },
    { selector: '#musica .media-card .media-meta h3', index: 1, path: ['music', 'videos', 1, 'title'] },
    { selector: '#musica .media-card .media-meta p', index: 1, path: ['music', 'videos', 1, 'subtitle'] }
  ],
  events: [
    { selector: '#fechas .section-title', path: ['events', 'title'] },
    { selector: '#fechas .date-row .date-info h3', index: 0, path: ['events', 'items', 0, 'title'] },
    { selector: '#fechas .date-row .date-info p', index: 0, path: ['events', 'items', 0, 'description'] },
    { selector: '#fechas .date-row .date-info h3', index: 1, path: ['events', 'items', 1, 'title'] },
    { selector: '#fechas .date-row .date-info p', index: 1, path: ['events', 'items', 1, 'description'] }
  ],
  gallery: [
    { selector: '#galeria .section-title', path: ['gallery', 'title'], rich: true },
    { selector: '#galeria .gallery-grid .g-item .g-cap', index: 0, path: ['gallery', 'images', 0, 'caption'] },
    { selector: '#galeria .gallery-grid .g-item .g-cap', index: 1, path: ['gallery', 'images', 1, 'caption'] },
    { selector: '#galeria .reels-row .reel .g-cap', index: 0, path: ['gallery', 'reels', 0, 'caption'] }
  ],
  services: [
    { selector: '#servicios .section-title', path: ['services', 'title'] },
    { selector: '#servicios .service h3', index: 0, path: ['services', 'items', 0, 'title'] },
    { selector: '#servicios .service p', index: 0, path: ['services', 'items', 0, 'description'] },
    { selector: '#servicios .service h3', index: 1, path: ['services', 'items', 1, 'title'] },
    { selector: '#servicios .service p', index: 1, path: ['services', 'items', 1, 'description'] }
  ],
  booking: [
    { selector: '#booking .section-title', path: ['booking', 'title'] },
    { selector: '#booking .lead', path: ['booking', 'lead'] }
  ]
};

const api = async (path, options = {}) => {
  const res = await fetch(appUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function notice(message, type = 'ok') {
  const el = $('#notice');
  el.textContent = message;
  el.classList.toggle('error', type === 'error');
  el.classList.remove('hidden');
  clearTimeout(notice._timer);
  notice._timer = setTimeout(() => el.classList.add('hidden'), 5200);
}

function getByPath(root, path) {
  return path.reduce((acc, part) => acc?.[part], root);
}

function setByPath(root, path, value) {
  const last = path[path.length - 1];
  const parent = getByPath(root, path.slice(0, -1));
  parent[last] = value;
}

function pathKey(path) {
  return path.join('.');
}

function markDirty(isDirty = true) {
  state.dirty = isDirty;
  updateChrome();
}

function updateChrome() {
  const dot = $('#dirtyDot');
  const text = $('#dirtyText');
  const save = $('#saveBtn');
  const build = $('#buildBtn');
  if (!dot || !text) return;

  dot.classList.toggle('dirty', state.dirty || state.saving || state.building);
  dot.classList.toggle('error', false);
  if (state.building) text.textContent = 'Publicando cambios';
  else if (state.saving) text.textContent = 'Guardando contenido';
  else text.textContent = state.dirty ? 'Cambios sin guardar' : 'Todo guardado';

  if (save) {
    save.disabled = state.saving || state.building;
    save.textContent = state.saving ? 'Guardando...' : 'Guardar sesión';
  }
  if (build) {
    build.disabled = state.saving || state.building;
    build.textContent = state.building ? 'Publicando...' : 'Publicar';
  }

  const meta = $('#topMeta');
  if (meta && state.content) {
    const counts = getCounts();
    const guide = getGlobalGuide();
    meta.innerHTML = `
      <span class="metric-chip"><b>${guide.score}</b> score IA</span>
      <span class="metric-chip"><b>4/4</b> EPK</span>
      <span class="metric-chip"><b>${counts.events}</b> fechas</span>
      <span class="metric-chip"><b>${counts.media}</b> media</span>
    `;
  }
}

function setPanelTitle(title, eyebrow = 'Editor local') {
  $('#panelTitle').textContent = title;
  $('#panelEyebrow').textContent = eyebrow;
}

function getCounts() {
  if (!state.content) return { sections: 0, events: 0, media: 0 };
  return {
    sections: Object.keys(sectionMeta).length,
    events: state.content.events?.items?.length || 0,
    media: (state.media.assets?.length || 0) + (state.media.media?.length || 0)
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function filledValue(value) {
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return String(value ?? '').trim().length > 0;
}

function collectSectionStats(value, stats = { leaves: 0, filled: 0, arrays: 0, links: 0, media: 0, chars: 0 }) {
  if (Array.isArray(value)) {
    stats.arrays += 1;
    value.forEach((item) => collectSectionStats(item, stats));
    return stats;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((child) => collectSectionStats(child, stats));
    return stats;
  }
  stats.leaves += 1;
  if (filledValue(value)) stats.filled += 1;
  if (typeof value === 'string') {
    stats.chars += value.trim().length;
    if (/^https?:\/\//.test(value) || value.startsWith('#')) stats.links += 1;
    if (/^(assets|media)\//.test(value) || /\.(png|jpe?g|webp|gif|mp4|mov|mp3|wav)$/i.test(value)) stats.media += 1;
  }
  return stats;
}

function sectionStats(sectionKey) {
  return collectSectionStats(state.content?.[sectionKey]);
}

function sectionCompletion(sectionKey) {
  const section = liveSections[sectionKey];
  if (!state.content) return 0;
  const stats = sectionStats(sectionKey);
  const sectionScore = stats.leaves ? Math.round((stats.filled / stats.leaves) * 100) : 100;
  if (!section) return sectionScore;
  const fields = section.fields || [];
  if (!fields.length) return sectionScore;
  const filled = fields.filter((field) => filledValue(getByPath(state.content, field.path))).length;
  const liveScore = Math.round((filled / fields.length) * 100);
  return Math.round((liveScore * 0.65) + (sectionScore * 0.35));
}

function words(value = '') {
  return String(value).replace(/<br>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function guideCopySeed() {
  const artist = state.content?.artist || {};
  const booking = state.content?.booking || {};
  return {
    name: artist.name || 'el artista',
    role: artist.jobTitle || 'músico',
    location: artist.location || 'México',
    whatsapp: booking.whatsappNumber || '',
    bookingLead: booking.lead || ''
  };
}

function bookingMessageSuggestion() {
  const seed = guideCopySeed();
  return `Hola ${seed.name}, me interesa contratarte. Fecha tentativa: ____. Ciudad/venue: ____. Formato: concierto/sesión/evento privado. ¿Podemos revisar disponibilidad y presupuesto?`;
}

function heroSubtitleSuggestion() {
  const seed = guideCopySeed();
  return `${seed.name} — ${seed.role} desde ${seed.location}. EPK para festivales, venues, sesiones y colaboraciones con sonido de jazz contemporáneo.`;
}

function getSectionGuide(sectionKey = state.liveSection) {
  const profile = guideProfiles[sectionKey] || guideProfiles.hero;
  const content = state.content || {};
  const completion = sectionCompletion(sectionKey);
  const stats = sectionStats(sectionKey);
  const meta = sectionMeta[sectionKey] || { label: labelForKey(sectionKey) };
  const actions = [
    { label: `Abrir ${meta.label}`, type: 'jump', panel: sectionKey, section: sectionKey },
    { label: 'Copiar guía IA', type: 'copy', value: `${meta.label}: ${profile.mission}` }
  ];
  const checks = [
    { label: 'Campos', value: `${stats.filled}/${stats.leaves || 0}` },
    { label: 'Compás', value: completion >= 85 ? 'Listo' : completion >= 60 ? 'Afinar' : 'Pendiente' }
  ];
  let cue = profile.mission;

  if (sectionKey === 'meta') {
    const descriptionWords = words(content.meta?.description || '');
    const ogReady = content.meta?.ogTitle && content.meta?.ogDescription && content.meta?.ogImage;
    checks.push(
      { label: 'Descripción', value: `${descriptionWords} palabras` },
      { label: 'OG', value: ogReady ? 'Listo' : 'Incompleto' }
    );
    cue = descriptionWords > 34 ? 'El SEO tiene buen material; compacta la descripción para que funcione como un hook editorial en Google y redes.' : 'El SEO está cerca: asegúrate de incluir instrumento, ciudad, proyecto fuerte y booking.';
    actions.push(
      { label: 'Copiar fórmula SEO', type: 'copy', value: 'Nombre + instrumento + escena/ciudad + proyecto fuerte + booking para festivales, venues y sesiones.' }
    );
  } else if (sectionKey === 'artist') {
    const artist = content.artist || {};
    checks.push(
      { label: 'Nombre', value: artist.name ? 'Listo' : 'Pendiente' },
      { label: 'Territorio', value: artist.location ? 'Listo' : 'Pendiente' }
    );
    cue = 'La identidad debe leerse como ficha de festival: nombre público, instrumento, ciudad base y crédito final sin ruido.';
    actions.push(
      { label: 'Copiar identidad', type: 'copy', value: `${artist.name || 'Nombre artístico'} · ${artist.jobTitle || 'instrumento/rol'} · ${artist.location || 'ciudad base'}` }
    );
  } else if (sectionKey === 'schema') {
    const memberOf = content.schema?.memberOf || [];
    const sameAs = content.schema?.sameAs || [];
    checks.push(
      { label: 'Proyectos', value: `${memberOf.length}` },
      { label: 'Perfiles', value: `${sameAs.length}` }
    );
    cue = sameAs.length < 3 ? 'Schema necesita más señales externas: Instagram, streaming, Discogs, prensa o perfiles oficiales.' : 'Schema ya sostiene autoridad; revisa que cada link siga vivo y represente al músico.';
    actions.push(
      { label: 'Copiar checklist', type: 'copy', value: 'Schema: proyectos activos en memberOf; perfiles oficiales en sameAs; no incluir links rotos ni redes secundarias.' }
    );
  } else if (sectionKey === 'navigation') {
    const nav = content.navigation || [];
    checks.push(
      { label: 'Items', value: `${nav.length}` },
      { label: 'Anclas', value: `${nav.filter((item) => String(item.href || '').startsWith('#')).length}/${nav.length || 1}` }
    );
    cue = nav.length > 7 ? 'El setlist del menú está largo; deja solo las paradas que ayudan a escuchar, confiar y contratar.' : 'La navegación debe sentirse como setlist: Bio, Trayectoria, Música, Fechas, Galería, Servicios.';
    actions.push(
      { label: 'Copiar setlist', type: 'copy', value: 'Orden sugerido: Bio, Trayectoria, Música, Fechas, Galería, Servicios, Booking si se necesita cierre visible.' }
    );
  } else if (sectionKey === 'hero') {
    const subtitle = content.hero?.subtitle || '';
    const slides = content.hero?.slides || [];
    checks.push(
      { label: 'Gancho', value: words(subtitle) <= 34 ? 'Directo' : 'Largo' },
      { label: 'Slides', value: `${slides.filter((slide) => slide?.image).length}/${Math.max(slides.length, 2)}` }
    );
    if (words(subtitle) > 34) cue = 'El hero ya tiene identidad; conviene compactarlo para que abra como un buen primer compás.';
    actions.push(
      { label: 'Copiar subtítulo IA', type: 'copy', value: heroSubtitleSuggestion() },
      { label: 'Usar subtítulo IA', type: 'apply', path: ['hero', 'subtitle'], value: heroSubtitleSuggestion(), notice: 'Subtítulo del hero actualizado.' },
      { label: 'Ir a media', type: 'jump', panel: 'media' }
    );
  } else if (sectionKey === 'bio') {
    const paragraphs = content.bio?.paragraphs || [];
    const totalWords = paragraphs.reduce((total, paragraph) => total + words(paragraph), 0);
    checks.push(
      { label: 'Historia', value: `${totalWords} palabras` },
      { label: 'Foto', value: content.bio?.image ? 'Lista' : 'Pendiente' }
    );
    cue = totalWords > 115 ? 'La bio tiene sustancia; separa carrera, sonido y proyectos para que programadores la escaneen rápido.' : 'La bio puede sonar más editorial si suma una frase sobre sonido, escena y proyectos actuales.';
    actions.push(
      { label: 'Copiar guía bio', type: 'copy', value: 'Estructura sugerida: origen musical, instrumento/sonido, proyectos activos, escenarios relevantes y frase de contratación.' },
      { label: 'Abrir bio', type: 'jump', panel: 'bio' }
    );
  } else if (sectionKey === 'timeline') {
    const items = content.timeline?.items || [];
    const tagged = items.filter((item) => item.tags?.length).length;
    checks.push(
      { label: 'Movimientos', value: `${items.length}` },
      { label: 'Tags', value: `${tagged}/${items.length || 1}` }
    );
    cue = 'La trayectoria debe leerse como partitura: cada movimiento con fecha, escenario, colaborador y evidencia del salto artístico.';
    actions.push(
      { label: 'Copiar formato hito', type: 'copy', value: 'Mov. N · año — proyecto · venue/ciudad · colaborador clave · por qué importa.' },
      { label: 'Abrir trayectoria', type: 'jump', panel: 'timeline' }
    );
  } else if (sectionKey === 'music') {
    const videos = content.music?.videos || [];
    checks.push(
      { label: 'Videos', value: `${videos.length}` },
      { label: 'Thumbnails', value: `${videos.filter((video) => video.thumbnail).length}/${videos.length || 1}` }
    );
    cue = 'La sección de música debe resolver confianza: primero video fuerte, luego escucha, luego contexto mínimo.';
    actions.push(
      { label: 'Copiar orden ideal', type: 'copy', value: 'Orden sugerido: video en vivo fuerte, ensamble/proyecto principal, playlist o sesión, reel corto para redes.' },
      { label: 'Abrir música', type: 'jump', panel: 'music' }
    );
  } else if (sectionKey === 'events') {
    const items = content.events?.items || [];
    const withFlyer = items.filter((item) => item.href).length;
    checks.push(
      { label: 'Fechas', value: `${items.length}` },
      { label: 'Flyers', value: `${withFlyer}/${items.length || 1}` }
    );
    cue = items.length ? 'Usa fechas como prueba social: lugar, ciudad, hora y flyer hacen que el EPK se sienta activo.' : 'Agrega al menos una fecha o una nota de disponibilidad para que el sitio no parezca pausado.';
    actions.push(
      { label: 'Copiar formato fecha', type: 'copy', value: 'Título del show · venue, ciudad · hora · costo/RSVP · link o flyer.' },
      { label: 'Abrir fechas', type: 'jump', panel: 'events' }
    );
  } else if (sectionKey === 'gallery') {
    const images = content.gallery?.images || [];
    const reels = content.gallery?.reels || [];
    checks.push(
      { label: 'Fotos', value: `${images.length}` },
      { label: 'Reels', value: `${reels.length}` }
    );
    cue = 'Piensa la galería como partitura visual: escenario, retrato, instrumento, sesión y energía del público.';
    actions.push(
      { label: 'Copiar set visual', type: 'copy', value: 'Set recomendado: 1 retrato limpio, 1 contrabajo en escenario, 1 foto de ensamble, 1 backstage/ensayo, 1 reel vertical.' },
      { label: 'Ir a media pool', type: 'jump', panel: 'media' }
    );
  } else if (sectionKey === 'services') {
    const services = content.services?.items || [];
    checks.push(
      { label: 'Formatos', value: `${services.length}` },
      { label: 'Claridad', value: services.every((item) => words(item.description) >= 8) ? 'Lista' : 'Mejorable' }
    );
    cue = 'Cada servicio debe sonar contratables: formato, para quién es, contexto ideal y tipo de resultado.';
    actions.push(
      { label: 'Copiar plantilla', type: 'copy', value: 'Formato: nombre del ensamble/servicio, duración o contexto, venues ideales, repertorio/sonido y contacto.' },
      { label: 'Abrir servicios', type: 'jump', panel: 'services' }
    );
  } else if (sectionKey === 'booking') {
    const email = content.booking?.email || '';
    checks.push(
      { label: 'WhatsApp', value: content.booking?.whatsappNumber ? 'Listo' : 'Pendiente' },
      { label: 'Email', value: email.includes('example.com') ? 'Placeholder' : 'Listo' }
    );
    cue = email.includes('example.com') ? 'El cierre ya tiene WhatsApp; falta reemplazar el correo placeholder para verse completamente profesional.' : 'El cierre está listo: refuerza el mensaje prellenado para reducir ida y vuelta.';
    actions.push(
      { label: 'Usar mensaje IA', type: 'apply', path: ['booking', 'whatsappText'], value: bookingMessageSuggestion(), notice: 'Mensaje de WhatsApp actualizado.' },
      { label: 'Copiar mensaje IA', type: 'copy', value: bookingMessageSuggestion() },
      { label: 'Abrir booking', type: 'jump', panel: 'booking' }
    );
  } else if (sectionKey === 'footerLinks') {
    const links = content.footerLinks || [];
    checks.push(
      { label: 'Links', value: `${links.length}` },
      { label: 'URLs', value: `${links.filter((item) => /^https?:\/\//.test(item.href || '')).length}/${links.length || 1}` }
    );
    cue = 'El footer es la coda: pocos links, todos oficiales, sin duplicar lo que ya resolvió booking.';
    actions.push(
      { label: 'Copiar orden footer', type: 'copy', value: 'Footer ideal: Instagram, Spotify/Apple Music, Discogs/prensa, Bandcamp o proyecto principal.' },
      { label: 'Abrir footer', type: 'jump', panel: 'footerLinks' }
    );
  } else if (sectionKey === 'spotify') {
    const spotify = content.spotify || {};
    checks.push(
      { label: 'Embed', value: spotify.embedUrl ? 'Listo' : 'Pendiente' },
      { label: 'Link', value: spotify.externalUrl ? 'Listo' : 'Pendiente' }
    );
    cue = spotify.embedUrl && spotify.externalUrl ? 'Spotify ya queda como aguja al disco: verifica que playlist y link externo apunten al mismo universo.' : 'Completa embed y link externo para que la escucha no se rompa fuera del sitio.';
    actions.push(
      { label: 'Copiar regla Spotify', type: 'copy', value: 'Usa embedUrl para el reproductor y externalUrl para abrir Spotify; ambos deben apuntar a playlist/artista vigente.' },
      { label: 'Abrir Spotify', type: 'jump', panel: 'spotify' }
    );
  }

  return {
    section: sectionKey,
    ...profile,
    score: completion,
    cue,
    checks,
    actions
  };
}

function getGlobalGuide() {
  if (!state.content) {
    return { score: 0, sections: [], cue: 'Carga el contenido para iniciar la sesión IA.', actions: [] };
  }
  const sections = Object.keys(guideProfiles).map((key) => getSectionGuide(key));
  const base = Math.round(sections.reduce((total, item) => total + item.score, 0) / sections.length);
  const bookingEmail = state.content.booking?.email || '';
  const events = state.content.events?.items || [];
  const mediaCount = (state.media.assets?.length || 0) + (state.media.media?.length || 0);
  const penalties = [
    bookingEmail.includes('example.com'),
    !events.length,
    mediaCount < 8,
    words(state.content.hero?.subtitle || '') > 38
  ].filter(Boolean).length * 5;
  const score = clamp(base - penalties, 0, 100);
  const lowest = [...sections].sort((a, b) => a.score - b.score)[0];
  const cue = lowest
    ? `Próximo compás: ${lowest.lane.toLowerCase()} (${lowest.form}). ${lowest.cue}`
    : 'El EPK está balanceado.';

  return {
    score,
    sections,
    focus: lowest,
    cue,
    actions: [
      { label: `Abrir ${lowest?.lane || 'sesión'}`, type: 'jump', panel: lowest?.section || 'live', section: lowest?.section },
      { label: 'Copiar pitch booking', type: 'copy', value: `${state.content.artist?.name || 'Artista'} está disponible para festivales, venues, sesiones y eventos privados. ${state.content.booking?.lead || ''}` },
      { label: 'Optimizar WhatsApp', type: 'apply', path: ['booking', 'whatsappText'], value: bookingMessageSuggestion(), notice: 'Mensaje de WhatsApp optimizado.' }
    ]
  };
}

function normalizeQuery(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sectionKeyFromQuery(query) {
  const normalized = normalizeQuery(query);
  const aliases = {
    meta: ['se', 'seo', 'meta', 'google', 'open graph', 'og'],
    artist: ['ar', 'artista', 'identidad', 'nombre'],
    schema: ['sc', 'schema', 'datos', 'structured'],
    navigation: ['nv', 'navegacion', 'menu', 'setlist'],
    hero: ['he', 'hero', 'inicio', 'portada'],
    bio: ['bi', 'bio', 'biografia', 'historia'],
    timeline: ['tr', 'trayectoria', 'timeline', 'movimientos', 'hitos'],
    music: ['mu', 'musica', 'videos', 'escucha'],
    events: ['fe', 'fechas', 'shows', 'agenda', 'eventos'],
    gallery: ['ga', 'galeria', 'fotos', 'reels', 'media'],
    services: ['sv', 'servicios', 'formatos', 'oferta'],
    booking: ['bk', 'booking', 'contratacion', 'contratar', 'whatsapp'],
    footerLinks: ['fo', 'footer', 'links finales', 'pie'],
    spotify: ['sp', 'spotify', 'playlist', 'embed']
  };
  return Object.entries(aliases).find(([, wordsForKey]) => wordsForKey.some((word) => normalized.includes(word)))?.[0]
    || Object.keys(guideProfiles).find((key) => normalized.includes(normalizeQuery(key)) || normalized.includes(normalizeQuery(guideProfiles[key].lane)));
}

function answerGuideQuestion(question) {
  const query = normalizeQuery(question);
  const sectionKey = sectionKeyFromQuery(query);
  const guide = getSectionGuide(sectionKey || state.liveSection);
  if (query.includes('seo') || query.includes('google') || query.includes('og')) {
    return 'Para SEO, piensa como un master: title con nombre + instrumento + escena; description con proyecto fuerte y booking; OG con imagen real del músico.';
  }
  if (query.includes('schema') || query.includes('datos')) {
    return 'Schema funciona como liner notes para buscadores: proyectos en memberOf y perfiles oficiales en sameAs. Evita enlaces secundarios o rotos.';
  }
  if (query.includes('navegacion') || query.includes('menu') || query.includes('setlist')) {
    return 'La navegación debe operar como setlist: Bio, Trayectoria, Música, Fechas, Galería y Servicios. Cada ancla debe llevar a una sección viva.';
  }
  if (query.includes('booking') || query.includes('contrat')) {
    return `Para booking, deja WhatsApp como canal principal, cambia el correo placeholder y usa este mensaje: "${bookingMessageSuggestion()}".`;
  }
  if (query.includes('hero') || query.includes('inicio')) {
    return `El hero debe decir instrumento, territorio y prueba de nivel en una sola respiración. Sugerencia: "${heroSubtitleSuggestion()}".`;
  }
  if (query.includes('spotify') || query.includes('playlist')) {
    return 'Spotify debe quedar como escucha inmediata: embed funcional, link externo vigente y título claro para que un booker pueda oír sin buscar.';
  }
  if (query.includes('foto') || query.includes('media') || query.includes('galer')) {
    return 'Prioriza una foto de escenario con instrumento, un retrato limpio, una imagen de ensamble y un reel vertical. Eso comunica sonido antes de leer.';
  }
  return `${guide.lane}: ${guide.cue}`;
}

function renderGuideActions(actions = [], scope = 'global', section = '') {
  if (!actions.length) return '';
  return `
    <div class="guide-action-row">
      ${actions.slice(0, 3).map((action, index) => `
        <button class="${action.type === 'apply' ? 'primary ' : ''}small" data-guide-scope="${escapeHtml(scope)}" data-guide-section="${escapeHtml(section)}" data-guide-action="${index}">
          ${escapeHtml(action.label)}
        </button>
      `).join('')}
    </div>
  `;
}

function guideActionsFor(scope, section) {
  if (scope === 'section') return getSectionGuide(section).actions;
  return getGlobalGuide().actions;
}

function attachGuideActionEvents(root = document) {
  root.querySelectorAll('[data-guide-action]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', async () => {
      const actions = guideActionsFor(buttonEl.dataset.guideScope, buttonEl.dataset.guideSection);
      const action = actions[Number(buttonEl.dataset.guideAction)];
      if (!action) return;
      if (action.type === 'copy') {
        await navigator.clipboard.writeText(action.value || '');
        notice('Texto IA copiado.');
        return;
      }
      if (action.type === 'apply' && action.path) {
        setByPath(state.content, action.path, action.value || '');
        markDirty();
        notice(action.notice || 'Sugerencia IA aplicada.');
        renderCurrent();
        return;
      }
      if (action.type === 'jump') {
        if (action.section && liveSections[action.section]) state.liveSection = action.section;
        switchPanel(action.panel || action.section || 'live');
      }
    });
  });
}

function blankFrom(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, blankFrom(child)]));
  }
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return 0;
  return '';
}

function labelForKey(key) {
  const labels = {
    ogTitle: 'OG title',
    ogDescription: 'OG description',
    ogImage: 'OG image',
    whatsappNumber: 'WhatsApp',
    whatsappText: 'Mensaje WhatsApp',
    youtubeId: 'YouTube ID',
    footerNote: 'Nota footer',
    sameAs: 'Perfiles',
    memberOf: 'Proyectos'
  };
  return labels[key] || String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function fieldHint(key) {
  return fieldHints[key] || fieldHints[String(key).toLowerCase()] || '';
}

function isMediaField(key, value) {
  const normalized = String(key).toLowerCase();
  if (normalized.includes('email')) return false;
  if (typeof value !== 'string') return false;
  if (normalized === 'href') return /^assets\/|^media\//.test(value);
  return mediaFieldNames.some((name) => normalized.includes(name));
}

function inputTypeFor(key) {
  const normalized = String(key).toLowerCase();
  if (normalized.includes('date')) return 'date';
  if (normalized.includes('email')) return 'email';
  if (normalized.includes('url')) return 'url';
  return 'text';
}

function makeInput(value, path, key) {
  const wrap = document.createElement('div');
  const text = String(value ?? '');
  const long = text.length > 82 || text.includes('\n') || ['description', 'subtitle', 'lead', 'footerNote', 'whatsappText'].includes(key);
  wrap.className = `field${long ? ' long' : ''}${isMediaField(key, value) ? ' media' : ''}`;

  const head = document.createElement('div');
  head.className = 'field-head';
  const label = document.createElement('div');
  label.className = 'field-name';
  label.textContent = labelForKey(key);
  const hint = document.createElement('div');
  hint.className = 'field-help';
  hint.textContent = fieldHint(key);
  head.append(label, hint);
  wrap.appendChild(head);

  let input;
  if (typeof value === 'boolean') {
    const check = document.createElement('label');
    check.className = 'checkbox';
    input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    check.append(input, document.createTextNode('Activo'));
    wrap.appendChild(check);
  } else if (long) {
    input = document.createElement('textarea');
    input.value = text;
    wrap.appendChild(input);
    wrap.appendChild(counterFor(input));
  } else {
    input = document.createElement('input');
    input.type = inputTypeFor(key);
    input.value = text;
    if (isMediaField(key, value)) {
      const row = document.createElement('div');
      row.className = 'path-row';
      row.appendChild(input);
      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'small';
      pick.textContent = 'Elegir';
      pick.addEventListener('click', () => openMediaPicker(path));
      row.appendChild(pick);
      wrap.appendChild(row);
      wrap.appendChild(mediaInlinePreview(text));
    } else {
      wrap.appendChild(input);
    }
  }

  input.addEventListener('input', () => {
    const nextValue = input.type === 'checkbox' ? input.checked : input.value;
    setByPath(state.content, path, nextValue);
    markDirty();
    if (input.tagName === 'TEXTAREA') updateCounter(input);
  });
  return wrap;
}

function counterFor(input) {
  const counter = document.createElement('div');
  counter.className = 'counter';
  input._counter = counter;
  updateCounter(input);
  return counter;
}

function updateCounter(input) {
  if (input._counter) input._counter.textContent = `${input.value.length} caracteres`;
}

function mediaInlinePreview(value) {
  const wrap = document.createElement('div');
  wrap.className = 'media-inline';
  const preview = document.createElement('div');
  preview.className = 'media-inline-preview';
  const path = String(value || '');
  if (isImage(path)) {
    preview.innerHTML = `<img src="${escapeHtml(publicUrl(path))}" alt="">`;
  } else if (isVideo(path)) {
    preview.innerHTML = `<video src="${escapeHtml(publicUrl(path))}" muted playsinline></video>`;
  } else {
    preview.textContent = path ? 'URL' : 'Sin media';
  }
  const code = document.createElement('code');
  code.textContent = path || 'Selecciona un archivo de la biblioteca';
  wrap.append(preview, code);
  return wrap;
}

function renderEditor(value, path = [], key = 'root') {
  if (Array.isArray(value)) return renderArray(value, path, key);
  if (value && typeof value === 'object') return renderObject(value, path, key);
  return makeInput(value, path, key);
}

function renderObject(object, path, key) {
  const section = document.createElement('div');
  const isTopObject = path.length === 1 || typeof key === 'number';
  section.className = isTopObject ? 'editor-grid' : 'editor-section';
  if (!isTopObject) {
    const title = document.createElement('h3');
    title.textContent = labelForKey(key);
    section.appendChild(title);
  }
  for (const [childKey, childValue] of Object.entries(object)) {
    section.appendChild(renderEditor(childValue, [...path, childKey], childKey));
  }
  return section;
}

function renderArray(array, path, key) {
  const section = document.createElement('div');
  section.className = 'array-section';
  const head = document.createElement('div');
  head.className = 'array-head';
  const title = document.createElement('h3');
  title.textContent = `${labelForKey(key)} (${array.length})`;
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'small';
  add.textContent = 'Agregar';
  add.addEventListener('click', () => {
    const sample = array[0] ?? '';
    array.push(blankFrom(sample));
    markDirty();
    renderCurrent();
  });
  head.append(title, add);
  section.appendChild(head);

  const list = document.createElement('div');
  list.className = 'array-list';
  array.forEach((item, index) => {
    const itemWrap = document.createElement('details');
    itemWrap.className = 'array-item';
    itemWrap.open = index === 0 || array.length <= 2;

    const summary = document.createElement('summary');
    summary.className = 'array-summary';
    const titleBlock = document.createElement('div');
    const itemTitle = document.createElement('div');
    itemTitle.className = 'array-item-title';
    itemTitle.textContent = itemTitleFor(item, index);
    const subtitle = document.createElement('div');
    subtitle.className = 'array-subtitle';
    subtitle.textContent = itemSubtitleFor(item);
    titleBlock.append(itemTitle, subtitle);

    const actions = document.createElement('div');
    actions.className = 'array-actions';
    actions.append(
      button('Subir', 'small', (event) => {
        event.stopPropagation();
        if (index > 0) {
          [array[index - 1], array[index]] = [array[index], array[index - 1]];
          markDirty();
          renderCurrent();
        }
      }),
      button('Bajar', 'small', (event) => {
        event.stopPropagation();
        if (index < array.length - 1) {
          [array[index + 1], array[index]] = [array[index], array[index + 1]];
          markDirty();
          renderCurrent();
        }
      }),
      button('Eliminar', 'small danger', (event) => {
        event.stopPropagation();
        if (confirm('¿Eliminar este item?')) {
          array.splice(index, 1);
          markDirty();
          renderCurrent();
        }
      })
    );
    summary.append(titleBlock, actions);
    const body = document.createElement('div');
    body.className = 'array-body';
    body.appendChild(renderEditor(item, [...path, index], index));
    itemWrap.append(summary, body);
    list.appendChild(itemWrap);
  });
  section.appendChild(list);
  return section;
}

function itemTitleFor(item, index) {
  if (!item || typeof item !== 'object') return String(item || `Item ${index + 1}`);
  return item.title || item.label || item.name || item.caption || item.src || item.href || `Item ${index + 1}`;
}

function itemSubtitleFor(item) {
  if (!item || typeof item !== 'object') return '';
  return item.description || item.subtitle || item.text || item.date || item.alt || '';
}

function button(text, className, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = text;
  el.addEventListener('click', onClick);
  return el;
}

function renderArrangementMap(sections, activeSection = '') {
  return `
    <div class="arrangement-map">
      ${sections.map((section, index) => `
        <button class="arrangement-track ${section.section === activeSection ? 'active' : ''} tone-${escapeHtml(section.color)}" data-arrangement-section="${escapeHtml(section.section)}" title="Abrir ${escapeHtml(section.lane)}">
          <span class="track-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="track-copy">
            <b>${escapeHtml(section.form)}</b>
            <small>${escapeHtml(section.lane)}</small>
          </span>
          <span class="track-bars" aria-hidden="true">
            ${Array.from({ length: 4 }).map((_, barIndex) => `<i class="${section.score >= (barIndex + 1) * 25 ? 'filled' : ''}"></i>`).join('')}
          </span>
          <span class="track-score">${section.score}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function attachArrangementEvents(root = document) {
  root.querySelectorAll('[data-arrangement-section]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => {
      const sectionKey = buttonEl.dataset.arrangementSection;
      if (liveSections[sectionKey]) state.liveSection = sectionKey;
      switchPanel(sectionKey);
    });
  });
}

function renderOverview() {
  setPanelTitle('Mapa de sesión', 'Studio CMS');
  const panel = $('#panel');
  const guide = getGlobalGuide();
  const counts = {
    Slides: state.content.hero.slides.length,
    Fechas: state.content.events.items.length,
    Fotos: state.content.gallery.images.length,
    Reels: state.content.gallery.reels.length,
    Assets: state.media.assets.length,
    Originales: state.media.media.length
  };
  const bookingIssue = state.content.booking.email === 'booking@example.com';
  panel.innerHTML = `
    <div class="dashboard-grid">
      <div class="quick-panel">
        <div class="studio-console">
          <div>
            <p class="eyebrow">Guía IA</p>
            <h3>Score de EPK: ${guide.score}/100</h3>
            <p>${escapeHtml(guide.cue)}</p>
          </div>
          <div class="vu-meter" aria-hidden="true">
            ${Array.from({ length: 16 }).map((_, index) => `<span class="${guide.score >= (index + 1) * 6 ? 'hot' : ''}"></span>`).join('')}
          </div>
          ${renderGuideActions(guide.actions, 'global')}
        </div>
        ${renderArrangementMap(guide.sections)}
        <div class="section-intro">
          <div>
            <p class="eyebrow">Sitio principal</p>
            <h3>${escapeHtml(state.content.artist.name)}</h3>
            <p>${escapeHtml(state.content.meta.description)}</p>
          </div>
          <div class="section-actions">
            <button data-jump="hero">Editar hero</button>
            <button data-jump="events">Editar fechas</button>
            <button data-jump="gallery">Editar galería</button>
          </div>
        </div>
        <div class="cards">
          ${Object.entries(counts).map(([label, count]) => `<article class="card"><h3>${count}</h3><p>${label}</p></article>`).join('')}
        </div>
        <div class="quick-actions">
          <button data-panel-jump="live">Abrir sesión</button>
          <button data-panel-jump="guide">Guía IA completa</button>
          <button data-jump="booking">Completar booking</button>
          <button data-jump="music">Actualizar música</button>
          <button data-panel-jump="media">Abrir media</button>
          <button data-panel-jump="legacy">Editar legacy</button>
        </div>
      </div>
      <div class="status-panel">
        <p class="eyebrow">Flujo</p>
        <div class="publish-flow">
          <div class="flow-step"><span class="step-num">1</span><p><b>Editar</b><br>Trabaja por secciones, no tocando HTML.</p></div>
          <div class="flow-step"><span class="step-num">2</span><p><b>Guardar</b><br>El CMS crea respaldo en content/.history.</p></div>
          <div class="flow-step"><span class="step-num">3</span><p><b>Build</b><br>Regenera index.html y dist/.</p></div>
          <div class="flow-step"><span class="step-num">4</span><p><b>Preview</b><br>Revisa el sitio antes de subirlo.</p></div>
        </div>
        <div style="margin-top:14px">
          ${bookingIssue ? '<span class="chip">Pendiente: correo real de booking</span>' : '<span class="chip">Booking completo</span>'}
        </div>
      </div>
    </div>
  `;
  panel.querySelectorAll('[data-jump]').forEach((el) => {
    el.addEventListener('click', () => switchPanel(el.dataset.jump));
  });
  panel.querySelectorAll('[data-panel-jump]').forEach((el) => {
    el.addEventListener('click', () => switchPanel(el.dataset.panelJump));
  });
  attachArrangementEvents(panel);
  attachGuideActionEvents(panel);
}

function renderGuide() {
  setPanelTitle('Guía IA', 'Coach de EPK');
  const panel = $('#panel');
  const guide = getGlobalGuide();
  const answer = state.guideQuestion ? answerGuideQuestion(state.guideQuestion) : guide.cue;
  panel.innerHTML = `
    <div class="guide-layout">
      <section class="guide-board">
        <div class="guide-hero">
          <div>
            <p class="eyebrow">Asistente de sesión</p>
            <h3>Coach IA para músico</h3>
            <p>${escapeHtml(answer)}</p>
          </div>
          <div class="guide-score">
            <span>${guide.score}</span>
            <small>score</small>
          </div>
        </div>

        <form class="guide-prompt" id="guidePromptForm">
          <input id="guidePromptInput" value="${escapeHtml(state.guideQuestion)}" placeholder="Pregunta por SE, AR, TR, SP, booking, media...">
          <button class="primary" type="submit">Preguntar</button>
        </form>

        <div class="score-staff score-staff-wide">
          ${guide.sections.map((section) => `<span>${escapeHtml(section.form)}</span>`).join('')}
        </div>

        ${renderArrangementMap(guide.sections)}
      </section>

      <aside class="guide-side">
        <div class="guide-card">
          <p class="eyebrow">Próxima toma</p>
          <h3>${escapeHtml(guide.focus?.lane || 'EPK')}</h3>
          <p>${escapeHtml(guide.cue)}</p>
          ${renderGuideActions(guide.actions, 'global')}
        </div>
        ${guide.sections.map((section) => `
          <article class="guide-card tone-${escapeHtml(section.color)}">
            <div class="guide-card-head">
              <div>
                <p class="eyebrow">${escapeHtml(section.form)}</p>
                <h3>${escapeHtml(section.lane)}</h3>
              </div>
              <span class="chip">${section.score}/100</span>
            </div>
            <p>${escapeHtml(section.cue)}</p>
            <div class="guide-checks">
              ${section.checks.map((check) => `<span><b>${escapeHtml(check.value)}</b>${escapeHtml(check.label)}</span>`).join('')}
            </div>
            ${renderGuideActions(section.actions, 'section', section.section)}
          </article>
        `).join('')}
      </aside>
    </div>
  `;
  $('#guidePromptForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.guideQuestion = $('#guidePromptInput').value;
    renderGuide();
  });
  attachArrangementEvents(panel);
  attachGuideActionEvents(panel);
}

function renderSection(sectionKey) {
  const meta = sectionMeta[sectionKey] || { label: labelForKey(sectionKey), summary: '' };
  const guide = getSectionGuide(sectionKey);
  setPanelTitle(`${guide.form}: ${meta.label}`, guide.lane);
  const panel = $('#panel');
  const bars = Array.from({ length: 16 }).map((_, index) => `<span class="${guide.score >= (index + 1) * 6 ? 'hot' : ''}"></span>`).join('');
  panel.innerHTML = `
    <section class="composition-module tone-${escapeHtml(guide.color)}">
      <div class="composition-head">
        <div class="module-mark">
          <span>${escapeHtml(meta.icon || 'ED')}</span>
          <small>${escapeHtml(guide.form)}</small>
        </div>
        <div class="composition-copy">
          <p class="eyebrow">${escapeHtml(guide.lane)}</p>
          <h3>${escapeHtml(meta.label)}</h3>
          <p>${escapeHtml(guide.cue)}</p>
        </div>
        <div class="composition-score">
          <strong>${guide.score}</strong>
          <small>score IA</small>
        </div>
      </div>
      <div class="composition-staff" aria-hidden="true">${bars}</div>
      <div class="module-grid">
        <div class="module-cue">
          <p class="eyebrow">Partitura</p>
          <p>${escapeHtml(meta.summary || guide.mission)}</p>
        </div>
        <div class="guide-checks compact">
          ${guide.checks.map((check) => `<span><b>${escapeHtml(check.value)}</b>${escapeHtml(check.label)}</span>`).join('')}
        </div>
        <div class="section-actions module-actions">
          ${renderGuideActions(guide.actions, 'section', sectionKey)}
          <button data-action="save-section">Guardar</button>
          <a class="button" href="${appUrl('/')}" target="_blank" rel="noopener">Preview</a>
        </div>
      </div>
    </section>
    <section class="score-editor-shell tone-${escapeHtml(guide.color)}">
      <div class="score-editor-head">
        <div>
          <p class="eyebrow">Editor</p>
          <h3>Arreglo de contenido</h3>
        </div>
        <span class="chip">${escapeHtml(meta.icon || 'ED')} · ${escapeHtml(guide.form)}</span>
      </div>
      <div id="sectionEditorMount"></div>
    </section>
  `;
  panel.querySelector('[data-action="save-section"]').addEventListener('click', saveContent);
  $('#sectionEditorMount').appendChild(renderEditor(state.content[sectionKey], [sectionKey], sectionKey));
  attachGuideActionEvents(panel);
}

function renderJson() {
  setPanelTitle('JSON completo', 'Avanzado');
  const panel = $('#panel');
  panel.innerHTML = '';
  const status = document.createElement('div');
  status.className = 'json-status chip';
  status.textContent = 'JSON válido';
  const textarea = document.createElement('textarea');
  textarea.className = 'json-editor';
  textarea.spellcheck = false;
  textarea.value = JSON.stringify(state.content, null, 2);
  textarea.addEventListener('input', () => {
    try {
      state.content = JSON.parse(textarea.value);
      textarea.style.borderColor = 'var(--line)';
      status.textContent = 'JSON válido';
      markDirty();
    } catch (error) {
      textarea.style.borderColor = 'var(--danger)';
      status.textContent = `JSON inválido: ${error.message}`;
    }
  });
  panel.append(status, textarea);
}

function renderMedia() {
  setPanelTitle('Media', 'Biblioteca');
  const panel = $('#panel');
  panel.innerHTML = `
    <div class="upload-panel">
      <div class="section-intro">
        <div>
          <p class="eyebrow">Upload</p>
          <h3>Subir imágenes, videos o audio</h3>
          <p>Los archivos pueden guardarse como originales en media/ y como publicados en assets/.</p>
        </div>
      </div>
      <label class="dropzone" id="dropzone">
        <span id="dropText">Arrastra archivos aquí o selecciónalos</span>
        <input id="uploadInput" type="file" multiple accept="image/*,video/*,audio/*">
      </label>
      <label class="checkbox"><input id="publishToAssets" type="checkbox" checked> Publicar también en assets/</label>
      <button id="uploadBtn">Subir seleccionados</button>
    </div>
    <div class="media-toolbar">
      <input id="mediaFilter" placeholder="Filtrar media">
      <div class="media-tabs">
        <button data-media-type="all">Todo</button>
        <button data-media-type="image">Imágenes</button>
        <button data-media-type="video">Videos</button>
      </div>
      <button id="refreshMediaBtn">Actualizar</button>
    </div>
    <div id="mediaGrid" class="media-grid"></div>
  `;
  const uploadInput = $('#uploadInput');
  const dropzone = $('#dropzone');
  uploadInput.addEventListener('change', () => {
    state.selectedUploadFiles = [...uploadInput.files];
    $('#dropText').textContent = state.selectedUploadFiles.length ? `${state.selectedUploadFiles.length} archivo(s) seleccionados` : 'Arrastra archivos aquí o selecciónalos';
  });
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('drag');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('drag');
    });
  });
  dropzone.addEventListener('drop', (event) => {
    state.selectedUploadFiles = [...event.dataTransfer.files];
    $('#dropText').textContent = `${state.selectedUploadFiles.length} archivo(s) seleccionados`;
  });
  $('#uploadBtn').addEventListener('click', uploadFiles);
  $('#refreshMediaBtn').addEventListener('click', refreshMedia);
  $('#mediaFilter').addEventListener('input', () => drawMediaGrid('#mediaGrid', $('#mediaFilter').value));
  panel.querySelectorAll('[data-media-type]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mediaType === state.mediaFilterType);
    btn.addEventListener('click', () => {
      state.mediaFilterType = btn.dataset.mediaType;
      renderMedia();
    });
  });
  drawMediaGrid('#mediaGrid');
}

function mediaCard(item, picker = false) {
  const card = document.createElement('article');
  card.className = 'media-item';
  const preview = document.createElement('div');
  preview.className = 'media-preview';
  if (item.type === 'image') {
    preview.innerHTML = `<img src="${escapeHtml(publicUrl(item.path))}" alt="" loading="lazy">`;
  } else if (item.type === 'video') {
    preview.innerHTML = `<video src="${escapeHtml(publicUrl(item.path))}" muted playsinline></video>`;
  } else {
    preview.textContent = item.type.toUpperCase();
  }
  const meta = document.createElement('div');
  meta.className = 'media-meta';
  meta.innerHTML = `
    <div class="media-info">
      <span class="chip">${escapeHtml(item.type)}</span>
      <span class="chip">${formatBytes(item.size)}</span>
    </div>
    <code>${escapeHtml(item.path)}</code>
  `;
  const action = document.createElement('button');
  action.className = 'small';
  action.textContent = picker ? 'Usar este archivo' : 'Copiar ruta';
  action.addEventListener('click', async () => {
    if (picker && state.mediaTargetPath) {
      setByPath(state.content, state.mediaTargetPath, item.path);
      markDirty();
      $('#mediaPicker').close();
      renderCurrent();
    } else {
      await navigator.clipboard.writeText(item.path);
      notice(`Ruta copiada: ${item.path}`);
    }
  });
  meta.appendChild(action);
  card.append(preview, meta);
  return card;
}

function allMedia() {
  return [...state.media.assets, ...state.media.media];
}

function drawMediaGrid(selector, filter = '', picker = false) {
  const grid = $(selector);
  if (!grid) return;
  grid.innerHTML = '';
  const query = filter.trim().toLowerCase();
  const items = allMedia()
    .filter((item) => state.mediaFilterType === 'all' || item.type === state.mediaFilterType)
    .filter((item) => !query || item.path.toLowerCase().includes(query));
  if (!items.length) {
    grid.innerHTML = '<div class="status-panel"><p>No hay media con ese filtro.</p></div>';
    return;
  }
  items.forEach((item) => grid.appendChild(mediaCard(item, picker)));
}

async function refreshMedia() {
  state.media = await api('/api/media');
  updateChrome();
  if (state.currentPanel === 'media') renderMedia();
}

function openMediaPicker(path) {
  state.mediaTargetPath = path;
  $('#mediaSearch').value = '';
  drawMediaGrid('#mediaPickerGrid', '', true);
  $('#mediaPicker').showModal();
}

async function uploadFiles() {
  const files = state.selectedUploadFiles.length ? state.selectedUploadFiles : [...$('#uploadInput').files];
  if (!files.length) return notice('Selecciona al menos un archivo.', 'error');
  for (const file of files) {
    const dataUrl = await readFileAsDataUrl(file);
    await api('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        dataUrl,
        publishToAssets: $('#publishToAssets').checked
      })
    });
  }
  state.selectedUploadFiles = [];
  $('#uploadInput').value = '';
  await refreshMedia();
  notice('Media subida correctamente.');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderLive() {
  setPanelTitle('Sesión visual', 'Edición live');
  const panel = $('#panel');
  const guide = getGlobalGuide();
  panel.innerHTML = `
    <div class="session-strip">
      <div>
        <p class="eyebrow">Session view</p>
        <h3>${escapeHtml(state.content.artist?.name || 'EPK')}</h3>
      </div>
      <div class="session-transport" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="session-cue">
        <b>${guide.score}/100</b>
        <span>${escapeHtml(getSectionGuide(state.liveSection).lane)}</span>
      </div>
    </div>
    <div class="live-layout">
      <aside class="live-inspector">
        <div class="live-head">
          <div>
            <p class="eyebrow">Inspector</p>
            <h3 id="liveSectionTitle">${escapeHtml(liveSections[state.liveSection].label)}</h3>
            <p class="live-help">Pistas, campos y media de la sección activa.</p>
          </div>
          <div class="live-section-buttons" id="liveSectionButtons"></div>
        </div>
        <div class="live-tools" id="liveTools"></div>
        <div class="live-fields" id="liveFields"></div>
      </aside>
      <section class="live-preview-panel">
        <div class="live-preview-head">
          <div>
            <p class="eyebrow">Preview clickeable</p>
            <h3>Sitio en vivo</h3>
            <p class="live-help">Haz click sobre una sección de la página.</p>
          </div>
          <div class="live-viewport-buttons" id="liveViewportButtons">
            <button data-viewport="desktop">Desktop</button>
            <button data-viewport="tablet">Tablet</button>
            <button data-viewport="mobile">Mobile</button>
          </div>
        </div>
        <div class="live-preview-wrap">
          <div class="live-frame-shell ${escapeHtml(state.liveViewport)}" id="liveFrameShell">
            <iframe class="live-frame" id="liveFrame" title="Preview editable" src="${appUrl(`/?cmsLive=${Date.now()}`)}"></iframe>
          </div>
        </div>
      </section>
    </div>
  `;
  renderLiveSectionButtons();
  renderLiveViewportButtons();
  renderLiveTools();
  renderLiveFields();
  const frame = $('#liveFrame');
  frame.addEventListener('load', attachLiveFrame);
}

function renderLiveSectionButtons() {
  const wrap = $('#liveSectionButtons');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(liveSections).map(([key, section]) => (
    `<button data-live-section="${key}" class="${key === state.liveSection ? 'active' : ''}">${escapeHtml(section.label)}</button>`
  )).join('');
  wrap.querySelectorAll('[data-live-section]').forEach((btn) => {
    btn.addEventListener('click', () => selectLiveSection(btn.dataset.liveSection));
  });
}

function renderLiveViewportButtons() {
  const wrap = $('#liveViewportButtons');
  if (!wrap) return;
  const viewports = [
    ['desktop', 'Desktop'],
    ['tablet', 'Tablet'],
    ['mobile', 'Mobile']
  ];
  wrap.innerHTML = viewports.map(([key, label]) => (
    `<button data-viewport="${key}" class="${key === state.liveViewport ? 'active' : ''}">${label}</button>`
  )).join('');
  wrap.querySelectorAll('[data-viewport]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.liveViewport = btn.dataset.viewport;
      $('#liveFrameShell')?.classList.remove('desktop', 'tablet', 'mobile');
      $('#liveFrameShell')?.classList.add(state.liveViewport);
      renderLiveViewportButtons();
    });
  });
}

function renderLiveTools() {
  const tools = $('#liveTools');
  if (!tools) return;
  const collections = liveCollections[state.liveSection] || [];
  const activeCollection = activeLiveCollection(collections);
  const hasMediaFields = liveSections[state.liveSection].fields.some((field) => field.type === 'media');
  tools.innerHTML = `
    <div class="live-command-row">
      <button data-live-action="focus">Enfocar</button>
      <button data-live-action="section-editor">Editor completo</button>
      <button data-live-action="media">Media</button>
      <button data-live-action="save">Guardar</button>
    </div>
    ${activeCollection ? renderLiveCollectionTools(collections, activeCollection) : ''}
    ${hasMediaFields ? renderLiveMediaShelf() : ''}
    ${renderLiveGuide()}
    ${renderLiveInsights()}
  `;
  attachLiveToolEvents(tools);
}

function activeLiveCollection(collections) {
  if (!collections.length) return null;
  const current = state.liveCollection[state.liveSection];
  const config = collections.find((item) => item.key === current) || collections[0];
  state.liveCollection[state.liveSection] = config.key;
  return config;
}

function renderLiveCollectionTools(collections, activeCollection) {
  const items = getByPath(state.content, activeCollection.path) || [];
  return `
    <div class="live-tool-card">
      <div class="live-tool-head">
        <div>
          <p class="eyebrow">Orden visual</p>
          <h4>${escapeHtml(activeCollection.label)}</h4>
        </div>
        <span class="chip">${items.length} items</span>
      </div>
      ${collections.length > 1 ? `
        <div class="live-collection-tabs">
          ${collections.map((collection) => `
            <button data-live-collection="${escapeHtml(collection.key)}" class="${collection.key === activeCollection.key ? 'active' : ''}">
              ${escapeHtml(collection.label)}
            </button>
          `).join('')}
        </div>
      ` : ''}
      <div class="live-sort-list" id="liveSortList" data-live-collection="${escapeHtml(activeCollection.key)}">
        ${items.map((item, index) => renderLiveSortItem(item, index, activeCollection)).join('')}
      </div>
    </div>
  `;
}

function renderLiveSortItem(item, index, config) {
  const title = itemValue(item, config.title) || `Item ${index + 1}`;
  const subtitle = itemValue(item, config.subtitle) || '';
  const media = itemValue(item, config.media);
  return `
    <article class="live-sort-item" draggable="true" data-live-sort-index="${index}">
      <div class="live-drag-handle" aria-hidden="true">::</div>
      ${media ? `<div class="live-sort-thumb">${mediaThumbMarkup(media)}</div>` : ''}
      <div class="live-sort-copy">
        <b>${escapeHtml(title)}</b>
        ${subtitle ? `<span>${escapeHtml(subtitle)}</span>` : ''}
      </div>
      <span class="live-sort-index">${index + 1}</span>
    </article>
  `;
}

function renderLiveMediaShelf() {
  const items = allMedia().filter((item) => ['image', 'video'].includes(item.type)).slice(0, 10);
  return `
    <div class="live-tool-card">
      <div class="live-tool-head">
        <div>
          <p class="eyebrow">Assets</p>
          <h4>Arrastrables</h4>
        </div>
      </div>
      <div class="live-asset-strip">
        ${items.length ? items.map((item) => `
          <button class="live-asset ${item.path === state.liveSelectedAsset ? 'selected' : ''}" draggable="true" data-media-path="${escapeHtml(item.path)}" title="${escapeHtml(item.path)}">
            ${mediaThumbMarkup(item.path)}
            <span>${escapeHtml(item.name || item.path.split('/').pop())}</span>
          </button>
        `).join('') : '<p class="live-help">Sin media disponible.</p>'}
      </div>
    </div>
  `;
}

function renderLiveInsights() {
  const insights = getLiveInsights();
  return `
    <div class="live-tool-card">
      <div class="live-tool-head">
        <div>
          <p class="eyebrow">Checks</p>
          <h4>Estado del bloque</h4>
        </div>
      </div>
      <div class="live-insight-grid">
        ${insights.map((item) => `
          <div class="live-insight">
            <span>${escapeHtml(item.label)}</span>
            <b>${escapeHtml(item.value)}</b>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLiveGuide() {
  const guide = getSectionGuide(state.liveSection);
  return `
    <div class="live-tool-card ai-live-card tone-${escapeHtml(guide.color)}">
      <div class="live-tool-head">
        <div>
          <p class="eyebrow">Guía IA · ${escapeHtml(guide.form)}</p>
          <h4>${escapeHtml(guide.lane)}</h4>
        </div>
        <span class="chip">${guide.score}/100</span>
      </div>
      <p class="ai-cue">${escapeHtml(guide.cue)}</p>
      <div class="guide-checks compact">
        ${guide.checks.map((check) => `<span><b>${escapeHtml(check.value)}</b>${escapeHtml(check.label)}</span>`).join('')}
      </div>
      ${renderGuideActions(guide.actions, 'section', guide.section)}
    </div>
  `;
}

function getLiveInsights() {
  const section = liveSections[state.liveSection];
  const fields = section.fields || [];
  const textFields = fields.filter((field) => field.type !== 'media');
  const mediaFields = fields.filter((field) => field.type === 'media');
  const chars = textFields.reduce((total, field) => total + String(getByPath(state.content, field.path) || '').length, 0);
  const empty = fields.filter((field) => !String(getByPath(state.content, field.path) || '').trim()).length;
  const missingMedia = mediaFields.filter((field) => !String(getByPath(state.content, field.path) || '').trim()).length;
  const collections = liveCollections[state.liveSection] || [];
  const itemCount = collections.reduce((total, collection) => total + ((getByPath(state.content, collection.path) || []).length), 0);
  return [
    { label: 'Copy', value: `${chars} caracteres` },
    { label: 'Vacíos', value: empty ? `${empty} pendiente(s)` : 'OK' },
    { label: 'Media', value: missingMedia ? `${missingMedia} pendiente(s)` : 'OK' },
    { label: 'Ordenables', value: itemCount ? `${itemCount} items` : 'Sin lista' }
  ];
}

function attachLiveToolEvents(tools) {
  tools.querySelectorAll('[data-live-action]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => {
      const action = buttonEl.dataset.liveAction;
      if (action === 'focus') highlightLiveTarget(true);
      if (action === 'section-editor') switchPanel(state.liveSection);
      if (action === 'media') switchPanel('media');
      if (action === 'save') saveContent();
    });
  });

  tools.querySelectorAll('[data-live-collection]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => {
      state.liveCollection[state.liveSection] = buttonEl.dataset.liveCollection;
      renderLiveTools();
    });
  });

  tools.querySelectorAll('.live-sort-item').forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-cms-sort-index', item.dataset.liveSortIndex);
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      item.classList.add('drop-target');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drop-target'));
    item.addEventListener('drop', (event) => {
      event.preventDefault();
      item.classList.remove('drop-target');
      const from = Number(event.dataTransfer.getData('application/x-cms-sort-index'));
      const to = Number(item.dataset.liveSortIndex);
      reorderLiveCollection($('#liveSortList')?.dataset.liveCollection, from, to);
    });
  });

  tools.querySelectorAll('[data-media-path]').forEach((asset) => {
    asset.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-cms-media-path', asset.dataset.mediaPath);
      event.dataTransfer.setData('text/plain', asset.dataset.mediaPath);
    });
    asset.addEventListener('click', async () => {
      state.liveSelectedAsset = asset.dataset.mediaPath;
      renderLiveTools();
    });
  });
  attachGuideActionEvents(tools);
}

function reorderLiveCollection(collectionKey, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
  const config = (liveCollections[state.liveSection] || []).find((collection) => collection.key === collectionKey);
  if (!config) return;
  const items = getByPath(state.content, config.path);
  if (!Array.isArray(items) || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
  const [moved] = items.splice(from, 1);
  items.splice(to, 0, moved);
  markDirty();
  renderLiveTools();
  renderLiveFields();
  applyLiveContent();
}

function itemValue(item, key) {
  if (!key) return '';
  if (typeof item !== 'object' || item === null) return item;
  return getByPath(item, String(key).split('.')) || '';
}

function mediaThumbMarkup(path) {
  if (isImage(path)) return `<img src="${escapeHtml(publicUrl(path))}" alt="">`;
  if (isVideo(path)) return `<video src="${escapeHtml(publicUrl(path))}" muted playsinline></video>`;
  return `<span>${escapeHtml(String(path || '').split('.').pop() || 'media')}</span>`;
}

function renderLiveFields() {
  const fields = $('#liveFields');
  if (!fields) return;
  const section = liveSections[state.liveSection];
  fields.innerHTML = '';
  section.fields.forEach((field) => fields.appendChild(liveField(field)));
}

function liveField(field) {
  const label = document.createElement('label');
  label.className = 'live-field';
  const value = getByPath(state.content, field.path) ?? '';
  const span = document.createElement('span');
  span.textContent = field.label;
  label.appendChild(span);

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.value = value;
    label.appendChild(input);
  } else {
    input = document.createElement('input');
    input.value = value;
    if (field.type === 'media') {
      label.classList.add('live-media-target');
      const row = document.createElement('div');
      row.className = 'path-row';
      row.appendChild(input);
      const pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'small';
      pick.textContent = 'Media';
      pick.addEventListener('click', () => openMediaPicker(field.path));
      row.appendChild(pick);
      label.appendChild(row);
      label.appendChild(mediaInlinePreview(value));
    } else {
      label.appendChild(input);
    }
  }

  input.dataset.livePath = pathKey(field.path);
  input.addEventListener('input', () => {
    setByPath(state.content, field.path, input.value);
    markDirty();
    updateLiveFieldCounter(input);
    renderLiveTools();
    applyLiveContent();
  });
  if (field.type === 'media') attachMediaDropTarget(label, field, input);
  else label.appendChild(liveFieldCounter(input));
  return label;
}

function liveFieldCounter(input) {
  const counter = document.createElement('small');
  counter.className = 'live-field-note';
  input._liveCounter = counter;
  updateLiveFieldCounter(input);
  return counter;
}

function updateLiveFieldCounter(input) {
  if (!input?._liveCounter) return;
  input._liveCounter.textContent = `${String(input.value || '').length} caracteres`;
}

function attachMediaDropTarget(label, field, input) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    label.addEventListener(eventName, (event) => {
      const types = Array.from(event.dataTransfer.types);
      if (!types.includes('application/x-cms-media-path') && !types.includes('text/plain')) return;
      event.preventDefault();
      label.classList.add('drop-ready');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    label.addEventListener(eventName, () => label.classList.remove('drop-ready'));
  });
  label.addEventListener('drop', (event) => {
    const mediaPath = event.dataTransfer.getData('application/x-cms-media-path') || event.dataTransfer.getData('text/plain');
    if (!mediaPath) return;
    event.preventDefault();
    setLiveFieldValue(field, input, mediaPath);
  });
  label.addEventListener('click', (event) => {
    if (!state.liveSelectedAsset || event.target.closest('button')) return;
    const selectedAsset = state.liveSelectedAsset;
    state.liveSelectedAsset = '';
    setLiveFieldValue(field, input, selectedAsset);
  });
}

function setLiveFieldValue(field, input, value) {
  input.value = value;
  setByPath(state.content, field.path, value);
  markDirty();
  renderLiveTools();
  renderLiveFields();
  applyLiveContent();
}

function selectLiveSection(sectionKey, options = {}) {
  if (!liveSections[sectionKey]) return;
  state.liveSection = sectionKey;
  const title = $('#liveSectionTitle');
  if (title) title.textContent = liveSections[state.liveSection].label;
  renderLiveSectionButtons();
  renderLiveTools();
  renderLiveFields();
  highlightLiveTarget(options.scroll !== false);
  attachLiveInlineEditing();
}

function attachLiveFrame() {
  state.liveFrameReady = true;
  injectLiveFrameStyle();
  applyLiveContent();
  attachLiveClickHandlers();
  highlightLiveTarget(false);
}

function liveDocument() {
  const frame = $('#liveFrame');
  try {
    return frame?.contentDocument || frame?.contentWindow?.document || null;
  } catch {
    return null;
  }
}

function injectLiveFrameStyle() {
  const doc = liveDocument();
  if (!doc || doc.getElementById('cms-live-style')) return;
  const style = doc.createElement('style');
  style.id = 'cms-live-style';
  style.textContent = `
    header.hero, section { cursor: pointer; }
    .cms-live-selected {
      outline: 3px solid rgba(224, 164, 88, .9) !important;
      outline-offset: -3px !important;
      box-shadow: inset 0 0 0 9999px rgba(224, 164, 88, .04) !important;
    }
    .cms-live-inline {
      outline: 1px dashed rgba(224, 164, 88, .72) !important;
      outline-offset: 4px !important;
      border-radius: 6px !important;
    }
    .cms-live-inline:focus {
      outline: 2px solid rgba(224, 164, 88, .95) !important;
      background: rgba(224, 164, 88, .08) !important;
    }
  `;
  doc.head.appendChild(style);
}

function attachLiveClickHandlers() {
  const doc = liveDocument();
  if (!doc || doc._cmsLiveClickAttached) return;
  doc._cmsLiveClickAttached = true;
  doc.addEventListener('click', (event) => {
    if (event.target.closest('[contenteditable="true"]')) return;
    const target = event.target.closest('header.hero, #bio, #musica, #fechas, #galeria, #servicios, #booking');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const sectionKey = liveTargetMap[target.id] || (target.classList.contains('hero') ? 'hero' : target.id);
    selectLiveSection(sectionKey, { scroll: false });
  }, true);
}

function highlightLiveTarget(scroll = true) {
  const doc = liveDocument();
  if (!doc) return;
  doc.querySelectorAll('.cms-live-selected').forEach((el) => el.classList.remove('cms-live-selected'));
  const target = doc.querySelector(liveSections[state.liveSection].target);
  if (!target) return;
  target.classList.add('cms-live-selected');
  if (scroll) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function attachLiveInlineEditing() {
  const doc = liveDocument();
  if (!doc) return;
  doc.querySelectorAll('[data-cms-inline]').forEach((node) => {
    if (node._cmsInlineHandler) node.removeEventListener('input', node._cmsInlineHandler);
    node.removeAttribute('contenteditable');
    node.removeAttribute('data-cms-inline');
    node.classList.remove('cms-live-inline');
  });

  (liveInlineBindings[state.liveSection] || []).forEach((binding) => {
    const node = liveInlineNode(doc, binding);
    if (!node) return;
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('spellcheck', 'false');
    node.setAttribute('data-cms-inline', pathKey(binding.path));
    node.classList.add('cms-live-inline');
    node._cmsInlineHandler = () => {
      const value = inlineValueFromNode(node, binding);
      setByPath(state.content, binding.path, value);
      syncLiveInspectorInput(binding.path, value);
      markDirty();
      renderLiveTools();
    };
    node.addEventListener('input', node._cmsInlineHandler);
  });
}

function liveInlineNode(doc, binding) {
  return doc.querySelectorAll(binding.selector)[binding.index || 0] || null;
}

function inlineValueFromNode(node, binding) {
  const value = node.innerText.replace(/\u00a0/g, ' ').trim();
  return binding.rich ? value.replace(/\n+/g, '<br>') : value;
}

function syncLiveInspectorInput(path, value) {
  const key = pathKey(path);
  document.querySelectorAll('[data-live-path]').forEach((input) => {
    if (input.dataset.livePath !== key || document.activeElement === input) return;
    input.value = value;
    updateLiveFieldCounter(input);
  });
}

function reloadLiveFrame() {
  const frame = $('#liveFrame');
  if (frame) frame.src = appUrl(`/?cmsLive=${Date.now()}`);
}

function applyLiveContent() {
  const doc = liveDocument();
  if (!doc) return;
  const content = state.content;

  setText(doc, '.nav-brand', `${content.artist.brandFirst} ${content.artist.brandLast}`);
  setText(doc, '.hero .eyebrow', `𝄢 ${content.hero.eyebrow}`);
  setText(doc, '.hero h1 .beat-1', content.hero.title.line1);
  setHtml(doc, '.hero h1 .beat-2', emphasizeLine(content.hero.title.line2, content.hero.title.emphasis));
  setText(doc, '.hero-sub', content.hero.subtitle);
  setHeroSlide(doc, 0, content.hero.slides?.[0]);
  setHeroSlide(doc, 1, content.hero.slides?.[1]);
  (content.hero.ctas || []).slice(0, 2).forEach((cta, index) => {
    const node = doc.querySelector(`.hero-ctas .btn:nth-child(${index + 1})`);
    if (!node) return;
    node.textContent = cta.label || '';
    node.setAttribute('href', cta.href || '#');
    node.className = `btn btn-${cta.style === 'primary' ? 'primary' : 'ghost'}`;
  });
  (content.hero.badges || []).slice(0, 3).forEach((badge, index) => {
    const node = doc.querySelectorAll('.hero-staff .badge')[index];
    if (node) node.innerHTML = `<b>${escapeHtml(badge.title || '')}</b> · ${escapeHtml(badge.text || '')}`;
  });

  setHtml(doc, '#bio .section-title', richLive(content.bio.title));
  setTextAt(doc, '#bio .lead', 0, content.bio.paragraphs?.[0]);
  setText(doc, '#bio .bio-quote', content.bio.quote);
  setTextAt(doc, '#bio .lead', 1, content.bio.paragraphs?.[1]);
  setImage(doc, '#bio img', content.bio.image, content.bio.imageAlt);

  setText(doc, '#musica .section-title', content.music.title);
  setText(doc, '#musica .lead', content.music.lead);
  (content.music.videos || []).slice(0, 4).forEach((video, index) => {
    const item = `#musica .media-card:nth-child(${index + 1})`;
    setText(doc, `${item} .media-meta h3`, video.title);
    setText(doc, `${item} .media-meta p`, video.subtitle);
    setImage(doc, `${item} .yt-facade img`, video.thumbnail, video.alt);
    const buttonEl = doc.querySelector(`${item} .yt-facade`);
    if (buttonEl) {
      buttonEl.dataset.yt = video.youtubeId || '';
      buttonEl.dataset.title = video.title || '';
      buttonEl.setAttribute('aria-label', `Reproducir: ${video.title || ''}`);
    }
  });

  setText(doc, '#fechas .section-title', content.events.title);
  setHtml(doc, '#fechas .lead', `${escapeHtml(content.events.lead)} <a href="#booking" style="color: var(--amber);">Agenda una fecha</a>.`);
  (content.events.items || []).slice(0, 5).forEach((event, index) => {
    const row = `#fechas .date-row:nth-child(${index + 1})`;
    setText(doc, `${row} .date-info h3`, event.title);
    setText(doc, `${row} .date-info p`, event.description);
    setText(doc, `${row} .date-cal .d`, event.day);
    setText(doc, `${row} .date-cal .m`, event.month);
    const status = doc.querySelector(`${row} .date-status`);
    if (status) {
      const nextStatus = event.href ? doc.createElement('a') : doc.createElement('span');
      nextStatus.className = ['date-status', event.statusStyle].filter(Boolean).join(' ');
      nextStatus.textContent = event.status || '';
      if (event.href) nextStatus.setAttribute('href', publicUrl(event.href));
      status.replaceWith(nextStatus);
    }
  });

  setHtml(doc, '#galeria .section-title', richLive(content.gallery.title));
  (content.gallery.images || []).slice(0, 6).forEach((image, index) => {
    const item = `#galeria .gallery-grid .g-item:nth-child(${index + 1})`;
    const itemNode = doc.querySelector(item);
    if (itemNode) itemNode.className = ['g-item', image.variant, 'reveal'].filter(Boolean).join(' ');
    setImage(doc, `${item} img`, image.src, image.alt);
    setText(doc, `${item} .g-cap`, image.caption);
  });
  (content.gallery.reels || []).slice(0, 3).forEach((reel, index) => {
    const item = `#galeria .reels-row .reel:nth-child(${index + 1})`;
    setVideo(doc, `${item} video`, reel.src);
    setText(doc, `${item} .g-cap`, reel.caption);
  });

  setText(doc, '#servicios .section-title', content.services.title);
  (content.services.items || []).slice(0, 4).forEach((service, index) => {
    const item = `#servicios .service:nth-child(${index + 1})`;
    const itemNode = doc.querySelector(item);
    if (itemNode) itemNode.dataset.glyph = service.glyph || '';
    setText(doc, `${item} .num`, service.number);
    setText(doc, `${item} h3`, service.title);
    setText(doc, `${item} p`, service.description);
  });

  setText(doc, '#booking .section-title', content.booking.title);
  setText(doc, '#booking .lead', content.booking.lead);
  const whatsapp = doc.querySelector('#booking .booking-ctas .btn:nth-child(1)');
  if (whatsapp) whatsapp.setAttribute('href', `https://wa.me/${encodeURIComponent(content.booking.whatsappNumber)}?text=${encodeURIComponent(content.booking.whatsappText)}`);
  const email = doc.querySelector('#booking .booking-ctas .btn:nth-child(2)');
  if (email) {
    email.textContent = content.booking.emailLabel;
    email.setAttribute('href', `mailto:${content.booking.email}`);
  }
  setText(doc, '#booking .booking-ctas .btn:nth-child(3)', content.booking.instagramLabel);

  highlightLiveTarget(false);
  attachLiveInlineEditing();
}

function emphasizeLine(line = '', emphasis = '') {
  const safeLine = escapeHtml(line);
  if (!emphasis) return safeLine;
  return safeLine.replace(escapeHtml(emphasis), `<em>${escapeHtml(emphasis)}</em>`);
}

function richLive(value = '') {
  return escapeHtml(value).replaceAll('&lt;br&gt;', '<br>');
}

function setText(doc, selector, value) {
  const node = doc.querySelector(selector);
  if (node && value !== undefined && value !== null) node.textContent = value;
}

function setTextAt(doc, selector, index, value) {
  const node = doc.querySelectorAll(selector)[index];
  if (node && value !== undefined && value !== null) node.textContent = value;
}

function setHtml(doc, selector, value) {
  const node = doc.querySelector(selector);
  if (node && value !== undefined && value !== null) node.innerHTML = value;
}

function setImage(doc, selector, src, alt = '') {
  const node = doc.querySelector(selector);
  if (!node || !src) return;
  node.setAttribute('src', publicUrl(src));
  node.setAttribute('alt', alt || '');
}

function setVideo(doc, selector, src) {
  const node = doc.querySelector(selector);
  if (!node || !src) return;
  node.setAttribute('src', publicUrl(src));
}

function setHeroSlide(doc, index, slide) {
  const node = doc.querySelectorAll('.hero-slide')[index];
  const src = typeof slide === 'string' ? slide : slide?.image;
  if (!node || !src) return;
  const url = publicUrl(src);
  node.style.setProperty('--slide-img', `url('${url}')`);
  node.style.backgroundImage = `url('${url}')`;
  if (slide?.label) node.setAttribute('aria-label', slide.label);
}

function renderLegacy() {
  setPanelTitle('Legacy', 'Archivos directos');
  const panel = $('#panel');
  const pages = state.content.legacyPages || [];
  panel.innerHTML = `
    <div class="legacy-layout">
      <div class="legacy-list">
        ${pages.map((page) => `<button data-legacy="${escapeHtml(page)}">${escapeHtml(page)}</button>`).join('')}
      </div>
      <div class="legacy-panel">
        <div class="legacy-toolbar">
          <input id="legacyPath" readonly value="${escapeHtml(state.legacyPath || pages[0] || '')}">
          <button id="loadLegacyBtn">Cargar</button>
          <button id="saveLegacyBtn">Guardar legacy</button>
        </div>
        <textarea id="legacyEditor" class="legacy-editor" spellcheck="false"></textarea>
      </div>
    </div>
  `;
  panel.querySelectorAll('[data-legacy]').forEach((buttonEl) => {
    buttonEl.classList.toggle('active', buttonEl.dataset.legacy === state.legacyPath);
    buttonEl.addEventListener('click', () => loadLegacy(buttonEl.dataset.legacy));
  });
  $('#loadLegacyBtn').addEventListener('click', () => loadLegacy($('#legacyPath').value));
  $('#saveLegacyBtn').addEventListener('click', saveLegacy);
  $('#legacyEditor').addEventListener('input', (event) => {
    state.legacyContent = event.target.value;
  });
  if (!state.legacyContent && pages.length) loadLegacy(state.legacyPath || pages[0]);
  else $('#legacyEditor').value = state.legacyContent;
}

async function loadLegacy(pagePath) {
  const data = await api(`/api/page?path=${encodeURIComponent(pagePath)}`);
  state.legacyPath = data.path;
  state.legacyContent = data.content;
  $('#legacyPath').value = data.path;
  $('#legacyEditor').value = data.content;
  document.querySelectorAll('[data-legacy]').forEach((buttonEl) => {
    buttonEl.classList.toggle('active', buttonEl.dataset.legacy === data.path);
  });
  notice(`Cargado: ${data.path}`);
}

async function saveLegacy() {
  if (!state.legacyPath) return notice('Carga una página legacy primero.', 'error');
  await api('/api/page', {
    method: 'PUT',
    body: JSON.stringify({ path: state.legacyPath, content: state.legacyContent })
  });
  notice(`Legacy guardado: ${state.legacyPath}`);
}

function renderCurrent() {
  markActive();
  updateChrome();
  if (state.currentPanel === 'overview') renderOverview();
  else if (state.currentPanel === 'live') renderLive();
  else if (state.currentPanel === 'guide') renderGuide();
  else if (state.currentPanel === 'media') renderMedia();
  else if (state.currentPanel === 'legacy') renderLegacy();
  else if (state.currentPanel === 'json') renderJson();
  else renderSection(state.currentPanel);
}

function switchPanel(panel) {
  state.currentPanel = panel;
  renderCurrent();
}

function markActive() {
  document.querySelectorAll('.nav, .nav-group button').forEach((buttonEl) => {
    buttonEl.classList.toggle('active', buttonEl.dataset.panel === state.currentPanel);
  });
}

async function saveContent(options = {}) {
  state.saving = true;
  updateChrome();
  try {
    await api('/api/content', {
      method: 'PUT',
      body: JSON.stringify(state.content)
    });
    markDirty(false);
    if (!options.quiet) notice('Contenido guardado.');
  } catch (error) {
    notice(error.message, 'error');
    if (options.throwOnError) throw error;
  } finally {
    state.saving = false;
    updateChrome();
  }
}

async function buildSite() {
  state.building = true;
  updateChrome();
  try {
    await saveContent({ quiet: true, throwOnError: true });
    const data = await api('/api/build', { method: 'POST', body: '{}' });
    const warnings = data.report.warnings || [];
    notice(warnings.length ? `Build listo con ${warnings.length} alerta(s).` : 'Build listo y dist actualizado.');
    if (state.currentPanel === 'live') reloadLiveFrame();
  } catch (error) {
    notice(error.message, 'error');
  } finally {
    state.building = false;
    updateChrome();
  }
}

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password')
      })
    });
    await boot();
  } catch (error) {
    $('#loginMessage').textContent = error.message;
  }
}

async function logout() {
  await api('/api/logout', { method: 'POST', body: '{}' });
  location.reload();
}

function buildSectionNav() {
  const nav = $('#sectionNav');
  nav.innerHTML = '';
  Object.entries(sectionMeta).forEach(([key, meta]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.panel = key;
    btn.dataset.search = `${meta.label} ${meta.summary}`.toLowerCase();
    btn.innerHTML = `<span class="nav-icon">${escapeHtml(meta.icon)}</span><span>${escapeHtml(meta.label)}</span>`;
    btn.addEventListener('click', () => switchPanel(key));
    nav.appendChild(btn);
  });
}

function filterNav(query) {
  const normalized = query.trim().toLowerCase();
  document.querySelectorAll('#sectionNav button').forEach((buttonEl) => {
    buttonEl.hidden = normalized && !buttonEl.dataset.search.includes(normalized);
  });
}

async function boot() {
  const status = await api('/api/status');
  if (!status.authenticated) {
    $('#loginView').classList.remove('hidden');
    $('#cmsView').classList.add('hidden');
    return;
  }
  state.content = await api('/api/content');
  state.media = await api('/api/media');
  $('#loginView').classList.add('hidden');
  $('#cmsView').classList.remove('hidden');
  buildSectionNav();
  renderCurrent();
}

function isImage(path) {
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(String(path));
}

function isVideo(path) {
  return /\.(mp4|mov|webm)$/i.test(String(path));
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function publicUrl(value) {
  const path = String(value || '');
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path;
  return `/${path.split('/').map((part) => encodeURIComponent(part)).join('/')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  $('#loginForm').addEventListener('submit', login);
  $('#saveBtn').addEventListener('click', saveContent);
  $('#buildBtn').addEventListener('click', buildSite);
  $('#guideBtn').addEventListener('click', () => switchPanel('guide'));
  $('#logoutBtn').addEventListener('click', logout);
  document.querySelectorAll('.sidebar > .side-nav > .nav').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => switchPanel(buttonEl.dataset.panel));
  });
  $('#navSearch').addEventListener('input', (event) => filterNav(event.target.value));
  $('[data-close-picker]').addEventListener('click', () => $('#mediaPicker').close());
  $('#mediaSearch').addEventListener('input', (event) => drawMediaGrid('#mediaPickerGrid', event.target.value, true));
  boot().catch((error) => notice(error.message, 'error'));
});
