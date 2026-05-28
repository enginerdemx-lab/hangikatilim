<?php
/**
 * Dinamik Sitemap Generator - katilimuzmani.com
 *
 * Supabase'den yayınlanmış haberleri ve blog yazılarını çekerek
 * otomatik olarak güncel bir sitemap.xml oluşturur.
 *
 * Google her sitemap.xml isteğinde bu script çalışır ve
 * tüm içerikler otomatik olarak sitemap'e eklenir.
 */

// Cache: 1 saat (3600 saniye) — Google'ın her istekte DB'ye yüklenmesini önler
$cacheFile = __DIR__ . '/../sitemap-cache.xml';
$cacheTime = 3600; // 1 saat

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    header('Content-Type: application/xml; charset=UTF-8');
    header('X-Sitemap-Source: cache');
    readfile($cacheFile);
    exit;
}

// ===== Supabase Ayarları =====
$supabaseUrl = 'https://jlckywnllaprrtjgqovf.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsY2t5d25sbGFwcnJ0amdxb3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzQyNjcsImV4cCI6MjA4MTExMDI2N30.YxaUY8eXUZW8wbh18yNDldKFrSnBSjJHn4aPgm4qNM8';
$siteUrl = 'https://katilimuzmani.com';

/**
 * Supabase REST API'den veri çeker
 */
function fetchFromSupabase($table, $query, $supabaseUrl, $supabaseKey) {
    $url = $supabaseUrl . '/rest/v1/' . $table . '?' . $query;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Content-Type: application/json',
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || $response === false) {
        return [];
    }

    return json_decode($response, true) ?: [];
}

// ===== Yayınlanmış haberleri çek =====
$newsPosts = fetchFromSupabase(
    'news_posts',
    'select=slug,published_at,updated_at&status=eq.published&order=published_at.desc',
    $supabaseUrl,
    $supabaseKey
);

// ===== Aktif blog yazılarını çek =====
$blogPosts = fetchFromSupabase(
    'blog_posts',
    'select=slug,published_at,updated_at&is_active=eq.true&order=published_at.desc',
    $supabaseUrl,
    $supabaseKey
);

// ===== XML Sitemap Oluştur =====
$today = date('Y-m-d');

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// --- Sabit Sayfalar ---
$staticPages = [
    ['loc' => '/',                   'changefreq' => 'daily',   'priority' => '1.0'],
    ['loc' => '/kampanyalar',        'changefreq' => 'daily',   'priority' => '0.9'],
    ['loc' => '/katilim-firmalari',  'changefreq' => 'weekly',  'priority' => '0.9'],
    ['loc' => '/sektor-haberleri',   'changefreq' => 'daily',   'priority' => '0.8'],
    ['loc' => '/blog',               'changefreq' => 'daily',   'priority' => '0.8'],
    ['loc' => '/iletisim',           'changefreq' => 'monthly', 'priority' => '0.5'],
    ['loc' => '/hakkimizda',         'changefreq' => 'monthly', 'priority' => '0.5'],
];

foreach ($staticPages as $page) {
    $xml .= "  <url>\n";
    $xml .= "    <loc>{$siteUrl}{$page['loc']}</loc>\n";
    $xml .= "    <lastmod>{$today}</lastmod>\n";
    $xml .= "    <changefreq>{$page['changefreq']}</changefreq>\n";
    $xml .= "    <priority>{$page['priority']}</priority>\n";
    $xml .= "  </url>\n";
}

// --- Sektör Haberleri (tek tek yazılar) ---
foreach ($newsPosts as $post) {
    if (empty($post['slug'])) continue;

    $lastmod = !empty($post['updated_at'])
        ? date('Y-m-d', strtotime($post['updated_at']))
        : (!empty($post['published_at']) ? date('Y-m-d', strtotime($post['published_at'])) : $today);

    $xml .= "  <url>\n";
    $xml .= "    <loc>{$siteUrl}/sektor-haberleri/" . htmlspecialchars($post['slug']) . "</loc>\n";
    $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
    $xml .= "    <changefreq>weekly</changefreq>\n";
    $xml .= "    <priority>0.7</priority>\n";
    $xml .= "  </url>\n";
}

// --- Blog Yazıları (tek tek yazılar) ---
foreach ($blogPosts as $post) {
    if (empty($post['slug'])) continue;

    $lastmod = !empty($post['updated_at'])
        ? date('Y-m-d', strtotime($post['updated_at']))
        : (!empty($post['published_at']) ? date('Y-m-d', strtotime($post['published_at'])) : $today);

    $xml .= "  <url>\n";
    $xml .= "    <loc>{$siteUrl}/blog/" . htmlspecialchars($post['slug']) . "</loc>\n";
    $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
    $xml .= "    <changefreq>weekly</changefreq>\n";
    $xml .= "    <priority>0.7</priority>\n";
    $xml .= "  </url>\n";
}

$xml .= '</urlset>';

// ===== Cache'e yaz =====
@file_put_contents($cacheFile, $xml);

// ===== Çıktı =====
header('Content-Type: application/xml; charset=UTF-8');
header('X-Sitemap-Source: generated');
header('X-Sitemap-News-Count: ' . count($newsPosts));
header('X-Sitemap-Blog-Count: ' . count($blogPosts));
echo $xml;
