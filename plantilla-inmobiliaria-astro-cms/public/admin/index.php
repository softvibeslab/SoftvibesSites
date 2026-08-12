<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

if (cms_is_logged_in()) {
    redirect('panel.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!CMS_READY) {
        $error = 'El CMS aún no está configurado.';
    } elseif (!login_allowed()) {
        $error = 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.';
    } elseif (validate_login((string) ($_POST['usuario'] ?? ''), (string) ($_POST['clave'] ?? ''))) {
        redirect('panel.php');
    } else {
        $error = 'Credenciales incorrectas.';
    }
}
?><!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso · CMS inmobiliario</title><style>
:root{--ink:#153f43;--accent:#d77e54;--bg:#f2eadc}*{box-sizing:border-box}body{margin:0;color:#243538;background:radial-gradient(circle at top,#d7e7e5,var(--bg));font:15px/1.5 system-ui,sans-serif}.login{display:grid;min-height:100vh;place-items:center;padding:20px}.card{width:min(430px,100%);padding:34px;border:1px solid #ffffffaa;border-radius:22px;background:#fffefadb;box-shadow:0 30px 80px #153f4320;backdrop-filter:blur(16px)}h1{margin:.2rem 0 1.5rem;color:var(--ink);font:600 38px/1.1 Georgia,serif}label{display:grid;margin:0 0 14px;font-weight:700;gap:6px}input{width:100%;padding:12px;border:1px solid #ccd1cc;border-radius:9px;font:inherit}button{width:100%;padding:12px;border:0;border-radius:999px;color:white;background:var(--ink);font:700 15px system-ui;cursor:pointer}.brand{display:grid;width:48px;height:48px;place-items:center;border-radius:50%;color:white;background:var(--ink);font:600 24px Georgia}.notice{margin:0 0 16px;padding:12px;border-left:4px solid var(--accent);background:#fff2ea}.error{border-color:#a93c32;background:#fff0ee}code{font-size:12px}
</style></head><body><main class="login"><section class="card"><span class="brand">H</span><h1>Administración</h1>
<?php if (!CMS_READY): ?><div class="notice"><strong>Configuración pendiente.</strong><br>Copia <code>config.example.php</code> como <code>config.local.php</code> y completa el usuario y hash de contraseña.</div><?php endif; ?>
<?php if ($error): ?><div class="notice error"><?= h($error) ?></div><?php endif; ?>
<form method="post" autocomplete="on"><label>Usuario<input name="usuario" autocomplete="username" required></label><label>Contraseña<input name="clave" type="password" autocomplete="current-password" required></label><button type="submit">Entrar</button></form></section></main></body></html>
