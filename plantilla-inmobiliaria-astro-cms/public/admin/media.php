<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    [$ok, $result] = store_uploaded_image($_FILES['image'] ?? [], ($_POST['replace'] ?? '') !== '' ? (string) $_POST['replace'] : null);
    if ($ok) {
        $meta = read_json('media');
        $meta[$result] = ['caption' => trim((string) ($_POST['caption'] ?? '')), 'updated_at' => gmdate(DATE_ATOM)];
        write_json('media', $meta);
        $message = "Imagen guardada como $result.";
    } else {
        $error = $result;
    }
}
$meta = read_json('media');
$images = glob(CMS_IMAGES . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [];
sort($images);
admin_header('Medios', 'media');
?>
<h1>Biblioteca de medios</h1>
<p class="notice">Se bloquean SVG y formatos no verificables. Tamaño máximo: <?= h((string) round(CMS_MAX_UPLOAD / 1024 / 1024)) ?> MB.</p>
<?php if ($message): ?><p class="notice"><?= h($message) ?></p><?php endif; ?><?php if ($error): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
<form method="post" enctype="multipart/form-data" class="card"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><div class="row"><label>Imagen<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required></label><label>Reemplazar archivo existente<select name="replace"><option value="">Subir como archivo nuevo</option><?php foreach ($images as $path): ?><option value="<?= h(basename($path)) ?>"><?= h(basename($path)) ?></option><?php endforeach; ?></select></label></div><label>Descripción interna<input name="caption" maxlength="240"></label><button type="submit">Guardar imagen</button></form>
<div class="list"><?php foreach ($images as $path): $name = basename($path); ?><article class="list-item"><img class="thumb" src="../img/<?= h($name) ?>?v=<?= filemtime($path) ?>" alt=""><div style="flex:1"><strong><?= h($name) ?></strong><div class="muted"><?= h((string) round(filesize($path) / 1024)) ?> KB · <?= h((string) ($meta[$name]['caption'] ?? 'Sin descripción')) ?></div></div><button type="button" class="button secondary" data-copy="/img/<?= h($name) ?>">Copiar ruta</button></article><?php endforeach; ?></div>
<script>document.querySelectorAll('[data-copy]').forEach((button)=>button.addEventListener('click',async()=>{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='Copiada';}));</script>
<?php admin_footer();
