<?php
// Editor visual: el sitio real en un iframe, edición al hacer clic, guardado en vivo
require_once __DIR__ . '/lib.php';
requiere_login();

$paginas = [
    '/' => 'Inicio',
    '/propiedades/' => 'Catálogo de propiedades',
    '/propiedades/penthouse-corasol-playa-del-carmen/' => 'Ficha · Penthouse Corasol',
    '/propiedades/lotes-selva-serena-guadalupe-victoria/' => 'Ficha · Lotes Selva Serena',
    '/propiedades/casa-tulum-ejemplo/' => 'Ficha · Casa Tulum',
    '/propiedades/departamento-cancun-ejemplo/' => 'Ficha · Depto Cancún',
    '/zonas/playa-del-carmen/' => 'Zona · Playa del Carmen',
    '/zonas/cancun/' => 'Zona · Cancún',
    '/zonas/tulum/' => 'Zona · Tulum',
    '/blog/' => 'Blog',
    '/contacto/' => 'Contacto',
    '/links/' => 'Links',
];
$csrf = csrf_token();
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES);
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Editor visual · CMS Suemi García</title>
<style>
:root{--oceano:#0e2a3a;--teal:#1b4d5c;--laton:#b08a57;--laton-claro:#d4b98c;--arena:#f1efe8;--ok:#1e6e46;--error:#8a3324}
*{box-sizing:border-box}
body{margin:0;height:100vh;display:flex;flex-direction:column;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0a1f2c}
.barra{background:var(--oceano);color:#fff;display:flex;align-items:center;gap:.9rem;padding:.6rem 1rem;flex-wrap:wrap;box-shadow:0 4px 16px rgba(0,0,0,.35);z-index:5}
.barra b{font-family:Georgia,serif;white-space:nowrap}.barra b span{color:var(--laton-claro);font-style:italic}
.barra select{background:#123448;color:#fff;border:1px solid #2a5265;border-radius:5px;padding:.45rem .6rem;font-size:.85rem;max-width:240px}
.barra .disp{display:flex;border:1px solid #2a5265;border-radius:5px;overflow:hidden}
.barra .disp button{background:transparent;border:0;color:#9fb6c2;padding:.4rem .7rem;cursor:pointer;font-size:.85rem}
.barra .disp button.on{background:var(--teal);color:#fff}
.contador{background:#123448;border-radius:999px;padding:.3rem .8rem;font-size:.78rem;color:#9fb6c2}
.contador.hay{background:var(--laton);color:#fff;font-weight:700}
.btn{border:0;border-radius:5px;padding:.55rem 1.1rem;font-weight:700;font-size:.85rem;cursor:pointer}
.btn-guardar{background:var(--laton);color:#fff}.btn-guardar:disabled{opacity:.4;cursor:default}
.btn-desc{background:transparent;color:#9fb6c2;border:1px solid #2a5265}
.barra a{color:#9fb6c2;text-decoration:none;font-size:.82rem;margin-left:auto}
.lienzo{flex:1;display:grid;place-items:center;overflow:auto;padding:1rem}
.marco{background:#fff;border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,.5);overflow:hidden;transition:width .3s ease;width:100%;height:100%;max-width:1600px}
.marco.movil{width:400px;max-height:850px;border-radius:28px;border:6px solid #16303f}
.marco iframe{width:100%;height:100%;border:0;display:block}
.toast{position:fixed;bottom:1.2rem;left:50%;transform:translateX(-50%);background:var(--oceano);color:#fff;padding:.8rem 1.4rem;border-radius:999px;font-size:.88rem;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;transition:opacity .25s;pointer-events:none;z-index:10;border:1px solid var(--laton)}
.toast.ver{opacity:1}
.ayuda{position:fixed;bottom:1.2rem;right:1.2rem;background:rgba(18,52,72,.95);color:#cfdde8;font-size:.75rem;padding:.7rem 1rem;border-radius:8px;max-width:250px;z-index:9;line-height:1.5}
.subiendo{position:fixed;inset:0;background:rgba(10,31,44,.75);display:none;place-items:center;color:#fff;font-size:1rem;z-index:20}
.subiendo.ver{display:grid}
/* Modal de confirmación de imagen */
.modal-fondo{position:fixed;inset:0;background:rgba(10,31,44,.8);display:none;place-items:center;z-index:30;padding:1rem}
.modal-fondo.ver{display:grid}
.modal{background:#fffdf9;border-radius:10px;border-top:3px solid var(--laton);max-width:640px;width:100%;padding:1.75rem;box-shadow:0 30px 90px rgba(0,0,0,.5)}
.modal h2{font-family:Georgia,serif;color:var(--oceano);margin:0 0 .25rem;font-size:1.25rem}
.modal .destino{font-size:.8rem;color:#777;margin:0 0 1.25rem}
.modal .comparar{display:grid;grid-template-columns:1fr auto 1fr;gap:.9rem;align-items:center}
.modal .comparar figure{margin:0;text-align:center}
.modal .comparar img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:6px;border:1px solid #e0dbd0;background:
repeating-conic-gradient(#f0ece2 0% 25%, #fff 0% 50%) 50%/16px 16px}
.modal .comparar figcaption{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--oceano);font-weight:700;margin-top:.4rem}
.modal .flecha{font-size:1.4rem;color:var(--laton)}
.modal .info{font-size:.8rem;color:#555;background:var(--arena);border-radius:6px;padding:.6rem .9rem;margin:1rem 0}
.modal .aviso-nota{font-size:.78rem;color:#8a6d3b;margin:.5rem 0 1.25rem}
.modal .botones{display:flex;gap:.75rem;justify-content:flex-end}
.modal .btn-cancelar{background:transparent;border:1px solid #c9c2b2;color:#555}
.progreso{height:8px;background:#e8e2d4;border-radius:99px;overflow:hidden;margin-top:1rem;display:none}
.progreso.ver{display:block}
.progreso div{height:100%;width:0%;background:var(--laton);transition:width .2s}
/* Editor usable desde el teléfono */
@media (max-width:640px){
  .barra{gap:.5rem;padding:.5rem .75rem}
  .barra b{font-size:.95rem}
  .barra select{max-width:140px;font-size:.8rem}
  .barra .disp{display:none} /* en un teléfono ya estás viendo la versión móvil */
  .btn{padding:.5rem .8rem;font-size:.78rem}
  .contador{font-size:.7rem;padding:.25rem .6rem}
  .barra a{margin-left:0;font-size:.75rem}
  .lienzo{padding:.4rem}
  .marco{border-radius:6px}
  .ayuda{display:none}
  .modal{padding:1.25rem}
  .modal .comparar{grid-template-columns:1fr}
  .modal .flecha{transform:rotate(90deg);text-align:center}
  .modal .botones{flex-direction:column-reverse}
  .modal .botones .btn{text-align:center}
}
</style>
</head>
<body>
<div class="barra">
  <b>Vive <span>Mar</span> · Editor</b>
  <select id="pagina">
    <?php foreach ($paginas as $ruta => $nombre): ?>
      <option value="<?= $e($ruta) ?>"><?= $e($nombre) ?></option>
    <?php endforeach; ?>
  </select>
  <div class="disp">
    <button id="d-desktop" class="on">🖥 Escritorio</button>
    <button id="d-movil">📱 Móvil</button>
  </div>
  <span class="contador" id="contador">Sin cambios</span>
  <button class="btn btn-guardar" id="guardar" disabled>💾 Publicar cambios</button>
  <button class="btn btn-desc" id="descartar" disabled>Descartar</button>
  <a href="panel.php">← Volver al panel</a>
</div>

<div class="lienzo"><div class="marco" id="marco"><iframe id="lienzo-iframe" src="/"></iframe></div></div>

<div class="toast" id="toast"></div>
<div class="ayuda">💡 <b>Textos:</b> clic sobre lo punteado en dorado y edita.<br>
<b>Imágenes:</b> clic encima → sube un archivo o elige del 🗂 Media Hub.<br>
Todo queda en cola con vista previa; nada cambia en el sitio hasta que pulses <b>«Publicar cambios»</b>.</div>
<div class="subiendo" id="subiendo">⏳ Subiendo imagen…</div>
<input type="file" id="selector-img" accept="image/*" style="display:none">

<!-- Modal selector de fuente: subir archivo o elegir del Media Hub -->
<div class="modal-fondo" id="modal-fuente">
  <div class="modal" style="max-width:460px;text-align:center;">
    <h2>Cambiar imagen</h2>
    <p class="destino">Vas a cambiar: <code id="fuente-destino"></code></p>
    <div style="display:grid;gap:.75rem;margin:1.25rem 0;">
      <button class="btn btn-guardar" id="fuente-subir" style="padding:1rem;">⬆️ Subir archivo de mi equipo</button>
      <button class="btn" id="fuente-hub" style="padding:1rem;background:var(--teal);color:#fff;">🗂 Elegir del Media Hub</button>
    </div>
    <button class="btn btn-cancelar" id="fuente-cancelar">Cancelar</button>
  </div>
</div>

<!-- Modal galería del Media Hub -->
<div class="modal-fondo" id="modal-hub">
  <div class="modal" style="max-width:860px;">
    <h2>🗂 Media Hub — elige una imagen</h2>
    <div id="hub-chips" style="display:flex;gap:.4rem;flex-wrap:wrap;margin:.75rem 0 .25rem;"></div>
    <input type="text" id="hub-buscar" placeholder="🔎 Buscar por nombre o caption…" style="width:100%;padding:.6rem;border:1px solid #d8d3c6;border-radius:5px;margin:.5rem 0;">
    <div id="hub-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;max-height:50vh;overflow:auto;"></div>
    <div class="botones" style="margin-top:1rem;">
      <button class="btn btn-cancelar" id="hub-cancelar">Cancelar</button>
    </div>
  </div>
</div>
<style>
.hub-chip{border:1.5px solid var(--laton);background:#fff;color:var(--oceano);border-radius:999px;
padding:.3rem .75rem;font-size:.72rem;font-weight:700;cursor:pointer}
.hub-chip.activo{background:var(--laton);color:#fff}
</style>

<!-- Modal de confirmación de reemplazo de imagen -->
<div class="modal-fondo" id="modal-img">
  <div class="modal">
    <h2>¿Reemplazar esta imagen?</h2>
    <p class="destino">Archivo del sitio: <code id="modal-destino"></code></p>
    <div class="comparar">
      <figure>
        <img id="modal-actual" alt="Imagen actual">
        <figcaption>Actual</figcaption>
      </figure>
      <span class="flecha">→</span>
      <figure>
        <img id="modal-nueva" alt="Imagen nueva">
        <figcaption>Nueva</figcaption>
      </figure>
    </div>
    <div class="info" id="modal-info"></div>
    <p class="aviso-nota">📸 Al confirmar, la imagen queda <b>en cola con vista previa</b>. Se aplicará en
    todas las páginas del sitio cuando pulses <b>«Publicar cambios»</b> (el formato se convierte solo si difiere).</p>
    <div class="progreso" id="modal-progreso"><div id="modal-barra"></div></div>
    <div class="botones">
      <button class="btn btn-cancelar" id="modal-cancelar">Cancelar</button>
      <button class="btn btn-guardar" id="modal-confirmar">✅ Sí, reemplazar</button>
    </div>
  </div>
</div>

<script>
const CSRF = <?= json_encode($csrf) ?>;
const iframe = document.getElementById('lienzo-iframe');
const selector = document.getElementById('pagina');
const contador = document.getElementById('contador');
const btnGuardar = document.getElementById('guardar');
const btnDescartar = document.getElementById('descartar');
const toast = document.getElementById('toast');
const subiendo = document.getElementById('subiendo');
const selectorImg = document.getElementById('selector-img');
const marco = document.getElementById('marco');

let cambios = {};      // textos pendientes: id → html
let cambiosImg = {};   // imágenes pendientes: destino → {tipo:'archivo'|'hub', archivo?, origen?, preview}
let imgDestino = null;

function avisar(msg, ms = 2600) {
  toast.textContent = msg;
  toast.classList.add('ver');
  setTimeout(() => toast.classList.remove('ver'), ms);
}

function hayPendientes() {
  return Object.keys(cambios).length + Object.keys(cambiosImg).length > 0;
}

function refrescarContador() {
  const t = Object.keys(cambios).length;
  const i = Object.keys(cambiosImg).length;
  const partes = [];
  if (t) partes.push(`${t} texto(s)`);
  if (i) partes.push(`${i} imagen(es)`);
  contador.textContent = partes.length ? partes.join(' · ') + ' sin publicar' : 'Sin cambios';
  contador.classList.toggle('hay', partes.length > 0);
  btnGuardar.disabled = !hayPendientes();
  btnDescartar.disabled = !hayPendientes();
}

function limpiarPendientes() {
  Object.values(cambiosImg).forEach((c) => {
    if (c.preview && c.preview.startsWith('blob:')) URL.revokeObjectURL(c.preview);
  });
  cambios = {};
  cambiosImg = {};
  refrescarContador();
}

function cargar(ruta) {
  iframe.src = ruta + (ruta.includes('?') ? '&' : '?') + 'cmsv=' + Date.now();
}

iframe.addEventListener('load', () => {
  // activa el modo edición dentro de la página cargada
  iframe.contentWindow.postMessage({ tipo: 'cms-activar' }, window.location.origin);
});

window.addEventListener('message', (ev) => {
  if (ev.origin !== window.location.origin) return;
  const d = ev.data || {};
  if (d.tipo === 'cms-listo') avisar('✏️ Modo edición activo: haz clic sobre los textos o imágenes');
  if (d.tipo === 'cms-cambio') { cambios[d.id] = d.valor; refrescarContador(); }
  if (d.tipo === 'cms-img') {
    imgDestino = d.src.split('/').pop().split('?')[0];
    document.getElementById('fuente-destino').textContent = '/img/' + imgDestino;
    modalFuente.classList.add('ver');
  }
});

// ---- Selector de fuente: subir vs Media Hub ----
const modalFuente = document.getElementById('modal-fuente');
const modalHub = document.getElementById('modal-hub');
const hubGrid = document.getElementById('hub-grid');
const hubBuscar = document.getElementById('hub-buscar');
let hubArchivos = [];
let fuente = 'archivo'; // 'archivo' | 'hub'
let hubOrigen = null;

document.getElementById('fuente-cancelar').addEventListener('click', () => modalFuente.classList.remove('ver'));
document.getElementById('fuente-subir').addEventListener('click', () => {
  modalFuente.classList.remove('ver');
  fuente = 'archivo';
  selectorImg.click();
});
document.getElementById('fuente-hub').addEventListener('click', async () => {
  modalFuente.classList.remove('ver');
  fuente = 'hub';
  const fd = new FormData();
  fd.append('accion', 'listar_media');
  const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
  const j = await r.json();
  if (!j.ok) { avisar('⚠️ No pude cargar el Media Hub', 4000); return; }
  hubArchivos = j.archivos.filter((a) => a.nombre !== imgDestino);
  pintarHubChips();
  pintarHub();
  modalHub.classList.add('ver');
});

let hubCat = '';

function pintarHubChips() {
  const conteos = {};
  hubArchivos.forEach((a) => { const c = a.categoria || 'sin-clasificar'; conteos[c] = (conteos[c] || 0) + 1; });
  const chips = document.getElementById('hub-chips');
  chips.innerHTML =
    `<button class="hub-chip ${hubCat === '' ? 'activo' : ''}" data-cat="">Todas (${hubArchivos.length})</button>` +
    Object.keys(conteos).sort().map((c) =>
      `<button class="hub-chip ${hubCat === c ? 'activo' : ''}" data-cat="${c}">${c} (${conteos[c]})</button>`
    ).join('');
  chips.querySelectorAll('.hub-chip').forEach((b) =>
    b.addEventListener('click', () => { hubCat = b.dataset.cat; pintarHubChips(); pintarHub(); })
  );
}

function pintarHub() {
  const q = hubBuscar.value.trim().toLowerCase();
  hubGrid.innerHTML = hubArchivos
    .filter((a) =>
      (hubCat === '' || (a.categoria || 'sin-clasificar') === hubCat) &&
      (a.nombre.toLowerCase().includes(q) || (a.caption || '').toLowerCase().includes(q))
    )
    .map(
      (a, i) => `
      <div data-i="${i}" data-nombre="${a.nombre}" title="${(a.caption || '').replace(/"/g, '&quot;')}" style="cursor:pointer;border:2px solid transparent;border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 4px 12px rgba(14,42,58,.1);"
           onmouseover="this.style.borderColor='#b08a57'" onmouseout="this.style.borderColor='transparent'">
        <img src="${a.url}" style="width:100%;aspect-ratio:16/10;object-fit:cover;display:block;">
        <div style="font-size:.65rem;padding:.35rem;word-break:break-all;color:#0e2a3a;font-weight:600;">${a.nombre}<br><span style="color:#999;font-weight:400;">${a.kb} KB · ${a.categoria || ''}</span></div>
      </div>`
    )
    .join('');
}

hubBuscar.addEventListener('input', pintarHub);
document.getElementById('hub-cancelar').addEventListener('click', () => modalHub.classList.remove('ver'));

hubGrid.addEventListener('click', (e) => {
  const item = e.target.closest('[data-nombre]');
  if (!item) return;
  hubOrigen = item.dataset.nombre;
  const info = hubArchivos.find((a) => a.nombre === hubOrigen);
  modalHub.classList.remove('ver');
  // Reutiliza el modal de confirmación con la imagen del hub
  modalDestino.textContent = '/img/' + imgDestino;
  modalActual.src = '/img/' + imgDestino + '?cmsv=' + Date.now();
  modalNueva.src = info.url;
  modalInfo.textContent = `🗂 Del Media Hub: ${info.nombre} · ${info.kb} KB${info.ancho ? ` · ${info.ancho}×${info.alto}px` : ''}`;
  modal.classList.add('ver');
});

// ---- Flujo de reemplazo con validación previa ----
const modal = document.getElementById('modal-img');
const modalActual = document.getElementById('modal-actual');
const modalNueva = document.getElementById('modal-nueva');
const modalDestino = document.getElementById('modal-destino');
const modalInfo = document.getElementById('modal-info');
const modalProgreso = document.getElementById('modal-progreso');
const modalBarra = document.getElementById('modal-barra');
const modalConfirmar = document.getElementById('modal-confirmar');
const modalCancelar = document.getElementById('modal-cancelar');
let archivoPendiente = null;
let urlPreview = null;

function cerrarModal() {
  modal.classList.remove('ver');
  modalProgreso.classList.remove('ver');
  modalBarra.style.width = '0%';
  modalConfirmar.disabled = false;
  modalCancelar.disabled = false;
  if (urlPreview) { URL.revokeObjectURL(urlPreview); urlPreview = null; }
  archivoPendiente = null;
}

selectorImg.addEventListener('change', () => {
  const archivo = selectorImg.files[0];
  selectorImg.value = '';
  if (!archivo || !imgDestino) return;

  archivoPendiente = archivo;
  urlPreview = URL.createObjectURL(archivo);
  modalDestino.textContent = '/img/' + imgDestino;
  modalActual.src = '/img/' + imgDestino + '?cmsv=' + Date.now();
  modalNueva.src = urlPreview;

  const kb = Math.round(archivo.size / 1024);
  const img = new Image();
  img.onload = () => {
    modalInfo.textContent = `📄 ${archivo.name} · ${kb} KB · ${img.naturalWidth}×${img.naturalHeight} px`;
    if (kb > 4096) modalInfo.textContent += ' — ⚠️ archivo pesado, puede tardar y hacer lento el sitio';
  };
  img.onerror = () => { modalInfo.textContent = `📄 ${archivo.name} · ${kb} KB (vista previa no disponible; se convertirá en el servidor)`; };
  img.src = urlPreview;

  modal.classList.add('ver');
});

modalCancelar.addEventListener('click', () => { cerrarModal(); avisar('Reemplazo cancelado'); });
modal.addEventListener('click', (e) => { if (e.target === modal && !modalConfirmar.disabled) cerrarModal(); });

// Confirmar en el modal = poner la imagen EN COLA (se sube al pulsar «Publicar cambios»)
modalConfirmar.addEventListener('click', () => {
  if (!imgDestino) return;
  const destino = imgDestino;
  let preview = null;

  if (fuente === 'hub' && hubOrigen) {
    const info = hubArchivos.find((a) => a.nombre === hubOrigen);
    preview = info ? info.url : null;
    cambiosImg[destino] = { tipo: 'hub', origen: hubOrigen, preview };
    hubOrigen = null;
  } else if (archivoPendiente) {
    preview = URL.createObjectURL(archivoPendiente);
    cambiosImg[destino] = { tipo: 'archivo', archivo: archivoPendiente, preview };
    archivoPendiente = null;
    urlPreview = null; // la vista previa del modal ya no se revoca: la usa el lienzo
  } else {
    return;
  }

  cerrarModal();
  // Vista previa inmediata en el lienzo, sin tocar el servidor todavía
  iframe.contentWindow.postMessage(
    { tipo: 'cms-img-preview', src: '/img/' + destino, preview },
    window.location.origin
  );
  refrescarContador();
  avisar('📸 Imagen en cola. Pulsa «Publicar cambios» para aplicarla.', 4000);
});

async function apiForm(datos) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(datos)) fd.append(k, v);
  const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
  return r.json();
}

btnGuardar.addEventListener('click', async () => {
  btnGuardar.disabled = true;
  btnDescartar.disabled = true;
  const imagenes = Object.entries(cambiosImg);
  const totalPasos = imagenes.length + (Object.keys(cambios).length ? 1 : 0);
  let paso = 0;
  const errores = [];

  try {
    // 1) Imágenes en cola
    for (const [destino, cambio] of imagenes) {
      paso++;
      avisar(`⏳ Publicando ${paso}/${totalPasos}: ${destino}…`, 60000);
      const j = cambio.tipo === 'hub'
        ? await apiForm({ accion: 'aplicar_desde_hub', origen: cambio.origen, destino })
        : await apiForm({ accion: 'reemplazar_imagen', destino, archivo: cambio.archivo });
      if (!j.ok) errores.push(`${destino}: ${j.error || 'error'}`);
    }

    // 2) Textos
    let textosOk = 0;
    if (Object.keys(cambios).length) {
      paso++;
      avisar(`⏳ Publicando ${paso}/${totalPasos}: textos…`, 60000);
      const j = await apiForm({ accion: 'guardar_copies', copies: JSON.stringify(cambios) });
      if (j.ok) textosOk = j.guardados;
      else errores.push('textos: ' + (j.error || 'error'));
    }

    if (errores.length) {
      avisar('⚠️ Publicado con errores: ' + errores.join(' · '), 7000);
    } else {
      avisar(`✅ Publicado: ${imagenes.length} imagen(es) y ${textosOk} texto(s) ya están en el sitio`, 4500);
    }
    limpiarPendientes();
    cargar(selector.value); // recarga con todo ya publicado
  } catch (e) {
    avisar('⚠️ Error de red al publicar', 5000);
    refrescarContador();
  }
});

btnDescartar.addEventListener('click', () => {
  limpiarPendientes();
  cargar(selector.value);
  avisar('Cambios descartados');
});

selector.addEventListener('change', () => {
  if (hayPendientes() &&
      !confirm('Tienes cambios sin publicar. ¿Cambiar de página y descartarlos?')) {
    return;
  }
  limpiarPendientes();
  cargar(selector.value);
});

document.getElementById('d-desktop').addEventListener('click', function () {
  marco.classList.remove('movil');
  this.classList.add('on');
  document.getElementById('d-movil').classList.remove('on');
});
document.getElementById('d-movil').addEventListener('click', function () {
  marco.classList.add('movil');
  this.classList.add('on');
  document.getElementById('d-desktop').classList.remove('on');
});

window.addEventListener('beforeunload', (e) => {
  if (hayPendientes()) e.preventDefault();
});

cargar('/');
</script>
</body>
</html>
