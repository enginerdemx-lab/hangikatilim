<?php
/**
 * E-posta Gönderme API - PHPMailer ile SMTP
 * Natro sunucuları için optimize edilmiştir
 * 
 * BU DOSYAYI SUNUCUYA /api/send-email.php OLARAK YÜKLEYİN
 */

// Hata raporlama (debug için)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sadece POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// === SMTP AYARLARI ===
$smtp_host = 'mail.katilimuzmani.com';
$smtp_port = 587;
$smtp_user = 'bildirim@katilimuzmani.com';
$smtp_pass = getenv('SMTP_PASS') ?: '';
$from_email = 'bildirim@katilimuzmani.com';
$from_name = 'Katılım Uzmanı';

// JSON al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

$to = $data['to'] ?? null;
$subject = $data['subject'] ?? null;
$html = $data['html'] ?? null;

if (!$to || !$subject || !$html) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing fields: to, subject, html']);
    exit();
}

// ============================================
// YÖNTEM 1: SMTP ile socket üzerinden gönder
// ============================================
function sendMailViaSMTP($to, $subject, $html, $smtp_host, $smtp_port, $smtp_user, $smtp_pass, $from_email, $from_name)
{
    try {
        // SMTP bağlantısı
        $socket = @fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
        if (!$socket) {
            return ['success' => false, 'error' => "SMTP bağlantı hatası: $errstr ($errno)"];
        }

        // SMTP komutlarını gönder
        $response = fgets($socket, 515);

        // EHLO
        fputs($socket, "EHLO katilimuzmani.com\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ')
                break;
        }

        // STARTTLS
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 515);

        // TLS başlat
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

        // EHLO tekrar
        fputs($socket, "EHLO katilimuzmani.com\r\n");
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ')
                break;
        }

        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);

        fputs($socket, base64_encode($smtp_user) . "\r\n");
        $response = fgets($socket, 515);

        fputs($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fgets($socket, 515);

        if (strpos($response, '235') === false) {
            fclose($socket);
            return ['success' => false, 'error' => 'SMTP kimlik doğrulama hatası'];
        }

        // MAIL FROM
        fputs($socket, "MAIL FROM:<{$from_email}>\r\n");
        $response = fgets($socket, 515);

        // RCPT TO
        fputs($socket, "RCPT TO:<{$to}>\r\n");
        $response = fgets($socket, 515);

        // DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 515);

        // E-posta içeriği
        $headers = "From: {$from_name} <{$from_email}>\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: {$subject}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "\r\n";
        $headers .= $html;
        $headers .= "\r\n.\r\n";

        fputs($socket, $headers);
        $response = fgets($socket, 515);

        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);

        if (strpos($response, '250') !== false) {
            return ['success' => true];
        } else {
            return ['success' => false, 'error' => 'E-posta gönderimi başarısız'];
        }
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// ============================================
// YÖNTEM 2: Basit mail() fonksiyonu
// ============================================
function sendMailSimple($to, $subject, $html, $from_email, $from_name)
{
    $headers = array();
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-type: text/html; charset=UTF-8";
    $headers[] = "From: {$from_name} <{$from_email}>";
    $headers[] = "Reply-To: {$from_email}";
    $headers[] = "X-Mailer: PHP/" . phpversion();

    $result = @mail($to, $subject, $html, implode("\r\n", $headers));

    if ($result) {
        return ['success' => true];
    } else {
        return ['success' => false, 'error' => 'mail() fonksiyonu başarısız'];
    }
}

// Önce SMTP dene, başarısız olursa mail() dene
$result = sendMailViaSMTP($to, $subject, $html, $smtp_host, $smtp_port, $smtp_user, $smtp_pass, $from_email, $from_name);

if (!$result['success']) {
    // SMTP başarısız, mail() dene
    $result = sendMailSimple($to, $subject, $html, $from_email, $from_name);
}

if ($result['success']) {
    echo json_encode(['success' => true, 'message' => 'E-posta gönderildi']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $result['error'] ?? 'Bilinmeyen hata']);
}
?>
