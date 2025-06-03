import React from 'react';
import type { CategorySummary } from '../services/api';

interface Props {
  summary: CategorySummary | undefined;
  title: string;
}

const SalesSummaryCard: React.FC<Props> = ({ summary, title }) => {
  if (!summary) {
    return (
      <div className="p-4 text-center text-[var(--color-text-secondary)]">
        No data available
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)]">Total Sales</span>
          <span className="text-sm font-medium text-[var(--color-primary)]">
            {formatCurrency(summary.total_sales)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)]">Orders</span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {formatNumber(summary.total_orders)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)]">Avg. Order</span>
          <span className="text-sm font-medium text-[var(--color-secondary)]">
            {formatCurrency(summary.average_order_value)}
          </span>
        </div>
        {summary.void_rate !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-text-secondary)]">Void Rate</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {(summary.void_rate * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesSummaryCard; 