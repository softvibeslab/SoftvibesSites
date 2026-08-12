<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if (!cms_is_authenticated()) {
    cms_json(['ok' => false, 'error' => 'Sesión no autorizada.'], 401);
}

$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'load') {
        cms_json([
            'ok' => true,
            'content' => cms_read_content(),
            'media' => cms_list_media(),
        ]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        cms_json(['ok' => false, 'error' => 'Método no permitido.'], 405);
    }

    $csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? null);
    if (!cms_verify_csrf(is_string($csrf) ? $csrf : null)) {
        cms_json(['ok' => false, 'error' => 'Token de seguridad inválido.'], 403);
    }

    if ($action === 'save_content') {
        $raw = file_get_contents('php://input');
        if (!is_string($raw) || strlen($raw) > CMS_MAX_JSON_BYTES) {
            cms_json(['ok' => false, 'error' => 'El contenido es demasiado grande.'], 413);
        }
        $input = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($input)) {
            throw new InvalidArgumentException('El contenido enviado no es válido.');
        }
        $clean = cms_sanitize_content($input);
        cms_save_content($clean);
        cms_json(['ok' => true, 'message' => 'Contenido guardado.', 'content' => $clean]);
    }

    if ($action === 'upload_image') {
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new InvalidArgumentException('Selecciona una imagen.');
        }
        $upload = $_FILES['file'];
        if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('La carga no pudo completarse.');
        }
        $size = is_int($upload['size'] ?? null) ? $upload['size'] : 0;
        if ($size < 1 || $size > CMS_MAX_UPLOAD_BYTES) {
            throw new InvalidArgumentException('La imagen debe pesar menos de 5 MB.');
        }
        $temporary = is_string($upload['tmp_name'] ?? null) ? $upload['tmp_name'] : '';
        if (!is_uploaded_file($temporary)) {
            throw new RuntimeException('El archivo temporal no es válido.');
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporary);
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!is_string($mime) || !isset($allowed[$mime])) {
            throw new InvalidArgumentException('Formato no permitido. Usa JPG, PNG o WebP.');
        }
        $directory = cms_upload_dir();
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new RuntimeException('No fue posible crear la carpeta de cargas.');
        }
        if (!is_writable($directory)) {
            throw new RuntimeException('La carpeta de cargas no tiene permisos de escritura.');
        }
        $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $allowed[$mime];
        if (!move_uploaded_file($temporary, $directory . '/' . $filename)) {
            throw new RuntimeException('No fue posible guardar la imagen.');
        }
        @chmod($directory . '/' . $filename, 0640);
        cms_json(['ok' => true, 'message' => 'Imagen cargada.', 'path' => '/img/uploads/' . $filename]);
    }

    cms_json(['ok' => false, 'error' => 'Acción desconocida.'], 404);
} catch (JsonException) {
    cms_json(['ok' => false, 'error' => 'El JSON enviado no es válido.'], 400);
} catch (InvalidArgumentException $error) {
    cms_json(['ok' => false, 'error' => $error->getMessage()], 422);
} catch (Throwable $error) {
    error_log('Ivy CMS error: ' . $error->getMessage());
    cms_json(['ok' => false, 'error' => 'Ocurrió un error interno. Revisa permisos y configuración.'], 500);
}
