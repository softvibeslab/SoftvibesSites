<?php
// Exporta/restaura el "estado vivo" del CMS (ediciones de textos + catálogo de media).
// El deploy de Hostinger es destructivo: build-deploy.sh respalda este estado antes
// de desplegar y lo restaura después, para no perder lo editado desde el panel.
// Acceso: sesión del CMS o ?llave=<CMS_HASH> (automatización).
require_once __DIR__ . '/lib.php';

$conLlave = hash_equals(CMS_HASH, $_GET['llave'] ?? '');
if (empty($_SESSION['cms_ok']) && !$conLlave) {
    http_response_code(403);
    exit('No autorizado');
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'contenido' => leer_guardados(),
        'media' => leer_media_json(),
        'ajustes' => leer_ajustes(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST: restaurar (merge sobre lo desplegado — lo del servidor pre-deploy gana)
$entrada = json_decode(file_get_contents('php://input'), true);
if (!is_array($entrada)) {
    http_response_code(400);
    exit(json_encode(['ok' => false, 'error' => 'JSON inválido']));
}

$resultado = ['ok' => true, 'contenido_restaurado' => 0, 'media_restaurada' => 0, 'copies_reaplicados' => 0];

if (!empty($entrada['contenido']) && is_array($entrada['contenido'])) {
    $actual = leer_guardados();
    foreach ($entrada['contenido'] as $id => $valor) {
        $actual[$id] = $valor;
        $resultado['contenido_restaurado']++;
    }
    file_put_contents(CMS_JSON, json_encode($actual, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    foreach ($actual as $id => $valor) {
        $resultado['copies_reaplicados'] += aplicar_copy((string) $id, (string) $valor) > 0 ? 1 : 0;
    }
}

if (!empty($entrada['ajustes']) && is_array($entrada['ajustes'])) {
    $ajustes = array_merge(CMS_AJUSTES_BASE, $entrada['ajustes']);
    // El HTML recién desplegado trae los valores base: aplicar los del estado vivo
    $resultado['ajustes_aplicados'] = aplicar_ajustes(CMS_AJUSTES_BASE, $ajustes);
    guardar_ajustes($ajustes);
}

if (!empty($entrada['media']) && is_array($entrada['media'])) {
    $actual = leer_media_json();
    foreach ($entrada['media'] as $archivo => $meta) {
        if (!isset($actual[$archivo]) && is_array($meta)) {
            $actual[$archivo] = $meta;
            $resultado['media_restaurada']++;
        }
    }
    guardar_media_json($actual);
}

echo json_encode($resultado);
