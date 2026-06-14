import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export interface TrafficPoint {
    date: string; // 'YYYY-MM-DD'
    users: number;
    sessions: number;
    pageViews: number;
}

interface TrafficChartProps {
    data: TrafficPoint[];
}

// Tarihi kısa biçime çevir: '2026-06-08' → '8 Haz'
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const shortDate = (iso: string): string => {
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${AYLAR[m] ?? ''}`.trim();
};

const TooltipBox: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-md">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">{shortDate(label)}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} className="text-xs flex items-center gap-1.5" style={{ color: p.color }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <span className="font-semibold">{Number(p.value).toLocaleString('tr-TR')}</span>
                </p>
            ))}
        </div>
    );
};

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[280px] flex items-center justify-center text-sm text-slate-400">
                Grafik verisi bulunamadı.
            </div>
        );
    }

    return (
        <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0855f8" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#0855f8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        allowDecimals={false}
                    />
                    <Tooltip content={<TooltipBox />} />
                    <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        iconType="circle"
                        formatter={(v) => <span className="text-slate-500 dark:text-slate-400">{v}</span>}
                    />
                    <Area
                        type="monotone"
                        dataKey="users"
                        name="Kullanıcılar"
                        stroke="#0855f8"
                        strokeWidth={2}
                        fill="url(#usersGrad)"
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="sessions"
                        name="Oturumlar"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#sessionsGrad)"
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
