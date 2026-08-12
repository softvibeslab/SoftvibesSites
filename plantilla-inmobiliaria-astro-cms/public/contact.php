<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

if (!empty($_POST['empresa'])) {
    header('Location: /gracias');
    exit;
}

$configFile = __DIR__ . '/admin/config.local.php';
$config = is_file($configFile) ? require $configFile : [];
$destination = is_array($config) ? (string) ($config['contact_email'] ?? '') : '';

$clean = static function (string $field): string {
    $value = trim((string) ($_POST[$field] ?? ''));
    $value = str_replace(["\r", "\0"], '', $value);
    return mb_substr($value, 0, 1000);
};

$name = $clean('nombre');
$phone = $clean('telefono');
$email = $clean('correo');
$interest = $clean('interes');
$message = $clean('mensaje');
$privacy = isset($_POST['privacidad']);

if ($name === '' || $phone === '' || !$privacy || ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL))) {
    header('Location: /contacto?estado=invalido');
    exit;
}

if (!filter_var($destination, FILTER_VALIDATE_EMAIL)) {
    header('Location: /contacto?estado=configuracion');
    exit;
}

$host = preg_replace('/[^a-z0-9.-]/i', '', (string) ($_SERVER['SERVER_NAME'] ?? 'example.com')) ?: 'example.com';
$subject = 'Nueva consulta del sitio: ' . mb_substr($name, 0, 80);
$body = "Nueva consulta desde el sitio web\n\n"
    . "Nombre: $name\n"
    . "Teléfono: $phone\n"
    . "Correo: $email\n"
    . "Interés: $interest\n"
    . "Mensaje: $message\n"
    . 'Fecha UTC: ' . gmdate('Y-m-d H:i:s');
$headers = "From: sitio@$host\r\nContent-Type: text/plain; charset=UTF-8\r\n";
if ($email !== '') {
    $headers .= "Reply-To: $email\r\n";
}

$sent = mail($destination, $subject, $body, $headers);
header('Location: ' . ($sent ? '/gracias' : '/contacto?estado=envio'));
exit;
