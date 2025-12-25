<?php
/**
 * BASIT E-POSTA API - DEBUG VERSION
 */

// Hataları göster (debug için)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// POST değilse
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// SMTP bilgileri
$from_email = 'bildirim@katilimuzmani.com';
$from_name = 'Katılım Uzmanı';

// JSON al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON', 'raw' => $input]);
    exit();
}

$to = isset($data['to']) ? $data['to'] : null;
$subject = isset($data['subject']) ? $data['subject'] : null;
$html = isset($data['html']) ? $data['html'] : null;

if (!$to || !$subject || !$html) {
    echo json_encode(['success' => false, 'error' => 'Missing: to, subject, or html']);
    exit();
}

// Basit mail() ile gönder
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: " . $from_name . " <" . $from_email . ">\r\n";
$headers .= "Reply-To: " . $from_email . "\r\n";

$result = mail($to, $subject, $html, $headers);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} else {
    $lastError = error_get_last();
    echo json_encode([
        'success' => false,
        'error' => 'mail() failed',
        'php_error' => $lastError ? $lastError['message'] : 'Unknown'
    ]);
}
?>