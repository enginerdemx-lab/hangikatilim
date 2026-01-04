<?php
/**
 * Basit E-posta Gönderme (PHP mail() kullanır)
 * SMTP sorunlarını bypass eder
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['html'])) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'error' => 'Missing fields']));
}

$to = $data['to'];
$subject = $data['subject'];
$message = $data['html'];

// Email başlıkları
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Katılım Uzmanı <bildirim@katilimuzmani.com>" . "\r\n";

// PHP'nin kendi mail() fonksiyonunu kullan
$success = mail($to, $subject, $message, $headers);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Mail gönderilemedi. Sunucu yapılandırması kontrol edilmeli.'
    ]);
}
?>