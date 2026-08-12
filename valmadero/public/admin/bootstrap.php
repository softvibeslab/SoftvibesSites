<?php
declare(strict_types=1);

ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Strict');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', '1');
}
session_name('site_cms');
session_start();

const CMS_DIR = __DIR__;
const CMS_ROOT = __DIR__ . '/..';
const CMS_STORAGE = __DIR__ . '/storage';
const CMS_IMAGES = __DIR__ . '/../img';

$configFile = __DIR__ . '/config.local.php';
$cmsConfig = is_file($configFile) ? require $configFile : [];
if (!is_array($cmsConfig)) {
    $cmsConfig = [];
}

define('CMS_READY', ($cmsConfig['user'] ?? '') !== '' && ($cmsConfig['password_hash'] ?? '') !== '');
define('CMS_USER', (string) ($cmsConfig['user'] ?? ''));
define('CMS_PASSWORD_HASH', (string) ($cmsConfig['password_hash'] ?? ''));
define('CMS_STATE_TOKEN', (string) ($cmsConfig['state_token'] ?? ''));
define('CMS_CONTACT_EMAIL', (string) ($cmsConfig['contact_email'] ?? ''));
define('CMS_MAX_UPLOAD', (int) ($cmsConfig['max_upload_bytes'] ?? 8 * 1024 * 1024));

if (!is_dir(CMS_STORAGE)) {
    mkdir(CMS_STORAGE, 0750, true);
}

foreach (['copies', 'settings', 'content', 'media', 'trash', 'login-attempts'] as $name) {
    $target = CMS_STORAGE . '/' . $name . '.json';
    $example = CMS_STORAGE . '/' . $name . '.example.json';
    if (!is_file($target)) {
        if (is_file($example)) {
            copy($example, $target);
        } else {
            file_put_contents($target, $name === 'trash' ? "[]\n" : "{}\n", LOCK_EX);
        }
    }
}
