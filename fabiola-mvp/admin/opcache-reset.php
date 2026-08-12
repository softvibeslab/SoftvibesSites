<?php
// Resetea el OPcache de PHP tras cada deploy (los .php en disco cambian pero
// PHP sigue ejecutando la versión compilada en memoria).
// Acceso: sesión del CMS iniciada, o ?llave=<CMS_HASH> para automatización post-deploy.
require_once __DIR__ . '/config.php';

$conLlave = hash_equals(CMS_HASH, $_GET['llave'] ?? '');
if (empty($_SESSION['cms_ok']) && !$conLlave) {
    http_response_code(403);
    exit('No autorizado');
}

header('Content-Type: application/json');
$resultado = ['opcache_reset' => false, 'invalidados' => [], 'copies_reaplicados' => 0];

if (function_exists('opcache_reset')) {
    $resultado['opcache_reset'] = @opcache_reset();
}
if (function_exists('opcache_invalidate')) {
    foreach (glob(__DIR__ . '/*.php') as $f) {
        if (@opcache_invalidate($f, true)) {
            $resultado['invalidados'][] = basename($f);
        }
    }
}

// Reaplica las ediciones del CMS sobre los HTML recién desplegados
// (el deploy sobrescribe los HTML con la versión del código fuente)
require_once __DIR__ . '/lib.php';
foreach (leer_guardados() as $id => $valor) {
    $resultado['copies_reaplicados'] += aplicar_copy((string) $id, (string) $valor) > 0 ? 1 : 0;
}

echo json_encode($resultado);
