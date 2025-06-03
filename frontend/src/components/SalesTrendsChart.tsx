import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { SalesTrends } from '../services/api';

interface Props {
  data: SalesTrends;
  granularity: string;
  loading?: boolean;
}

const SalesTrendsChart: React.FC<Props> = ({ data, granularity, loading = false }) => {
  // Generate placeholder data if no data exists
  const placeholderData = Array.from({ length: 7 }, (_, i) => ({
    period: `Day ${i + 1}`,
    total_sales: Math.random() * 1000 + 500,
  }));

  const chartData = data.this_period.length > 0 ? data.this_period : placeholderData;

  return (
    <div className="chart-container h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--color-border)"
            opacity={0.3}
          />
          <XAxis 
            dataKey="period" 
            stroke="var(--color-text-secondary)"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="var(--color-text-secondary)"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-dark)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
          />
          <Area
            type="monotone"
            dataKey="total_sales"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSales)"
            className="chart-area"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendsChart; 