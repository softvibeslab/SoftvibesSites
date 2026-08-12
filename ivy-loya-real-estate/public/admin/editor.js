(() => {
  'use strict';

  const app = document.getElementById('editorApp');
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
  const propertyEditors = document.getElementById('propertyEditors');
  const mediaGrid = document.getElementById('mediaGrid');
  const preview = document.getElementById('sitePreview');
  const toast = document.getElementById('toast');
  let state = null;
  let dirty = false;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const getPath = (source, path) => path.split('.').reduce((value, part) => value?.[part], source);

  const setPath = (source, path, value) => {
    const parts = path.split('.');
    const finalPart = parts.pop();
    const target = parts.reduce((current, part) => current[part], source);
    target[finalPart] = value;
  };

  const showToast = (message, error = false) => {
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3200);
  };

  const api = async (url, options = {}) => {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const result = await response.json().catch(() => ({ ok: false, error: 'Respuesta inválida del servidor.' }));
    if (!response.ok || !result.ok) throw new Error(result.error || 'No fue posible completar la acción.');
    return result;
  };

  const valueForField = (field) => {
    const base = getPath(state, field.dataset.path);
    return field.dataset.locale ? base?.[field.dataset.locale] : base;
  };

  const fillFields = () => {
    document.querySelectorAll('[data-path]').forEach((field) => {
      field.value = valueForField(field) ?? '';
    });
  };

  const renderProperties = () => {
    propertyEditors.innerHTML = state.properties.map((property, index) => `
      <article class="property-editor">
        <div class="property-editor__head"><h3>Propiedad ${index + 1}</h3><code>${escapeHtml(property.id)}</code></div>
        <div class="field-grid">
          <label>ID interno<input data-property-index="${index}" data-property-path="id" type="text" value="${escapeHtml(property.id)}"></label>
          <label>Nombre<input data-property-index="${index}" data-property-path="title" type="text" value="${escapeHtml(property.title)}"></label>
          <label class="full">Ubicación<input data-property-index="${index}" data-property-path="location" type="text" value="${escapeHtml(property.location)}"></label>
          <label><span class="language-label">ES</span> Estado<input data-property-index="${index}" data-property-path="status.es" type="text" value="${escapeHtml(property.status.es)}"></label>
          <label><span class="language-label">EN</span> Status<input data-property-index="${index}" data-property-path="status.en" type="text" value="${escapeHtml(property.status.en)}"></label>
          <label><span class="language-label">ES</span> Resumen<textarea data-property-index="${index}" data-property-path="summary.es">${escapeHtml(property.summary.es)}</textarea></label>
          <label><span class="language-label">EN</span> Summary<textarea data-property-index="${index}" data-property-path="summary.en">${escapeHtml(property.summary.en)}</textarea></label>
          <label class="full">Ruta de imagen<input data-property-index="${index}" data-property-path="image" type="text" value="${escapeHtml(property.image)}" placeholder="/img/uploads/imagen.jpg"></label>
          <label class="full">Enlace público<input data-property-index="${index}" data-property-path="link" type="url" value="${escapeHtml(property.link)}"></label>
        </div>
        <img class="image-preview" src="${escapeHtml(property.image)}" alt="Vista previa de ${escapeHtml(property.title)}">
      </article>
    `).join('');
  };

  const renderMedia = (items) => {
    mediaGrid.innerHTML = items.map((item) => `
      <article class="media-item">
        <img src="${escapeHtml(item.path)}" alt="${escapeHtml(item.name)}" loading="lazy">
        <button type="button" data-copy-media="${escapeHtml(item.path)}" title="${escapeHtml(item.path)}">Copiar ruta</button>
      </article>
    `).join('');
  };

  const load = async () => {
    app.classList.add('loading');
    try {
      const result = await api('api.php?action=load');
      state = result.content;
      fillFields();
      renderProperties();
      renderMedia(result.media || []);
      dirty = false;
    } catch (error) {
      showToast(error.message, true);
    } finally {
      app.classList.remove('loading');
    }
  };

  document.addEventListener('input', (event) => {
    if (!state) return;
    const field = event.target.closest('[data-path]');
    if (field) {
      if (field.dataset.locale) {
        const localized = getPath(state, field.dataset.path);
        localized[field.dataset.locale] = field.value;
      } else {
        setPath(state, field.dataset.path, field.value);
      }
      dirty = true;
      return;
    }
    const propertyField = event.target.closest('[data-property-index]');
    if (propertyField) {
      const property = state.properties[Number(propertyField.dataset.propertyIndex)];
      setPath(property, propertyField.dataset.propertyPath, propertyField.value);
      const card = propertyField.closest('.property-editor');
      if (propertyField.dataset.propertyPath === 'image') card.querySelector('.image-preview').src = propertyField.value;
      dirty = true;
    }
  });

  document.addEventListener('click', async (event) => {
    const copyButton = event.target.closest('[data-copy-media]');
    if (!copyButton) return;
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copyMedia);
      showToast('Ruta copiada. Pégala en el campo de imagen.');
    } catch {
      showToast(`Ruta: ${copyButton.dataset.copyMedia}`);
    }
  });

  document.getElementById('saveContent').addEventListener('click', async () => {
    if (!state) return;
    app.classList.add('loading');
    try {
      const result = await api('api.php?action=save_content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify(state),
      });
      state = result.content;
      dirty = false;
      showToast('Cambios guardados.');
      preview.src = `/?updated=${Date.now()}`;
    } catch (error) {
      showToast(error.message, true);
    } finally {
      app.classList.remove('loading');
    }
  });

  document.getElementById('reloadContent').addEventListener('click', () => {
    if (!dirty || window.confirm('¿Descartar los cambios no guardados?')) load();
  });

  document.getElementById('refreshPreview').addEventListener('click', () => {
    preview.src = `/?preview=${Date.now()}`;
  });

  document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('uploadFile');
    if (!fileInput.files.length) return;
    const form = new FormData();
    form.append('file', fileInput.files[0]);
    app.classList.add('loading');
    try {
      const result = await api('api.php?action=upload_image', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf },
        body: form,
      });
      fileInput.value = '';
      try { await navigator.clipboard.writeText(result.path); } catch {}
      showToast(`Imagen lista: ${result.path}`);
      const fresh = await api('api.php?action=load');
      renderMedia(fresh.media || []);
    } catch (error) {
      showToast(error.message, true);
    } finally {
      app.classList.remove('loading');
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!dirty) return;
    event.preventDefault();
  });

  load();
})();
