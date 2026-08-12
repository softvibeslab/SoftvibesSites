<?php
require_once __DIR__ . '/lib.php';
requiere_login();

$campos = escanear_copies();
$imgs = glob(CMS_IMG . '/*.{jpg,jpeg,png,webp,svg,gif,avif}', GLOB_BRACE) ?: [];
$guardados = leer_guardados();

panel_inicio('Inicio', 'panel');
?>
<h1>Hola, Roger 👋</h1>
<div class="tarjeta">
  <p style="margin:0 0 1rem;">Desde aquí administras el contenido del sitio de Suemi García sin tocar código.</p>
  <p><a class="boton boton--laton" href="editor.php" style="font-size:1rem;">✨ Abrir editor visual — edita el sitio haciendo clic sobre él</a></p>
  <p><a class="boton" href="mediahub.php">🗂 Media Hub (<?= count($imgs) ?> archivos)</a>
  <a class="boton" href="copies.php">✏️ Copies en modo formulario (<?= count($campos) ?>)</a>
  <a class="boton" href="imagenes.php">🖼 Administrar imágenes (<?= count($imgs) ?>)</a></p>
</div>
<div class="tarjeta">
  <strong>Cómo funciona</strong>
  <ul style="font-size:.9rem; line-height:1.7;">
    <li><b>Copies:</b> editas el texto y se publica al instante en todas las páginas donde aparece.</li>
    <li><b>Imágenes:</b> si reemplazas una imagen conservando su nombre, cambia en todo el sitio de inmediato.</li>
    <li><b>Respaldo:</b> tus cambios de texto quedan guardados (<?= count($guardados) ?> registrados). Si Softvibes
        republica el sitio, usa el botón <em>«Reaplicar cambios guardados»</em> en Copies para restaurarlos.</li>
  </ul>
</div>
<?php panel_fin();
