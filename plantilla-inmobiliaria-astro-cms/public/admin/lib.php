<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

const CMS_COPY_REGEX = '/<([a-zA-Z0-9]+)\b[^>]*\bdata-cms="([a-zA-Z0-9._:-]+)"[^>]*>(.*?)<\/\1>/s';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $path): never
{
    header('Location: ' . $path);
    exit;
}

function cms_is_logged_in(): bool
{
    return !empty($_SESSION['cms_authenticated']);
}

function require_login(): void
{
    if (!cms_is_logged_in()) {
        redirect('index.php');
    }
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
    }
    return (string) $_SESSION['csrf'];
}

function verify_csrf(): void
{
    $received = (string) ($_POST['csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
    if ($received === '' || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $received)) {
        http_response_code(403);
        exit('Solicitud inválida. Recarga la página e inténtalo nuevamente.');
    }
}

function client_key(): string
{
    return hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
}

function login_allowed(): bool
{
    $attempts = read_json('login-attempts', []);
    $entry = $attempts[client_key()] ?? ['count' => 0, 'until' => 0];
    return (int) ($entry['until'] ?? 0) <= time();
}

function record_login(bool $success): void
{
    $attempts = read_json('login-attempts', []);
    $key = client_key();
    if ($success) {
        unset($attempts[$key]);
    } else {
        $count = (int) ($attempts[$key]['count'] ?? 0) + 1;
        $attempts[$key] = ['count' => $count, 'until' => $count >= 5 ? time() + 900 : 0];
    }
    write_json('login-attempts', $attempts);
}

function validate_login(string $user, string $password): bool
{
    if (!CMS_READY || !login_allowed()) {
        return false;
    }
    $valid = hash_equals(CMS_USER, $user) && password_verify($password, CMS_PASSWORD_HASH);
    record_login($valid);
    if ($valid) {
        session_regenerate_id(true);
        $_SESSION['cms_authenticated'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
    }
    return $valid;
}

function read_json(string $name, array $fallback = []): array
{
    $path = CMS_STORAGE . '/' . basename($name) . '.json';
    if (!is_file($path)) {
        return $fallback;
    }
    $decoded = json_decode((string) file_get_contents($path), true);
    return is_array($decoded) ? $decoded : $fallback;
}

function write_json(string $name, array $data): void
{
    $path = CMS_STORAGE . '/' . basename($name) . '.json';
    $tmp = $path . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($tmp, $json . "\n", LOCK_EX) === false) {
        throw new RuntimeException('No se pudo guardar el estado del CMS.');
    }
    chmod($tmp, 0640);
    if (!rename($tmp, $path)) {
        throw new RuntimeException('No se pudo publicar el estado del CMS.');
    }
}

function site_html_files(): array
{
    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(CMS_ROOT, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($iterator as $file) {
        $path = $file->getPathname();
        if ($file->getExtension() === 'html' && !str_contains($path, DIRECTORY_SEPARATOR . 'admin' . DIRECTORY_SEPARATOR)) {
            $files[] = $path;
        }
    }
    return $files;
}

function sanitize_copy(string $value): string
{
    return trim(strip_tags($value, '<em><strong><br><b><i>'));
}

function scan_copies(): array
{
    $copies = [];
    foreach (site_html_files() as $path) {
        $html = (string) file_get_contents($path);
        if (!preg_match_all(CMS_COPY_REGEX, $html, $matches, PREG_SET_ORDER)) {
            continue;
        }
        foreach ($matches as $match) {
            $id = $match[2];
            $copies[$id] ??= ['value' => trim($match[3]), 'files' => []];
            $copies[$id]['files'][] = str_replace(CMS_ROOT, '', $path);
        }
    }
    ksort($copies);
    return $copies;
}

function apply_copy(string $id, string $value): int
{
    if (!preg_match('/^[a-zA-Z0-9._:-]+$/', $id)) {
        return 0;
    }
    $safe = sanitize_copy($value);
    $pattern = '/(<([a-zA-Z0-9]+)\b[^>]*\bdata-cms="' . preg_quote($id, '/') . '"[^>]*>)(.*?)(<\/\2>)/s';
    $changed = 0;
    foreach (site_html_files() as $path) {
        $html = (string) file_get_contents($path);
        $next = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . $safe . $m[4], $html, -1, $count);
        if ($next !== null && $count > 0 && $next !== $html) {
            file_put_contents($path, $next, LOCK_EX);
            $changed++;
        }
    }
    return $changed;
}

function default_settings(): array
{
    return [
        'phone_display' => '+52 000 000 0000',
        'whatsapp' => '520000000000',
        'whatsapp_message' => 'Hola, visité su sitio y quiero recibir información.',
        'calendar_url' => 'https://calendly.com/example',
        'email' => 'contacto@example.com',
    ];
}

function apply_settings(array $before, array $after): int
{
    $pairs = [];
    foreach (default_settings() as $key => $_) {
        $old = (string) ($before[$key] ?? '');
        $new = (string) ($after[$key] ?? '');
        if ($old !== '' && $old !== $new) {
            $pairs[$old] = $new;
            if ($key === 'whatsapp_message') {
                $pairs[rawurlencode($old)] = rawurlencode($new);
            }
        }
    }
    if ($pairs === []) {
        return 0;
    }
    $changed = 0;
    foreach (site_html_files() as $path) {
        $html = (string) file_get_contents($path);
        $next = strtr($html, $pairs);
        if ($next !== $html) {
            file_put_contents($path, $next, LOCK_EX);
            $changed++;
        }
    }
    return $changed;
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return trim($value, '-');
}

function allowed_image_mimes(): array
{
    return ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
}

function store_uploaded_image(array $file, ?string $replace = null): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return [false, 'No se recibió un archivo válido.'];
    }
    if ((int) ($file['size'] ?? 0) > CMS_MAX_UPLOAD) {
        return [false, 'La imagen supera el límite permitido.'];
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string) $finfo->file((string) $file['tmp_name']);
    $allowed = allowed_image_mimes();
    if (!isset($allowed[$mime]) || @getimagesize((string) $file['tmp_name']) === false) {
        return [false, 'El formato de imagen no está permitido.'];
    }
    $extension = $allowed[$mime];
    if ($replace !== null) {
        $targetName = basename($replace);
        $expected = strtolower(pathinfo($targetName, PATHINFO_EXTENSION));
        if ($expected === 'jpeg') {
            $expected = 'jpg';
        }
        if ($expected !== $extension) {
            return [false, 'Para reemplazar una imagen, el formato debe coincidir.'];
        }
    } else {
        $base = slugify(pathinfo((string) ($file['name'] ?? 'imagen'), PATHINFO_FILENAME)) ?: 'imagen';
        $targetName = $base . '-' . bin2hex(random_bytes(4)) . '.' . $extension;
    }
    $target = CMS_IMAGES . '/' . $targetName;
    if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
        return [false, 'No se pudo guardar la imagen.'];
    }
    chmod($target, 0644);
    return [true, $targetName];
}

function admin_header(string $title, string $active = ''): void
{
    $nav = [
        'panel' => ['panel.php', 'Inicio'],
        'copies' => ['copies.php', 'Copies'],
        'content' => ['content.php', 'Contenido'],
        'media' => ['media.php', 'Medios'],
        'settings' => ['settings.php', 'Ajustes'],
        'backup' => ['backup.php', 'Respaldo'],
    ];
    ?><!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?= h($title) ?> · CMS</title>
    <style>
    :root{--ink:#153f43;--accent:#d77e54;--bg:#f5f2eb;--line:#ddd9cf;--danger:#a93c32}*{box-sizing:border-box}body{margin:0;color:#243538;background:var(--bg);font:15px/1.55 system-ui,sans-serif}a{color:var(--ink)}header{position:sticky;z-index:20;top:0;background:#102f32;color:white}header .wrap{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:20px}nav{display:flex;flex-wrap:wrap;gap:5px}nav a{padding:8px 11px;border-radius:8px;color:#d7e5e4;text-decoration:none}nav a.active,nav a:hover{background:#285358;color:white}.wrap{width:min(1080px,calc(100% - 28px));margin:auto}main{padding:38px 0 70px}h1,h2,h3{line-height:1.15;color:var(--ink)}h1{font-size:clamp(30px,6vw,48px)}.card{margin:0 0 18px;padding:22px;border:1px solid var(--line);border-radius:14px;background:white;box-shadow:0 10px 35px #153f430b}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.metric{font-size:28px;font-weight:800;color:var(--ink)}label{display:grid;margin:0 0 14px;color:#455;font-size:13px;font-weight:700;gap:5px}input,select,textarea{width:100%;padding:10px 11px;border:1px solid #cac8c0;border-radius:8px;background:#fff;font:inherit}textarea{min-height:90px;resize:vertical}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.button,button{display:inline-flex;align-items:center;justify-content:center;padding:9px 14px;border:0;border-radius:8px;color:white;background:var(--ink);font-weight:750;text-decoration:none;cursor:pointer}.button.secondary{color:var(--ink);background:#e6eeec}.button.accent{background:var(--accent)}.button.danger,button.danger{background:var(--danger)}.notice{margin:0 0 18px;padding:13px 16px;border-left:4px solid var(--accent);background:#fff4ed}.error{border-color:var(--danger);color:#6c2822;background:#fff0ee}.actions{display:flex;flex-wrap:wrap;gap:8px}.list{display:grid;gap:10px}.list-item{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px;border:1px solid var(--line);border-radius:10px;background:white}.thumb{width:92px;height:68px;border-radius:8px;object-fit:cover;background:#eee}.muted{color:#6d797a;font-size:13px}.copy-field{padding:16px;border-top:1px solid var(--line)}.copy-field:first-child{border-top:0}.copy-field textarea{min-height:72px}.login{display:grid;min-height:100vh;place-items:center;padding:20px}.login .card{width:min(440px,100%)}code{padding:2px 5px;border-radius:4px;background:#eee}@media(max-width:760px){header .wrap{align-items:flex-start;flex-direction:column;padding:12px 0}.grid,.row{grid-template-columns:1fr}.list-item{align-items:flex-start;flex-direction:column}}
    </style></head><body><header><div class="wrap"><strong>CMS inmobiliario</strong><nav><?php foreach ($nav as $key => [$href,$label]): ?><a href="<?= $href ?>" class="<?= $active === $key ? 'active' : '' ?>"><?= h($label) ?></a><?php endforeach; ?><a href="../" target="_blank" rel="noopener">Ver sitio ↗</a><a href="logout.php">Salir</a></nav></div></header><main class="wrap">
    <?php
}

function admin_footer(): void
{
    ?></main></body></html><?php
}
