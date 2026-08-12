<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$message = '';
$error = '';
if (isset($_GET['download'])) {
    $state = [
        'version' => 1,
        'exported_at' => gmdate(DATE_ATOM),
        'copies' => read_json('copies'),
        'settings' => read_json('settings'),
        'content' => read_json('content'),
        'media' => read_json('media'),
        'trash' => read_json('trash'),
    ];
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="cms-backup-' . gmdate('Y-m-d-His') . '.json"');
    echo json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $file = $_FILES['backup'] ?? [];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || (int) ($file['size'] ?? 0) > 5 * 1024 * 1024) {
        $error = 'No se recibió un respaldo JSON válido.';
    } else {
        $state = json_decode((string) file_get_contents((string) $file['tmp_name']), true);
        if (!is_array($state) || ($state['version'] ?? null) !== 1) {
            $error = 'El formato del respaldo no es compatible.';
        } else {
            try {
                foreach (['copies', 'settings', 'content', 'media', 'trash'] as $key) {
                    if (isset($state[$key]) && is_array($state[$key])) {
                        write_json($key, $state[$key]);
                    }
                }
                foreach (read_json('copies') as $id => $value) {
                    apply_copy((string) $id, (string) $value);
                }
                apply_settings(default_settings(), array_merge(default_settings(), read_json('settings')));
                $message = 'Respaldo restaurado; se reaplicaron copies y ajustes disponibles.';
            } catch (Throwable $exception) {
                $error = $exception->getMessage();
            }
        }
    }
}
admin_header('Respaldo', 'backup');
?>
<h1>Respaldo y restauración</h1>
<?php if ($message): ?><p class="notice"><?= h($message) ?></p><?php endif; ?><?php if ($error): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
<section class="card"><h2>Exportar estado</h2><p>Descarga copies, ajustes, contenido, metadatos de medios y papelera. Las imágenes se respaldan por separado desde el hosting.</p><a class="button accent" href="backup.php?download=1">Descargar respaldo JSON</a></section>
<section class="card"><h2>Restaurar estado</h2><p>La restauración reemplaza los archivos JSON actuales y reaplica los cambios sobre el HTML publicado.</p><form method="post" enctype="multipart/form-data" onsubmit="return confirm('Se reemplazará el estado actual del CMS. ¿Continuar?')"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><label>Archivo de respaldo<input name="backup" type="file" accept="application/json,.json" required></label><button class="danger" type="submit">Restaurar respaldo</button></form></section>
<?php admin_footer();
