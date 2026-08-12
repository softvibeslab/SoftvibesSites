<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_login();

$collection = in_array($_GET['collection'] ?? '', ['properties', 'blog'], true) ? (string) $_GET['collection'] : 'properties';
$content = read_json('content', ['properties' => [], 'blog' => []]);
$content['properties'] ??= [];
$content['blog'] ??= [];
$trash = read_json('trash', []);
$message = '';
$error = '';

if (isset($_GET['export'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="cms-content-' . gmdate('Y-m-d-His') . '.json"');
    echo json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = (string) ($_POST['action'] ?? 'save');
    $collection = in_array($_POST['collection'] ?? '', ['properties', 'blog'], true) ? (string) $_POST['collection'] : 'properties';
    try {
        if ($action === 'delete') {
            $id = (string) ($_POST['id'] ?? '');
            if (isset($content[$collection][$id])) {
                $trash[] = ['collection' => $collection, 'id' => $id, 'item' => $content[$collection][$id], 'deleted_at' => gmdate(DATE_ATOM)];
                unset($content[$collection][$id]);
                write_json('content', $content);
                write_json('trash', $trash);
                $message = 'Elemento enviado a la papelera.';
            }
        } elseif ($action === 'restore') {
            $index = filter_var($_POST['index'] ?? null, FILTER_VALIDATE_INT);
            if ($index !== false && isset($trash[$index])) {
                $entry = $trash[$index];
                $targetCollection = in_array($entry['collection'] ?? '', ['properties', 'blog'], true) ? $entry['collection'] : null;
                if ($targetCollection !== null) {
                    $content[$targetCollection][(string) $entry['id']] = $entry['item'];
                    array_splice($trash, $index, 1);
                    write_json('content', $content);
                    write_json('trash', $trash);
                    $collection = $targetCollection;
                    $message = 'Elemento restaurado.';
                }
            }
        } else {
            $id = slugify((string) ($_POST['id'] ?? $_POST['title'] ?? ''));
            if ($id === '') {
                throw new RuntimeException('El slug no es válido.');
            }
            $original = slugify((string) ($_POST['original_id'] ?? ''));
            if ($original !== '' && $original !== $id) {
                unset($content[$collection][$original]);
            }
            if ($collection === 'properties') {
                $price = filter_var($_POST['price'] ?? null, FILTER_VALIDATE_FLOAT);
                $areaInput = trim((string) ($_POST['area'] ?? ''));
                $area = $areaInput === '' ? null : filter_var($areaInput, FILTER_VALIDATE_FLOAT);
                if ($price === false || $price < 0 || ($area !== null && ($area === false || $area <= 0))) {
                    throw new RuntimeException('Precio y superficie deben ser números válidos.');
                }
                $content[$collection][$id] = [
                    'title' => trim((string) ($_POST['title'] ?? '')),
                    'summary' => trim((string) ($_POST['summary'] ?? '')),
                    'price' => $price,
                    'currency' => in_array($_POST['currency'] ?? '', ['MXN', 'USD', 'EUR'], true) ? $_POST['currency'] : 'MXN',
                    'type' => slugify((string) ($_POST['type'] ?? 'propiedad')),
                    'zone' => slugify((string) ($_POST['zone'] ?? 'general')),
                    'location' => trim((string) ($_POST['location'] ?? '')),
                    'area' => $area,
                    'bedrooms' => ($_POST['bedrooms'] ?? '') === '' ? null : max(0, (int) $_POST['bedrooms']),
                    'bathrooms' => ($_POST['bathrooms'] ?? '') === '' ? null : max(0, (float) $_POST['bathrooms']),
                    'image' => trim((string) ($_POST['image'] ?? '/img/demo/property.svg')),
                    'featured' => isset($_POST['featured']),
                    'demo' => isset($_POST['demo']),
                    'status' => in_array($_POST['status'] ?? '', ['venta', 'preventa', 'entrega-inmediata', 'reservada'], true) ? $_POST['status'] : 'venta',
                    'features' => array_values(array_filter(array_map('trim', preg_split('/\R/', (string) ($_POST['features'] ?? '')) ?: []))),
                    'payment' => array_values(array_filter(array_map('trim', preg_split('/\R/', (string) ($_POST['payment'] ?? '')) ?: []))),
                    'body' => trim((string) ($_POST['body'] ?? '')),
                    'updated_at' => gmdate(DATE_ATOM),
                ];
            } else {
                $date = (string) ($_POST['date'] ?? '');
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    throw new RuntimeException('La fecha no es válida.');
                }
                $content[$collection][$id] = [
                    'title' => trim((string) ($_POST['title'] ?? '')),
                    'description' => trim((string) ($_POST['description'] ?? '')),
                    'date' => $date,
                    'image' => trim((string) ($_POST['image'] ?? '')),
                    'draft' => isset($_POST['draft']),
                    'body' => trim((string) ($_POST['body'] ?? '')),
                    'updated_at' => gmdate(DATE_ATOM),
                ];
            }
            if (($content[$collection][$id]['title'] ?? '') === '') {
                throw new RuntimeException('El título es obligatorio.');
            }
            write_json('content', $content);
            $message = 'Contenido guardado como borrador estructurado.';
        }
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}

$editId = slugify((string) ($_GET['edit'] ?? ''));
$item = $editId !== '' ? ($content[$collection][$editId] ?? null) : null;
admin_header('Contenido', 'content');
?>
<h1>Contenido estructurado</h1>
<p class="notice">Este contenido no modifica automáticamente las rutas estáticas. Descarga el JSON, ejecútalo con el importador del proyecto y vuelve a compilar.</p>
<?php if ($message): ?><p class="notice"><?= h($message) ?></p><?php endif; ?><?php if ($error): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
<div class="actions" style="margin-bottom:18px"><a class="button <?= $collection === 'properties' ? 'accent' : 'secondary' ?>" href="content.php?collection=properties">Propiedades</a><a class="button <?= $collection === 'blog' ? 'accent' : 'secondary' ?>" href="content.php?collection=blog">Blog</a><a class="button secondary" href="content.php?collection=<?= h($collection) ?>&export=1">Descargar JSON</a></div>

<section class="card"><h2><?= $item ? 'Editar' : 'Crear' ?> <?= $collection === 'properties' ? 'propiedad' : 'artículo' ?></h2>
<form method="post"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="save"><input type="hidden" name="collection" value="<?= h($collection) ?>"><input type="hidden" name="original_id" value="<?= h($editId) ?>">
<div class="row"><label>Slug<input name="id" value="<?= h($editId) ?>" placeholder="se-genera-del-titulo"></label><label>Título<input name="title" value="<?= h((string) ($item['title'] ?? '')) ?>" required></label></div>
<?php if ($collection === 'properties'): ?>
<label>Resumen<textarea name="summary" required><?= h((string) ($item['summary'] ?? '')) ?></textarea></label>
<div class="row"><label>Precio<input name="price" type="number" min="0" step="0.01" value="<?= h((string) ($item['price'] ?? '')) ?>" required></label><label>Moneda<select name="currency"><?php foreach (['MXN','USD','EUR'] as $currency): ?><option <?= ($item['currency'] ?? 'MXN') === $currency ? 'selected' : '' ?>><?= $currency ?></option><?php endforeach; ?></select></label></div>
<div class="row"><label>Tipo<input name="type" value="<?= h((string) ($item['type'] ?? '')) ?>" placeholder="departamento" required></label><label>Zona<input name="zone" value="<?= h((string) ($item['zone'] ?? '')) ?>" placeholder="playa-del-carmen" required></label></div>
<label>Ubicación<input name="location" value="<?= h((string) ($item['location'] ?? '')) ?>" required></label>
<div class="row"><label>Superficie m², si está confirmada<input name="area" type="number" min="1" step="0.01" value="<?= h((string) ($item['area'] ?? '')) ?>"></label><div class="row"><label>Recámaras<input name="bedrooms" type="number" min="0" value="<?= h((string) ($item['bedrooms'] ?? '')) ?>"></label><label>Baños<input name="bathrooms" type="number" min="0" step="0.5" value="<?= h((string) ($item['bathrooms'] ?? '')) ?>"></label></div></div>
<div class="row"><label>Ruta de imagen<input name="image" value="<?= h((string) ($item['image'] ?? '/img/demo/property.svg')) ?>" required></label><label>Estatus<select name="status"><?php foreach (['venta','preventa','entrega-inmediata','reservada'] as $status): ?><option value="<?= $status ?>" <?= ($item['status'] ?? 'venta') === $status ? 'selected' : '' ?>><?= h($status) ?></option><?php endforeach; ?></select></label></div>
<div class="row"><label><span><input style="width:auto" type="checkbox" name="featured" <?= !empty($item['featured']) ? 'checked' : '' ?>> Destacada</span></label><label><span><input style="width:auto" type="checkbox" name="demo" <?= !isset($item['demo']) || !empty($item['demo']) ? 'checked' : '' ?>> Contenido demostrativo</span></label></div>
<div class="row"><label>Características, una por línea<textarea name="features"><?= h(implode("\n", $item['features'] ?? [])) ?></textarea></label><label>Formas de pago, una por línea<textarea name="payment"><?= h(implode("\n", $item['payment'] ?? [])) ?></textarea></label></div>
<?php else: ?>
<label>Descripción<textarea name="description" required><?= h((string) ($item['description'] ?? '')) ?></textarea></label><div class="row"><label>Fecha<input name="date" type="date" value="<?= h((string) ($item['date'] ?? gmdate('Y-m-d'))) ?>" required></label><label>Ruta de imagen<input name="image" value="<?= h((string) ($item['image'] ?? '/img/demo/zone.svg')) ?>"></label></div><label><span><input style="width:auto" type="checkbox" name="draft" <?= !empty($item['draft']) ? 'checked' : '' ?>> Mantener como borrador</span></label>
<?php endif; ?>
<label>Cuerpo en Markdown<textarea name="body" style="min-height:220px"><?= h((string) ($item['body'] ?? '')) ?></textarea></label><div class="actions"><button type="submit">Guardar borrador</button><?php if ($item): ?><a class="button secondary" href="content.php?collection=<?= h($collection) ?>">Cancelar</a><?php endif; ?></div></form></section>

<section class="card"><h2><?= $collection === 'properties' ? 'Propiedades' : 'Artículos' ?> guardados</h2><div class="list">
<?php foreach (($content[$collection] ?? []) as $id => $entry): ?><article class="list-item"><div><strong><?= h((string) ($entry['title'] ?? $id)) ?></strong><div class="muted"><?= h($id) ?> · Actualizado <?= h((string) ($entry['updated_at'] ?? 'sin fecha')) ?></div></div><div class="actions"><a class="button secondary" href="content.php?collection=<?= h($collection) ?>&edit=<?= urlencode((string) $id) ?>">Editar</a><form method="post" onsubmit="return confirm('El elemento se moverá a la papelera. ¿Continuar?')"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="collection" value="<?= h($collection) ?>"><input type="hidden" name="id" value="<?= h((string) $id) ?>"><button class="danger" type="submit">Papelera</button></form></div></article><?php endforeach; ?>
<?php if (($content[$collection] ?? []) === []): ?><p class="muted">No hay elementos en esta colección.</p><?php endif; ?></div></section>

<?php if ($trash !== []): ?><section class="card"><h2>Papelera recuperable</h2><div class="list"><?php foreach ($trash as $index => $entry): ?><article class="list-item"><div><strong><?= h((string) ($entry['item']['title'] ?? $entry['id'] ?? 'Elemento')) ?></strong><div class="muted"><?= h((string) ($entry['collection'] ?? '')) ?> · <?= h((string) ($entry['deleted_at'] ?? '')) ?></div></div><form method="post"><input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>"><input type="hidden" name="action" value="restore"><input type="hidden" name="collection" value="<?= h($collection) ?>"><input type="hidden" name="index" value="<?= h((string) $index) ?>"><button type="submit">Restaurar</button></form></article><?php endforeach; ?></div></section><?php endif; ?>
<?php admin_footer();
