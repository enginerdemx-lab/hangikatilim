<?php
/**
 * NATRO SUNUCU TANI TESTİ
 * Bu dosyayı sunucuya yükleyip tarayıcıda açın: /api/test-email.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Natro E-posta Test</h1>";

// 1. PHP Versiyonu
echo "<h2>1. PHP Bilgileri</h2>";
echo "<p>PHP Versiyon: " . phpversion() . "</p>";

// 2. mail() fonksiyonu var mı?
echo "<h2>2. mail() Fonksiyonu</h2>";
if (function_exists('mail')) {
    echo "<p style='color:green'>✓ mail() mevcut</p>";
} else {
    echo "<p style='color:red'>✗ mail() YOK - devre dışı</p>";
}

// 3. fsockopen var mı?
echo "<h2>3. fsockopen() Fonksiyonu</h2>";
if (function_exists('fsockopen')) {
    echo "<p style='color:green'>✓ fsockopen() mevcut</p>";
} else {
    echo "<p style='color:red'>✗ fsockopen() YOK</p>";
}

// 4. stream_socket_client var mı?
echo "<h2>4. stream_socket_client() Fonksiyonu</h2>";
if (function_exists('stream_socket_client')) {
    echo "<p style='color:green'>✓ stream_socket_client() mevcut</p>";
} else {
    echo "<p style='color:red'>✗ stream_socket_client() YOK</p>";
}

// 5. OpenSSL var mı?
echo "<h2>5. OpenSSL Desteği</h2>";
if (extension_loaded('openssl')) {
    echo "<p style='color:green'>✓ OpenSSL yüklü</p>";
} else {
    echo "<p style='color:red'>✗ OpenSSL YOK</p>";
}

// 6. SMTP bağlantı testi
echo "<h2>6. SMTP Bağlantı Testi (SSL:465)</h2>";
$host = 'ssl://mail.katilimuzmani.com';
$port = 465;
$timeout = 10;

$errno = 0;
$errstr = '';
$fp = @fsockopen($host, $port, $errno, $errstr, $timeout);

if (!$fp) {
    echo "<p style='color:red'>✗ Bağlantı BAŞARISIZ: $errstr (Kod: $errno)</p>";
} else {
    echo "<p style='color:green'>✓ SMTP'ye bağlanıldı!</p>";

    // Sunucu yanıtını al
    $response = fgets($fp, 515);
    echo "<p>Sunucu yanıtı: <code>" . htmlspecialchars($response) . "</code></p>";

    // EHLO gönder
    fputs($fp, "EHLO katilimuzmani.com\r\n");
    $ehlo = '';
    while ($line = fgets($fp, 515)) {
        $ehlo .= $line;
        if (substr($line, 3, 1) == ' ')
            break;
    }
    echo "<p>EHLO yanıtı: <pre>" . htmlspecialchars($ehlo) . "</pre></p>";

    // AUTH LOGIN dene
    fputs($fp, "AUTH LOGIN\r\n");
    $auth = fgets($fp, 515);
    echo "<p>AUTH yanıtı: <code>" . htmlspecialchars($auth) . "</code></p>";

    // Kullanıcı adı
    $user = 'bildirim@katilimuzmani.com';
    $pass = 'MD-3rHdk:.n746P-';

    fputs($fp, base64_encode($user) . "\r\n");
    $userResp = fgets($fp, 515);
    echo "<p>Kullanıcı adı yanıtı: <code>" . htmlspecialchars($userResp) . "</code></p>";

    fputs($fp, base64_encode($pass) . "\r\n");
    $passResp = fgets($fp, 515);
    echo "<p>Şifre yanıtı: <code>" . htmlspecialchars($passResp) . "</code></p>";

    if (strpos($passResp, '235') !== false) {
        echo "<p style='color:green; font-size:20px;'>✓ KİMLİK DOĞRULAMA BAŞARILI!</p>";

        // Test e-postası gönder
        echo "<h2>7. Test E-postası Gönderimi</h2>";

        fputs($fp, "MAIL FROM:<$user>\r\n");
        echo "<p>MAIL FROM: " . htmlspecialchars(fgets($fp, 515)) . "</p>";

        $testTo = 'engineerdemx@gmail.com'; // Test için
        fputs($fp, "RCPT TO:<$testTo>\r\n");
        echo "<p>RCPT TO: " . htmlspecialchars(fgets($fp, 515)) . "</p>";

        fputs($fp, "DATA\r\n");
        $dataResp = fgets($fp, 515);
        echo "<p>DATA: " . htmlspecialchars($dataResp) . "</p>";

        if (strpos($dataResp, '354') !== false) {
            $msg = "From: Test <$user>\r\n";
            $msg .= "To: $testTo\r\n";
            $msg .= "Subject: Natro Test Email\r\n";
            $msg .= "MIME-Version: 1.0\r\n";
            $msg .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $msg .= "Bu bir test e-postasıdır.\r\n.\r\n";

            fputs($fp, $msg);
            $sendResp = fgets($fp, 515);
            echo "<p>Gönderim sonucu: <code>" . htmlspecialchars($sendResp) . "</code></p>";

            if (strpos($sendResp, '250') !== false) {
                echo "<p style='color:green; font-size:24px;'>🎉 E-POSTA GÖNDERİLDİ!</p>";
            } else {
                echo "<p style='color:red'>✗ Gönderim başarısız</p>";
            }
        }
    } else {
        echo "<p style='color:red; font-size:20px;'>✗ KİMLİK DOĞRULAMA BAŞARISIZ!</p>";
        echo "<p>Muhtemel sebepler: Yanlış şifre veya e-posta hesabı aktif değil</p>";
    }

    fputs($fp, "QUIT\r\n");
    fclose($fp);
}

echo "<hr><p>Test tamamlandı: " . date('Y-m-d H:i:s') . "</p>";
?>