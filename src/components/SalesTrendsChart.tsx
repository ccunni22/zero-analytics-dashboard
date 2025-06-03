import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { SalesTrends } from '../services/api';
import { format, parseISO } from 'date-fns';

const SalesTrendsChart: React.FC<Props> = ({ data, granularity = 'week' }) => {
  const merged = (data.this_period || []).map((tp, i) => ({
    week_start: tp.week_start,
    total_sales: typeof tp.total_sales === 'number' ? tp.total_sales : 0,
    prev_total_sales: typeof data.prev_period?.[i]?.total_sales === 'number' ? data.prev_period[i].total_sales : 0,
  }));

  const tickFormat = (str: string) => {
    const date = parseISO(str);
    return format(date, 'MMM d');
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={merged}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorThisPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="colorPrevPeriod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0F7FA" />
            <stop offset="100%" stopColor="#E0F7FA" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="week_start" 
          tickFormatter={tickFormat}
          stroke="#E0F7FA"
          strokeWidth={1}
          tick={{ fill: '#E0F7FA', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(224,247,250,0.2)' }}
          tickLine={{ stroke: 'rgba(224,247,250,0.2)' }}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => {
            const date = parseISO(value as string);
            return format(date, 'MMM d, yyyy');
          }}
        />
        <Area 
          type="monotone" 
          dataKey="total_sales" 
          stroke="#00E5FF" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorThisPeriod)"
          style={{ filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.25))' }}
        />
        <Area 
          type="monotone" 
          dataKey="prev_total_sales" 
          stroke="#E0F7FA" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorPrevPeriod)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(224,247,250,0.15))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SalesTrendsChart; 