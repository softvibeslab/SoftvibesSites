<?php
// API JSON del CMS (usada por el editor visual y el drag & drop de imágenes)
require_once __DIR__ . '/lib.php';
requiere_login();

@ini_set('memory_limit', '256M');
header('Content-Type: application/json; charset=utf-8');

// Los errores fatales deben responder JSON, nunca un cuerpo vacío
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
        }
        echo json_encode(['ok' => false, 'error' => 'PHP fatal: ' . substr($e['message'], 0, 200)]);
    }
});

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

if ($accion === 'reemplazar_imagen') {
    $destino = basename($_POST['destino'] ?? '');
    if (!is_file(CMS_IMG . '/' . $destino)) {
        responder(['ok' => false, 'error' => 'La imagen destino no existe'], 404);
    }
    [$ok, $msg] = guardar_imagen($_FILES['archivo'] ?? [], CMS_IMG . '/' . $destino);
    if (!$ok) {
        responder(['ok' => false, 'error' => $msg], 400);
    }
    responder(['ok' => true, 'imagen' => $destino, 'mensaje' => "«{$destino}» reemplazada en todo el sitio ({$msg})"]);
}

if ($accion === 'subir_imagen') {
    $archivo = $_FILES['archivo'] ?? [];
    $nombre = strtolower(preg_replace('/[^a-zA-Z0-9._-]/', '-', basename($archivo['name'] ?? 'imagen')));
    $ext = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
    // Formatos poco aptos para web se convierten a JPG automáticamente
    if (in_array($ext, CMS_EXT_CONVERTIR, true)) {
        $nombre = preg_replace('/\.[^.]+$/', '.jpg', $nombre);
    }
    [$ok, $msg] = guardar_imagen($archivo, CMS_IMG . '/' . $nombre);
    if (!$ok) {
        responder(['ok' => false, 'error' => $msg], 400);
    }
    responder(['ok' => true, 'imagen' => $nombre, 'mensaje' => "«{$nombre}» subida ({$msg}) — ruta: /img/{$nombre}"]);
}

if ($accion === 'listar_media') {
    $meta = leer_media_json();
    $archivos = [];
    foreach (glob(CMS_IMG . '/*.{jpg,jpeg,png,webp,svg,gif,avif}', GLOB_BRACE) ?: [] as $ruta) {
        $nombre = basename($ruta);
        $dims = @getimagesize($ruta);
        $m = $meta[$nombre] ?? [];
        $archivos[] = [
            'nombre' => $nombre,
            'url' => '/img/' . $nombre . '?v=' . filemtime($ruta),
            'kb' => (int) round(filesize($ruta) / 1024),
            'ancho' => $dims[0] ?? null,
            'alto' => $dims[1] ?? null,
            'fecha' => date('Y-m-d H:i', filemtime($ruta)),
            'categoria' => $m['categoria'] ?? 'sin-clasificar',
            'caption' => $m['caption'] ?? '',
            'origen' => $m['origen'] ?? '',
            'post' => $m['post'] ?? '',
            'sha1' => $m['sha1'] ?? '',
        ];
    }
    usort($archivos, fn($a, $b) => strcmp($b['fecha'], $a['fecha']));
    responder(['ok' => true, 'archivos' => $archivos]);
}

if ($accion === 'importar_media') {
    // Importación con metadatos (usada por la subida masiva desde redes)
    $nombre = strtolower(preg_replace('/[^a-zA-Z0-9._-]/', '-', basename($_POST['nombre'] ?? '')));
    if ($nombre === '' || !preg_match('/\.(jpg|jpeg|png|webp)$/', $nombre)) {
        responder(['ok' => false, 'error' => 'Nombre destino inválido'], 400);
    }
    $sha1 = $_POST['sha1'] ?? '';
    $meta = leer_media_json();
    foreach ($meta as $archivo => $m) {
        if ($sha1 !== '' && ($m['sha1'] ?? '') === $sha1) {
            responder(['ok' => true, 'imagen' => $archivo, 'omitido' => true, 'mensaje' => 'ya existía (sha1)']);
        }
    }
    [$ok, $msg] = guardar_imagen($_FILES['archivo'] ?? [], CMS_IMG . '/' . $nombre);
    if (!$ok) {
        responder(['ok' => false, 'error' => $msg], 400);
    }
    redimensionar_imagen(CMS_IMG . '/' . $nombre);
    $meta[$nombre] = [
        'categoria' => preg_replace('/[^a-z0-9-]/', '', $_POST['categoria'] ?? 'sin-clasificar') ?: 'sin-clasificar',
        'caption' => mb_substr(trim($_POST['caption'] ?? ''), 0, 400),
        'origen' => mb_substr(trim($_POST['origen'] ?? ''), 0, 60),
        'post' => mb_substr(trim($_POST['post'] ?? ''), 0, 300),
        'sha1' => $sha1,
    ];
    guardar_media_json($meta);
    responder(['ok' => true, 'imagen' => $nombre, 'mensaje' => "«{$nombre}» importada ({$msg})"]);
}

if ($accion === 'aplicar_desde_hub') {
    $origen = basename($_POST['origen'] ?? '');
    $destino = basename($_POST['destino'] ?? '');
    if (!is_file(CMS_IMG . '/' . $origen)) {
        responder(['ok' => false, 'error' => 'El archivo del Media Hub no existe'], 404);
    }
    if (!is_file(CMS_IMG . '/' . $destino)) {
        responder(['ok' => false, 'error' => 'La imagen destino no existe'], 404);
    }
    if ($origen === $destino) {
        responder(['ok' => false, 'error' => 'Origen y destino son el mismo archivo'], 400);
    }
    [$ok, $msg] = importar_imagen(CMS_IMG . '/' . $origen, $origen, CMS_IMG . '/' . $destino, false);
    if (!$ok) {
        responder(['ok' => false, 'error' => $msg], 400);
    }
    responder(['ok' => true, 'imagen' => $destino, 'mensaje' => "«{$origen}» aplicada como «{$destino}» en todo el sitio ({$msg})"]);
}

if ($accion === 'reaplicar') {
    $n = 0;
    foreach (leer_guardados() as $id => $valor) {
        $n += aplicar_copy((string) $id, (string) $valor) > 0 ? 1 : 0;
    }
    responder(['ok' => true, 'reaplicados' => $n]);
}

if ($accion === 'eliminar_imagen') {
    $destino = basename($_POST['destino'] ?? '');
    if (!is_file(CMS_IMG . '/' . $destino)) {
        responder(['ok' => false, 'error' => 'El archivo no existe'], 404);
    }
    unlink(CMS_IMG . '/' . $destino);
    $meta = leer_media_json();
    if (isset($meta[$destino])) {
        unset($meta[$destino]);
        guardar_media_json($meta);
    }
    responder(['ok' => true, 'mensaje' => "«{$destino}» eliminada"]);
}

responder(['ok' => false, 'error' => 'Acción desconocida'], 400);
