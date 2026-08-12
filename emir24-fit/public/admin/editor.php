<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();

$notice = '';
$error = '';
$content = cms_read_content();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!cms_verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'La sesión expiró. Recarga e inténtalo de nuevo.';
    } else {
        try {
            $content = cms_sanitize_content($_POST);
            cms_save_content($content);
            $notice = 'Cambios guardados. La landing los cargará al volver a abrirse.';
        } catch (Throwable $exception) {
            $error = $exception instanceof InvalidArgumentException
                ? $exception->getMessage()
                : 'No fue posible guardar. Revisa permisos y formato.';
        }
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Editor | Emir24 CMS</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="admin-header">
    <a class="admin-brand" href="panel.php"><span>E24</span><strong>Editor de contenido</strong></a>
    <nav><a href="panel.php">Panel</a><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav>
  </header>
  <main class="editor-shell">
    <aside><p class="eyebrow">Edición segura</p><h1>Contenido</h1><p class="muted">Guarda solo información confirmada. Los cambios de SEO requieren recompilar para quedar en el HTML inicial.</p><nav><a href="#marca">Marca</a><a href="#portada">Portada</a><a href="#modalidades">Modalidades</a><a href="#confianza">Coach + FAQ</a><a href="#cierre">Cierre + SEO</a></nav></aside>
    <form class="editor-form" method="post">
      <input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>">
      <?php if ($notice !== ''): ?><div class="notice success"><?= cms_e($notice) ?></div><?php endif; ?>
      <?php if ($error !== ''): ?><div class="notice error"><?= cms_e($error) ?></div><?php endif; ?>

      <section id="marca"><div class="section-title"><span>01</span><div><h2>Marca y contacto</h2><p>Enlaces públicos y ubicación mostrada en la landing.</p></div></div><div class="field-grid">
        <label>Nombre<input name="brand[name]" maxlength="80" value="<?= cms_e($content['brand']['name']) ?>" required></label>
        <label>Descriptor<input name="brand[descriptor]" maxlength="180" value="<?= cms_e($content['brand']['descriptor']) ?>" required></label>
        <label class="full">Instagram<input type="url" name="contact[instagram]" value="<?= cms_e($content['contact']['instagram']) ?>" required></label>
        <label class="full">WhatsApp base<input type="url" name="contact[whatsapp]" value="<?= cms_e($content['contact']['whatsapp']) ?>" required></label>
        <label class="full">Ubicación<input name="contact[location]" maxlength="180" value="<?= cms_e($content['contact']['location']) ?>" required></label>
      </div></section>

      <section id="portada"><div class="section-title"><span>02</span><div><h2>Portada</h2><p>Mensaje principal y accesos a cada modalidad.</p></div></div><div class="field-grid">
        <label>Antetítulo<input name="hero[eyebrow]" value="<?= cms_e($content['hero']['eyebrow']) ?>" required></label>
        <label>Título<input name="hero[title]" value="<?= cms_e($content['hero']['title']) ?>" required></label>
        <label class="full">Resumen<textarea name="hero[summary]" required><?= cms_e($content['hero']['summary']) ?></textarea></label>
        <label>CTA presencial<input name="hero[primaryCta]" value="<?= cms_e($content['hero']['primaryCta']) ?>" required></label>
        <label>CTA online<input name="hero[secondaryCta]" value="<?= cms_e($content['hero']['secondaryCta']) ?>" required></label>
      </div></section>

      <section id="modalidades"><div class="section-title"><span>03</span><div><h2>Modalidades</h2><p>Un detalle por línea. El mensaje abre WhatsApp precargado.</p></div></div>
        <?php foreach ($content['services'] as $index => $service): ?>
          <fieldset><legend><?= $index === 0 ? 'Entrenamiento presencial' : 'Asesoría online' ?></legend><div class="field-grid">
            <label>Etiqueta<input name="services[<?= $index ?>][tag]" value="<?= cms_e($service['tag']) ?>" required></label>
            <label>Título<input name="services[<?= $index ?>][title]" value="<?= cms_e($service['title']) ?>" required></label>
            <label class="full">Resumen<textarea name="services[<?= $index ?>][summary]" required><?= cms_e($service['summary']) ?></textarea></label>
            <label class="full">Detalles<textarea name="services[<?= $index ?>][details]" required><?= cms_e(implode("\n", $service['details'])) ?></textarea></label>
            <label>Texto del botón<input name="services[<?= $index ?>][cta]" value="<?= cms_e($service['cta']) ?>" required></label>
            <label class="full">Mensaje de WhatsApp<textarea name="services[<?= $index ?>][message]" required><?= cms_e($service['message']) ?></textarea></label>
          </div></fieldset>
        <?php endforeach; ?>
      </section>

      <section id="confianza"><div class="section-title"><span>04</span><div><h2>Coach y preguntas</h2><p>No publiques credenciales ni resultados sin verificar.</p></div></div><div class="field-grid">
        <label>Antetítulo<input name="about[eyebrow]" value="<?= cms_e($content['about']['eyebrow']) ?>" required></label>
        <label>Título<input name="about[title]" value="<?= cms_e($content['about']['title']) ?>" required></label>
        <label class="full">Biografía<textarea name="about[body]" required><?= cms_e($content['about']['body']) ?></textarea></label>
        <label class="full">Nota de verificación<textarea name="about[note]" required><?= cms_e($content['about']['note']) ?></textarea></label>
      </div>
      <?php foreach ($content['faq'] as $index => $item): ?>
        <fieldset><legend>Pregunta <?= $index + 1 ?></legend><div class="field-grid"><label class="full">Pregunta<input name="faq[<?= $index ?>][question]" value="<?= cms_e($item['question']) ?>" required></label><label class="full">Respuesta<textarea name="faq[<?= $index ?>][answer]" required><?= cms_e($item['answer']) ?></textarea></label></div></fieldset>
      <?php endforeach; ?>
      </section>

      <section id="cierre"><div class="section-title"><span>05</span><div><h2>Cierre y SEO</h2><p>Última llamada a la acción y metadatos.</p></div></div><div class="field-grid">
        <label>Antetítulo<input name="finalCta[eyebrow]" value="<?= cms_e($content['finalCta']['eyebrow']) ?>" required></label>
        <label>Título<input name="finalCta[title]" value="<?= cms_e($content['finalCta']['title']) ?>" required></label>
        <label class="full">Resumen<textarea name="finalCta[summary]" required><?= cms_e($content['finalCta']['summary']) ?></textarea></label>
        <label>Botón<input name="finalCta[button]" value="<?= cms_e($content['finalCta']['button']) ?>" required></label>
        <label class="full">Título SEO<input name="seo[title]" maxlength="180" value="<?= cms_e($content['seo']['title']) ?>" required></label>
        <label class="full">Descripción SEO<textarea name="seo[description]" maxlength="320" required><?= cms_e($content['seo']['description']) ?></textarea></label>
      </div></section>

      <div class="savebar"><p>Se creará un respaldo del JSON actual.</p><button class="primary-button" type="submit">Guardar cambios</button></div>
    </form>
  </main>
</body>
</html>

