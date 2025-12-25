<?php
/**
 * SMTP HOST TEST - Farklı host'ları dene
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<h1>SMTP Host Testi</h1>";

$hosts = [
    ['ssl://localhost', 465],
    ['ssl://127.0.0.1', 465],
    ['ssl://mail.katilimuzmani.com', 465],
    ['ssl://smtp.katilimuzmani.com', 465],
    ['localhost', 587],
    ['127.0.0.1', 587],
    ['localhost', 25],
    ['127.0.0.1', 25],
];

foreach ($hosts as $config) {
    $host = $config[0];
    $port = $config[1];

    echo "<h3>Test: $host:$port</h3>";

    $fp = @fsockopen($host, $port, $errno, $errstr, 5);

    if (!$fp) {
        echo "<p style='color:red'>✗ Başarısız: $errstr</p>";
    } else {
        $response = @fgets($fp, 515);
        echo "<p style='color:green'>✓ BAĞLANTI BAŞARILI!</p>";
        echo "<p>Yanıt: <code>" . htmlspecialchars($response) . "</code></p>";
        fclose($fp);
    }
}

// Natro cPanel mail ayarlarını kontrol
echo "<h2>Natro cPanel Mail Ayarları</h2>";
echo "<p>cPanel'de <b>E-posta Hesapları</b> > <b>E-posta İstemcisi Yapılandır</b> kısmından doğru SMTP sunucu adresini kontrol edin.</p>";
echo "<p>Genellikle şunlardan biri olur:</p>";
echo "<ul>";
echo "<li>mail.domainadiniz.com</li>";
echo "<li>smtp.domainadiniz.com</li>";
echo "<li>Sunucu IP adresi</li>";
echo "<li>localhost (aynı sunucu)</li>";
echo "</ul>";

echo "<hr><p>Test: " . date('Y-m-d H:i:s') . "</p>";
?>