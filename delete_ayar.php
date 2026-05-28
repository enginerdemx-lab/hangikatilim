<?php
// Bu betik, cPanel'de isminde bozuk karakter olan inatçı .code-workspace dosyalarını siler.

$files = glob("*.code-workspace");
$count = 0;

if (empty($files)) {
    echo "<h2>Silinecek .code-workspace dosyası bulunamadı. Zaten silinmiş olabilir!</h2>";
} else {
    foreach($files as $file) {
        if(unlink($file)) {
            echo "<h2>BAŞARILI: Silinen dosya -> " . htmlspecialchars($file) . "</h2>";
            $count++;
        } else {
            echo "<h2>HATA: Silinemedi -> " . htmlspecialchars($file) . "</h2>";
        }
    }
    echo "<h3>Toplam $count adet dosya silindi.</h3>";
}
echo "<p>Artık bu delete_ayar.php dosyasını cPanel'den silebilirsiniz.</p>";
?>
