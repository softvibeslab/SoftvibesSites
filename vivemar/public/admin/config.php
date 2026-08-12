<?php
// Configuración del CMS Vive Mar
declare(strict_types=1);

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
session_start();

const CMS_USER = 'roger';
const CMS_SALT = 'vivemar-softvibes-2026';
// sha256("holamundo:" . CMS_SALT)
const CMS_HASH = 'eac1047f8fc22e640e477459778e23e70dbe877b53bb3946ded88e0cc3e1bc54';

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
