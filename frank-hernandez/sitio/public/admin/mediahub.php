<?php
// Media Hub: biblioteca central de archivos multimedia del sitio
require_once __DIR__ . '/lib.php';
requiere_login();
panel_inicio('Media Hub', 'media');
?>
<h1>🗂 Media Hub</h1>

<div class="tarjeta" id="dropzone" style="border:2px dashed var(--laton);text-align:center;">
  <strong>⬆️ Sube tus archivos multimedia</strong>
  <p style="font-size:.85rem;color:#777;margin:.4rem 0 .9rem;">
    Arrastra y suelta <b>uno o varios archivos</b> aquí, o
    <label style="display:inline;color:var(--laton);cursor:pointer;text-decoration:underline;font-size:.85rem;text-transform:none;letter-spacing:0;">
      explora tu equipo<input type="file" id="entrada" accept="image/*" multiple style="display:none">
    </label>.
    Acepto JPG, PNG, WebP, GIF, HEIC, TIFF… (los formatos pesados se convierten a JPG).
  </p>
  <div id="cola" style="font-size:.8rem;color:var(--oceano);"></div>
</div>

<div class="tarjeta">
  <div id="chips" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;"></div>
  <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
    <input type="text" id="buscar" placeholder="🔎 Buscar por nombre, caption o etiqueta…" style="flex:1;min-width:200px;">
    <span id="total" style="font-size:.82rem;color:#777;"></span>
  </div>
</div>

<style>
.chip{border:1.5px solid var(--laton);background:transparent;color:var(--oceano);border-radius:999px;
padding:.4rem .9rem;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s}
.chip:hover{background:#fdf3e3}
.chip.activo{background:var(--laton);color:#fff}
.badge-cat{display:inline-block;background:var(--arena);color:var(--oceano);border-radius:4px;
padding:.1rem .45rem;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin:.3rem .3rem .3rem 0}
.badge-origen{display:inline-block;background:#e8f0ef;color:#1b4d5c;border-radius:4px;
padding:.1rem .45rem;font-size:.62rem;font-weight:700}
.caption-mini{display:block;color:#8a8a8a;font-size:.7rem;font-weight:400;line-height:1.35;
max-height:2.7em;overflow:hidden;margin-top:.2rem}
</style>

<div class="grid-img" id="galeria"></div>

<script>
const CSRF = <?= json_encode(csrf_token()) ?>;
const galeria = document.getElementById('galeria');
const buscar = document.getElementById('buscar');
const total = document.getElementById('total');
const cola = document.getElementById('cola');
const entrada = document.getElementById('entrada');
const dropzone = document.getElementById('dropzone');
let archivos = [];
let catActiva = '';

async function api(datos) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(datos)) fd.append(k, v);
  const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
  return r.json();
}

function pintarChips() {
  const conteos = {};
  archivos.forEach((a) => { conteos[a.categoria] = (conteos[a.categoria] || 0) + 1; });
  const cats = Object.keys(conteos).sort();
  const chips = document.getElementById('chips');
  chips.innerHTML =
    `<button class="chip ${catActiva === '' ? 'activo' : ''}" data-cat="">Todas (${archivos.length})</button>` +
    cats.map((c) => `<button class="chip ${catActiva === c ? 'activo' : ''}" data-cat="${c}">${c} (${conteos[c]})</button>`).join('');
  chips.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => { catActiva = b.dataset.cat; pintarChips(); pintar(); })
  );
}

function pintar() {
  const q = buscar.value.trim().toLowerCase();
  const lista = archivos.filter((a) =>
    (catActiva === '' || a.categoria === catActiva) &&
    (a.nombre.toLowerCase().includes(q) || (a.caption || '').toLowerCase().includes(q) || (a.categoria || '').includes(q))
  );
  total.textContent = `${lista.length} de ${archivos.length} archivo(s)`;
  galeria.innerHTML = lista
    .map(
      (a) => `
    <div class="img-item">
      <img src="${a.url}" alt="${a.nombre}" loading="lazy" title="${(a.caption || '').replace(/"/g, '&quot;')}">
      <div class="cuerpo">
        <code>${a.nombre}</code>
        <span class="badge-cat">${a.categoria}</span>${a.origen ? `<span class="badge-origen">${a.origen}</span>` : ''}
        ${a.caption ? `<span class="caption-mini">${a.caption.slice(0, 110)}</span>` : ''}
        ${a.kb} KB${a.ancho ? ` · ${a.ancho}×${a.alto}px` : ''}
        <div class="acciones">
          <button class="boton" onclick="copiarRuta('${a.nombre}')">📋 Copiar ruta</button>
          <a class="boton" href="${a.url}" target="_blank" rel="noopener">👁 Ver</a>
          <button class="boton boton--peligro" onclick="eliminar('${a.nombre}')">Eliminar</button>
        </div>
      </div>
    </div>`
    )
    .join('');
}

async function cargarGaleria() {
  const j = await api({ accion: 'listar_media' });
  if (j.ok) { archivos = j.archivos; pintarChips(); pintar(); }
}

window.copiarRuta = (nombre) => {
  navigator.clipboard.writeText('/img/' + nombre);
  total.textContent = `📋 Ruta copiada: /img/${nombre}`;
};

window.eliminar = async (nombre) => {
  if (!confirm(`¿Eliminar «${nombre}»? Si alguna página lo usa, mostrará imagen rota. No se puede deshacer.`)) return;
  const j = await api({ accion: 'eliminar_imagen', destino: nombre });
  if (j.ok) cargarGaleria(); else alert('⚠️ ' + j.error);
};

async function subirTodos(lista) {
  const pendientes = Array.from(lista);
  let hechos = 0;
  for (const archivo of pendientes) {
    cola.textContent = `⏳ Subiendo ${archivo.name} (${hechos + 1}/${pendientes.length})…`;
    const j = await api({ accion: 'subir_imagen', archivo });
    hechos++;
    if (!j.ok) alert(`⚠️ ${archivo.name}: ${j.error}`);
  }
  cola.textContent = `✅ ${hechos} archivo(s) procesado(s).`;
  setTimeout(() => (cola.textContent = ''), 4000);
  cargarGaleria();
}

entrada.addEventListener('change', () => { if (entrada.files.length) subirTodos(entrada.files); entrada.value = ''; });

['dragenter', 'dragover'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.style.background = '#fdf3e3'; })
);
['dragleave', 'drop'].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.style.background = ''; })
);
dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) subirTodos(e.dataTransfer.files); });

buscar.addEventListener('input', pintar);
cargarGaleria();
</script>
<?php panel_fin();
