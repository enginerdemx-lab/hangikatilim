<?php
/**
 * E-posta Gönderme API
 * CORS destekli, Natro SMTP kullanarak e-posta gönderir
 */

// CORS Headers - Her istekte çalışır
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS isteği için erken dönüş (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sadece POST kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// === SMTP AYARLARI ===
// Natro cPanel SMTP bilgilerinizi buraya girin
$smtp_host = 'mail.katilimuzmani.com'; // veya smtp.katilimuzmani.com
$smtp_port = 587; // veya 465 (SSL için)
$smtp_user = 'bildirim@katilimuzmani.com'; // E-posta hesabınız
$smtp_pass = 'MD-3rHdk:.n746P-'; // cPanel'deki şifre
$from_email = 'bildirim@katilimuzmani.com';
$from_name = 'Katılım Uzmanı';

// JSON body al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit();
}

// Gerekli alanları kontrol et
$to = $data['to'] ?? null;
$subject = $data['subject'] ?? null;
$html = $data['html'] ?? null;
$text = $data['text'] ?? strip_tags($html);

if (!$to || !$subject || !$html) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: to, subject, html']);
    exit();
}

// PHPMailer kullanmadan basit mail() fonksiyonu ile gönder
// Natro sunucularında genellikle mail() fonksiyonu çalışır

// E-posta başlıkları
$headers = array();
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-type: text/html; charset=UTF-8";
$headers[] = "From: {$from_name} <{$from_email}>";
$headers[] = "Reply-To: {$from_email}";
$headers[] = "X-Mailer: PHP/" . phpversion();

// E-posta gönder
$mail_sent = @mail($to, $subject, $html, implode("\r\n", $headers));

if ($mail_sent) {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    // Hata durumunda log tut
    error_log("Failed to send email to: {$to}, subject: {$subject}");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email. Check server mail configuration.']);
}
?>