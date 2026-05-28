<?php
/**
 * E-POSTA API - NATRO SMTP İLE
 * PHPMailer yerine fsockopen ile SMTP bağlantısı
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

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

// SMTP Ayarları
$smtp = [
    'host' => 'mail.katilimuzmani.com',
    'port' => 587,
    'user' => 'bildirim@katilimuzmani.com',
    'pass' => getenv('SMTP_PASS') ?: '',
    'from' => 'bildirim@katilimuzmani.com',
    'name' => 'Katılım Uzmanı'
];

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['html'])) {
    die(json_encode(['success' => false, 'error' => 'Missing: to, subject, html']));
}

$to = $data['to'];
$subject = $data['subject'];
$body = $data['html'];

// SMTP ile e-posta gönder
function smtpMail($to, $subject, $body, $smtp)
{
    $log = [];

    // Bağlan
    $fp = @fsockopen($smtp['host'], $smtp['port'], $errno, $errstr, 30);
    if (!$fp) {
        return ['success' => false, 'error' => "Connection failed: $errstr"];
    }

    $log[] = getResponse($fp);

    // EHLO
    sendCmd($fp, "EHLO " . $smtp['host']);
    $log[] = getResponse($fp);

    // STARTTLS
    sendCmd($fp, "STARTTLS");
    $resp = getResponse($fp);
    $log[] = $resp;

    if (strpos($resp, '220') === false) {
        fclose($fp);
        return ['success' => false, 'error' => 'STARTTLS failed', 'log' => $log];
    }

    // TLS etkinleştir
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)) {
        fclose($fp);
        return ['success' => false, 'error' => 'TLS encryption failed'];
    }

    // EHLO tekrar
    sendCmd($fp, "EHLO " . $smtp['host']);
    $log[] = getResponse($fp);

    // AUTH LOGIN
    sendCmd($fp, "AUTH LOGIN");
    $log[] = getResponse($fp);

    sendCmd($fp, base64_encode($smtp['user']));
    $log[] = getResponse($fp);

    sendCmd($fp, base64_encode($smtp['pass']));
    $resp = getResponse($fp);
    $log[] = $resp;

    if (strpos($resp, '235') === false) {
        fclose($fp);
        return ['success' => false, 'error' => 'Auth failed', 'log' => $log];
    }

    // MAIL FROM
    sendCmd($fp, "MAIL FROM:<{$smtp['from']}>");
    $log[] = getResponse($fp);

    // RCPT TO
    sendCmd($fp, "RCPT TO:<{$to}>");
    $log[] = getResponse($fp);

    // DATA
    sendCmd($fp, "DATA");
    $resp = getResponse($fp);
    $log[] = $resp;

    if (strpos($resp, '354') === false) {
        fclose($fp);
        return ['success' => false, 'error' => 'DATA command failed', 'log' => $log];
    }

    // E-posta içeriği
    $msg = "From: {$smtp['name']} <{$smtp['from']}>\r\n";
    $msg .= "To: {$to}\r\n";
    $msg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "\r\n";
    $msg .= $body;
    $msg .= "\r\n.\r\n";

    fwrite($fp, $msg);
    $resp = getResponse($fp);
    $log[] = $resp;

    // QUIT
    sendCmd($fp, "QUIT");
    fclose($fp);

    if (strpos($resp, '250') !== false) {
        return ['success' => true, 'log' => $log];
    }

    return ['success' => false, 'error' => 'Send failed', 'log' => $log];
}

function sendCmd($fp, $cmd)
{
    fwrite($fp, $cmd . "\r\n");
}

function getResponse($fp)
{
    $response = '';
    while ($line = fgets($fp, 515)) {
        $response .= $line;
        if (substr($line, 3, 1) == ' ' || substr($line, 3, 1) == "\r")
            break;
    }
    return trim($response);
}

// Gönder
$result = smtpMail($to, $subject, $body, $smtp);

echo json_encode($result);
?>
