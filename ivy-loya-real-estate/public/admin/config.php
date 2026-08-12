<?php
declare(strict_types=1);

const CMS_MAX_JSON_BYTES = 524288;
const CMS_MAX_UPLOAD_BYTES = 5242880;

function cms_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function cms_boot(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('ivy_cms_session');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/admin',
            'domain' => '',
            'secure' => cms_is_https(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }

    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
    header('X-Robots-Tag: noindex, nofollow, noarchive');
}

function cms_public_root(): string
{
    return dirname(__DIR__);
}

function cms_content_path(): string
{
    return cms_public_root() . '/data/site-content.json';
}

function cms_upload_dir(): string
{
    return cms_public_root() . '/img/uploads';
}

function cms_env(string $key): string
{
    $value = getenv($key);
    return is_string($value) ? trim($value) : '';
}

function cms_is_configured(): bool
{
    return cms_env('IVY_CMS_USER') !== '' && cms_env('IVY_CMS_PASSWORD_HASH') !== '';
}

function cms_is_authenticated(): bool
{
    $authenticatedAt = $_SESSION['cms_authenticated_at'] ?? null;
    $valid = isset($_SESSION['cms_user'])
        && is_string($_SESSION['cms_user'])
        && is_int($authenticatedAt)
        && $authenticatedAt > time() - 14400;
    if (!$valid) {
        unset($_SESSION['cms_user'], $_SESSION['cms_authenticated_at']);
    }
    return $valid;
}

function cms_require_auth(): void
{
    if (!cms_is_authenticated()) {
        header('Location: index.php');
        exit;
    }
}

function cms_csrf_token(): string
{
    if (!isset($_SESSION['cms_csrf']) || !is_string($_SESSION['cms_csrf'])) {
        $_SESSION['cms_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['cms_csrf'];
}

function cms_verify_csrf(mixed $token): bool
{
    return is_string($token) && hash_equals(cms_csrf_token(), $token);
}

function cms_e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cms_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cms_read_content(): array
{
    $path = cms_content_path();
    if (!is_file($path)) {
        throw new RuntimeException('No se encontró el archivo de contenido.');
    }
    $raw = file_get_contents($path);
    if (!is_string($raw) || strlen($raw) > CMS_MAX_JSON_BYTES) {
        throw new RuntimeException('El archivo de contenido no es válido.');
    }
    $decoded = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    if (!is_array($decoded)) {
        throw new RuntimeException('El contenido debe ser un objeto JSON.');
    }
    return $decoded;
}

function cms_text(mixed $value, int $max = 2400): string
{
    if (!is_string($value)) {
        return '';
    }
    $clean = trim(str_replace(["\0", "\r"], '', $value));
    return function_exists('mb_substr') ? mb_substr($clean, 0, $max) : substr($clean, 0, $max);
}

function cms_localized(mixed $value, int $max = 2400): array
{
    $source = is_array($value) ? $value : [];
    return [
        'es' => cms_text($source['es'] ?? '', $max),
        'en' => cms_text($source['en'] ?? '', $max),
    ];
}

function cms_url(mixed $value, bool $allowEmpty = true): string
{
    $url = cms_text($value, 1000);
    if ($url === '' && $allowEmpty) {
        return '';
    }
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        throw new InvalidArgumentException('Hay un enlace con formato inválido.');
    }
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new InvalidArgumentException('Los enlaces deben usar HTTPS o HTTP.');
    }
    return $url;
}

function cms_image_path(mixed $value): string
{
    $path = cms_text($value, 500);
    if (!preg_match('#^/img/[a-zA-Z0-9/_\-.]+\.(?:jpe?g|png|webp)$#i', $path)) {
        throw new InvalidArgumentException('La imagen debe ser una ruta válida dentro de /img/.');
    }
    return $path;
}

function cms_sanitize_content(array $input): array
{
    $brand = is_array($input['brand'] ?? null) ? $input['brand'] : [];
    $contact = is_array($input['contact'] ?? null) ? $input['contact'] : [];
    $hero = is_array($input['hero'] ?? null) ? $input['hero'] : [];
    $about = is_array($input['about'] ?? null) ? $input['about'] : [];
    $intro = is_array($input['propertiesIntro'] ?? null) ? $input['propertiesIntro'] : [];
    $seo = is_array($input['seo'] ?? null) ? $input['seo'] : [];
    $propertiesInput = is_array($input['properties'] ?? null) ? array_slice($input['properties'], 0, 12) : [];

    if (count($propertiesInput) < 1) {
        throw new InvalidArgumentException('Debe existir al menos una propiedad.');
    }

    $properties = [];
    foreach ($propertiesInput as $index => $property) {
        if (!is_array($property)) {
            continue;
        }
        $id = preg_replace('/[^a-z0-9-]/', '-', strtolower(cms_text($property['id'] ?? 'property-' . ($index + 1), 80)));
        $properties[] = [
            'id' => trim((string) $id, '-') ?: 'property-' . ($index + 1),
            'title' => cms_text($property['title'] ?? '', 140),
            'location' => cms_text($property['location'] ?? '', 140),
            'status' => cms_localized($property['status'] ?? [], 180),
            'summary' => cms_localized($property['summary'] ?? [], 900),
            'image' => cms_image_path($property['image'] ?? ''),
            'link' => cms_url($property['link'] ?? '', false),
        ];
    }

    $email = cms_text($contact['email'] ?? '', 254);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('El correo electrónico no es válido.');
    }

    return [
        'brand' => [
            'name' => cms_text($brand['name'] ?? '', 100),
            'descriptor' => cms_localized($brand['descriptor'] ?? [], 220),
            'partner' => cms_text($brand['partner'] ?? '', 120),
        ],
        'contact' => [
            'instagram' => cms_url($contact['instagram'] ?? '', false),
            'whatsapp' => cms_url($contact['whatsapp'] ?? '', true),
            'email' => $email,
        ],
        'hero' => [
            'eyebrow' => cms_localized($hero['eyebrow'] ?? [], 180),
            'title' => cms_localized($hero['title'] ?? [], 260),
            'summary' => cms_localized($hero['summary'] ?? [], 800),
            'primaryCta' => cms_localized($hero['primaryCta'] ?? [], 100),
            'secondaryCta' => cms_localized($hero['secondaryCta'] ?? [], 100),
        ],
        'about' => [
            'eyebrow' => cms_localized($about['eyebrow'] ?? [], 180),
            'title' => cms_localized($about['title'] ?? [], 260),
            'body' => cms_localized($about['body'] ?? [], 1200),
            'note' => cms_localized($about['note'] ?? [], 300),
        ],
        'propertiesIntro' => [
            'eyebrow' => cms_localized($intro['eyebrow'] ?? [], 180),
            'title' => cms_localized($intro['title'] ?? [], 260),
            'summary' => cms_localized($intro['summary'] ?? [], 800),
        ],
        'properties' => $properties,
        'seo' => [
            'title' => cms_localized($seo['title'] ?? [], 180),
            'description' => cms_localized($seo['description'] ?? [], 320),
        ],
    ];
}

function cms_save_content(array $content): void
{
    $path = cms_content_path();
    $directory = dirname($path);
    if (!is_dir($directory) || !is_writable($directory)) {
        throw new RuntimeException('La carpeta data no tiene permisos de escritura.');
    }

    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n";
    if (strlen($json) > CMS_MAX_JSON_BYTES) {
        throw new RuntimeException('El contenido excede el límite permitido.');
    }

    if (is_file($path)) {
        @copy($path, $directory . '/site-content.backup.json');
    }
    $temporary = tempnam($directory, 'ivy-content-');
    if ($temporary === false || file_put_contents($temporary, $json, LOCK_EX) === false) {
        throw new RuntimeException('No fue posible preparar el archivo.');
    }
    @chmod($temporary, 0640);
    if (!rename($temporary, $path)) {
        @unlink($temporary);
        throw new RuntimeException('No fue posible guardar el contenido.');
    }
}

function cms_list_media(): array
{
    $root = cms_public_root() . '/img';
    if (!is_dir($root)) {
        return [];
    }
    $items = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (!$file->isFile() || !preg_match('/\.(?:jpe?g|png|webp)$/i', $file->getFilename())) {
            continue;
        }
        $relative = str_replace(DIRECTORY_SEPARATOR, '/', substr($file->getPathname(), strlen(cms_public_root())));
        $items[] = [
            'path' => $relative,
            'name' => $file->getFilename(),
            'bytes' => $file->getSize(),
        ];
        if (count($items) >= 200) {
            break;
        }
    }
    usort($items, static fn(array $a, array $b): int => strcmp($a['path'], $b['path']));
    return $items;
}

cms_boot();
