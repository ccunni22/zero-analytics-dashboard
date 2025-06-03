import React from 'react';
import type { SalesSummary, CategorySummary } from '../services/api';

interface Props {
  summary: SalesSummary;
  interactive?: boolean;
  compact?: boolean;
}

const safeNumber = (value: number | undefined | null) => typeof value === 'number' && !isNaN(value) ? value : 0;

const formatCurrency = (value: number | undefined | null) => `$${safeNumber(value).toFixed(2)}`;

const renderCategory = (label: string, data?: CategorySummary) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-300">{label}</span>
    <span className="text-yellow-400">{formatCurrency(data?.total_sales)}</span>
  </div>
);

const SalesSummaryCard: React.FC<Props> = ({ summary, interactive = false, compact = false }) => {
  const total = summary.total;
  const food = summary.food;
  const alcohol = summary.alcohol;

  const boxClass = compact
    ? "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex flex-col justify-center items-start backdrop-blur-[12px] shadow-[0_2px_16px_0_rgba(94,203,250,0.08)] transition-all duration-300 ease-in-out hover:shadow-[0_4px_24px_0_rgba(0,229,255,0.12)] hover:border-[rgba(0,229,255,0.12)] hover:translate-y-[-2px]"
    : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 flex flex-col justify-center items-start backdrop-blur-[12px] shadow-[0_2px_16px_0_rgba(94,203,250,0.08)] transition-all duration-300 ease-in-out hover:shadow-[0_4px_24px_0_rgba(0,229,255,0.12)] hover:border-[rgba(0,229,255,0.12)] hover:translate-y-[-2px]";
  
  const titleClass = compact 
    ? "flex items-center gap-2 uppercase text-left font-light tracking-widest text-[12px] text-[#E0F7FA] mb-2" 
    : "flex items-center gap-2 uppercase text-left font-light tracking-widest text-[12px] text-[#E0F7FA] mb-3";
  
  const valueClass = compact 
    ? "text-2xl font-medium text-left text-[#E0F7FA]" 
    : "text-3xl font-medium text-left text-[#E0F7FA]";
  
  const subStatClass = compact 
    ? "text-[10px] text-[#00E5FF] mt-0.5 text-left" 
    : "text-xs text-[#00E5FF] mt-1 text-left";

  const hoverClass = interactive ? "hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-shadow duration-200" : "";

  return (
    <div className="w-full h-full flex flex-col">
      {/* KPI Grid Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto">
          {/* Total Sales */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.total_sales === 'number' ? summary.total_sales.toLocaleString() : '--'}</div>
            <div className="text-xs text-[#E0F7FA] mt-1">
              {summary.sales_growth > 0 ? '+' : ''}{summary.sales_growth}% vs previous period
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.total_orders === 'number' ? summary.total_orders.toLocaleString() : '--'}</div>
            <div className="text-xs text-[#E0F7FA] mt-1">
              {summary.orders_growth > 0 ? '+' : ''}{summary.orders_growth}% vs previous period
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Average Order Value</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.avg_order_value === 'number' ? summary.avg_order_value.toLocaleString() : '--'}</div>
            <div className="text-xs text-[#E0F7FA] mt-1">
              {summary.aov_growth > 0 ? '+' : ''}{summary.aov_growth}% vs previous period
            </div>
          </div>

          {/* Items Sold */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Items Sold</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.total_items === 'number' ? summary.total_items.toLocaleString() : '--'}</div>
            <div className="text-xs text-[#E0F7FA] mt-1">
              {summary.items_growth > 0 ? '+' : ''}{summary.items_growth}% vs previous period
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesSummaryCard; 