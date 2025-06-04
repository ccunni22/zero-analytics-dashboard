import React, { useState, useEffect } from "react";
import {
  format,
  subDays,
  parseISO,
  differenceInDays,
  eachDayOfInterval,
} from "date-fns";
import type {
  SalesSummary,
  SalesTrends,
  HeatmapData,
  ItemAnalytics,
} from "../services/api";
import api from "../services/api";
import SalesSummaryCard from "./SalesSummaryCard";
import SalesTrendsChart from "./SalesTrendsChart";
import SalesHeatmap from "./SalesHeatmap";
import DateRangePicker from "./DateRangePicker";
import CSVUpload from "./CSVUpload";
import DonutChart from "./DonutChart";
import DashboardCard from "./common/DashboardCard";
import "../styles/theme.css";
import {
  PieChart as StaticPieChart,
  Pie as StaticPie,
  Cell as StaticCell,
  ResponsiveContainer as StaticResponsiveContainer,
} from "recharts";

// Placeholder data for development
const placeholderSummary: SalesSummary = {
  total: {
    total_sales: 13766.01,
    total_orders: 381,
    average_order_value: 36.12,
    total_items_sold: 961,
    void_rate: 0.02,
  },
  food: {
    total_sales: 9876.54,
    total_orders: 245,
    average_order_value: 40.31,
    total_items_sold: 612,
    void_rate: 0.01,
  },
  alcohol: {
    total_sales: 3889.47,
    total_orders: 136,
    average_order_value: 28.6,
    total_items_sold: 349,
    void_rate: 0.03,
  },
};

const placeholderTrends: SalesTrends = {
  this_period: Array.from({ length: 7 }, (_, i) => ({
    period: format(subDays(new Date(), 6 - i), "MMM dd"),
    total_sales: Math.random() * 2000 + 1000,
  })),
  prev_period: Array.from({ length: 7 }, (_, i) => ({
    period: format(subDays(new Date(), 13 - i), "MMM dd"),
    total_sales: Math.random() * 2000 + 1000,
  })),
};

const placeholderHeatmap: HeatmapData[] = Array.from(
  { length: 24 * 7 },
  (_, i) => ({
    date: format(subDays(new Date(), Math.floor(i / 24)), "yyyy-MM-dd"),
    day_of_week: Math.floor(i / 24),
    hour_of_day: i % 24,
    total_sales: Math.floor(Math.random() * 1000),
  }),
);

const placeholderItems: ItemAnalytics[] = [
  {
    item_name: "Burger",
    total_quantity: 156,
    total_sales: 2340.0,
    order_count: 78,
    avg_order_value: 30.0,
    category: "Food",
    rank_type: "Top",
  },
  {
    item_name: "Fries",
    total_quantity: 234,
    total_sales: 1170.0,
    order_count: 117,
    avg_order_value: 10.0,
    category: "Food",
    rank_type: "Top",
  },
  {
    item_name: "Beer",
    total_quantity: 189,
    total_sales: 945.0,
    order_count: 63,
    avg_order_value: 15.0,
    category: "Alcohol",
    rank_type: "Top",
  },
];

const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    format(new Date("2024-05-28"), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date("2025-05-28"), "yyyy-MM-dd"),
  );
  const [category, setCategory] = useState<string>("ALL");
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrends>({
    this_period: [],
    prev_period: [],
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [itemAnalytics, setItemAnalytics] = useState<ItemAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [granularity, setGranularity] = useState<
    "day" | "week" | "biweek" | "month" | "quarter"
  >("day");
  const [isCompact, setIsCompact] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
      let newGranularity: "day" | "week" | "biweek" | "month" | "quarter";
      if (days <= 7) newGranularity = "day";
      else if (days <= 30) newGranularity = "week";
      else if (days <= 90) newGranularity = "week";
      else if (days <= 183) newGranularity = "biweek";
      else if (days <= 366) newGranularity = "month";
      else newGranularity = "quarter";
      setGranularity(newGranularity);

      const [summary, trends, heatmap, items] = await Promise.all([
        api.getSalesSummary(startDate, endDate),
        api.getSalesTrends(startDate, endDate, category, newGranularity),
        api.getSalesHeatmap(startDate, endDate, category),
        api.getItemAnalytics(startDate, endDate),
      ]);
      console.log("API summary:", summary);
      console.log("API trends:", trends);
      console.log("API heatmap:", heatmap);
      console.log("API items:", items);

      setSalesSummary(summary);
      setSalesTrends(trends);
      setHeatmapData(heatmap);
      setItemAnalytics(items);
    } catch (err) {
      setError("Failed to fetch dashboard data. Using placeholder data.");
      console.error("Dashboard data fetch error:", err);
      setSalesSummary(placeholderSummary);
      setSalesTrends(placeholderTrends);
      setHeatmapData(placeholderHeatmap);
      setItemAnalytics(placeholderItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, category]);

  // Generate array of date strings for the selected range
  const dateList = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((date) => format(date, "yyyy-MM-dd"));

  return (
    <>
      <div className="dashboard-border">
        <div className="dashboard-content">
          <div className="dashboard-toolbar flex justify-between items-center mb-8 w-full">
            <h1 className="text-3xl font-bold text-[#E0F7FA] tracking-tight" style={{ textShadow: '0 0 20px rgba(0, 229, 255, 0.4)', letterSpacing: '0.08em' }}>
              ZERO DASHBOARD
            </h1>
            <div className="flex items-center gap-6">
              <CSVUpload compact />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#E0F7FA]">Date Range:</span>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>
            </div>
          </div>

          {/* GRID LAYOUT START */}
          <div className="grid grid-cols-12 gap-4">
            {/* Top Row: KPIs (1/3) + Sales Trends (2/3) */}
            <div className="dashboard-top-row col-span-12">
              <DashboardCard
                className="glass-card sales-summary"
                style={{ flex: 1 }}
                cardId="summary"
              >
                <div className="kpi-card kpi-full">
                  <SalesSummaryCard
                    summary={salesSummary?.total}
                    title="Total Sales"
                  />
                </div>
                <div className="kpi-row">
                  <div className="kpi-card">
                    <SalesSummaryCard
                      summary={salesSummary?.food}
                      title="Food Sales"
                    />
                  </div>
                  <div className="kpi-card">
                    <SalesSummaryCard
                      summary={salesSummary?.alcohol}
                      title="Alcohol Sales"
                    />
                  </div>
                </div>
              </DashboardCard>
              <DashboardCard
                className="glass-card sales-trends"
                style={{ flex: 2 }}
                cardId="trends"
              >
                <div className="section-header mb-2" style={{ marginTop: 8 }}>
                  Sales Trends
                </div>
                <SalesTrendsChart
                  data={salesTrends}
                  granularity={granularity}
                  loading={loading}
                />
              </DashboardCard>
            </div>

            {/* Middle Row: Full-width Heatmap */}
            <div className="col-span-12">
              <DashboardCard
                className="glass-card heatmap-card flex flex-col justify-between"
                style={{ height: 350 }}
                cardId="heatmap"
              >
                <div className="section-header mb-2" style={{ marginTop: 8 }}>
                  Sales Heatmap
                </div>
                <SalesHeatmap
                  data={heatmapData}
                  loading={loading}
                  days={dateList}
                />
              </DashboardCard>
            </div>

            {/* Bottom Row: 4 Donut Charts */}
            {(() => {
              // Split itemAnalytics into top/bottom food/alcohol
              const topFood = itemAnalytics
                .filter((i) => i.category === "Food" && i.rank_type === "Top")
                .slice(0, 5);
              const topAlcohol = itemAnalytics
                .filter(
                  (i) => i.category === "Alcohol" && i.rank_type === "Top",
                )
                .slice(0, 5);
              const bottomFood = itemAnalytics
                .filter(
                  (i) => i.category === "Food" && i.rank_type === "Bottom",
                )
                .slice(0, 5);
              const bottomAlcohol = itemAnalytics
                .filter(
                  (i) => i.category === "Alcohol" && i.rank_type === "Bottom",
                )
                .slice(0, 5);
              const toDonutData = (arr: typeof topFood) =>
                arr.map((i) => ({ name: i.item_name, value: i.total_sales }));
              const topItemColors = [
                "#00E5FF", // neon cyan
                "#1DE9B6", // aqua green
                "#2979FF", // electric blue
                "#7C4DFF", // neon purple
                "#00B8D4", // teal
              ];
              const bottomItemColors = [
                "#FF1744", // neon red
                "#FF5252", // coral red
                "#F50057", // magenta
                "#FF4081", // hot pink
                "#FF6E40", // orange-red
              ];
              return (
                <>
                  <div className="col-span-12 md:col-span-3">
                    <DashboardCard
                      className="glass-card h-full flex flex-col justify-between"
                      style={{ minHeight: 350, padding: 24 }}
                      cardId="donut-top-food"
                    >
                      <div className="section-header mb-2">
                        Top 5 Food Items
                      </div>
                      <DonutChart
                        data={toDonutData(topFood)}
                        title="Top 5 Food Items"
                        interactive
                        colors={topItemColors}
                      />
                    </DashboardCard>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <DashboardCard
                      className="glass-card h-full flex flex-col justify-between"
                      style={{ minHeight: 350, padding: 24 }}
                      cardId="donut-bottom-food"
                    >
                      <div className="section-header mb-2">
                        Bottom 5 Food Items
                      </div>
                      <DonutChart
                        data={toDonutData(bottomFood)}
                        title="Bottom 5 Food Items"
                        interactive
                        colors={bottomItemColors}
                      />
                    </DashboardCard>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <DashboardCard
                      className="glass-card h-full flex flex-col justify-between"
                      style={{ minHeight: 350, padding: 24 }}
                      cardId="donut-top-alcohol"
                    >
                      <div className="section-header mb-2">
                        Top 5 Alcohol Items
                      </div>
                      <DonutChart
                        data={toDonutData(topAlcohol)}
                        title="Top 5 Alcohol Items"
                        interactive
                        colors={topItemColors}
                      />
                    </DashboardCard>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <DashboardCard
                      className="glass-card h-full flex flex-col justify-between"
                      style={{ minHeight: 350, padding: 24 }}
                      cardId="donut-bottom-alcohol"
                    >
                      <div className="section-header mb-2">
                        Bottom 5 Alcohol Items
                      </div>
                      <DonutChart
                        data={toDonutData(bottomAlcohol)}
                        title="Bottom 5 Alcohol Items"
                        interactive
                        colors={bottomItemColors}
                      />
                    </DashboardCard>
                  </div>
                </>
              );
            })()}
          </div>
          {/* GRID LAYOUT END */}

          {error && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
