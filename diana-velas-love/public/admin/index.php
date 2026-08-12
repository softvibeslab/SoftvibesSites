<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if (cms_is_authenticated()) {
    header('Location: panel.php');
    exit;
}

$error = '';
$now = time();
$attempts = array_values(array_filter(
    is_array($_SESSION['login_attempts'] ?? null) ? $_SESSION['login_attempts'] : [],
    static fn(mixed $timestamp): bool => is_int($timestamp) && $timestamp > $now - 900
));
$_SESSION['login_attempts'] = $attempts;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!cms_verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'La sesión expiró. Recarga e inténtalo de nuevo.';
    } elseif (!cms_is_configured()) {
        $error = 'El editor todavía no está configurado en el servidor.';
    } elseif (count($attempts) >= 5) {
        $error = 'Demasiados intentos. Espera 15 minutos antes de volver a intentar.';
    } else {
        $username = is_string($_POST['username'] ?? null) ? trim($_POST['username']) : '';
        $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
        $validUser = hash_equals(cms_env('DIANA_CMS_USER'), $username);
        $validPassword = password_verify($password, cms_env('DIANA_CMS_PASSWORD_HASH'));
        if ($validUser && $validPassword) {
            session_regenerate_id(true);
            $_SESSION['cms_user'] = $username;
            $_SESSION['cms_authenticated_at'] = $now;
            $_SESSION['login_attempts'] = [];
            $_SESSION['cms_csrf'] = bin2hex(random_bytes(32));
            header('Location: panel.php');
            exit;
        }
        $_SESSION['login_attempts'][] = $now;
        $error = 'Usuario o contraseña incorrectos.';
    }
}
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Acceso | Diana CMS</title><link rel="stylesheet" href="admin.css"></head>
<body class="login-page">
  <main class="login-card">
    <div class="admin-mark">✿</div><p class="eyebrow">Editor privado</p><h1>Diana CMS</h1><p class="muted">Actualiza la marca, el catálogo y los mensajes de pedido desde una fuente controlada.</p>
    <?php if (!cms_is_configured()): ?><div class="notice warning"><strong>Configuración pendiente.</strong> Define <code>DIANA_CMS_USER</code> y <code>DIANA_CMS_PASSWORD_HASH</code> en el servidor. No existe contraseña predeterminada.</div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="notice error"><?= cms_e($error) ?></div><?php endif; ?>
    <form method="post" autocomplete="on"><input type="hidden" name="csrf" value="<?= cms_e(cms_csrf_token()) ?>"><label>Usuario<input type="text" name="username" autocomplete="username" required <?= cms_is_configured() ? '' : 'disabled' ?>></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required <?= cms_is_configured() ? '' : 'disabled' ?>></label><button class="primary-button" type="submit" <?= cms_is_configured() ? '' : 'disabled' ?>>Entrar al panel</button></form>
    <a class="back-link" href="/">← Volver al catálogo</a>
  </main>
</body>
</html>
