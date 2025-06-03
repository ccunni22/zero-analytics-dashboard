const SalesSummaryCard: React.FC<Props> = ({ summary, interactive = false, compact = false }) => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* KPI Grid Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto">
          {/* Total Sales */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.total === 'number' ? summary.total.toLocaleString() : '--'}</div>
          </div>
          {/* Total Orders */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 flex flex-col">
            <div className="text-sm text-[#E0F7FA] mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-[#00E5FF]">{typeof summary.orders === 'number' ? summary.orders.toLocaleString() : '--'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 