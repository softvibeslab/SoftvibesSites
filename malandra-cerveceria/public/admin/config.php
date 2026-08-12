<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('malandra_cms');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'samesite' => 'Strict',
        'path' => '/',
    ]);
    session_start();
}

const CMS_DATA_FILE = __DIR__ . '/../data/site-content.json';
const CMS_BACKUP_DIR = __DIR__ . '/storage/backups';
const CMS_LOCAL_CREDENTIALS_FILE = __DIR__ . '/storage/credentials.php';

function cms_e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cms_credentials(): array
{
    $environmentUser = trim((string) getenv('MALANDRA_CMS_USER'));
    $environmentHash = trim((string) getenv('MALANDRA_CMS_PASSWORD_HASH'));
    if ($environmentUser !== '' && $environmentHash !== '') {
        return ['user' => $environmentUser, 'passwordHash' => $environmentHash];
    }

    if (!is_file(CMS_LOCAL_CREDENTIALS_FILE)) {
        return ['user' => '', 'passwordHash' => ''];
    }

    $credentials = require CMS_LOCAL_CREDENTIALS_FILE;
    if (!is_array($credentials)) {
        return ['user' => '', 'passwordHash' => ''];
    }

    return [
        'user' => trim((string) ($credentials['user'] ?? '')),
        'passwordHash' => trim((string) ($credentials['passwordHash'] ?? '')),
    ];
}

function cms_user(): string
{
    return cms_credentials()['user'];
}

function cms_password_hash(): string
{
    return cms_credentials()['passwordHash'];
}

function cms_is_configured(): bool
{
    return cms_user() !== '' && cms_password_hash() !== '';
}

function cms_csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
    }
    return (string) $_SESSION['csrf'];
}

function cms_verify_csrf(mixed $value): bool
{
    return is_string($value) && hash_equals(cms_csrf(), $value);
}

function cms_is_authenticated(): bool
{
    return !empty($_SESSION['cms_authenticated']);
}

function cms_attempt_login(string $user, string $password): bool
{
    if (!cms_is_configured()) {
        return false;
    }
    $validUser = hash_equals(cms_user(), trim($user));
    $validPassword = password_verify($password, cms_password_hash());
    if (!$validUser || !$validPassword) {
        usleep(350000);
        return false;
    }
    session_regenerate_id(true);
    $_SESSION['cms_authenticated'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    return true;
}

function cms_require_auth(): void
{
    if (!cms_is_authenticated()) {
        header('Location: index.php');
        exit;
    }
}

function cms_load_content(): array
{
    $raw = @file_get_contents(CMS_DATA_FILE);
    if ($raw === false) {
        throw new RuntimeException('No se pudo leer el contenido del sitio.');
    }
    $content = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($content)) {
        throw new RuntimeException('El contenido no tiene una estructura válida.');
    }
    return $content;
}

function cms_text(mixed $value, int $max = 2000): string
{
    $text = trim((string) $value);
    if (mb_strlen($text) > $max) {
        $text = mb_substr($text, 0, $max);
    }
    return $text;
}

function cms_instagram_url(mixed $value, bool $postOnly = false): string
{
    $url = filter_var(trim((string) $value), FILTER_VALIDATE_URL);
    if (!is_string($url)) {
        throw new InvalidArgumentException('Hay una URL de Instagram inválida.');
    }
    $pattern = $postOnly
        ? '#^https://www\.instagram\.com/p/[A-Za-z0-9_-]+/?$#'
        : '#^https://www\.instagram\.com/[A-Za-z0-9._-]+/?$#';
    if (!preg_match($pattern, $url)) {
        throw new InvalidArgumentException('Solo se permiten URLs públicas de Instagram.');
    }
    return $url;
}

function cms_validate_content(array $content): void
{
    if (($content['brand']['name'] ?? '') === '' || ($content['hero']['title'] ?? '') === '') {
        throw new InvalidArgumentException('Marca y título del hero son obligatorios.');
    }
    if (!isset($content['batches']) || !is_array($content['batches']) || count($content['batches']) < 1) {
        throw new InvalidArgumentException('Debe existir al menos un lote.');
    }
    if (!isset($content['media']['clips'], $content['media']['photos']) || !is_array($content['media']['clips']) || !is_array($content['media']['photos'])) {
        throw new InvalidArgumentException('El archivo multimedia no tiene una estructura válida.');
    }
    if (count($content['media']['clips']) !== 3 || count($content['media']['photos']) !== 6) {
        throw new InvalidArgumentException('El archivo multimedia debe conservar tres videos y seis fotografías de bitácora.');
    }
    foreach ($content['media']['clips'] as $clip) {
        if (($clip['title'] ?? '') === '' || !preg_match('#^/media/[a-z0-9-]+\.mp4$#', (string) ($clip['src'] ?? '')) || !preg_match('#^/media/[a-z0-9-]+-poster\.jpg$#', (string) ($clip['poster'] ?? ''))) {
            throw new InvalidArgumentException('Hay un video multimedia inválido.');
        }
    }
    foreach ($content['media']['photos'] as $photo) {
        if (($photo['caption'] ?? '') === '' || !preg_match('#^/media/[a-z0-9-]+\.jpg$#', (string) ($photo['src'] ?? ''))) {
            throw new InvalidArgumentException('Hay una fotografía multimedia inválida.');
        }
    }
    foreach ($content['batches'] as $batch) {
        if (($batch['name'] ?? '') === '' || ($batch['status'] ?? '') === '') {
            throw new InvalidArgumentException('Cada lote necesita nombre y estado.');
        }
        if (($batch['available'] ?? true) !== false) {
            throw new InvalidArgumentException('La disponibilidad comercial permanece bloqueada en esta versión.');
        }
        cms_instagram_url($batch['sourceUrl'] ?? '', true);
    }
}

function cms_save_content(array $content): void
{
    cms_validate_content($content);
    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . PHP_EOL;
    if (!is_dir(CMS_BACKUP_DIR) && !mkdir(CMS_BACKUP_DIR, 0750, true) && !is_dir(CMS_BACKUP_DIR)) {
        throw new RuntimeException('No se pudo crear el directorio de respaldos.');
    }
    if (is_file(CMS_DATA_FILE)) {
        $backup = CMS_BACKUP_DIR . '/site-content-' . gmdate('Ymd-His') . '.json';
        if (!copy(CMS_DATA_FILE, $backup)) {
            throw new RuntimeException('No se pudo crear el respaldo.');
        }
    }
    $temporary = CMS_DATA_FILE . '.tmp-' . bin2hex(random_bytes(5));
    if (file_put_contents($temporary, $json, LOCK_EX) === false || !rename($temporary, CMS_DATA_FILE)) {
        @unlink($temporary);
        throw new RuntimeException('No se pudo guardar el contenido.');
    }
}
