import React, { useState, useEffect } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import type { SalesSummary, SalesTrends, HeatmapData, ItemAnalytics } from '../services/api';
import api from '../services/api';
import SalesSummaryCard from './SalesSummaryCard';
import SalesTrendsChart from './SalesTrendsChart';
import SalesHeatmap from './SalesHeatmap';
import DateRangePicker from './DateRangePicker';
import CSVUpload from './CSVUpload';
import DonutChart from './DonutChart';
import DashboardCard from './common/DashboardCard';
import '../styles/theme.css';

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
      setLoading(true);
      setError(null);
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
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-dark)] to-[var(--color-bg-light)] text-[var(--color-text-primary)]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Zero Analytics Dashboard</h1>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        <div className="grid-container">
          {/* Sales Summary Cards */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardCard className="glass-card">
              <SalesSummaryCard summary={salesSummary?.total} title="Total Sales" />
            </DashboardCard>
            <DashboardCard className="glass-card">
              <SalesSummaryCard summary={salesSummary?.food} title="Food Sales" />
            </DashboardCard>
            <DashboardCard className="glass-card">
              <SalesSummaryCard summary={salesSummary?.alcohol} title="Alcohol Sales" />
            </DashboardCard>
          </div>

          {/* Sales Trends */}
          <div className="col-span-12 md:col-span-8">
            <DashboardCard className="glass-card">
              <div className="section-header">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Sales Trends
              </div>
              <SalesTrendsChart
                data={salesTrends}
                granularity={granularity}
                loading={loading}
              />
            </DashboardCard>
          </div>

          {/* Sales Heatmap */}
          <div className="col-span-12 md:col-span-4">
            <DashboardCard className="glass-card">
              <div className="section-header">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Sales Heatmap
              </div>
              <SalesHeatmap data={heatmapData} loading={loading} />
            </DashboardCard>
          </div>

          {/* Item Analytics */}
          <div className="col-span-12">
            <DashboardCard className="glass-card">
              <div className="section-header">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Top Items
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {itemAnalytics.map((item, index) => (
                  <div key={index} className="glass-card p-4">
                    <h3 className="text-sm font-semibold mb-2">{item.item_name}</h3>
                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                      <span>Quantity: {item.total_quantity}</span>
                      <span>Sales: ${item.total_sales.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;