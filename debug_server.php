<?php
// Sunucu Durumunu İnceleme Betiği
echo "<h1>Sunucu Hata Ayıklama (Debug) Raporu</h1>";

// 1. admin klasörü kontrolü
echo "<h2>1. 'admin' Klasörü Kontrolü</h2>";
if (is_dir('admin')) {
    echo "<p style='color:red; font-weight:bold;'>UYARI: Sunucuda fiziksel bir 'admin' klasörü BULUNDU!</p>";
    echo "<p>Bu klasörün içindeki dosyalar:</p><ul>";
    $files = scandir('admin');
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "<li>" . htmlspecialchars($file) . "</li>";
        }
    }
    echo "</ul><p style='color:red;'><strong>ÇÖZÜM:</strong> cPanel veya FTP'den girip bu 'admin' klasörünün adını 'admin_yedek' yapın veya silin!</p>";
} else {
    echo "<p style='color:green;'>Başarılı: Sunucuda fiziksel 'admin' klasörü yok. (Çakışma yaşanmamalı)</p>";
}

// 2. .htaccess kontrolü
echo "<h2>2. .htaccess Dosyası Kontrolü</h2>";
if (file_exists('.htaccess')) {
    echo "<p style='color:green;'>.htaccess dosyası BULUNDU.</p>";
    
    // İzinleri kontrol et
    $perms = substr(sprintf('%o', fileperms('.htaccess')), -4);
    echo "<p>Dosya İzinleri: <strong>$perms</strong> ";
    if ($perms == '0644' || $perms == '0755') {
        echo "<span style='color:green;'>(Normal)</span></p>";
    } else {
        echo "<span style='color:red;'>(Anormal olabilir, genelde 0644 olmalıdır)</span></p>";
    }
    
    // İçeriği göster
    echo "<h3>Mevcut .htaccess İçeriği:</h3>";
    $content = file_get_contents('.htaccess');
    echo "<pre style='background:#f4f4f4; padding:15px; border:1px solid #ccc; overflow:auto;'>";
    echo htmlspecialchars($content);
    echo "</pre>";
    
    // Doğru sürüm mü kontrol et
    if (strpos($content, '^admin(/.*)?$ /index.html') !== false) {
        echo "<p style='color:green; font-weight:bold;'>Harika: En son gönderdiğim (V3) düzeltme dosyası AKTİF.</p>";
    } else {
        echo "<p style='color:red; font-weight:bold;'>HATA: Bu .htaccess dosyası benim verdiğim V3 dosyası DEĞİL! Üzerine yazılmış veya eski dosya kalmış.</p>";
    }
} else {
    echo "<p style='color:red; font-weight:bold;'>HATA: .htaccess dosyası BULUNAMADI! (Muhtemelen yüklemediniz veya silindi)</p>";
}

echo "<hr>";
echo "<p><em>Lütfen bu ekranın fotoğrafını çekip bana (yapay zekaya) gönderin.</em></p>";
?>
