import React from 'react';
import type { ItemAnalytics } from '../services/api';

interface Props {
  data: ItemAnalytics[];
}

const ItemAnalyticsTable: React.FC<Props> = ({ data }) => {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-white">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-3 text-left">Item</th>
            <th className="px-4 py-3 text-right">Quantity</th>
            <th className="px-4 py-3 text-right">Sales</th>
            <th className="px-4 py-3 text-right">Orders</th>
            <th className="px-4 py-3 text-right">Avg Order</th>
            <th className="px-4 py-3 text-center">Category</th>
            <th className="px-4 py-3 text-center">Type</th>
          </tr>
        </thead>
        <tbody>
          {safeData.map((item, idx) => (
            <tr key={item.item_name + idx} className="border-b border-gray-800 hover:bg-gray-700/50">
              <td className="px-4 py-3">{item.item_name}</td>
              <td className="px-4 py-3 text-right">{item.total_quantity}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(item.total_sales)}</td>
              <td className="px-4 py-3 text-right">{item.order_count}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(item.avg_order_value)}</td>
              <td className="px-4 py-3 text-center">{item.category}</td>
              <td className="px-4 py-3 text-center">{item.rank_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemAnalyticsTable; 