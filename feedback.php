<?php
/* Приём обратной связи из игры «ОГЭ по математике».
   Настраивается переменными окружения веб-сервера, а не исходным кодом:
   OGE_FEEDBACK_MAIL_TO, OGE_FEEDBACK_MAIL_FROM, OGE_FEEDBACK_DATA_DIR.
   DATA_DIR обязан находиться вне публичной web-директории. */

const SITE_NAME = 'ОГЭ по математике';

const MIN_LEN = 5;
const MAX_LEN = 2000;
const LIMIT_PER_HOUR = 10;                    // не больше стольких сообщений в час с одного адреса
$mailTo = getenv('OGE_FEEDBACK_MAIL_TO') ?: '';
$mailFrom = getenv('OGE_FEEDBACK_MAIL_FROM') ?: '';
$dataDir = getenv('OGE_FEEDBACK_DATA_DIR') ?: '';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply($code, $ok) {
    http_response_code($code);
    echo json_encode(array('ok' => $ok));
    exit;
}

if ($mailTo === '' || $mailFrom === '' || $dataDir === '') reply(503, false);
if (!preg_match('/^(?:[A-Za-z]:[\\\\\/]|\/)/', $dataDir)) reply(500, false);
define('DATA_DIR', rtrim($dataDir, DIRECTORY_SEPARATOR));

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, false);
}

$raw = file_get_contents('php://input', false, null, 0, 10240);
$msg = json_decode($raw, true);
if (!is_array($msg)) reply(400, false);

$kinds = array('bug' => 'Ошибка', 'idea' => 'Идея', 'other' => 'Другое');
$kind  = isset($msg['kind']) && is_string($msg['kind']) ? $msg['kind'] : '';
$text  = isset($msg['text']) && is_string($msg['text']) ? trim($msg['text']) : '';
$id    = isset($msg['id']) && is_string($msg['id']) ? $msg['id'] : '';

if (!isset($kinds[$kind])) reply(400, false);
if (!preg_match('/^[a-z0-9]{4,24}$/', $id)) reply(400, false);
$len = function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
if ($len < MIN_LEN || $len > MAX_LEN) reply(400, false);

/* Папка находится вне web-root и создаётся при первом сообщении. */
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
}

/* Do not accept a storage directory inside the publicly served document root. */
$docRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
$realDataDir = realpath(DATA_DIR);
if ($docRoot !== false && $realDataDir !== false) {
    $docRoot = rtrim(str_replace('\\', '/', strtolower($docRoot)), '/');
    $realDataDir = rtrim(str_replace('\\', '/', strtolower($realDataDir)), '/');
    if ($realDataDir === $docRoot || strpos($realDataDir, $docRoot . '/') === 0) reply(500, false);
}

/* простое ограничение частоты: по хэшу адреса, без хранения самого адреса */
$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$rate = DATA_DIR . '/rate-' . substr(sha1($ip . __FILE__), 0, 16) . '.txt';
$now  = time();
$recent = array();
if (is_file($rate)) {
    foreach (file($rate, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $t) {
        if ((int)$t > $now - 3600) $recent[] = (int)$t;
    }
}
if (count($recent) >= LIMIT_PER_HOUR) reply(429, false);
$recent[] = $now;
@file_put_contents($rate, implode("\n", $recent) . "\n", LOCK_EX);

/* 1) копия в файл, чтобы сообщение не потерялось, даже если почта не сработает */
$line = json_encode(array(
    'id' => $id, 'kind' => $kind, 'text' => $text, 'received' => date('c'),
), JSON_UNESCAPED_UNICODE) . "\n";
$saved = @file_put_contents(DATA_DIR . '/messages.jsonl', $line, FILE_APPEND | LOCK_EX) !== false;

/* 2) письмо */
$subject = '[' . SITE_NAME . '] ' . $kinds[$kind];
$body    = "Тип: " . $kinds[$kind] . "\nВремя: " . date('d.m.Y H:i') . " (время сервера)\n\n" . $text . "\n";
$from    = str_replace(array("\r", "\n"), '', $mailFrom);
$headers = "From: " . $from . "\r\n"
         . "MIME-Version: 1.0\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: 8bit\r\n";
$mailed = @mail($mailTo, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);

/* успех, если сообщение сохранено хотя бы одним способом */
reply(($saved || $mailed) ? 200 : 500, ($saved || $mailed));
