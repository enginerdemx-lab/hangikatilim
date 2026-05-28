<?php
/**
 * E-POSTA API - GÜNCEL SMTP AYARLARI
 * mail.kurumsaleposta.com - Natro SMTP SSL
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'error' => 'POST required']));
}

// GÜNCEL SMTP AYARLARI - Natro cPanel'den alındı
$host = 'ssl://mail.kurumsaleposta.com';
$port = 465;
$user = 'bildirim@katilimuzmani.com';
$pass = getenv('SMTP_PASS') ?: '';
$from = 'bildirim@katilimuzmani.com';
$fromName = 'Katılım Uzmanı';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['html'])) {
    die(json_encode(['success' => false, 'error' => 'Missing fields']));
}

$to = $data['to'];
$subject = $data['subject'];
$body = $data['html'];

// SSL SMTP bağlantısı
$fp = @fsockopen($host, $port, $errno, $errstr, 30);
if (!$fp) {
    die(json_encode(['success' => false, 'error' => "Connection: $errstr ($errno)"]));
}

$log = [];
$log[] = fgets($fp, 515);

// EHLO
fputs($fp, "EHLO katilimuzmani.com\r\n");
while ($line = fgets($fp, 515)) {
    $log[] = $line;
    if (substr($line, 3, 1) == ' ')
        break;
}

// AUTH LOGIN
fputs($fp, "AUTH LOGIN\r\n");
$log[] = fgets($fp, 515);

fputs($fp, base64_encode($user) . "\r\n");
$log[] = fgets($fp, 515);

fputs($fp, base64_encode($pass) . "\r\n");
$authResp = fgets($fp, 515);
$log[] = $authResp;

if (strpos($authResp, '235') === false) {
    fclose($fp);
    die(json_encode(['success' => false, 'error' => 'Auth failed', 'log' => $log]));
}

// MAIL FROM
fputs($fp, "MAIL FROM:<$from>\r\n");
$log[] = fgets($fp, 515);

// RCPT TO
fputs($fp, "RCPT TO:<$to>\r\n");
$log[] = fgets($fp, 515);

// DATA
fputs($fp, "DATA\r\n");
$dataResp = fgets($fp, 515);
$log[] = $dataResp;

if (strpos($dataResp, '354') === false) {
    fclose($fp);
    die(json_encode(['success' => false, 'error' => 'DATA rejected', 'log' => $log]));
}

// E-posta içeriği
$msg = "From: $fromName <$from>\r\n";
$msg .= "To: $to\r\n";
$msg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
$msg .= "MIME-Version: 1.0\r\n";
$msg .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
$msg .= $body . "\r\n.\r\n";

fputs($fp, $msg);
$sendResp = fgets($fp, 515);
$log[] = $sendResp;

fputs($fp, "QUIT\r\n");
fclose($fp);

if (strpos($sendResp, '250') !== false) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Send failed', 'log' => $log]);
}
?>
