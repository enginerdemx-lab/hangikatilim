<?php
$htaccessContent = <<<EOD
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  Options -MultiViews

  # 1. Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. www -> non-www
  RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
  RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

  # 3. Sitemap
  RewriteRule ^sitemap\.xml$ api/sitemap.php [L]

  # 4. React SPA fallback. Prerendered pages are physical folders
  #    (e.g. /blog/index.html) and are served directly by the -d check below;
  #    every other path falls back to index.html (RELATIVE path = LiteSpeed-safe).
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule ^(.*)$ index.html [QSA,L]
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>
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

