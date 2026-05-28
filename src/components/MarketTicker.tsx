import React, { useEffect, useState } from 'react';
import { siteSettingsApi } from '../services/api/siteSettings';
import { ArrowDown, ArrowUp, X } from 'lucide-react';

interface TickerData {
    rates: {
        USD: number;
        EUR: number;
        GBP: number;
    };
    changes: {
        USD: number;
        EUR: number;
        GBP: number;
        GOLD: number;
    };
    gold_try: number;
    last_update: string;
}

const MarketTicker: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [tickerData, setTickerData] = useState<TickerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                // 1. Get Settings
                const settings = await siteSettingsApi.getSettings();

                if (!settings?.ticker_active) {
                    console.log('[MarketTicker] Ticker disabled in settings');
                    setActive(false);
                    setLoading(false);
                    return;
                }
                setActive(true);

                // 2. Fetch Ticker Data
                const ons = settings.gold_ons_price || 2060;

                try {
                    const response = await fetch(`/api/tcmb.php?ons=${ons}`);

                    // Check if response is valid JSON (prevents PHP source code issue in Dev)
                    const contentType = response.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error('Response is not JSON (likely PHP source in dev)');
                    }

                    if (!response.ok) throw new Error('Network response was not ok');

                    const data = await response.json();

                    // Override Gold Change if manual rate is set in settings
                    if (settings.market_gold_change_rate !== undefined && settings.market_gold_change_rate !== null) {
                        // Ensure changes object exists
                        if (!data.changes) data.changes = {};
                        data.changes.GOLD = settings.market_gold_change_rate;
                    }

                    setTickerData(data);
                } catch (fetchError) {
                    console.warn('[MarketTicker] API Error:', fetchError);

                    // Fallback for Development (Mock Data)
                    if (import.meta.env.DEV) {
                        console.info('[MarketTicker] Using Mock Data for Development');
                        setTickerData({
                            rates: { USD: 30.123, EUR: 32.456, GBP: 38.789 },
                            changes: { USD: 0.15, EUR: -0.05, GBP: 0.20, GOLD: 0.50 },
                            gold_try: 2050.50,
                            last_update: '10:30 (Mock)'
                        });
                    } else {
                        throw fetchError;
                    }
                }
                setLoading(false);

            } catch (error) {
                console.error('[MarketTicker] Critical Error:', error);
                setLoading(false);
            }
        };

        fetchData();

        // Refresh every 5 minutes
        intervalId = setInterval(fetchData, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    if (!active || !isVisible) return null;

    // Minimal skeleton or null while loading initial data
    if (loading || !tickerData) return null;

    const formatRate = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(val);
    };

    const formatGold = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    const formatPct = (val: number) => {
        return `%${Math.abs(val).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const renderItem = (label: string, value: string, pct: number) => {
        const isUp = pct >= 0;
        const colorClass = isUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

        return (
            <div className="flex items-center gap-3 px-4 py-1.5 border-r border-gray-100 last:border-0 min-w-max">
                <span className="text-xs font-bold text-gray-700">{label}</span>
                <span className="text-xs font-medium text-gray-900">{value}</span>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${colorClass}`}>
                    {isUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {formatPct(pct)}
                </div>
            </div>
        );
    };

    // Items rendered twice for seamless loop
    const tickerItems = (
        <>
            {renderItem('Dolar', formatRate(tickerData.rates.USD), tickerData.changes.USD)}
            {renderItem('Euro', formatRate(tickerData.rates.EUR), tickerData.changes.EUR)}
            {renderItem('Sterlin', formatRate(tickerData.rates.GBP), tickerData.changes.GBP)}
            {renderItem('Gram Altın', `${formatGold(tickerData.gold_try)} ₺`, tickerData.changes.GOLD)}
        </>
    );

    return (
        <>
            {/* Keyframe animation injected via <style> tag */}
            <style>{`
                @keyframes ticker-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ticker-track {
                    display: flex;
                    width: max-content;
                    animation: ticker-scroll 18s linear infinite;
                }
                .ticker-track:hover {
                    animation-play-state: paused;
                }
                @media (prefers-reduced-motion: reduce) {
                    .ticker-track {
                        animation: none;
                    }
                }
            `}</style>

            <div className="bg-white border-b border-gray-200 relative z-20 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-11">

                        {/* Mobile: auto-scrolling marquee | Desktop: static flex */}
                        <div className="flex-1 overflow-hidden relative">

                            {/* Mobile marquee (hidden on md+) */}
                            <div className="flex md:hidden h-full items-center">
                                <div className="ticker-track items-center">
                                    {tickerItems}
                                    {/* Duplicate for seamless loop */}
                                    {tickerItems}
                                </div>
                            </div>

                            {/* Desktop static (hidden below md) */}
                            <div className="hidden md:flex items-center h-full">
                                {tickerItems}
                            </div>
                        </div>

                        {/* Last Update & Close */}
                        <div className="flex items-center gap-4 pl-4 md:bg-white md:shadow-none bg-white shadow-[-10px_0_10px_white]">
                            <span className="hidden md:inline-block text-[10px] text-gray-400 whitespace-nowrap">
                                Son: {tickerData.last_update}
                            </span>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MarketTicker;
