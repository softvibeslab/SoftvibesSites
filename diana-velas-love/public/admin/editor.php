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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Editor | Diana CMS</title><link rel="stylesheet" href="admin.css"></head>
<body>
  <header class="admin-header"><a class="admin-brand" href="panel.php"><span>✿</span><strong>Editor de contenido</strong></a><nav><a href="panel.php">Panel</a><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav></header>
  <main class="editor-shell">
    <aside><p class="eyebrow">Edición segura</p><h1>Contenido</h1><p class="muted">Publica solo datos confirmados. Deja WhatsApp vacío hasta recibir el número real.</p><nav><a href="#contacto">Marca + contacto</a><a href="#portada">Portada</a><a href="#productos">Productos</a><a href="#propuesta">Propuesta</a><a href="#contenido">Proceso + FAQ</a><a href="#cierre">Cierre + SEO</a></nav></aside>
    <form class="editor-form" method="post">
      <input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>">
      <?php if ($notice !== ''): ?><div class="notice success"><?= cms_e($notice) ?></div><?php endif; ?>
      <?php if ($error !== ''): ?><div class="notice error"><?= cms_e($error) ?></div><?php endif; ?>

      <section id="contacto"><div class="section-title"><span>01</span><div><h2>Marca y contacto</h2><p>El número usa código de país y solo dígitos. Puede quedar vacío en la demo.</p></div></div><div class="field-grid">
        <label>Nombre<input name="brand[name]" maxlength="80" value="<?= cms_e($content['brand']['name']) ?>" required></label>
        <label>Descriptor<input name="brand[descriptor]" maxlength="180" value="<?= cms_e($content['brand']['descriptor']) ?>" required></label>
        <label>Monograma<input name="brand[monogram]" maxlength="12" value="<?= cms_e($content['brand']['monogram']) ?>" required></label>
        <label>Ubicación<input name="contact[location]" maxlength="180" value="<?= cms_e($content['contact']['location']) ?>" required></label>
        <label class="full">Instagram<input type="url" name="contact[instagram]" value="<?= cms_e($content['contact']['instagram']) ?>" required></label>
        <label>WhatsApp<input inputmode="numeric" pattern="[0-9]{10,15}" name="contact[whatsappNumber]" value="<?= cms_e($content['contact']['whatsappNumber']) ?>" placeholder="529841234567"></label>
        <label>Estado de WhatsApp<input name="contact[whatsappStatus]" maxlength="220" value="<?= cms_e($content['contact']['whatsappStatus']) ?>" required></label>
      </div></section>

      <section id="portada"><div class="section-title"><span>02</span><div><h2>Portada y catálogo</h2><p>Propuesta principal y presentación de la colección.</p></div></div><div class="field-grid">
        <label class="full">Antetítulo<input name="hero[eyebrow]" value="<?= cms_e($content['hero']['eyebrow']) ?>" required></label>
        <label>Título<input name="hero[title]" value="<?= cms_e($content['hero']['title']) ?>" required></label>
        <label>Énfasis<input name="hero[emphasis]" value="<?= cms_e($content['hero']['emphasis']) ?>" required></label>
        <label class="full">Resumen<textarea name="hero[summary]" required><?= cms_e($content['hero']['summary']) ?></textarea></label>
        <label>CTA catálogo<input name="hero[primaryCta]" value="<?= cms_e($content['hero']['primaryCta']) ?>" required></label>
        <label>CTA WhatsApp<input name="hero[secondaryCta]" value="<?= cms_e($content['hero']['secondaryCta']) ?>" required></label>
        <label>Antetítulo del catálogo<input name="catalog[eyebrow]" value="<?= cms_e($content['catalog']['eyebrow']) ?>" required></label>
        <label>Título del catálogo<input name="catalog[title]" value="<?= cms_e($content['catalog']['title']) ?>" required></label>
        <label class="full">Resumen del catálogo<textarea name="catalog[summary]" required><?= cms_e($content['catalog']['summary']) ?></textarea></label>
        <label class="full">Mensaje sin resultados<input name="catalog[empty]" value="<?= cms_e($content['catalog']['empty']) ?>" required></label>
      </div></section>

      <section id="productos"><div class="section-title"><span>03</span><div><h2>Catálogo</h2><p>La casilla controla visibilidad. No uses precio o stock sin confirmación.</p></div></div>
        <?php foreach ($content['products'] as $index => $product): ?>
          <fieldset class="product-fieldset"><legend>Producto <?= $index + 1 ?> · <?= cms_e($product['name']) ?></legend>
            <div class="product-editor-head"><img src="<?= cms_e($product['image']) ?>" alt=""><label class="toggle"><input type="checkbox" name="products[<?= $index ?>][visible]" value="1" <?= $product['visible'] ? 'checked' : '' ?>><span>Visible en catálogo</span></label></div>
            <input type="hidden" name="products[<?= $index ?>][id]" value="<?= cms_e($product['id']) ?>">
            <div class="field-grid">
              <label>Nombre<input name="products[<?= $index ?>][name]" maxlength="100" value="<?= cms_e($product['name']) ?>" required></label>
              <label>Categoría<input name="products[<?= $index ?>][category]" maxlength="60" value="<?= cms_e($product['category']) ?>" required></label>
              <label>Etiqueta de precio<input name="products[<?= $index ?>][priceLabel]" maxlength="60" value="<?= cms_e($product['priceLabel']) ?>" required></label>
              <label>Ruta de imagen<input name="products[<?= $index ?>][image]" value="<?= cms_e($product['image']) ?>" required></label>
              <label class="full">Texto alternativo<input name="products[<?= $index ?>][alt]" maxlength="220" value="<?= cms_e($product['alt']) ?>" required></label>
              <label class="full">Descripción<textarea name="products[<?= $index ?>][description]" required><?= cms_e($product['description']) ?></textarea></label>
              <label class="full">Publicación original<input type="url" name="products[<?= $index ?>][sourceUrl]" value="<?= cms_e($product['sourceUrl']) ?>" required></label>
              <label class="full">Mensaje de WhatsApp<textarea name="products[<?= $index ?>][message]" required><?= cms_e($product['message']) ?></textarea></label>
            </div>
          </fieldset>
        <?php endforeach; ?>
      </section>

      <section id="propuesta"><div class="section-title"><span>04</span><div><h2>Propuesta</h2><p>Explica el archivo visual sin convertir inferencias en hechos.</p></div></div><div class="field-grid">
        <label>Antetítulo<input name="about[eyebrow]" value="<?= cms_e($content['about']['eyebrow']) ?>" required></label>
        <label>Título<input name="about[title]" value="<?= cms_e($content['about']['title']) ?>" required></label>
        <label class="full">Texto principal<textarea name="about[body]" required><?= cms_e($content['about']['body']) ?></textarea></label>
        <label class="full">Nota de verificación<textarea name="about[note]" required><?= cms_e($content['about']['note']) ?></textarea></label>
      </div></section>

      <section id="contenido"><div class="section-title"><span>05</span><div><h2>Pedido y preguntas</h2><p>Tres pasos y las respuestas que reducen dudas antes de conversar.</p></div></div>
        <?php foreach ($content['steps'] as $index => $step): ?><fieldset><legend>Paso <?= $index + 1 ?></legend><div class="field-grid"><label>Título<input name="steps[<?= $index ?>][title]" value="<?= cms_e($step['title']) ?>" required></label><label>Descripción<textarea name="steps[<?= $index ?>][text]" required><?= cms_e($step['text']) ?></textarea></label></div></fieldset><?php endforeach; ?>
        <?php foreach ($content['faq'] as $index => $item): ?><fieldset><legend>Pregunta <?= $index + 1 ?></legend><div class="field-grid"><label class="full">Pregunta<input name="faq[<?= $index ?>][question]" value="<?= cms_e($item['question']) ?>" required></label><label class="full">Respuesta<textarea name="faq[<?= $index ?>][answer]" required><?= cms_e($item['answer']) ?></textarea></label></div></fieldset><?php endforeach; ?>
      </section>

      <section id="cierre"><div class="section-title"><span>06</span><div><h2>Cierre y SEO</h2><p>Última llamada a la acción y metadatos del sitio.</p></div></div><div class="field-grid">
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
