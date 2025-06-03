import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CategorySummary {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  gross_sales?: number;
  total_items_sold?: number;
  void_rate?: number;
}

export interface SalesSummary {
  total: CategorySummary;
  food?: CategorySummary;
  alcohol?: CategorySummary;
}

export interface TrendPoint {
  week_start: string;
  total_sales: number;
}

export interface SalesTrends {
  this_period: TrendPoint[];
  prev_period: TrendPoint[];
}

export interface HeatmapData {
  date: string;
  day_of_week: number;
  hour_of_day: number;
  total_quantity: number;
}

export interface ItemAnalytics {
  item_name: string;
  total_quantity: number;
  total_sales: number;
  order_count: number;
  avg_order_value: number;
  category: string;
  rank_type: string;
}

const api = {
  // Get sales summary for a date range
  getSalesSummary: async (startDate: string, endDate: string): Promise<SalesSummary> => {
    const response = await axios.get(`${API_BASE_URL}/sales/summary`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Get sales trends
  getSalesTrends: async (startDate: string, endDate: string, category: string = 'ALL', granularity: string = 'week'): Promise<SalesTrends> => {
    const response = await axios.get(`${API_BASE_URL}/sales/trends`, {
      params: { start_date: startDate, end_date: endDate, category, granularity }
    });
    return response.data;
  },

  // Get sales heatmap data
  getSalesHeatmap: async (startDate: string, endDate: string, category: string = 'ALL'): Promise<HeatmapData[]> => {
    const response = await axios.get(`${API_BASE_URL}/sales/heatmap`, {
      params: { start_date: startDate, end_date: endDate, category }
    });
    // Transform backend data: { data: [{ date, hours: [...] }, ...] }
    const raw = response.data.data || [];
    const result: any[] = [];
    raw.forEach((row: { date: string; hours: number[] }) => {
      const dateObj = new Date(row.date);
      const day_of_week = dateObj.getDay();
      row.hours.forEach((qty, hour_of_day) => {
        result.push({ date: row.date, day_of_week, hour_of_day, total_quantity: qty });
      });
    });
    return result;
  },

  // Get item analytics
  getItemAnalytics: async (startDate: string, endDate: string, limit: number = 5): Promise<ItemAnalytics[]> => {
    const response = await axios.get(`${API_BASE_URL}/sales/items`, {
      params: { start_date: startDate, end_date: endDate, limit }
    });
    // Flatten top/bottom items for food and alcohol
    const items: ItemAnalytics[] = [];
    const { food, alcohol } = response.data;
    if (food) {
      (food.top_items || []).forEach((item: any) => items.push({ ...item, category: 'Food', rank_type: 'Top' }));
      (food.bottom_items || []).forEach((item: any) => items.push({ ...item, category: 'Food', rank_type: 'Bottom' }));
    }
    if (alcohol) {
      (alcohol.top_items || []).forEach((item: any) => items.push({ ...item, category: 'Alcohol', rank_type: 'Top' }));
      (alcohol.bottom_items || []).forEach((item: any) => items.push({ ...item, category: 'Alcohol', rank_type: 'Bottom' }));
    }
    return items;
  },

  // Upload CSV file
  uploadCSV: async (file: File, similarityThreshold: number = 0.8): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('similarity_threshold', similarityThreshold.toString());
    
    const response = await axios.post(`${API_BASE_URL}/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api; 