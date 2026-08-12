<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$message = '';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    try {
        $available = scan_copies();
        $saved = read_json('copies');
        $changed = 0;
        if (($_POST['action'] ?? '') === 'reapply') {
            foreach ($saved as $id => $value) {
                $changed += apply_copy((string) $id, (string) $value) > 0 ? 1 : 0;
            }
            $message = "$changed copies reaplicados al sitio publicado.";
        } else {
            foreach (($_POST['copy'] ?? []) as $id => $value) {
                $id = (string) $id;
                if (!isset($available[$id])) {
                    continue;
                }
                $value = sanitize_copy((string) $value);
                if ($value === '' || $value === $available[$id]['value']) {
                    continue;
                }
                if (apply_copy($id, $value) > 0) {
                    $saved[$id] = $value;
                    $changed++;
                }
            }
            write_json('copies', $saved);
            $message = $changed > 0 ? "$changed copies actualizados." : 'No hubo cambios.';
        }
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}
$copies = scan_copies();
admin_header('Copies', 'copies');
?>
<h1>Copies del sitio</h1>
<?php if ($message): ?><p class="notice"><?= h($message) ?></p><?php endif; ?>
<?php if ($error): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
<?php if ($copies === []): ?><p class="notice">No se encontraron elementos <code>data-cms</code>. Ejecuta y despliega primero el build de Astro.</p><?php else: ?>
<form method="post" class="card"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="save">
<?php foreach ($copies as $id => $info): ?><div class="copy-field"><label><?= h($id) ?><textarea name="copy[<?= h($id) ?>]"><?= h((string) $info['value']) ?></textarea></label><span class="muted">Aparece en <?= h(implode(', ', array_unique($info['files']))) ?></span></div><?php endforeach; ?>
<button type="submit">Guardar y publicar</button></form>
<?php endif; ?>
<form method="post" class="card"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="reapply"><h2>Después de un despliegue</h2><p>Reaplica los copies persistidos sobre el HTML recién publicado.</p><button class="accent" type="submit">Reaplicar copies guardados</button></form>
<?php admin_footer();
