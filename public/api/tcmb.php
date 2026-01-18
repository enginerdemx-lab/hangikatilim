<?php
// TCMB Proxy & Cache Script
// Handles CORS and caching for frontend ticker

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Allow all origins or specify your domain

// Configuration
$cacheFile = __DIR__ . '/cache/tcmb.json';
$cacheDuration = 30 * 60; // 30 minutes in seconds
$manualOnsPrice = isset($_GET['ons']) ? floatval($_GET['ons']) : 2060; // Default ONS if not provided

// Create cache directory if not exists
if (!file_exists(dirname($cacheFile))) {
    mkdir(dirname($cacheFile), 0755, true);
}

// Function to fetch URL content
function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Handle specific SSL issues if needed
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}

// Function to parse TCMB XML
function parseTcmbXml($xmlString) {
    if (!$xmlString) return null;
    $xml = simplexml_load_string($xmlString);
    if (!$xml) return null;

    $rates = [];
    foreach ($xml->Currency as $currency) {
        $code = (string)$currency['CurrencyCode'];
        if (in_array($code, ['USD', 'EUR', 'GBP'])) {
            $rates[$code] = floatval($currency->ForexSelling); // Use ForexSelling
        }
    }
    return $rates;
}

// Function to get previous working day date string (Ym/dmy.xml format logic needed or just Y-m-d)
// TCMB URL format for old dates: https://www.tcmb.gov.tr/kurlar/202401/17012024.xml
function getPreviousWorkDay($dateTimestamp) {
    $dayOfWeek = date('N', $dateTimestamp);
    $subtractDays = 1;
    if ($dayOfWeek == 1) { // Monday -> Friday
        $subtractDays = 3;
    } elseif ($dayOfWeek == 7) { // Sunday -> Friday
        $subtractDays = 2;
    }
    return $dateTimestamp - ($subtractDays * 86400);
}

// Check Cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
    $cachedData = json_decode(file_get_contents($cacheFile), true);
    
    // Update calculated gold based on current request ONS price (dynamic)
    // We only cache the RAW rates, but for simplicity, let's just return cached if ONS hasn't drastically changed or force recalc.
    // Actually, to support dynamic ONS in admin, we should recalculate Gold part even if cache is hit.
    // Let's refine: Cache stores purely TCMB rates.
    
    if (isset($cachedData['tcmb_rates'])) {
        $usd = $cachedData['tcmb_rates']['USD'];
        $gramGold = ($manualOnsPrice * $usd) / 31.1035;
        
        $response = [
            'source' => 'cache',
            'last_update' => date('H:i', filemtime($cacheFile)),
            'rates' => $cachedData['rates'], // Current rates
            'changes' => $cachedData['changes'],
            'gold_ons' => $manualOnsPrice,
            'gold_try' => $gramGold
        ];
        
        // Recalculate Gold change if needed or just use cached change pct (assuming ONS stable)
        // For simplicity:
        echo json_encode($response);
        exit;
    }
}

// Fetch Live Data
$todayXml = fetchUrl('https://www.tcmb.gov.tr/kurlar/today.xml');
$currentRates = parseTcmbXml($todayXml);

if (!$currentRates) {
    // If fail, try to serve stale cache
    if (file_exists($cacheFile)) {
        echo file_get_contents($cacheFile);
        exit;
    }
    http_response_code(503);
    echo json_encode(['error' => 'Service unavailable']);
    exit;
}

// Fetch Previous Day Data for % Change
// Logic: If today is weekend, today.xml might be friday's data.
// We need the day BEFORE today.xml's date.
// TCMB Today.xml has <Date Date="01/17/2024" ...>
$xml = simplexml_load_string($todayXml);
$xmlDateStr = (string)$xml['Date']; // MM/DD/YYYY
$dateObj = DateTime::createFromFormat('m/d/Y', $xmlDateStr);
$currentDateTs = $dateObj->getTimestamp();
$prevDateTs = getPreviousWorkDay($currentDateTs);

// Construct URL for previous day
// Format: https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml
$prevYear = date('Y', $prevDateTs);
$prevMonth = date('m', $prevDateTs);
$prevDay = date('d', $prevDateTs);
$prevUrl = "https://www.tcmb.gov.tr/kurlar/{$prevYear}{$prevMonth}/{$prevDay}{$prevMonth}{$prevYear}.xml";

$prevXml = fetchUrl($prevUrl);
$prevRates = parseTcmbXml($prevXml);

// Calculate Changes and Final Response
$responseRates = [];
$changes = [];

foreach (['USD', 'EUR', 'GBP'] as $currency) {
    $curr = $currentRates[$currency];
    $prev = isset($prevRates[$currency]) ? $prevRates[$currency] : $curr;
    
    $responseRates[$currency] = $curr;
    
    // Calculate % change
    $diff = $curr - $prev;
    $pct = ($diff / $prev) * 100;
    $changes[$currency] = round($pct, 2);
}

// Calculate Gram Gold
// Gram Gold = (ONS * USD) / 31.1035
$gramGold = ($manualOnsPrice * $currentRates['USD']) / 31.1035;

// Gold Previous Day (Approximation assuming ONS was same? Or just track USD change?)
// Let's assume constant ONS for daily change calc to reflect currency impact + general trend.
// Or if proper: ($manualOnsPrice * $prevRates['USD']) / 31.1035
$prevGramGold = ($manualOnsPrice * ($prevRates['USD'] ?? $currentRates['USD'])) / 31.1035;
$goldDiff = $gramGold - $prevGramGold;
$goldPct = ($goldDiff / $prevGramGold) * 100;

$finalData = [
    'tcmb_rates' => $currentRates, // Internal use
    'rates' => $responseRates,
    'changes' => array_merge($changes, ['GOLD' => round($goldPct, 2)]),
    'gold_ons' => $manualOnsPrice,
    'gold_try' => $gramGold,
    'last_update' => date('H:i')
];

// Save to cache
file_put_contents($cacheFile, json_encode($finalData));

// Output
echo json_encode(array_merge($finalData, ['source' => 'live']));
?>
