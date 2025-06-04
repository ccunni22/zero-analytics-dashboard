import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SalesTrends } from "../services/api";
import { format, parseISO } from "date-fns";

interface Props {
  data: SalesTrends;
  granularity: string;
  loading?: boolean;
}

const SalesTrendsChart: React.FC<Props> = ({
  data,
  granularity,
  loading = false,
}) => {
  // Transform data for the chart
  const chartData = data.this_period.map((tp, i) => ({
    period: tp.period,
    this_period: tp.total_sales,
    prev_period: data.prev_period[i]?.total_sales || 0,
  }));

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "MMM d");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-10">
          <div className="text-[var(--color-text-primary)]">Loading...</div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorThisPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorPrevPeriod" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0.05} />
            </linearGradient>
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="period"
            tickFormatter={formatDate}
            stroke="var(--color-text-secondary)"
            tick={{ fill: "var(--color-text-secondary)" }}
          />
          <YAxis
            stroke="var(--color-text-secondary)"
            tick={{ fill: "var(--color-text-secondary)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-dark)",
              border: "1px solid var(--color-border)",
              borderRadius: "4px",
            }}
            labelFormatter={formatDate}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="this_period"
            name="This Period"
            stroke="#00E5FF"
            fill="url(#colorThisPeriod)"
            fillOpacity={0.25}
            strokeWidth={2.5}
            dot={{ r: 4, stroke: '#00E5FF', strokeWidth: 2, fill: '#0b192f', filter: 'url(#glow-cyan)' }}
            activeDot={{ r: 6, stroke: '#00E5FF', strokeWidth: 2, fill: '#0b192f', filter: 'url(#glow-cyan)' }}
            filter="url(#glow-cyan)"
          />
          <Area
            type="monotone"
            dataKey="prev_period"
            name="Previous Period"
            stroke="#7C4DFF"
            fill="url(#colorPrevPeriod)"
            fillOpacity={0.25}
            strokeWidth={2.5}
            dot={{ r: 4, stroke: '#7C4DFF', strokeWidth: 2, fill: '#0b192f' }}
            activeDot={{ r: 6, stroke: '#7C4DFF', strokeWidth: 2, fill: '#0b192f' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendsChart;
