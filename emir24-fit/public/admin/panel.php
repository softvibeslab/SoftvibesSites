<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();
$contentWritable = is_writable(dirname(cms_content_path()));
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Panel | Emir24 CMS</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="admin-header">
    <a class="admin-brand" href="panel.php"><span>E24</span><strong>Emir24 CMS</strong></a>
    <nav><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav>
  </header>
  <main class="admin-shell">
    <div class="titlebar"><div><p class="eyebrow">Panel privado</p><h1>Hola, <?= cms_e((string) $_SESSION['cms_user']) ?>.</h1><p class="muted">El contenido público vive en un JSON controlado y respaldado al guardar.</p></div><a class="primary-button" href="editor.php">Abrir editor</a></div>
    <section class="admin-cards">
      <a href="editor.php#portada"><span>01</span><h2>Portada</h2><p>Propuesta, llamadas a la acción y ubicación.</p><b>Editar →</b></a>
      <a href="editor.php#modalidades"><span>02</span><h2>Modalidades</h2><p>Presencial, online y mensajes de WhatsApp.</p><b>Editar →</b></a>
      <a href="editor.php#confianza"><span>03</span><h2>Confianza</h2><p>Bio, preguntas frecuentes y SEO.</p><b>Editar →</b></a>
    </section>
    <section class="status-card"><h2>Estado del sistema</h2><div><i class="<?= $contentWritable ? 'ok' : 'bad' ?>"></i><strong>Contenido</strong><small><?= $contentWritable ? 'Carpeta editable' : 'Sin permiso de escritura' ?></small></div><div><i class="<?= cms_is_configured() ? 'ok' : 'bad' ?>"></i><strong>Credenciales</strong><small><?= cms_is_configured() ? 'Definidas fuera del código' : 'Configuración pendiente' ?></small></div><div><i class="ok"></i><strong>Seguridad</strong><small>Sesión, CSRF y respaldo habilitados</small></div></section>
  </main>
</body>
</html>

