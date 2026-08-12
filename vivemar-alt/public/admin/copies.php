<?php
require_once __DIR__ . '/lib.php';
requiere_login();

$mensaje = '';
$tipo = 'ok';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verificar();

    if (($_POST['accion'] ?? '') === 'guardar') {
        $actuales = escanear_copies();
        $cambiados = 0;
        foreach ($_POST['copy'] ?? [] as $id => $valor) {
            $id = (string) $id;
            if (!isset($actuales[$id])) {
                continue; // solo ids que existen en el sitio
            }
            $valor = sanitizar_copy($valor);
            if ($valor === '' || $valor === $actuales[$id]['valor']) {
                continue;
            }
            if (aplicar_copy($id, $valor) > 0) {
                guardar_copy_json($id, $valor);
                $cambiados++;
            }
        }
        $mensaje = $cambiados > 0
            ? "✅ $cambiados texto(s) actualizados y publicados."
            : 'No hubo cambios que publicar.';
    }

    if (($_POST['accion'] ?? '') === 'reaplicar') {
        $n = 0;
        foreach (leer_guardados() as $id => $valor) {
            $n += aplicar_copy((string) $id, (string) $valor) > 0 ? 1 : 0;
        }
        $mensaje = "🔄 $n copy(s) guardados reaplicados sobre el sitio publicado.";
    }
}

$campos = escanear_copies();
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES);

$nombres = [
    'hero-etiqueta' => 'Hero · etiqueta superior',
    'hero-titulo' => 'Hero · título principal',
    'hero-descripcion' => 'Hero · descripción',
    'hero-testimonio' => 'Hero · testimonio',
    'corasol-texto' => 'Franja de desarrollos (Corasol)',
    'nosotros-bio' => 'Sección "Tu asesora" · biografía',
    'parallax-titulo' => 'Banda parallax · título',
];

panel_inicio('Copies', 'copies');
?>
<h1>Copies del sitio</h1>
<?php if ($mensaje): ?><div class="aviso aviso--<?= $tipo ?>"><?= $e($mensaje) ?></div><?php endif; ?>

<form method="post" class="tarjeta">
  <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
  <input type="hidden" name="accion" value="guardar">
  <p style="font-size:.85rem;color:#777;margin-top:0;">
    Se permite texto plano y las etiquetas <code>&lt;em&gt;</code> (cursiva) y
    <code>&lt;strong&gt;</code> (negrita). Los cambios se publican al instante.
  </p>
  <?php foreach ($campos as $id => $info): ?>
    <div class="campo-copy">
      <label><?= $e($nombres[$id] ?? $id) ?></label>
      <textarea name="copy[<?= $e($id) ?>]"><?= $e($info['valor']) ?></textarea>
      <small>Aparece en: <?= $e(implode(' · ', array_unique($info['archivos']))) ?></small>
    </div>
  <?php endforeach; ?>
  <p><button type="submit" class="boton">💾 Guardar y publicar</button></p>
</form>

<form method="post" class="tarjeta">
  <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
  <input type="hidden" name="accion" value="reaplicar">
  <strong>¿Softvibes republicó el sitio?</strong>
  <p style="font-size:.88rem;">Tus ediciones quedan respaldadas en este panel. Este botón las vuelve a
  aplicar sobre la versión recién publicada.</p>
  <button type="submit" class="boton boton--laton">🔄 Reaplicar cambios guardados (<?= count(leer_guardados()) ?>)</button>
</form>
<?php panel_fin();
