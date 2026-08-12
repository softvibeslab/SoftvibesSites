<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !cms_verify_csrf($_POST['csrf'] ?? null)) {
    http_response_code(400);
    exit('Solicitud inválida.');
}
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
}
session_destroy();
header('Location: index.php');
exit;

