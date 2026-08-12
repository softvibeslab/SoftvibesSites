<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
$authorization = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
$expected = CMS_STATE_TOKEN !== '' ? 'Bearer ' . CMS_STATE_TOKEN : '';
if ($expected === '' || !hash_equals($expected, $authorization)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'No autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'version' => 1,
        'copies' => read_json('copies'),
        'settings' => read_json('settings'),
        'content' => read_json('content'),
        'media' => read_json('media'),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body) || ($body['version'] ?? null) !== 1) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Estado inválido']);
    exit;
}

foreach (['copies', 'settings', 'content', 'media'] as $key) {
    if (isset($body[$key]) && is_array($body[$key])) {
        write_json($key, $body[$key]);
    }
}
foreach (read_json('copies') as $id => $value) {
    apply_copy((string) $id, (string) $value);
}
apply_settings(default_settings(), array_merge(default_settings(), read_json('settings')));
echo json_encode(['ok' => true]);
