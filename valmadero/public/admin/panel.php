<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$copies = scan_copies();
$content = read_json('content', ['properties' => [], 'blog' => []]);
$images = glob(CMS_IMAGES . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [];
admin_header('Inicio', 'panel');
?>
<h1>Panel del sitio</h1>
<p class="notice">Los copies, datos de contacto e imágenes se aplican al sitio publicado. Propiedades y artículos se guardan como contenido estructurado para exportar y recompilar Astro.</p>
<div class="grid">
  <section class="card"><div class="metric"><?= count($copies) ?></div><strong>copies editables</strong><p class="muted">Marcados con <code>data-cms</code>.</p><a class="button" href="copies.php">Editar copies</a></section>
  <section class="card"><div class="metric"><?= count($content['properties'] ?? []) ?></div><strong>propiedades</strong><p class="muted">Inventario estructurado.</p><a class="button" href="content.php?collection=properties">Administrar</a></section>
  <section class="card"><div class="metric"><?= count($images) ?></div><strong>imágenes</strong><p class="muted">JPG, PNG, WebP o GIF.</p><a class="button" href="media.php">Abrir medios</a></section>
</div>
<section class="card"><h2>Flujo recomendado</h2><ol><li>Edita copies, contacto e imágenes para cambios inmediatos.</li><li>Gestiona propiedades y blog como borradores estructurados.</li><li>Exporta el contenido, sincronízalo con <code>npm run import:cms</code> y ejecuta un nuevo build.</li></ol></section>
<?php admin_footer();
