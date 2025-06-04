import React from "react";
import type { CategorySummary } from "../services/api";

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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <>
      <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2 truncate">
        {title}
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)] truncate">
            Total Sales
          </span>
          <span className="text-xs font-medium text-[#00E5FF] truncate">
            {formatCurrency(summary.total_sales)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)] truncate">
            Orders
          </span>
          <span className="text-xs font-medium text-[#00E5FF] truncate">
            {formatNumber(summary.total_orders)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--color-text-secondary)] truncate">
            Avg. Order
          </span>
          <span className="text-xs font-medium text-[#00E5FF] truncate">
            {formatCurrency(summary.average_order_value)}
          </span>
        </div>
        {summary.total_items_sold !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              Items Sold
            </span>
            <span className="text-xs font-medium text-[#00E5FF] truncate">
              {formatNumber(summary.total_items_sold)}
            </span>
          </div>
        )}
        {summary.void_rate !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              Void Rate
            </span>
            <span className="text-xs font-medium text-[#00E5FF] truncate">
              {(summary.void_rate * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesSummaryCard;
