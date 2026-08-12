<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if (cms_is_authenticated()) {
    header('Location: editor.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!cms_verify_csrf($_POST['csrf'] ?? null)) {
        $error = 'La sesión expiró. Recarga la página.';
    } elseif (!cms_is_configured()) {
        $error = 'El CMS no tiene credenciales configuradas en el servidor.';
    } elseif (cms_attempt_login((string) ($_POST['user'] ?? ''), (string) ($_POST['password'] ?? ''))) {
        header('Location: editor.php');
        exit;
    } else {
        $error = 'Credenciales incorrectas.';
    }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>CMS · Malandra</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body class="login-page">
  <main class="login-card">
    <div class="admin-mark">M</div>
    <p class="eyebrow">Editor privado</p>
    <h1>Malandra<br>CMS</h1>
    <p class="muted">Actualiza la landing sin convertir datos pendientes en hechos comerciales.</p>
    <?php if (!cms_is_configured()): ?><div class="notice warning">Configura <code>MALANDRA_CMS_USER</code> y <code>MALANDRA_CMS_PASSWORD_HASH</code> en el servidor.</div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="notice error" role="alert"><?= cms_e($error) ?></div><?php endif; ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= cms_e(cms_csrf()) ?>">
      <label>Usuario<input name="user" autocomplete="username" required></label>
      <label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label>
      <button class="primary-button" type="submit" <?= cms_is_configured() ? '' : 'disabled' ?>>Entrar al editor</button>
    </form>
    <a class="back-link" href="/">← Volver a la landing</a>
  </main>
</body>
</html>
