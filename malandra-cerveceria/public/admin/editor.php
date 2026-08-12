<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();

$content = cms_load_content();
$message = isset($_GET['saved']) ? 'Cambios guardados. La landing los leerá al volver a cargar.' : '';
$error = '';

function cms_field(array $group, string $key, int $max = 2000): string
{
    return cms_text($group[$key] ?? '', $max);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!cms_verify_csrf($_POST['csrf'] ?? null)) {
            throw new RuntimeException('La sesión expiró. Recarga el editor.');
        }

        $next = $content;
        $brand = is_array($_POST['brand'] ?? null) ? $_POST['brand'] : [];
        $hero = is_array($_POST['hero'] ?? null) ? $_POST['hero'] : [];
        $story = is_array($_POST['story'] ?? null) ? $_POST['story'] : [];
        $media = is_array($_POST['media'] ?? null) ? $_POST['media'] : [];
        $contact = is_array($_POST['contact'] ?? null) ? $_POST['contact'] : [];
        $finalCta = is_array($_POST['finalCta'] ?? null) ? $_POST['finalCta'] : [];
        $seo = is_array($_POST['seo'] ?? null) ? $_POST['seo'] : [];

        $next['brand'] = [
            'name' => cms_field($brand, 'name', 80),
            'descriptor' => cms_field($brand, 'descriptor', 120),
        ];
        $next['notice'] = cms_text($_POST['notice'] ?? '', 350);
        $next['hero'] = [
            'eyebrow' => cms_field($hero, 'eyebrow', 100),
            'title' => cms_field($hero, 'title', 120),
            'emphasis' => cms_field($hero, 'emphasis', 120),
            'summary' => cms_field($hero, 'summary', 600),
            'primaryCta' => cms_field($hero, 'primaryCta', 60),
            'secondaryCta' => cms_field($hero, 'secondaryCta', 60),
        ];
        $next['story'] = [
            'eyebrow' => cms_field($story, 'eyebrow', 100),
            'title' => cms_field($story, 'title', 180),
            'body' => cms_field($story, 'body', 1400),
            'note' => cms_field($story, 'note', 700),
        ];
        $next['media']['eyebrow'] = cms_field($media, 'eyebrow', 100);
        $next['media']['title'] = cms_field($media, 'title', 180);
        $next['media']['summary'] = cms_field($media, 'summary', 700);
        $next['media']['note'] = cms_field($media, 'note', 500);
        $next['media']['heroCaption'] = cms_field($media, 'heroCaption', 140);
        $next['media']['storyCaption'] = cms_field($media, 'storyCaption', 140);

        $postedClips = is_array($media['clips'] ?? null) ? $media['clips'] : [];
        foreach ($next['media']['clips'] as $index => &$clip) {
            $posted = is_array($postedClips[$index] ?? null) ? $postedClips[$index] : [];
            $clip['title'] = cms_field($posted, 'title', 140);
            $clip['text'] = cms_field($posted, 'text', 500);
        }
        unset($clip);

        $postedPhotos = is_array($media['photos'] ?? null) ? $media['photos'] : [];
        foreach ($next['media']['photos'] as $index => &$photo) {
            $posted = is_array($postedPhotos[$index] ?? null) ? $postedPhotos[$index] : [];
            $photo['caption'] = cms_field($posted, 'caption', 140);
        }
        unset($photo);
        $next['contact'] = [
            'instagram' => cms_instagram_url($contact['instagram'] ?? ''),
            'informationSource' => cms_instagram_url($contact['informationSource'] ?? ''),
            'location' => cms_field($contact, 'location', 120),
        ];

        $postedBatches = is_array($_POST['batches'] ?? null) ? $_POST['batches'] : [];
        foreach ($next['batches'] as $index => &$batch) {
            $posted = is_array($postedBatches[$index] ?? null) ? $postedBatches[$index] : [];
            $batch['name'] = cms_field($posted, 'name', 100);
            $batch['style'] = cms_field($posted, 'style', 100);
            $batch['abv'] = cms_field($posted, 'abv', 40);
            $batch['hops'] = cms_field($posted, 'hops', 100);
            $batch['status'] = cms_field($posted, 'status', 100);
            $batch['description'] = cms_field($posted, 'description', 700);
            $batch['sourceUrl'] = cms_instagram_url($posted['sourceUrl'] ?? '', true);
            $batch['visible'] = isset($posted['visible']);
            $batch['available'] = false;
        }
        unset($batch);

        foreach (['process', 'timeline', 'faq'] as $collection) {
            $postedItems = is_array($_POST[$collection] ?? null) ? $_POST[$collection] : [];
            foreach ($next[$collection] as $index => &$item) {
                $posted = is_array($postedItems[$index] ?? null) ? $postedItems[$index] : [];
                foreach (array_keys($item) as $key) {
                    $item[$key] = cms_field($posted, (string) $key, $key === 'text' || $key === 'answer' ? 900 : 180);
                }
            }
            unset($item);
        }

        $next['finalCta'] = [
            'eyebrow' => cms_field($finalCta, 'eyebrow', 120),
            'title' => cms_field($finalCta, 'title', 180),
            'summary' => cms_field($finalCta, 'summary', 500),
            'button' => cms_field($finalCta, 'button', 60),
        ];
        $next['seo'] = [
            'title' => cms_field($seo, 'title', 180),
            'description' => cms_field($seo, 'description', 320),
        ];

        cms_save_content($next);
        header('Location: editor.php?saved=1');
        exit;
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Editor · Malandra CMS</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="admin-header">
    <a class="admin-brand" href="editor.php"><span>M</span><strong>Malandra CMS</strong></a>
    <nav><a href="/" target="_blank" rel="noopener">Ver landing ↗</a><form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf()) ?>"><button type="submit">Cerrar sesión</button></form></nav>
  </header>

  <main class="editor-shell">
    <aside>
      <p class="eyebrow">Contenido vivo</p>
      <h1>Editar<br>Malandra</h1>
      <p class="muted">Los campos comerciales permanecen bloqueados hasta confirmar disponibilidad.</p>
      <nav>
        <a href="#marca">Marca y hero</a>
        <a href="#historia">Historia</a>
        <a href="#multimedia">Multimedia</a>
        <a href="#lotes">Lotes</a>
        <a href="#proceso">Proceso</a>
        <a href="#bitacora">Bitácora</a>
        <a href="#faq">Preguntas</a>
        <a href="#cierre">Cierre y SEO</a>
      </nav>
    </aside>

    <form class="editor-form" method="post">
      <input type="hidden" name="csrf" value="<?= cms_e(cms_csrf()) ?>">
      <?php if ($message !== ''): ?><div class="notice success" role="status"><?= cms_e($message) ?></div><?php endif; ?>
      <?php if ($error !== ''): ?><div class="notice error" role="alert"><?= cms_e($error) ?></div><?php endif; ?>

      <section id="marca">
        <div class="section-title"><span>01</span><div><h2>Marca y hero</h2><p>Primera impresión y llamada principal a Instagram.</p></div></div>
        <div class="field-grid">
          <label>Marca<input name="brand[name]" value="<?= cms_e($content['brand']['name']) ?>" required></label>
          <label>Descriptor<input name="brand[descriptor]" value="<?= cms_e($content['brand']['descriptor']) ?>" required></label>
          <label class="full">Aviso de revisión<textarea name="notice" required><?= cms_e($content['notice']) ?></textarea></label>
          <label>Antetítulo<input name="hero[eyebrow]" value="<?= cms_e($content['hero']['eyebrow']) ?>" required></label>
          <label>Título<input name="hero[title]" value="<?= cms_e($content['hero']['title']) ?>" required></label>
          <label>Énfasis<input name="hero[emphasis]" value="<?= cms_e($content['hero']['emphasis']) ?>" required></label>
          <label>CTA principal<input name="hero[primaryCta]" value="<?= cms_e($content['hero']['primaryCta']) ?>" required></label>
          <label>CTA Instagram<input name="hero[secondaryCta]" value="<?= cms_e($content['hero']['secondaryCta']) ?>" required></label>
          <label class="full">Resumen<textarea name="hero[summary]" required><?= cms_e($content['hero']['summary']) ?></textarea></label>
          <label>Instagram oficial<input type="url" name="contact[instagram]" value="<?= cms_e($content['contact']['instagram']) ?>" required></label>
          <label>Fuente informativa<input type="url" name="contact[informationSource]" value="<?= cms_e($content['contact']['informationSource']) ?>" required></label>
          <label class="full">Ubicación general<input name="contact[location]" value="<?= cms_e($content['contact']['location']) ?>" required></label>
        </div>
      </section>

      <section id="historia">
        <div class="section-title"><span>02</span><div><h2>Historia</h2><p>Relato verificable del proceso público.</p></div></div>
        <div class="field-grid">
          <label>Antetítulo<input name="story[eyebrow]" value="<?= cms_e($content['story']['eyebrow']) ?>" required></label>
          <label>Título<input name="story[title]" value="<?= cms_e($content['story']['title']) ?>" required></label>
          <label class="full">Historia<textarea name="story[body]" required><?= cms_e($content['story']['body']) ?></textarea></label>
          <label class="full">Nota de verificación<textarea name="story[note]" required><?= cms_e($content['story']['note']) ?></textarea></label>
        </div>
      </section>

      <section id="multimedia">
        <div class="section-title"><span>03</span><div><h2>Multimedia</h2><p>Textos y pies del archivo visual ya cargado en la landing.</p></div></div>
        <div class="field-grid">
          <label>Antetítulo<input name="media[eyebrow]" value="<?= cms_e($content['media']['eyebrow']) ?>" required></label>
          <label>Título<input name="media[title]" value="<?= cms_e($content['media']['title']) ?>" required></label>
          <label class="full">Resumen<textarea name="media[summary]" required><?= cms_e($content['media']['summary']) ?></textarea></label>
          <label>Pie del hero<input name="media[heroCaption]" value="<?= cms_e($content['media']['heroCaption']) ?>" required></label>
          <label>Pie del equipo<input name="media[storyCaption]" value="<?= cms_e($content['media']['storyCaption']) ?>" required></label>
          <label class="full">Nota del archivo<textarea name="media[note]" required><?= cms_e($content['media']['note']) ?></textarea></label>
        </div>
        <?php foreach ($content['media']['clips'] as $index => $clip): ?>
          <fieldset><legend>Video <?= $index + 1 ?></legend><div class="field-grid">
            <label>Título<input name="media[clips][<?= $index ?>][title]" value="<?= cms_e($clip['title']) ?>" required></label>
            <label>Descripción<textarea name="media[clips][<?= $index ?>][text]" required><?= cms_e($clip['text']) ?></textarea></label>
          </div></fieldset>
        <?php endforeach; ?>
        <fieldset><legend>Pies de foto</legend><div class="field-grid">
          <?php foreach ($content['media']['photos'] as $index => $photo): ?>
            <label>Foto <?= $index + 1 ?><input name="media[photos][<?= $index ?>][caption]" value="<?= cms_e($photo['caption']) ?>" required></label>
          <?php endforeach; ?>
        </div></fieldset>
      </section>

      <section id="lotes">
        <div class="section-title"><span>04</span><div><h2>Lotes</h2><p>“Visible” publica la ficha, pero nunca la marca como disponible.</p></div></div>
        <?php foreach ($content['batches'] as $index => $batch): ?>
          <fieldset><legend>Lote <?= $index + 1 ?> · <?= cms_e($batch['name']) ?></legend>
            <label class="toggle"><input type="checkbox" name="batches[<?= $index ?>][visible]" value="1" <?= $batch['visible'] ? 'checked' : '' ?>><span>Visible en la landing</span></label>
            <div class="field-grid">
              <label>Nombre<input name="batches[<?= $index ?>][name]" value="<?= cms_e($batch['name']) ?>" required></label>
              <label>Estilo<input name="batches[<?= $index ?>][style]" value="<?= cms_e($batch['style']) ?>" required></label>
              <label>ABV<input name="batches[<?= $index ?>][abv]" value="<?= cms_e($batch['abv']) ?>" required></label>
              <label>Lúpulo<input name="batches[<?= $index ?>][hops]" value="<?= cms_e($batch['hops']) ?>" required></label>
              <label class="full">Estado<input name="batches[<?= $index ?>][status]" value="<?= cms_e($batch['status']) ?>" required></label>
              <label class="full">Descripción<textarea name="batches[<?= $index ?>][description]" required><?= cms_e($batch['description']) ?></textarea></label>
              <label class="full">Publicación original<input type="url" name="batches[<?= $index ?>][sourceUrl]" value="<?= cms_e($batch['sourceUrl']) ?>" required></label>
            </div>
          </fieldset>
        <?php endforeach; ?>
      </section>

      <section id="proceso">
        <div class="section-title"><span>05</span><div><h2>Proceso</h2><p>Las cuatro etapas editoriales de la landing.</p></div></div>
        <?php foreach ($content['process'] as $index => $step): ?><fieldset><legend>Etapa <?= $index + 1 ?></legend><div class="field-grid"><label>Título<input name="process[<?= $index ?>][title]" value="<?= cms_e($step['title']) ?>" required></label><label>Descripción<textarea name="process[<?= $index ?>][text]" required><?= cms_e($step['text']) ?></textarea></label></div></fieldset><?php endforeach; ?>
      </section>

      <section id="bitacora">
        <div class="section-title"><span>06</span><div><h2>Bitácora</h2><p>Cronología basada en publicaciones observadas.</p></div></div>
        <?php foreach ($content['timeline'] as $index => $item): ?><fieldset><legend>Entrada <?= $index + 1 ?></legend><div class="field-grid"><label>Fecha<input name="timeline[<?= $index ?>][date]" value="<?= cms_e($item['date']) ?>" required></label><label>Título<input name="timeline[<?= $index ?>][title]" value="<?= cms_e($item['title']) ?>" required></label><label class="full">Texto<textarea name="timeline[<?= $index ?>][text]" required><?= cms_e($item['text']) ?></textarea></label></div></fieldset><?php endforeach; ?>
      </section>

      <section id="faq">
        <div class="section-title"><span>07</span><div><h2>Preguntas frecuentes</h2><p>Respuestas que separan hechos y pendientes.</p></div></div>
        <?php foreach ($content['faq'] as $index => $item): ?><fieldset><legend>Pregunta <?= $index + 1 ?></legend><div class="field-grid"><label class="full">Pregunta<input name="faq[<?= $index ?>][question]" value="<?= cms_e($item['question']) ?>" required></label><label class="full">Respuesta<textarea name="faq[<?= $index ?>][answer]" required><?= cms_e($item['answer']) ?></textarea></label></div></fieldset><?php endforeach; ?>
      </section>

      <section id="cierre">
        <div class="section-title"><span>08</span><div><h2>Cierre y SEO</h2><p>CTA final y metadatos del sitio.</p></div></div>
        <div class="field-grid">
          <label>Antetítulo<input name="finalCta[eyebrow]" value="<?= cms_e($content['finalCta']['eyebrow']) ?>" required></label>
          <label>Botón<input name="finalCta[button]" value="<?= cms_e($content['finalCta']['button']) ?>" required></label>
          <label class="full">Título<input name="finalCta[title]" value="<?= cms_e($content['finalCta']['title']) ?>" required></label>
          <label class="full">Resumen<textarea name="finalCta[summary]" required><?= cms_e($content['finalCta']['summary']) ?></textarea></label>
          <label class="full">Título SEO<input name="seo[title]" value="<?= cms_e($content['seo']['title']) ?>" required></label>
          <label class="full">Descripción SEO<textarea name="seo[description]" required><?= cms_e($content['seo']['description']) ?></textarea></label>
        </div>
      </section>

      <div class="savebar"><p>Se creará un respaldo antes de reemplazar el JSON.</p><button class="primary-button" type="submit">Guardar cambios</button></div>
    </form>
  </main>
</body>
</html>
