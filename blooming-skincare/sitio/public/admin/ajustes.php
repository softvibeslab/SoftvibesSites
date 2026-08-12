<?php
// Ajustes de contacto: número, mensaje de WhatsApp, Calendly y correo de TODOS los CTAs
require_once __DIR__ . '/lib.php';
requiere_login();

$mensaje = '';
$tipo = 'ok';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_verificar();
    $actual = leer_ajustes();
    $nuevo = [
        'telefono' => trim($_POST['telefono'] ?? '') ?: $actual['telefono'],
        'whatsapp' => preg_replace('/\D/', '', $_POST['whatsapp'] ?? '') ?: $actual['whatsapp'],
        'mensaje'  => trim($_POST['mensaje'] ?? '') ?: $actual['mensaje'],
        'calendly' => trim($_POST['calendly'] ?? '') ?: $actual['calendly'],
        'correo'   => trim($_POST['correo'] ?? '') ?: $actual['correo'],
    ];
    if (!filter_var($nuevo['calendly'], FILTER_VALIDATE_URL)) {
        $mensaje = 'La URL de Calendly no es válida.';
        $tipo = 'error';
    } elseif (!filter_var($nuevo['correo'], FILTER_VALIDATE_EMAIL)) {
        $mensaje = 'El correo no es válido.';
        $tipo = 'error';
    } else {
        $tocados = aplicar_ajustes($actual, $nuevo);
        guardar_ajustes($nuevo);
        $mensaje = $tocados > 0
            ? "✅ Ajustes aplicados en {$tocados} página(s). Todos los CTAs del sitio quedaron actualizados."
            : 'Guardado (no hubo cambios que aplicar).';
    }
}

$a = leer_ajustes();
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES);

panel_inicio('Ajustes de contacto', 'ajustes');
?>
<h1>⚙️ Ajustes de contacto</h1>
<?php if ($mensaje): ?><div class="aviso aviso--<?= $tipo ?>"><?= $e($mensaje) ?></div><?php endif; ?>

<form method="post" class="tarjeta">
  <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
  <p style="font-size:.9rem;color:#666;margin-top:0;">
    Estos valores alimentan <b>todos los botones del sitio</b>: WhatsApp (número y mensaje
    precargado), Agendar (Calendly), teléfono y correo. Al guardar se actualizan al instante
    en todas las páginas.
  </p>

  <label>📱 Número de WhatsApp (con lada de país, solo dígitos)</label>
  <input type="text" name="whatsapp" value="<?= $e($a['whatsapp']) ?>" placeholder="529842541127">

  <label>💬 Mensaje precargado de WhatsApp (el general; las propiedades usan el suyo propio)</label>
  <textarea name="mensaje" rows="3"><?= $e($a['mensaje']) ?></textarea>

  <label>📅 URL de Calendly (todos los botones "Agendar")</label>
  <input type="text" name="calendly" value="<?= $e($a['calendly']) ?>">

  <label>☎️ Teléfono visible (como se muestra en el sitio)</label>
  <input type="text" name="telefono" value="<?= $e($a['telefono']) ?>">

  <label>✉️ Correo de contacto</label>
  <input type="text" name="correo" value="<?= $e($a['correo']) ?>">

  <p style="margin-top:1.5rem;"><button type="submit" class="boton boton--laton">💾 Guardar y aplicar en todo el sitio</button></p>
  <p style="font-size:.8rem;color:#999;">💡 Los <b>textos</b> de los botones ("Escríbenos por WhatsApp",
  "Agenda una asesoría"…) se editan desde el <a href="editor.php">✨ Editor visual</a> haciendo clic sobre ellos.</p>
</form>
<?php panel_fin();
