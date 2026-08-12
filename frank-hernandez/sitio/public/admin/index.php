<?php
require_once __DIR__ . '/config.php';

if (!empty($_SESSION['cms_ok'])) {
    header('Location: panel.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Freno básico contra fuerza bruta
    $_SESSION['intentos'] = ($_SESSION['intentos'] ?? 0) + 1;
    if ($_SESSION['intentos'] > 8) {
        sleep(3);
    }
    if (login_valido($_POST['usuario'] ?? '', $_POST['clave'] ?? '')) {
        session_regenerate_id(true);
        $_SESSION['cms_ok'] = true;
        $_SESSION['intentos'] = 0;
        header('Location: panel.php');
        exit;
    }
    $error = 'Usuario o contraseña incorrectos.';
}
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Acceso · CMS Frank Hernández</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
background:linear-gradient(168deg,#0e2a3a,#1b4d5c)}
.caja{background:#fffdf9;padding:2.5rem;border-radius:8px;width:min(360px,90vw);box-shadow:0 20px 60px rgba(0,0,0,.35);border-top:3px solid #b08a57}
h1{font-family:Georgia,serif;color:#0e2a3a;margin:0 0 .25rem;font-size:1.5rem}h1 span{color:#b08a57;font-style:italic}
p{color:#5f6d76;font-size:.85rem;margin:0 0 1.5rem}
label{display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0e2a3a;margin:1rem 0 .3rem}
input{width:100%;box-sizing:border-box;padding:.75rem;border:1px solid #d8d3c6;border-radius:5px;font-size:1rem}
button{width:100%;margin-top:1.5rem;background:#b08a57;color:#fff;border:0;padding:.85rem;border-radius:5px;font-weight:700;font-size:.95rem;cursor:pointer}
button:hover{background:#9a7748}
.error{background:#fdecea;color:#8a3324;border:1px solid #8a3324;border-radius:5px;padding:.7rem;font-size:.85rem;margin-bottom:.5rem}
</style>
</head>
<body>
<form class="caja" method="post" autocomplete="off">
  <h1>Vive <span>Mar</span></h1>
  <p>Panel de administración del sitio</p>
  <?php if ($error): ?><div class="error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
  <label>Usuario</label>
  <input type="text" name="usuario" required autofocus>
  <label>Contraseña</label>
  <input type="password" name="clave" required>
  <button type="submit">Entrar</button>
</form>
</body>
</html>
