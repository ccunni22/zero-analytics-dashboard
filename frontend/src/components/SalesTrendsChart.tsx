import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  TooltipProps
} from 'recharts';
import type { SalesTrends } from '../services/api';
import { format, parseISO } from 'date-fns';
import ErrorBoundary from './ErrorBoundary';

type Granularity = 'day' | 'week' | 'biweek' | 'month' | 'quarter';

interface Props {
  data: SalesTrends;
  startDate?: string;
  endDate?: string;
  granularity: Granularity;
}

type TickFormatter = (period: string) => string;

function getTickFormat(granularity: Granularity): TickFormatter {
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

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
  tickFormat: TickFormatter;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, tickFormat }) => {
  if (!active || !payload?.length || !label) return null;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  return (
    <div className="bg-[rgba(16,24,39,0.95)] border border-[rgba(0,229,255,0.12)] rounded-[8px] p-3 shadow-[0_4px_24px_0_rgba(0,229,255,0.12)] backdrop-blur-[12px]">
      <p className="text-[#E0F7FA] text-xs mb-1">{tickFormat(label)}</p>
      <p className="text-[#00E5FF] text-xs">
        This Period: {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      {payload[1] && (
        <p className="text-[#E0F7FA] text-xs">
          Previous Period: {formatCurrency(payload[1].value ?? 0)}
        </p>
      )}
    </div>
  );
};

const SalesTrendsChart: React.FC<Props> = ({ data, granularity }) => {
  // Defensive: Ensure period exists on each TrendPoint
  const merged = (data.this_period || []).map((tp, i) => ({
    period: (tp as any).period || (tp as any).week_start || '',
    this_period: typeof tp.total_sales === 'number' ? tp.total_sales : 0,
    prev_period: typeof data.prev_period?.[i]?.total_sales === 'number' ? data.prev_period[i].total_sales : 0,
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
          <Tooltip content={<CustomTooltip tickFormat={tickFormat} />} />
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

export default function SalesTrendsChartWithErrorBoundary(props: Props) {
  return (
    <ErrorBoundary>
      <SalesTrendsChart {...props} />
    </ErrorBoundary>
  );
} 