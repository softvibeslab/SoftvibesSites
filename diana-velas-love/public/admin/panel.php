<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();
$content = cms_read_content();
$contentWritable = is_writable(dirname(cms_content_path()));
$visibleProducts = count(array_filter($content['products'], static fn(array $product): bool => (bool) ($product['visible'] ?? false)));
$whatsappReady = preg_match('/^\d{10,15}$/', (string) ($content['contact']['whatsappNumber'] ?? '')) === 1;
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Panel | Diana CMS</title><link rel="stylesheet" href="admin.css"></head>
<body>
  <header class="admin-header"><a class="admin-brand" href="panel.php"><span>✿</span><strong>Diana CMS</strong></a><nav><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav></header>
  <main class="admin-shell">
    <div class="titlebar"><div><p class="eyebrow">Panel privado</p><h1>Hola, <?= cms_e((string) $_SESSION['cms_user']) ?>.</h1><p class="muted">El sitio lee un JSON respaldado al guardar. Los cambios de catálogo aparecen sin recompilar.</p></div><a class="primary-button" href="editor.php">Abrir editor</a></div>
    <section class="admin-cards"><a href="editor.php#contacto"><span>01</span><h2>Contacto</h2><p>WhatsApp, Instagram, ubicación y estado público.</p><b>Editar →</b></a><a href="editor.php#productos"><span>02</span><h2>Catálogo</h2><p><?= $visibleProducts ?> productos visibles, fichas y mensajes individuales.</p><b>Editar →</b></a><a href="editor.php#contenido"><span>03</span><h2>Contenido</h2><p>Portada, proceso, preguntas, cierre y SEO.</p><b>Editar →</b></a></section>
    <section class="status-card"><h2>Estado del sistema</h2><div><i class="<?= $contentWritable ? 'ok' : 'bad' ?>"></i><strong>Contenido</strong><small><?= $contentWritable ? 'Carpeta editable' : 'Sin permiso de escritura' ?></small></div><div><i class="<?= cms_is_configured() ? 'ok' : 'bad' ?>"></i><strong>Credenciales</strong><small><?= cms_is_configured() ? 'Definidas fuera del código' : 'Configuración pendiente' ?></small></div><div><i class="<?= $whatsappReady ? 'ok' : 'warn' ?>"></i><strong>WhatsApp</strong><small><?= $whatsappReady ? 'Número configurado' : 'Número pendiente; no publicar' ?></small></div><div><i class="ok"></i><strong>Seguridad</strong><small>Sesión, CSRF y respaldo habilitados</small></div></section>
  </main>
</body>
</html>
