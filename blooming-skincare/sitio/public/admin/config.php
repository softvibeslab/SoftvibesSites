<?php
// Configuración del CMS Blooming
declare(strict_types=1);

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
session_start();

const CMS_USER = 'roger';
const CMS_SALT = 'blooming-softvibes-2026';
// sha256(clave . ":" . CMS_SALT)
const CMS_HASH = 'c383900496af08aacf41901305aeec291588ff10b19c1d1a9493b14185ad4db8';

define('CMS_RAIZ', dirname(__DIR__));            // public_html
define('CMS_IMG', CMS_RAIZ . '/img');
define('CMS_JSON', __DIR__ . '/contenido.json'); // persistencia de copies

function login_valido(string $usuario, string $clave): bool
{
    return hash_equals(CMS_USER, $usuario)
        && hash_equals(CMS_HASH, hash('sha256', $clave . ':' . CMS_SALT));
}

function requiere_login(): void
{
    if (empty($_SESSION['cms_ok'])) {
        header('Location: index.php');
        exit;
    }
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function csrf_verificar(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(403);
        exit('CSRF inválido');
    }
}
