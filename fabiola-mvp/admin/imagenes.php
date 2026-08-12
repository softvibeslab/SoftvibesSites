<?php
require_once __DIR__ . '/lib.php';
requiere_login();

$mensaje = '';
$tipo = 'ok';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verificar();
    $accion = $_POST['accion'] ?? '';

    if ($accion === 'subir') {
        $archivo = $_FILES['archivo'] ?? [];
        $nombre = strtolower(preg_replace('/[^a-zA-Z0-9._-]/', '-', basename($archivo['name'] ?? 'imagen')));
        $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
        if (in_array($ext, CMS_EXT_CONVERTIR, true)) {
            $nombre = preg_replace('/\.[^.]+$/', '.jpg', $nombre);
        }
        [$ok, $res] = guardar_imagen($archivo, CMS_IMG . '/' . $nombre);
        $mensaje = $ok ? "✅ Imagen «{$nombre}» subida ({$res}). Ruta para usarla: /img/{$nombre}" : $res;
        $tipo = $ok ? 'ok' : 'error';
    }

    if ($accion === 'reemplazar') {
        $destino = basename($_POST['destino'] ?? '');
        if (!is_file(CMS_IMG . '/' . $destino)) {
            $mensaje = 'La imagen a reemplazar no existe.';
            $tipo = 'error';
        } else {
            [$ok, $res] = guardar_imagen($_FILES['archivo'] ?? [], CMS_IMG . '/' . $destino);
            $mensaje = $ok ? "✅ «{$destino}» reemplazada ({$res}). El cambio ya es visible en todo el sitio." : $res;
            $tipo = $ok ? 'ok' : 'error';
        }
    }

    if ($accion === 'eliminar') {
        $destino = basename($_POST['destino'] ?? '');
        if (is_file(CMS_IMG . '/' . $destino)) {
            unlink(CMS_IMG . '/' . $destino);
            $mensaje = "🗑 «{$destino}» eliminada. Ojo: si alguna página la usaba, mostrará imagen rota.";
        }
    }
}

$imgs = glob(CMS_IMG . '/*.{jpg,jpeg,png,webp,svg,gif,avif}', GLOB_BRACE) ?: [];
sort($imgs);
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES);

panel_inicio('Imágenes', 'imagenes');
?>
<h1>Imágenes del sitio</h1>
<?php if ($mensaje): ?><div class="aviso aviso--<?= $tipo ?>"><?= $e($mensaje) ?></div><?php endif; ?>

<div class="tarjeta" id="dropzone" style="border:2px dashed var(--laton);text-align:center;transition:background .15s;">
  <strong>⬆️ Subir imagen nueva</strong>
  <p style="font-size:.85rem;color:#777;margin:.4rem 0 .8rem;">
    <b>Arrastra y suelta</b> archivos aquí (o sobre cualquier imagen de abajo para reemplazarla), o usa el botón.
  </p>
  <form method="post" enctype="multipart/form-data" style="display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;justify-content:center;">
    <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
    <input type="hidden" name="accion" value="subir">
    <input type="file" name="archivo" accept="image/*" required>
    <button type="submit" class="boton">Subir</button>
  </form>
</div>

<div class="grid-img">
  <?php foreach ($imgs as $ruta): $nombre = basename($ruta); ?>
    <div class="img-item" data-nombre="<?= $e($nombre) ?>">
      <img src="/img/<?= $e($nombre) ?>?v=<?= filemtime($ruta) ?>" alt="<?= $e($nombre) ?>" loading="lazy">
      <div class="cuerpo">
        <code><?= $e($nombre) ?></code>
        <?= number_format(filesize($ruta) / 1024) ?> KB
        <form method="post" enctype="multipart/form-data" style="margin-top:.5rem;">
          <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
          <input type="hidden" name="accion" value="reemplazar">
          <input type="hidden" name="destino" value="<?= $e($nombre) ?>">
          <input type="file" name="archivo" accept="image/*" required style="font-size:.7rem;max-width:100%;">
          <div class="acciones">
            <button type="submit" class="boton">Reemplazar</button>
          </div>
        </form>
        <form method="post" onsubmit="return confirm('¿Eliminar <?= $e($nombre) ?>? Esta acción no se puede deshacer.');">
          <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
          <input type="hidden" name="accion" value="eliminar">
          <input type="hidden" name="destino" value="<?= $e($nombre) ?>">
          <div class="acciones"><button type="submit" class="boton boton--peligro">Eliminar</button></div>
        </form>
      </div>
    </div>
  <?php endforeach; ?>
</div>

<script>
// Drag & drop: soltar sobre el recuadro sube una imagen nueva;
// soltar sobre una tarjeta reemplaza esa imagen.
const CSRF = <?= json_encode(csrf_token()) ?>;

async function enviar(accion, archivo, destino) {
  const fd = new FormData();
  fd.append('accion', accion);
  fd.append('archivo', archivo);
  if (destino) fd.append('destino', destino);
  const r = await fetch('api.php', { method: 'POST', body: fd, headers: { 'X-CSRF': CSRF } });
  return r.json();
}

function preparar(el, alSoltar) {
  ['dragenter', 'dragover'].forEach((ev) =>
    el.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.style.background = '#fdf3e3';
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    el.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.style.background = '';
    })
  );
  el.addEventListener('drop', (e) => {
    const archivo = e.dataTransfer.files[0];
    if (archivo) alSoltar(archivo);
  });
}

preparar(document.getElementById('dropzone'), async (archivo) => {
  const j = await enviar('subir_imagen', archivo);
  alert(j.ok ? '✅ ' + j.mensaje : '⚠️ ' + j.error);
  if (j.ok) location.reload();
});

document.querySelectorAll('.img-item').forEach((item) => {
  preparar(item, async (archivo) => {
    const nombre = item.dataset.nombre;
    if (!confirm(`¿Reemplazar «${nombre}» con «${archivo.name}»? El cambio será visible en todo el sitio.`)) return;
    const j = await enviar('reemplazar_imagen', archivo, nombre);
    alert(j.ok ? '✅ ' + j.mensaje : '⚠️ ' + j.error);
    if (j.ok) location.reload();
  });
});
</script>
<?php panel_fin();
