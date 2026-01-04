<?php
/**
 * E-posta Gönderme API - NATRO SMTP
 * Natro hosting tarafından onaylanan SMTP ayarları kullanılıyor
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

class NatroSMTP
{
    private $socket;
    private $debug = [];
    public $lastError = '';

    private function log($msg)
    {
        $this->debug[] = date('H:i:s') . ' - ' . $msg;
    }

    private function read()
    {
        $response = '';
        while ($line = fgets($this->socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ')
                break;
        }
        $this->log("SERVER: " . trim($response));
        return $response;
    }

    private function send($cmd)
    {
        $this->log("CLIENT: $cmd");
        fwrite($this->socket, $cmd . "\r\n");
        return $this->read();
    }

    public function sendMail($to, $subject, $html, $from, $fromName)
    {
        // NATRO SMTP AYARLARI (Hosting firması tarafından onaylandı)
        $host = 'mail.kurumsaleposta.com';
        $port = 465;
        $user = 'destek@katilimuzmani.com';
        $pass = 'dN_5_BXb18h6@wD:';

        try {
            $this->log("Connecting to ssl://$host:$port...");

            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                    'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                ]
            ]);

            $this->socket = @stream_socket_client(
                "ssl://$host:$port",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if (!$this->socket) {
                throw new Exception("Bağlantı hatası: $errstr ($errno)");
            }

            $this->log("Connected!");
            $this->read(); // Welcome message

            // EHLO
            $response = $this->send("EHLO " . gethostname());
            if (substr($response, 0, 3) != '250') {
                throw new Exception("EHLO hatası: $response");
            }

            // AUTH LOGIN
            $response = $this->send("AUTH LOGIN");
            if (substr($response, 0, 3) != '334') {
                throw new Exception("AUTH hatası: $response");
            }

            $response = $this->send(base64_encode($user));
            if (substr($response, 0, 3) != '334') {
                throw new Exception("Kullanıcı adı hatası: $response");
            }

            $response = $this->send(base64_encode($pass));
            if (substr($response, 0, 3) != '235') {
                throw new Exception("Şifre hatası: $response");
            }

            // MAIL FROM
            $response = $this->send("MAIL FROM:<$user>");
            if (substr($response, 0, 3) != '250') {
                throw new Exception("MAIL FROM hatası: $response");
            }

            // RCPT TO
            $response = $this->send("RCPT TO:<$to>");
            if (substr($response, 0, 3) != '250') {
                throw new Exception("RCPT TO hatası: $response");
            }

            // DATA
            $response = $this->send("DATA");
            if (substr($response, 0, 3) != '354') {
                throw new Exception("DATA hatası: $response");
            }

            // Email içeriği
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$from>\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date('r') . "\r\n";

            $body = $headers . "\r\n" . $html . "\r\n.";
            $response = $this->send($body);

            if (substr($response, 0, 3) != '250') {
                throw new Exception("Mail gönderim hatası: $response");
            }

            // QUIT
            $this->send("QUIT");
            fclose($this->socket);

            return true;

        } catch (Exception $e) {
            $this->lastError = $e->getMessage();
            $this->log("ERROR: " . $e->getMessage());
            if ($this->socket)
                @fclose($this->socket);
            return false;
        }
    }

    public function getDebugLog()
    {
        return $this->debug;
    }
}

// Input al
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['to']) || !isset($data['subject']) || !isset($data['html'])) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'error' => 'Missing fields']));
}

$smtp = new NatroSMTP();
$success = $smtp->sendMail(
    $data['to'],
    $data['subject'],
    $data['html'],
    'destek@katilimuzmani.com',
    'Katılım Uzmanı'
);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $smtp->lastError,
        'debug' => $smtp->getDebugLog()
    ]);
}
?>