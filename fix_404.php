<?php
$htaccessContent = <<<EOD
<IfModule mod_rewrite.c>
  Options -MultiViews
  RewriteEngine On
  RewriteBase /

  # 1. Zorunlu HTTPS Yönlendirmesi
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. www'dan www'suz (katilimuzmani.com) yönlendirme
  RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
  RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

  # 3. Admin panel (React SPA) için özel kurallar (fiziksel klasör çakışmalarını önler)
  RewriteRule ^admin/login/?$ /index.html [L]
  RewriteRule ^admin(/.*)?$ /index.html [L]

  # 4. Sitemap için yönlendirme
  RewriteRule ^sitemap\.xml$ /api/sitemap.php [L]

  # 5. React SPA Fallback (LiteSpeed Uyumlu)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  # index.html için cache'i kapat
  <FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>
  
  # Statik dosyalar için cache'i aç
  <FilesMatch "\.(js|css|webp|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
EOD;

$result = file_put_contents('.htaccess', $htaccessContent);

if ($result !== false) {
    echo "<h1>BAŞARILI: .htaccess dosyası oluşturuldu/güncellendi!</h1>";
    echo "<p>Artık 404 hatası almamalısınız. Lütfen <b>katilimuzmani.com/admin/login</b> adresine giderek test edin.</p>";
} else {
    echo "<h1>HATA: Dosya yazılamadı.</h1>";
    echo "<p>Sunucu yazma izinlerini kontrol edin.</p>";
}
echo "<p>Bu php dosyasını (fix_404.php) silebilirsiniz.</p>";
?>

