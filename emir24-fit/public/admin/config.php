<?php
declare(strict_types=1);

const CMS_MAX_JSON_BYTES = 524288;

function cms_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function cms_boot(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('emir_cms_session');
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
    header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
    header('X-Robots-Tag: noindex, nofollow, noarchive');
}

function cms_content_path(): string
{
    return dirname(__DIR__) . '/data/site-content.json';
}

function cms_env(string $key): string
{
    $value = getenv($key);
    return is_string($value) ? trim($value) : '';
}

function cms_is_configured(): bool
{
    return cms_env('EMIR_CMS_USER') !== '' && cms_env('EMIR_CMS_PASSWORD_HASH') !== '';
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

function cms_text(mixed $value, int $max = 1600): string
{
    if (!is_string($value)) {
        return '';
    }
    $clean = trim(str_replace(["\0", "\r"], '', $value));
    return function_exists('mb_substr') ? mb_substr($clean, 0, $max) : substr($clean, 0, $max);
}

function cms_url(mixed $value): string
{
    $url = cms_text($value, 1000);
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        throw new InvalidArgumentException('Hay un enlace con formato inválido.');
    }
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true)) {
        throw new InvalidArgumentException('Los enlaces deben usar HTTPS o HTTP.');
    }
    return $url;
}

function cms_lines(mixed $value, int $limit = 5): array
{
    $lines = is_array($value) ? $value : preg_split('/\n/', cms_text($value, 4000));
    if (!is_array($lines)) {
        return [];
    }
    return array_values(array_slice(array_filter(array_map(
        static fn(mixed $line): string => cms_text($line, 220),
        $lines
    ), static fn(string $line): bool => $line !== ''), 0, $limit));
}

function cms_sanitize_content(array $input): array
{
    $brand = is_array($input['brand'] ?? null) ? $input['brand'] : [];
    $contact = is_array($input['contact'] ?? null) ? $input['contact'] : [];
    $hero = is_array($input['hero'] ?? null) ? $input['hero'] : [];
    $about = is_array($input['about'] ?? null) ? $input['about'] : [];
    $final = is_array($input['finalCta'] ?? null) ? $input['finalCta'] : [];
    $seo = is_array($input['seo'] ?? null) ? $input['seo'] : [];
    $serviceInput = is_array($input['services'] ?? null) ? array_slice($input['services'], 0, 2) : [];
    $faqInput = is_array($input['faq'] ?? null) ? array_slice($input['faq'], 0, 8) : [];

    if (count($serviceInput) !== 2) {
        throw new InvalidArgumentException('Deben existir las dos modalidades.');
    }

    $services = [];
    foreach ($serviceInput as $index => $service) {
        if (!is_array($service)) {
            throw new InvalidArgumentException('Hay una modalidad inválida.');
        }
        $id = $index === 0 ? 'personal' : 'online';
        $details = cms_lines($service['details'] ?? [], 5);
        if (count($details) < 1) {
            throw new InvalidArgumentException('Cada modalidad necesita al menos un detalle.');
        }
        $services[] = [
            'id' => $id,
            'number' => $index === 0 ? '01' : '02',
            'tag' => cms_text($service['tag'] ?? '', 60),
            'title' => cms_text($service['title'] ?? '', 100),
            'summary' => cms_text($service['summary'] ?? '', 600),
            'details' => $details,
            'cta' => cms_text($service['cta'] ?? '', 80),
            'message' => cms_text($service['message'] ?? '', 600),
        ];
    }

    $faq = [];
    foreach ($faqInput as $item) {
        if (!is_array($item)) {
            continue;
        }
        $question = cms_text($item['question'] ?? '', 220);
        $answer = cms_text($item['answer'] ?? '', 1000);
        if ($question !== '' && $answer !== '') {
            $faq[] = ['question' => $question, 'answer' => $answer];
        }
    }
    if (count($faq) < 1) {
        throw new InvalidArgumentException('Debe existir al menos una pregunta frecuente.');
    }

    return [
        'brand' => [
            'name' => cms_text($brand['name'] ?? '', 80),
            'descriptor' => cms_text($brand['descriptor'] ?? '', 180),
        ],
        'contact' => [
            'instagram' => cms_url($contact['instagram'] ?? ''),
            'whatsapp' => cms_url($contact['whatsapp'] ?? ''),
            'location' => cms_text($contact['location'] ?? '', 180),
        ],
        'hero' => [
            'eyebrow' => cms_text($hero['eyebrow'] ?? '', 100),
            'title' => cms_text($hero['title'] ?? '', 180),
            'summary' => cms_text($hero['summary'] ?? '', 700),
            'primaryCta' => cms_text($hero['primaryCta'] ?? '', 100),
            'secondaryCta' => cms_text($hero['secondaryCta'] ?? '', 100),
        ],
        'services' => $services,
        'about' => [
            'eyebrow' => cms_text($about['eyebrow'] ?? '', 100),
            'title' => cms_text($about['title'] ?? '', 180),
            'body' => cms_text($about['body'] ?? '', 1200),
            'note' => cms_text($about['note'] ?? '', 600),
        ],
        'faq' => $faq,
        'finalCta' => [
            'eyebrow' => cms_text($final['eyebrow'] ?? '', 100),
            'title' => cms_text($final['title'] ?? '', 200),
            'summary' => cms_text($final['summary'] ?? '', 700),
            'button' => cms_text($final['button'] ?? '', 100),
        ],
        'seo' => [
            'title' => cms_text($seo['title'] ?? '', 180),
            'description' => cms_text($seo['description'] ?? '', 320),
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
    $temporary = tempnam($directory, 'emir-content-');
    if ($temporary === false || file_put_contents($temporary, $json, LOCK_EX) === false) {
        throw new RuntimeException('No fue posible preparar el archivo.');
    }
    @chmod($temporary, 0640);
    if (!rename($temporary, $path)) {
        @unlink($temporary);
        throw new RuntimeException('No fue posible guardar el contenido.');
    }
}

cms_boot();

