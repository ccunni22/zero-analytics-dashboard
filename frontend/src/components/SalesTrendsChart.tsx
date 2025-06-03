import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { SalesTrends } from '../services/api';
import { format, parseISO, differenceInDays, differenceInMonths, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns';

interface Props {
  data: SalesTrends;
  interactive?: boolean;
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'biweek' | 'month' | 'quarter';
}

function getTickFormat(granularity: string) {
  switch (granularity) {
    case 'day':
      return (period: string) => {
        try { return format(parseISO(period), 'MMM d'); } catch { return period; }
      };
    case 'week':
      return (period: string) => {
        try { return 'Wk of ' + format(parseISO(period), 'MMM d'); } catch { return period; }
      };
    case 'biweek':
      return (period: string) => {
        try { return 'BiWk of ' + format(parseISO(period), 'MMM d'); } catch { return period; }
      };
    case 'month':
      return (period: string) => {
        try { return format(parseISO(period + '-01'), 'MMM yyyy'); } catch { return period; }
      };
    case 'quarter':
      return (period: string) => {
        const [year, q] = period.split('-Q');
        return q && year ? `Q${q} ${year}` : period;
      };
    default:
      return (period: string) => period;
  }
}

const SalesTrendsChart: React.FC<Props> = ({ data, interactive = false, granularity = 'week' }) => {
  const merged = (data.this_period || []).map((tp, i) => ({
    period: tp.period,
    this_period: tp.total_sales,
    prev_period: data.prev_period?.[i]?.total_sales ?? null,
  }));
  const tickFormat = getTickFormat(granularity);
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={merged} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorThisPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.15}/>
            </linearGradient>
            <linearGradient id="colorPrevPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E0F7FA" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#E0F7FA" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="period" 
            tickFormatter={tickFormat}
            stroke="#E0F7FA"
            strokeWidth={1}
            tick={{ fill: '#E0F7FA', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(224,247,250,0.2)' }}
            tickLine={{ stroke: 'rgba(224,247,250,0.2)' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#E0F7FA"
            strokeWidth={1}
            tick={{ fill: '#E0F7FA', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(224,247,250,0.2)' }}
            tickLine={{ stroke: 'rgba(224,247,250,0.2)' }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(224,247,250,0.1)" />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[rgba(16,24,39,0.95)] border border-[rgba(0,229,255,0.12)] rounded-[8px] p-3 shadow-[0_4px_24px_0_rgba(0,229,255,0.12)] backdrop-blur-[12px]">
                    <p className="text-[#E0F7FA] text-xs mb-1">{tickFormat(label)}</p>
                    <p className="text-[#00E5FF] text-xs">This Period: {formatCurrency(payload[0].value)}</p>
                    {payload[1] && (
                      <p className="text-[#E0F7FA] text-xs">Previous Period: {formatCurrency(payload[1].value)}</p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="this_period" 
            stroke="#00E5FF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorThisPeriod)"
            style={{ filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.25))' }}
          />
          <Area 
            type="monotone" 
            dataKey="prev_period" 
            stroke="#E0F7FA" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrevPeriod)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(224,247,250,0.15))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendsChart; 