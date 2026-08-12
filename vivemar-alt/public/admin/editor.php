<?php
// Editor visual: el sitio real en un iframe, edición al hacer clic, guardado en vivo
require_once __DIR__ . '/lib.php';
requiere_login();

$paginas = [
    '/' => 'Inicio',
    '/propiedades/' => 'Catálogo de propiedades',
    '/propiedades/penthouse-corasol-playa-del-carmen/' => 'Ficha · Penthouse Corasol',
    '/propiedades/lotes-selva-serena-guadalupe-victoria/' => 'Ficha · Lotes Selva Serena',
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
<title>Editor visual · CMS Vive Mar</title>
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
<div class="ayuda">💡 <b>Haz clic sobre cualquier texto</b> punteado en dorado para editarlo ahí mismo.
<b>Clic en una imagen</b> para reemplazarla. Al terminar, «Publicar cambios».</div>
<div class="subiendo" id="subiendo">⏳ Subiendo imagen…</div>
<input type="file" id="selector-img" accept=".jpg,.jpeg,.png,.webp,.svg" style="display:none">

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

let cambios = {};
let imgDestino = null;

function avisar(msg, ms = 2600) {
  toast.textContent = msg;
  toast.classList.add('ver');
  setTimeout(() => toast.classList.remove('ver'), ms);
}

function refrescarContador() {
  const n = Object.keys(cambios).length;
  contador.textContent = n ? `${n} cambio(s) sin publicar` : 'Sin cambios';
  contador.classList.toggle('hay', n > 0);
  btnGuardar.disabled = n === 0;
  btnDescartar.disabled = n === 0;
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
    avisar(`Reemplazar «${imgDestino}»: elige el archivo nuevo…`, 4000);
    selectorImg.click();
  }
});

selectorImg.addEventListener('change', async () => {
  const archivo = selectorImg.files[0];
  selectorImg.value = '';
  if (!archivo || !imgDestino) return;
  subiendo.classList.add('ver');
  const fd = new FormData();
  fd.append('accion', 'reemplazar_imagen');
  fd.append('destino', imgDestino);
  fd.append('archivo', archivo);
  try {
    const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
    const j = await r.json();
    subiendo.classList.remove('ver');
    if (j.ok) { avisar('✅ ' + j.mensaje); cargar(selector.value); }
    else avisar('⚠️ ' + (j.error || 'Error al subir'), 4000);
  } catch (e) {
    subiendo.classList.remove('ver');
    avisar('⚠️ Error de red al subir la imagen', 4000);
  }
});

btnGuardar.addEventListener('click', async () => {
  btnGuardar.disabled = true;
  const fd = new FormData();
  fd.append('accion', 'guardar_copies');
  fd.append('copies', JSON.stringify(cambios));
  try {
    const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
    const j = await r.json();
    if (j.ok) {
      avisar(`✅ ${j.guardados} texto(s) publicados en el sitio`);
      cambios = {};
      refrescarContador();
    } else {
      avisar('⚠️ ' + (j.error || 'Error al publicar'), 4000);
      btnGuardar.disabled = false;
    }
  } catch (e) {
    avisar('⚠️ Error de red al publicar', 4000);
    btnGuardar.disabled = false;
  }
});

btnDescartar.addEventListener('click', () => {
  cambios = {};
  refrescarContador();
  cargar(selector.value);
  avisar('Cambios descartados');
});

selector.addEventListener('change', () => {
  if (Object.keys(cambios).length &&
      !confirm('Tienes cambios sin publicar. ¿Cambiar de página y descartarlos?')) {
    return;
  }
  cambios = {};
  refrescarContador();
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
  if (Object.keys(cambios).length) e.preventDefault();
});

cargar('/');
</script>
</body>
</html>
