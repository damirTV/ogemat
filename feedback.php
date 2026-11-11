<?php
/* Приём обратной связи из игры «ОГЭ по математике».
   Принимает POST с JSON {id, kind, text, ts}, сохраняет в файл и присылает письмо.
   Положите этот файл рядом с index.html. */

/* ===== НАСТРОЙКИ: измените три строки ниже ===== */
const MAIL_TO   = 'damir@shakirov.tv';          // куда присылать сообщения (ваша почта)
const MAIL_FROM = 'noreply@ogemat.ru';  // отправитель: ящик на ВАШЕМ домене (так письма реже попадают в спам)
const SITE_NAME = 'ОГЭ по математике';
/* ===== дальше менять не нужно ===== */

const MIN_LEN = 5;
const MAX_LEN = 2000;
const LIMIT_PER_HOUR = 10;                    // не больше стольких сообщений в час с одного адреса
const DATA_DIR = __DIR__ . '/feedback-data';  // сюда пишется копия всех сообщений

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply($code, $ok) {
    http_response_code($code);
    echo json_encode(array('ok' => $ok));
    exit;
}

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

/* папка для данных; .htaccess закрывает её от скачивания через браузер (для Apache) */
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0755, true);
    @file_put_contents(DATA_DIR . '/.htaccess', "Require all denied\nDeny from all\n");
    @file_put_contents(DATA_DIR . '/index.html', '');
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
$from    = str_replace(array("\r", "\n"), '', MAIL_FROM);
$headers = "From: " . $from . "\r\n"
         . "MIME-Version: 1.0\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "Content-Transfer-Encoding: 8bit\r\n";
$mailed = @mail(MAIL_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);

/* успех, если сообщение сохранено хотя бы одним способом */
reply(($saved || $mailed) ? 200 : 500, ($saved || $mailed));
