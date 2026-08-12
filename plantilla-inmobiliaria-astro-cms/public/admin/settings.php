<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$message = '';
$error = '';
$current = array_merge(default_settings(), read_json('settings'));
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    if (($_POST['action'] ?? '') === 'reapply') {
        $files = apply_settings(default_settings(), $current);
        $message = "Ajustes guardados reaplicados en $files páginas.";
    } else {
        $next = [
        'phone_display' => trim((string) ($_POST['phone_display'] ?? '')),
        'whatsapp' => preg_replace('/\D/', '', (string) ($_POST['whatsapp'] ?? '')),
        'whatsapp_message' => trim((string) ($_POST['whatsapp_message'] ?? '')),
        'calendar_url' => trim((string) ($_POST['calendar_url'] ?? '')),
        'email' => trim((string) ($_POST['email'] ?? '')),
        ];
        if ($next['phone_display'] === '' || strlen($next['whatsapp']) < 8) {
            $error = 'Revisa el teléfono y el número de WhatsApp.';
        } elseif (!filter_var($next['calendar_url'], FILTER_VALIDATE_URL) || !filter_var($next['email'], FILTER_VALIDATE_EMAIL)) {
            $error = 'La URL de agenda o el correo no son válidos.';
        } else {
            try {
                $files = apply_settings($current, $next);
                write_json('settings', $next);
                $current = $next;
                $message = "Ajustes guardados y aplicados en $files páginas.";
            } catch (Throwable $exception) {
                $error = $exception->getMessage();
            }
        }
    }
}
admin_header('Ajustes', 'settings');
?>
<h1>Ajustes de contacto</h1>
<p class="notice">Estos reemplazos se aplican al HTML publicado. Actualiza también <code>src/config/site.ts</code> antes del siguiente build o reaplica los ajustes después de desplegar.</p>
<?php if ($message): ?><p class="notice"><?= h($message) ?></p><?php endif; ?><?php if ($error): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
<form method="post" class="card"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="save">
<div class="row"><label>Teléfono visible<input name="phone_display" value="<?= h($current['phone_display']) ?>" required></label><label>WhatsApp, solo dígitos<input name="whatsapp" value="<?= h($current['whatsapp']) ?>" inputmode="numeric" required></label></div>
<label>Mensaje general de WhatsApp<textarea name="whatsapp_message" required><?= h($current['whatsapp_message']) ?></textarea></label>
<div class="row"><label>URL de agenda<input name="calendar_url" type="url" value="<?= h($current['calendar_url']) ?>" required></label><label>Correo público<input name="email" type="email" value="<?= h($current['email']) ?>" required></label></div>
<button type="submit">Guardar y aplicar</button></form>
<form method="post" class="card"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="reapply"><h2>Después de un despliegue</h2><p>Vuelve a aplicar teléfono, WhatsApp, agenda y correo guardados sobre el build recién publicado.</p><button class="accent" type="submit">Reaplicar ajustes guardados</button></form>
<?php admin_footer();
