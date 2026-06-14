import React, { useEffect, useRef, useState } from 'react';
import { Users, Activity } from 'lucide-react';
import { analyticsService, RealtimeData } from '../../services/api/analytics';

const POLL_MS = 60 * 1000; // 60 saniye

export const RealtimeUsers: React.FC = () => {
    const [data, setData] = useState<RealtimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchOnce = async () => {
            const rt = await analyticsService.getRealtime();
            if (!cancelled) {
                setData(rt);
                setLoading(false);
            }
        };

        fetchOnce();
        timerRef.current = window.setInterval(fetchOnce, POLL_MS);

        return () => {
            cancelled = true;
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, []);

    // İlk yükleme
    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <div className="animate-pulse space-y-3">
                    <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
        );
    }

    // Hata / veri yok (Edge Function güncellenmemiş olabilir)
    if (!data || data.hasError) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Anlık Aktif Kullanıcı</h3>
                </div>
                <p className="text-xs text-slate-400">
                    Anlık veri alınamadı. GA4 Realtime için <code>analytics-overview</code> Edge Function'ını güncelleyip yeniden deploy edin.
                </p>
            </div>
        );
    }

    const perMinute = data.perMinute && data.perMinute.length > 0
        ? data.perMinute
        : new Array(30).fill(0);
    // index 0 = şu an → barları soldan sağa "29 dk önce → şimdi" göster
    const bars = [...perMinute].reverse();
    const maxVal = Math.max(...bars, 1);
    const maxCountry = Math.max(...data.byCountry.map((c) => c.users), 1);

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Son 30 dakikadaki aktif kullanıcı
                    </h3>
                </div>
                <Users size={16} className="text-slate-400" />
            </div>

            {/* Büyük sayı */}
            <p className="text-4xl font-bold text-slate-900 dark:text-white leading-none mb-4">
                {data.activeUsers.toLocaleString('tr-TR')}
            </p>

            {/* Dakika başına barlar */}
            <p className="text-[11px] font-medium text-slate-400 mb-1.5">Dakika başına aktif kullanıcı</p>
            <div className="flex items-end gap-[2px] h-12 mb-4">
                {bars.map((v, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-sm bg-[#0855f8]/80 dark:bg-[#3b82f6] transition-all"
                        style={{ height: `${Math.max((v / maxVal) * 100, v > 0 ? 8 : 2)}%` }}
                        title={`${29 - i} dk önce: ${v}`}
                    />
                ))}
            </div>

            {/* Ülke dağılımı */}
            {data.byCountry.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
                        <span>Ülke</span>
                        <span>Aktif kullanıcı</span>
                    </div>
                    <ul className="space-y-1.5">
                        {data.byCountry.map((c) => (
                            <li key={c.country} className="flex items-center gap-2">
                                <span className="text-xs text-slate-600 dark:text-slate-300 w-24 truncate">{c.country}</span>
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#0855f8] rounded-full"
                                        style={{ width: `${(c.users / maxCountry) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-slate-900 dark:text-white w-8 text-right">{c.users}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
