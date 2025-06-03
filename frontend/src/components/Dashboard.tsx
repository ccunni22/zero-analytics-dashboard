import React, { useState, useEffect } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import type { SalesSummary, SalesTrends, HeatmapData, ItemAnalytics } from '../services/api';
import api from '../services/api';
import SalesSummaryCard from './SalesSummaryCard';
import SalesTrendsChart from './SalesTrendsChart';
import SalesHeatmap from './SalesHeatmap';
import ItemAnalyticsTable from './ItemAnalyticsTable';
import DateRangePicker from './DateRangePicker';
import CSVUpload from './CSVUpload';
import DonutChart from './DonutChart';
import DashboardCard from './common/DashboardCard';

const widgetList = [
  { key: 'summary', label: 'Summary' },
  { key: 'trends', label: 'Trends' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'items', label: 'Items' },
];

const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<string>('ALL');
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrends>({ this_period: [], prev_period: [] });
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [itemAnalytics, setItemAnalytics] = useState<ItemAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'biweek' | 'month' | 'quarter'>('day');
  const [isCompact, setIsCompact] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsTransitioning(true);
      setLoading(true);
      setError(null);
      // Determine granularity
      const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
      let newGranularity: 'day' | 'week' | 'biweek' | 'month' | 'quarter';
      if (days <= 7) newGranularity = 'day';
      else if (days <= 30) newGranularity = 'week';
      else if (days <= 183) newGranularity = 'biweek';
      else if (days <= 366) newGranularity = 'month';
      else newGranularity = 'quarter';
      setGranularity(newGranularity);
      const [summary, trends, heatmap, items] = await Promise.all([
        api.getSalesSummary(startDate, endDate),
        api.getSalesTrends(startDate, endDate, category, newGranularity),
        api.getSalesHeatmap(startDate, endDate, category),
        api.getItemAnalytics(startDate, endDate)
      ]);
      setSalesSummary(summary);
      setSalesTrends(trends);
      setHeatmapData(heatmap);
      setItemAnalytics(items);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, category]);

  useEffect(() => {
    console.log('Sales Trends Data:', salesTrends);
  }, [salesTrends]);

  // Dummy data for testing
  const dummyTrends = {
    this_period: [
      { period: '2025-05-03', total_sales: 1000 },
      { period: '2025-05-04', total_sales: 1200 },
      { period: '2025-05-05', total_sales: 900 },
      { period: '2025-05-06', total_sales: 1500 },
      { period: '2025-05-07', total_sales: 1100 }
    ],
    prev_period: [
      { period: '2025-05-03', total_sales: 800 },
      { period: '2025-05-04', total_sales: 950 },
      { period: '2025-05-05', total_sales: 1000 },
      { period: '2025-05-06', total_sales: 1200 },
      { period: '2025-05-07', total_sales: 1050 }
    ]
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Helper to get top/bottom 5 for each category
  const getDonutData = (category: string, rank: string) =>
    (itemAnalytics || [])
      .filter((item) => item.category === category && item.rank_type === rank)
      .slice(0, 5)
      .map((item) => ({ name: item.item_name, value: item.total_sales }));

  // Widget renderers
  const widgetRenderers: Record<string, React.ReactNode> = {
    summary: salesSummary ? <SalesSummaryCard summary={salesSummary} /> : <div className="text-center text-gray-400">No summary data</div>,
    trends: salesTrends && salesTrends.this_period && salesTrends.this_period.length > 0
      ? <SalesTrendsChart data={salesTrends} startDate={startDate} endDate={endDate} granularity={granularity} />
      : <div className="text-center text-gray-400">No trends data</div>,
    heatmap: heatmapData && heatmapData.length > 0 ? <SalesHeatmap data={heatmapData} /> : <div className="text-center text-gray-400">No heatmap data</div>,
    items: (
      <div className="w-full max-w-4xl mx-auto grid grid-cols-2 gap-6 border-4 border-pink-500">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <DonutChart
            data={getDonutData('Food', 'Top')}
            title="Top 5 Food Items"
          />
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <DonutChart
            data={getDonutData('Food', 'Bottom')}
            title="Bottom 5 Food Items"
          />
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <DonutChart
            data={getDonutData('Alcohol', 'Top')}
            title="Top 5 Alcohol Items"
          />
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <DonutChart
            data={getDonutData('Alcohol', 'Bottom')}
            title="Bottom 5 Alcohol Items"
          />
        </div>
      </div>
    ),
  };

  // Enhanced Modal component with animations
  const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl h-[80vh] bg-[#18182f] rounded-2xl shadow-2xl p-8 flex flex-col transform transition-all duration-300 scale-100 hover:scale-[1.02]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-white text-2xl hover:text-pink-400 transition-colors z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="flex-1 flex flex-col justify-center items-center">{children}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101024]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
          <p className="text-white text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101024]">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101827] px-8 py-4 flex flex-col">
      {/* Top bar: Title and Upload */}
      <div className="w-full mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold text-white tracking-wide uppercase text-left">Sales Analytics Dashboard</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold transition-all duration-200 border-none hover:from-cyan-400 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ minWidth: 140 }}
        >
          {showUpload ? 'Hide Upload' : 'Upload Data'}
        </button>
      </div>
      {/* Filters: Category Selector and Date Range Picker */}
      <div className="w-full mb-4 grid grid-cols-12 gap-x-6 items-center">
        <div className="col-span-3 flex flex-row gap-4 items-center">
          <label className="text-gray-300 font-medium uppercase text-left">Category:</label>
          <div className="relative w-full max-w-[160px]">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="appearance-none w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] text-[#E0E0E0] px-4 py-2 rounded-[8px] pr-8 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 outline-none transition-colors text-sm font-medium backdrop-blur-[10px]"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            >
              <option value="ALL">All</option>
              <option value="FOOD">Food</option>
              <option value="ALCOHOL">Alcohol</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
            </span>
          </div>
        </div>
        <div className="col-span-9">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
      {/* Main Grid */}
      <div className="w-full grid grid-cols-12 gap-4 mb-4 mt-2">
        {/* Top Row: Sales Summary (4) + Sales Trends (8) */}
        <div className="col-span-12 md:col-span-4 flex items-stretch h-[400px]">
          <DashboardCard title="SALES SUMMARY" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg>}>
            {salesSummary ? <SalesSummaryCard summary={salesSummary} /> : <div className="text-center text-gray-400">No summary data</div>}
          </DashboardCard>
        </div>
        <div className="col-span-12 md:col-span-8 flex items-stretch h-[400px]">
          <DashboardCard title="SALES TRENDS" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/></svg>}>
            {(salesTrends && salesTrends.this_period && salesTrends.this_period.length > 0)
              ? <SalesTrendsChart data={salesTrends} startDate={startDate} endDate={endDate} granularity={granularity} />
              : <SalesTrendsChart data={dummyTrends} startDate={startDate} endDate={endDate} granularity={granularity} />}
          </DashboardCard>
        </div>
        {/* Heatmap: Full width */}
        <div className="col-span-12 flex items-stretch h-[500px]">
          <DashboardCard title="SALES HEATMAP" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 8h8v8H8z"/></svg>}>
            {heatmapData && heatmapData.length > 0 ? <SalesHeatmap data={heatmapData} /> : <div className="text-center text-gray-400">No heatmap data</div>}
          </DashboardCard>
        </div>
        {/* Donut Charts: 4 in a row */}
        <div className="col-span-12 grid grid-cols-12 gap-4 gap-y-4 mb-4 mt-2">
          <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-stretch h-[300px] min-h-[300px]">
            <DashboardCard title="TOP 5 FOOD ITEMS" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}>
              <DonutChart 
                data={getDonutData('Food', 'Top')} 
                title="Top 5 Food Items" 
                interactive={true} 
                showTitle={false}
                compact={isCompact}
              />
            </DashboardCard>
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-stretch h-[300px] min-h-[300px]">
            <DashboardCard title="TOP 5 ALCOHOL ITEMS" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}>
              <DonutChart 
                data={getDonutData('Alcohol', 'Top')} 
                title="Top 5 Alcohol Items" 
                interactive={true} 
                showTitle={false}
                compact={isCompact}
              />
            </DashboardCard>
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-stretch h-[300px] min-h-[300px]">
            <DashboardCard title="BOTTOM 5 FOOD ITEMS" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}>
              <DonutChart 
                data={getDonutData('Food', 'Bottom')} 
                title="Bottom 5 Food Items" 
                interactive={true} 
                showTitle={false}
                compact={isCompact}
              />
            </DashboardCard>
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-stretch h-[300px] min-h-[300px]">
            <DashboardCard title="BOTTOM 5 ALCOHOL ITEMS" className="w-full" icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}>
              <DonutChart 
                data={getDonutData('Alcohol', 'Bottom')} 
                title="Bottom 5 Alcohol Items" 
                interactive={true} 
                showTitle={false}
                compact={isCompact}
              />
            </DashboardCard>
          </div>
        </div>
      </div>
      {/* CSV Upload Modal */}
      {showUpload && (
        <Modal onClose={() => setShowUpload(false)}>
          <CSVUpload />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;