<?php
// Manejador del formulario de contacto para hosting compartido de Hostinger.
// Configura el correo destino antes de publicar:
$destino = 'frank.rivieramaya.demo@softvibes.com';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: /');
  exit;
}

// Honeypot: si el campo oculto "empresa" viene lleno, es un bot.
if (!empty($_POST['empresa'])) {
  header('Location: /gracias');
  exit;
}

$limpio = fn($campo) => htmlspecialchars(trim($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

$nombre      = $limpio('nombre');
$telefono    = $limpio('telefono');
$correo      = $limpio('correo');
$interes     = $limpio('interes');
$presupuesto = $limpio('presupuesto');
$mensaje     = $limpio('mensaje');

if ($nombre === '' || $telefono === '') {
  header('Location: /contacto');
  exit;
}

$asunto = "Nuevo lead del sitio web: $nombre ($interes)";
$cuerpo = "Nuevo contacto desde el sitio de Frank Hernández\n\n"
  . "Nombre: $nombre\n"
  . "Teléfono/WhatsApp: $telefono\n"
  . "Correo: $correo\n"
  . "Interés: $interes\n"
  . "Presupuesto: $presupuesto\n"
  . "Mensaje: $mensaje\n\n"
  . 'Fecha: ' . date('Y-m-d H:i:s');

$cabeceras = "From: sitio@frankrivieramaya.com\r\n";
if (filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  $cabeceras .= "Reply-To: $correo\r\n";
}
$cabeceras .= "Content-Type: text/plain; charset=UTF-8\r\n";

mail($destino, $asunto, $cuerpo, $cabeceras);

header('Location: /gracias');
exit;
