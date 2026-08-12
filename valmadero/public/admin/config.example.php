<?php
declare(strict_types=1);

// Copia este archivo como config.local.php y completa todos los valores.
// Genera el hash en un servidor con PHP:
// php -r "echo password_hash('TU_CLAVE', PASSWORD_DEFAULT), PHP_EOL;"
return [
    'user' => 'admin',
    'password_hash' => '',
    'state_token' => '',
    'contact_email' => 'contacto@valmadero.example', // Sustituir por el correo real antes de publicar.
    'max_upload_bytes' => 8 * 1024 * 1024,
];
