<?php
declare(strict_types=1);

const CMS_MAX_JSON_BYTES = 1048576;
const CMS_DEPLOYED_USER = 'diana_admin';
const CMS_DEPLOYED_PASSWORD_HASH = '$2y$12$aopHw0mIXCi5Gh8KxljMLOCZZVOy6vDSPVkU.AVrMrgci.874a5dW';

function cms_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function cms_boot(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name('diana_cms_session');
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
    if (!is_string($value) || trim($value) === '') {
        $value = $_SERVER[$key] ?? '';
    }
    if (!is_string($value) || trim($value) === '') {
        $value = match ($key) {
            'DIANA_CMS_USER' => CMS_DEPLOYED_USER,
            'DIANA_CMS_PASSWORD_HASH' => CMS_DEPLOYED_PASSWORD_HASH,
            default => '',
        };
    }
    return is_string($value) ? trim($value) : '';
}

function cms_is_configured(): bool
{
    return cms_env('DIANA_CMS_USER') !== '' && cms_env('DIANA_CMS_PASSWORD_HASH') !== '';
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

function cms_phone(mixed $value): string
{
    $phone = preg_replace('/\D+/', '', cms_text($value, 24));
    if (!is_string($phone)) {
        return '';
    }
    if ($phone !== '' && !preg_match('/^\d{10,15}$/', $phone)) {
        throw new InvalidArgumentException('WhatsApp debe tener entre 10 y 15 dígitos con código de país, o quedar vacío.');
    }
    return $phone;
}

function cms_asset(mixed $value): string
{
    $path = cms_text($value, 240);
    if (!preg_match('#^/img/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp)$#i', $path)) {
        throw new InvalidArgumentException('Las imágenes deben ser rutas internas válidas dentro de /img/.');
    }
    return $path;
}

function cms_slug(mixed $value): string
{
    $slug = strtolower(cms_text($value, 80));
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        throw new InvalidArgumentException('Hay un identificador de producto inválido.');
    }
    return $slug;
}

function cms_sanitize_content(array $input): array
{
    $brand = is_array($input['brand'] ?? null) ? $input['brand'] : [];
    $contact = is_array($input['contact'] ?? null) ? $input['contact'] : [];
    $hero = is_array($input['hero'] ?? null) ? $input['hero'] : [];
    $catalog = is_array($input['catalog'] ?? null) ? $input['catalog'] : [];
    $about = is_array($input['about'] ?? null) ? $input['about'] : [];
    $final = is_array($input['finalCta'] ?? null) ? $input['finalCta'] : [];
    $seo = is_array($input['seo'] ?? null) ? $input['seo'] : [];
    $productInput = is_array($input['products'] ?? null) ? array_slice($input['products'], 0, 24) : [];
    $stepInput = is_array($input['steps'] ?? null) ? array_slice($input['steps'], 0, 3) : [];
    $faqInput = is_array($input['faq'] ?? null) ? array_slice($input['faq'], 0, 10) : [];

    if (count($productInput) < 1) {
        throw new InvalidArgumentException('Debe existir al menos un producto.');
    }
    $products = [];
    $ids = [];
    foreach ($productInput as $product) {
        if (!is_array($product)) {
            throw new InvalidArgumentException('Hay un producto inválido.');
        }
        $id = cms_slug($product['id'] ?? '');
        if (in_array($id, $ids, true)) {
            throw new InvalidArgumentException('Los identificadores de producto no pueden repetirse.');
        }
        $ids[] = $id;
        $products[] = [
            'id' => $id,
            'name' => cms_text($product['name'] ?? '', 100),
            'category' => cms_text($product['category'] ?? '', 60),
            'image' => cms_asset($product['image'] ?? ''),
            'alt' => cms_text($product['alt'] ?? '', 220),
            'description' => cms_text($product['description'] ?? '', 700),
            'priceLabel' => cms_text($product['priceLabel'] ?? '', 60),
            'sourceUrl' => cms_url($product['sourceUrl'] ?? ''),
            'message' => cms_text($product['message'] ?? '', 900),
            'visible' => isset($product['visible']) && (string) $product['visible'] === '1',
        ];
    }

    $steps = [];
    foreach ($stepInput as $step) {
        if (is_array($step)) {
            $steps[] = ['title' => cms_text($step['title'] ?? '', 100), 'text' => cms_text($step['text'] ?? '', 400)];
        }
    }
    if (count($steps) !== 3) {
        throw new InvalidArgumentException('Deben existir tres pasos de pedido.');
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
            'monogram' => cms_text($brand['monogram'] ?? '', 12),
        ],
        'contact' => [
            'instagram' => cms_url($contact['instagram'] ?? ''),
            'whatsappNumber' => cms_phone($contact['whatsappNumber'] ?? ''),
            'location' => cms_text($contact['location'] ?? '', 180),
            'whatsappStatus' => cms_text($contact['whatsappStatus'] ?? '', 220),
        ],
        'hero' => [
            'eyebrow' => cms_text($hero['eyebrow'] ?? '', 120),
            'title' => cms_text($hero['title'] ?? '', 160),
            'emphasis' => cms_text($hero['emphasis'] ?? '', 160),
            'summary' => cms_text($hero['summary'] ?? '', 800),
            'primaryCta' => cms_text($hero['primaryCta'] ?? '', 100),
            'secondaryCta' => cms_text($hero['secondaryCta'] ?? '', 100),
        ],
        'catalog' => [
            'eyebrow' => cms_text($catalog['eyebrow'] ?? '', 100),
            'title' => cms_text($catalog['title'] ?? '', 180),
            'summary' => cms_text($catalog['summary'] ?? '', 800),
            'empty' => cms_text($catalog['empty'] ?? '', 220),
        ],
        'products' => $products,
        'about' => [
            'eyebrow' => cms_text($about['eyebrow'] ?? '', 120),
            'title' => cms_text($about['title'] ?? '', 200),
            'body' => cms_text($about['body'] ?? '', 1400),
            'note' => cms_text($about['note'] ?? '', 700),
        ],
        'steps' => $steps,
        'faq' => $faq,
        'finalCta' => [
            'eyebrow' => cms_text($final['eyebrow'] ?? '', 120),
            'title' => cms_text($final['title'] ?? '', 220),
            'summary' => cms_text($final['summary'] ?? '', 800),
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
    $temporary = tempnam($directory, 'diana-content-');
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
