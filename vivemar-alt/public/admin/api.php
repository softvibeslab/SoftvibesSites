<?php
// API JSON del CMS (usada por el editor visual y el drag & drop de imágenes)
require_once __DIR__ . '/lib.php';
requiere_login();

header('Content-Type: application/json; charset=utf-8');

function responder(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// CSRF: acepta token por POST o por encabezado X-CSRF
$token = $_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF'] ?? '');
if (!hash_equals($_SESSION['csrf'] ?? '', $token)) {
    responder(['ok' => false, 'error' => 'CSRF inválido'], 403);
}

$accion = $_POST['accion'] ?? '';

if ($accion === 'guardar_copies') {
    $copies = json_decode($_POST['copies'] ?? '{}', true);
    if (!is_array($copies) || $copies === []) {
        responder(['ok' => false, 'error' => 'Sin cambios'], 400);
    }
    $existentes = escanear_copies();
    $guardados = 0;
    $detalle = [];
    foreach ($copies as $id => $valor) {
        $id = (string) $id;
        if (!isset($existentes[$id])) {
            $detalle[$id] = 'id desconocido';
            continue;
        }
        $valor = sanitizar_copy((string) $valor);
        if ($valor === '') {
            $detalle[$id] = 'vacío, ignorado';
            continue;
        }
        $archivos = aplicar_copy($id, $valor);
        if ($archivos > 0) {
            guardar_copy_json($id, $valor);
            $guardados++;
            $detalle[$id] = "publicado en $archivos archivo(s)";
        } else {
            $detalle[$id] = 'sin cambios';
        }
    }
    responder(['ok' => true, 'guardados' => $guardados, 'detalle' => $detalle]);
}

if ($accion === 'reemplazar_imagen' || $accion === 'subir_imagen') {
    $extOk = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
    $archivo = $_FILES['archivo'] ?? null;
    if (!$archivo || ($archivo['error'] ?? 1) !== UPLOAD_ERR_OK) {
        responder(['ok' => false, 'error' => 'No se recibió el archivo (¿excede el límite del servidor?)'], 400);
    }
    $ext = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $extOk, true)) {
        responder(['ok' => false, 'error' => 'Formato no permitido: .' . $ext], 400);
    }
    if ($ext !== 'svg' && @getimagesize($archivo['tmp_name']) === false) {
        responder(['ok' => false, 'error' => 'El archivo no es una imagen válida'], 400);
    }

    if ($accion === 'reemplazar_imagen') {
        $destino = basename($_POST['destino'] ?? '');
        if (!is_file(CMS_IMG . '/' . $destino)) {
            responder(['ok' => false, 'error' => 'La imagen destino no existe'], 404);
        }
        $extDestino = strtolower(pathinfo($destino, PATHINFO_EXTENSION));
        $equivalentes = ['jpg' => 'jpeg', 'jpeg' => 'jpg'];
        if ($ext !== $extDestino && ($equivalentes[$ext] ?? '') !== $extDestino) {
            responder(['ok' => false, 'error' => "Debe ser el mismo formato (.$extDestino)"], 400);
        }
        move_uploaded_file($archivo['tmp_name'], CMS_IMG . '/' . $destino);
        responder(['ok' => true, 'imagen' => $destino, 'mensaje' => "«{$destino}» reemplazada en todo el sitio"]);
    }

    $nombre = strtolower(preg_replace('/[^a-zA-Z0-9._-]/', '-', basename($archivo['name'])));
    move_uploaded_file($archivo['tmp_name'], CMS_IMG . '/' . $nombre);
    responder(['ok' => true, 'imagen' => $nombre, 'mensaje' => "«{$nombre}» subida — ruta: /img/{$nombre}"]);
}

responder(['ok' => false, 'error' => 'Acción desconocida'], 400);
