<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
cms_require_auth();
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="<?= cms_e(cms_csrf_token()) ?>">
  <title>Editor | Ivy CMS</title>
  <link rel="stylesheet" href="admin.css">
  <script src="editor.js" defer></script>
</head>
<body>
  <header class="admin-header">
    <a class="admin-brand" href="panel.php"><span>IL</span><strong>Editor de contenido</strong></a>
    <nav><a href="panel.php">Panel</a><a href="/" target="_blank" rel="noopener">Ver sitio ↗</a><form action="logout.php" method="post"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><button type="submit">Cerrar sesión</button></form></nav>
  </header>

  <main class="editor-layout" id="editorApp">
    <div class="editor-pane">
      <div>
        <p class="admin-eyebrow">Edición segura</p>
        <h1>Contenido del sitio</h1>
        <p class="admin-muted">Los campos ES y EN alimentan ambas rutas. La vista previa se actualiza al guardar.</p>
      </div>
      <nav class="editor-tabs" aria-label="Secciones del editor">
        <a href="#brand">Marca</a><a href="#hero">Portada</a><a href="#about">Ivy</a><a href="#properties">Propiedades</a><a href="#seo">SEO</a><a href="#media">Imágenes</a>
      </nav>

      <section class="editor-section" id="brand">
        <h2>Marca y contacto</h2>
        <p>Si WhatsApp queda vacío, todos los botones principales enviarán al Instagram oficial.</p>
        <div class="field-grid">
          <label>Nombre<input data-path="brand.name" type="text" maxlength="100"></label>
          <label>Marca de respaldo<input data-path="brand.partner" type="text" maxlength="120"></label>
          <label><span class="language-label">ES</span> Descriptor<input data-path="brand.descriptor.es" type="text" maxlength="220"></label>
          <label><span class="language-label">EN</span> Descriptor<input data-path="brand.descriptor.en" type="text" maxlength="220"></label>
          <label class="full">Instagram oficial<input data-path="contact.instagram" type="url" placeholder="https://www.instagram.com/..."></label>
          <label class="full">WhatsApp oficial — opcional<input data-path="contact.whatsapp" type="url" placeholder="https://wa.me/52..."></label>
          <label class="full">Correo — opcional<input data-path="contact.email" type="email"></label>
        </div>
      </section>

      <section class="editor-section" id="hero">
        <h2>Portada</h2>
        <div class="field-grid">
          <label><span class="language-label">ES</span> Antetítulo<input data-path="hero.eyebrow" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Eyebrow<input data-path="hero.eyebrow" data-locale="en" type="text"></label>
          <label><span class="language-label">ES</span> Título<textarea data-path="hero.title" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Title<textarea data-path="hero.title" data-locale="en"></textarea></label>
          <label><span class="language-label">ES</span> Resumen<textarea data-path="hero.summary" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Summary<textarea data-path="hero.summary" data-locale="en"></textarea></label>
          <label><span class="language-label">ES</span> CTA principal<input data-path="hero.primaryCta" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Primary CTA<input data-path="hero.primaryCta" data-locale="en" type="text"></label>
          <label><span class="language-label">ES</span> CTA contacto<input data-path="hero.secondaryCta" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Contact CTA<input data-path="hero.secondaryCta" data-locale="en" type="text"></label>
        </div>
      </section>

      <section class="editor-section" id="about">
        <h2>Presentación de Ivy</h2>
        <div class="field-grid">
          <label><span class="language-label">ES</span> Antetítulo<input data-path="about.eyebrow" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Eyebrow<input data-path="about.eyebrow" data-locale="en" type="text"></label>
          <label><span class="language-label">ES</span> Título<textarea data-path="about.title" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Title<textarea data-path="about.title" data-locale="en"></textarea></label>
          <label><span class="language-label">ES</span> Biografía<textarea data-path="about.body" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Bio<textarea data-path="about.body" data-locale="en"></textarea></label>
          <label><span class="language-label">ES</span> Nota<input data-path="about.note" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Note<input data-path="about.note" data-locale="en" type="text"></label>
        </div>
      </section>

      <section class="editor-section" id="properties">
        <h2>Propiedades</h2>
        <p>La demo mantiene tres tarjetas. Confirma por escrito inventario, disponibilidad y condiciones antes de publicar.</p>
        <div class="field-grid">
          <label><span class="language-label">ES</span> Antetítulo<input data-path="propertiesIntro.eyebrow" data-locale="es" type="text"></label>
          <label><span class="language-label">EN</span> Eyebrow<input data-path="propertiesIntro.eyebrow" data-locale="en" type="text"></label>
          <label><span class="language-label">ES</span> Título<textarea data-path="propertiesIntro.title" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Title<textarea data-path="propertiesIntro.title" data-locale="en"></textarea></label>
          <label><span class="language-label">ES</span> Resumen<textarea data-path="propertiesIntro.summary" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Summary<textarea data-path="propertiesIntro.summary" data-locale="en"></textarea></label>
        </div>
        <div id="propertyEditors"></div>
      </section>

      <section class="editor-section" id="seo">
        <h2>SEO</h2>
        <p>Estos valores se aplican al cargar el contenido. Para que redes sociales y buscadores reflejen cambios, genera y publica un build nuevo.</p>
        <div class="field-grid">
          <label><span class="language-label">ES</span> Título SEO<input data-path="seo.title" data-locale="es" type="text" maxlength="180"></label>
          <label><span class="language-label">EN</span> SEO title<input data-path="seo.title" data-locale="en" type="text" maxlength="180"></label>
          <label><span class="language-label">ES</span> Descripción<textarea data-path="seo.description" data-locale="es"></textarea></label>
          <label><span class="language-label">EN</span> Description<textarea data-path="seo.description" data-locale="en"></textarea></label>
        </div>
      </section>

      <section class="editor-section" id="media">
        <h2>Biblioteca de imágenes</h2>
        <p>JPG, PNG o WebP; máximo 5 MB. Al cargar o pulsar una imagen se copia su ruta para pegarla en una propiedad.</p>
        <form class="media-upload" id="uploadForm">
          <label>Seleccionar archivo<input id="uploadFile" name="file" type="file" accept="image/jpeg,image/png,image/webp" required></label>
          <button class="admin-button" type="submit">Subir imagen</button>
        </form>
        <div class="media-grid" id="mediaGrid"></div>
      </section>
    </div>

    <aside class="preview-pane">
      <div class="preview-toolbar"><span>Vista previa</span><button class="secondary-button" id="refreshPreview" type="button">Recargar</button></div>
      <iframe id="sitePreview" src="/" title="Vista previa de la landing"></iframe>
    </aside>
  </main>

  <div class="editor-actions">
    <button class="secondary-button" id="reloadContent" type="button">Descartar</button>
    <button class="admin-button" id="saveContent" type="button">Guardar cambios</button>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</body>
</html>
