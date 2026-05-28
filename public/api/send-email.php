<?php
/**
 * Secure SMTP mail endpoint
 */

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: 'https://katilimuzmani.com,https://www.katilimuzmani.com,http://localhost:3000,http://localhost:5173')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$requiredApiKey = getenv('MAIL_API_KEY') ?: '';
if ($requiredApiKey !== '') {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($apiKey === '') {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (stripos($auth, 'Bearer ') === 0) {
            $apiKey = substr($auth, 7);
        }
    }
    if (!hash_equals($requiredApiKey, $apiKey)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
}

class NatroSMTP
{
    private $socket;
    public $lastError = '';

    public function sendMail($to, $subject, $html, $from, $fromName)
    {
        $host = getenv('SMTP_HOST') ?: 'mail.kurumsaleposta.com';
        $port = (int)(getenv('SMTP_PORT') ?: '465');
        $user = getenv('SMTP_USER') ?: 'destek@katilimuzmani.com';
        $pass = getenv('SMTP_PASS') ?: '';

        if ($pass === '') {
            $this->lastError = 'SMTP_PASS is not configured';
            return false;
        }

        try {
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false,
                    'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT,
                ],
            ]);

            $this->socket = @stream_socket_client(
                "ssl://{$host}:{$port}",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if (!$this->socket) {
                throw new Exception("Connection failed: {$errstr} ({$errno})");
            }

            $this->read();
            $this->expect($this->send('EHLO ' . gethostname()), '250');
            $this->expect($this->send('AUTH LOGIN'), '334');
            $this->expect($this->send(base64_encode($user)), '334');
            $this->expect($this->send(base64_encode($pass)), '235');
            $this->expect($this->send("MAIL FROM:<{$user}>"), '250');
            $this->expect($this->send("RCPT TO:<{$to}>"), '250');
            $this->expect($this->send('DATA'), '354');

            $subject = str_replace(["\r", "\n"], ' ', $subject);
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= 'From: =?UTF-8?B?' . base64_encode($fromName) . "?= <{$from}>\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= 'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n";
            $headers .= 'Date: ' . date('r') . "\r\n\r\n";

            $this->expect($this->send($headers . $html . "\r\n."), '250');
            $this->send('QUIT');
            fclose($this->socket);
            return true;
        } catch (Exception $e) {
            $this->lastError = $e->getMessage();
            if ($this->socket) {
                @fclose($this->socket);
            }
            return false;
        }
    }

    private function read()
    {
        $response = '';
        while ($line = fgets($this->socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $response;
    }

    private function send($cmd)
    {
        fwrite($this->socket, $cmd . "\r\n");
        return $this->read();
    }

    private function expect($response, $code)
    {
        if (substr($response, 0, 3) !== $code) {
            throw new Exception(trim($response));
        }
    }
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$to = trim((string)($data['to'] ?? ''));
$subject = trim((string)($data['subject'] ?? ''));
$html = (string)($data['html'] ?? '');

if ($to === '' || $subject === '' || $html === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing or invalid fields']);
    exit();
}

$from = getenv('MAIL_FROM_EMAIL') ?: 'destek@katilimuzmani.com';
$fromName = getenv('MAIL_FROM_NAME') ?: 'Katilim Uzmani';

$smtp = new NatroSMTP();
$success = $smtp->sendMail($to, $subject, $html, $from, $fromName);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    error_log('SMTP send failed: ' . $smtp->lastError);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Send failed']);
}
?>
