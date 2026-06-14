import React from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import type { PaymentRow } from '../../types';

interface ResultChartProps {
  schedule: PaymentRow[];
  theme: 'light' | 'dark';
}

const ResultChart: React.FC<ResultChartProps> = ({ schedule, theme }) => {
  const chartGridColor = theme === 'dark' ? '#334155' : '#f3f4f6';
  const chartData = schedule.filter((_, i) => i % Math.ceil((schedule.length || 1) / 20) === 0);

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#210CAE" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#210CAE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} opacity={0.5} />
          <XAxis dataKey="month" hide />
          <YAxis yAxisId="left" orientation="left" hide domain={['auto', 'auto']} />
          <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(value) => `${value}. Taksit`}
            formatter={(value: any, name: any) => {
              const label = name === 'remaining' ? 'Kalan Borç' : 'Aylık Taksit';
              return [new Intl.NumberFormat('tr-TR').format(value) + ' TL', label];
            }}
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            itemStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
          <Area yAxisId="left" type="monotone" dataKey="remaining" stroke="#210CAE" fill="url(#colorRemaining)" strokeWidth={2} name="Kalan Anapara" />
          <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#4DC9E6" strokeWidth={3} dot={false} name="Aylık Taksit" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultChart;
