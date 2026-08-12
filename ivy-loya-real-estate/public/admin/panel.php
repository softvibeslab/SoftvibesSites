<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();

$contentWritable = is_writable(dirname(cms_content_path()));
$uploadsWritable = is_dir(cms_upload_dir()) ? is_writable(cms_upload_dir()) : is_writable(dirname(cms_upload_dir()));
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Panel | Ivy CMS</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="admin-header">
    <a class="admin-brand" href="panel.php"><span>IL</span><strong>Ivy CMS</strong></a>
    <nav><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav>
  </header>
  <main class="admin-shell">
    <div class="admin-titlebar"><div><p class="admin-eyebrow">Panel privado</p><h1>Hola, <?= cms_e((string) $_SESSION['cms_user']) ?>.</h1><p class="admin-muted">El contenido público se actualiza desde un único archivo controlado.</p></div><a class="admin-button" href="editor.php">Abrir editor</a></div>
    <section class="admin-cards">
      <a class="admin-card" href="editor.php"><span class="admin-card__icon">Aa</span><h2>Textos y SEO</h2><p>Edita ambos idiomas, llamadas a la acción y metadatos.</p><b>Editar →</b></a>
      <a class="admin-card" href="editor.php#properties"><span class="admin-card__icon">⌂</span><h2>Propiedades</h2><p>Actualiza proyecto, ubicación, estado, imagen y enlace.</p><b>Editar →</b></a>
      <a class="admin-card" href="editor.php#media"><span class="admin-card__icon">▧</span><h2>Biblioteca</h2><p>Carga JPG, PNG o WebP y copia la ruta de uso.</p><b>Abrir →</b></a>
    </section>
    <section class="system-status">
      <h2>Estado del sistema</h2>
      <div><span class="status-dot <?= $contentWritable ? 'ok' : 'bad' ?>"></span><strong>Contenido</strong><small><?= $contentWritable ? 'Carpeta editable' : 'Sin permiso de escritura' ?></small></div>
      <div><span class="status-dot <?= $uploadsWritable ? 'ok' : 'bad' ?>"></span><strong>Imágenes</strong><small><?= $uploadsWritable ? 'Carga disponible' : 'Sin permiso de escritura' ?></small></div>
      <div><span class="status-dot ok"></span><strong>Credenciales</strong><small>Definidas fuera del código</small></div>
    </section>
  </main>
</body>
</html>
