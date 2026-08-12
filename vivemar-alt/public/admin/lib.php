<?php
// Utilidades del CMS: escaneo y aplicación de copies sobre el HTML estático
declare(strict_types=1);
require_once __DIR__ . '/config.php';

/** Lista todos los .html del sitio (excluye /admin) */
function html_del_sitio(): array
{
    $archivos = [];
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(CMS_RAIZ, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $f) {
        if ($f->getExtension() === 'html' && !str_contains($f->getPathname(), '/admin/')) {
            $archivos[] = $f->getPathname();
        }
    }
    return $archivos;
}

/** Regex de un elemento con data-cms. $1 tag, $2 id, $3 contenido */
const CMS_REGEX = '/<([a-zA-Z0-9]+)\b[^>]*\bdata-cms="([^"]+)"[^>]*>(.*?)<\/\1>/s';

/** Escanea el sitio y devuelve [id => ['valor' => html, 'archivos' => [...]]] */
function escanear_copies(): array
{
    $campos = [];
    foreach (html_del_sitio() as $ruta) {
        $html = file_get_contents($ruta);
        if (preg_match_all(CMS_REGEX, $html, $m, PREG_SET_ORDER)) {
            foreach ($m as $hit) {
                $id = $hit[2];
                if (!isset($campos[$id])) {
                    $campos[$id] = ['valor' => trim($hit[3]), 'archivos' => []];
                }
                $campos[$id]['archivos'][] = str_replace(CMS_RAIZ, '', $ruta);
            }
        }
    }
    ksort($campos);
    return $campos;
}

/** Permite solo etiquetas de énfasis dentro de los copies */
function sanitizar_copy(string $texto): string
{
    $texto = strip_tags($texto, '<em><strong><br><b><i>');
    return trim($texto);
}

/** Aplica un copy a todos los HTML del sitio; devuelve nº de archivos tocados */
function aplicar_copy(string $id, string $nuevo): int
{
    $nuevo = sanitizar_copy($nuevo);
    $tocados = 0;
    $regex = '/(<([a-zA-Z0-9]+)\b[^>]*\bdata-cms="' . preg_quote($id, '/') . '"[^>]*>)(.*?)(<\/\2>)/s';
    foreach (html_del_sitio() as $ruta) {
        $html = file_get_contents($ruta);
        $resultado = preg_replace($regex, '${1}' . str_replace(['\\', '$'], ['\\\\', '\$'], $nuevo) . '${4}', $html, -1, $n);
        if ($n > 0 && $resultado !== null && $resultado !== $html) {
            file_put_contents($ruta, $resultado);
            $tocados++;
        }
    }
    return $tocados;
}

function leer_guardados(): array
{
    return is_file(CMS_JSON) ? (json_decode(file_get_contents(CMS_JSON), true) ?: []) : [];
}

function guardar_copy_json(string $id, string $valor): void
{
    $datos = leer_guardados();
    $datos[$id] = $valor;
    file_put_contents(CMS_JSON, json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

/** Layout del panel */
function panel_inicio(string $titulo, string $activo = ''): void
{
    $e = fn($s) => htmlspecialchars($s, ENT_QUOTES);
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>' . $e($titulo) . ' · CMS Vive Mar</title>
<style>
:root{--oceano:#0e2a3a;--laton:#b08a57;--arena:#f1efe8;--ok:#1e6e46;--error:#8a3324}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:var(--arena);color:#22313c}
.top{background:var(--oceano);color:#fff;padding:.9rem 1.5rem;display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap}
.top b{font-family:Georgia,serif;font-size:1.15rem}.top b span{color:#d4b98c;font-style:italic}
.top a{color:#cfdde8;text-decoration:none;font-size:.9rem}.top a.activo,.top a:hover{color:#d4b98c}
.top .salir{margin-left:auto}
main{max-width:1000px;margin:2rem auto;padding:0 1.25rem}
h1{font-family:Georgia,serif;color:var(--oceano)}
.tarjeta{background:#fff;border-radius:6px;box-shadow:0 8px 24px rgba(14,42,58,.08);padding:1.5rem;margin-bottom:1.5rem;border-top:2px solid var(--laton)}
label{display:block;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--oceano);margin:.9rem 0 .3rem}
input[type=text],input[type=password],textarea{width:100%;padding:.7rem;border:1px solid #d8d3c6;border-radius:5px;font-size:.95rem;font-family:inherit}
textarea{min-height:70px;resize:vertical}
.boton{display:inline-block;background:var(--oceano);color:#fff;border:0;padding:.7rem 1.5rem;border-radius:5px;font-weight:600;cursor:pointer;text-decoration:none;font-size:.9rem}
.boton:hover{background:#1b4d5c}.boton--laton{background:var(--laton)}.boton--peligro{background:var(--error)}
.aviso{padding:.8rem 1rem;border-radius:5px;margin-bottom:1rem;font-size:.92rem}
.aviso--ok{background:#e6f4ec;color:var(--ok);border:1px solid var(--ok)}
.aviso--error{background:#fdecea;color:var(--error);border:1px solid var(--error)}
.grid-img{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.25rem}
.img-item{background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 6px 18px rgba(14,42,58,.08)}
.img-item img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#eee}
.img-item .cuerpo{padding:.75rem;font-size:.78rem}
.img-item code{display:block;margin-bottom:.4rem;word-break:break-all;color:var(--oceano);font-weight:700}
.img-item .acciones{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem}
.img-item .boton{padding:.35rem .7rem;font-size:.75rem}
.campo-copy{border-bottom:1px solid #eee;padding:1rem 0}
.campo-copy small{color:#777}
.pie{font-size:.78rem;color:#777;text-align:center;padding:2rem 0}
</style></head><body>
<div class="top"><b>Vive <span>Mar</span> · CMS</b>
<a href="panel.php"' . ($activo === 'panel' ? ' class="activo"' : '') . '>Inicio</a>
<a href="editor.php" style="font-weight:700;color:#d4b98c">✨ Editor visual</a>
<a href="copies.php"' . ($activo === 'copies' ? ' class="activo"' : '') . '>Copies</a>
<a href="imagenes.php"' . ($activo === 'imagenes' ? ' class="activo"' : '') . '>Imágenes</a>
<a href="/" target="_blank">Ver sitio ↗</a>
<a href="logout.php" class="salir">Salir</a></div><main>';
}

function panel_fin(): void
{
    echo '<div class="pie">CMS Vive Mar · hecho por Softvibes</div></main></body></html>';
}
