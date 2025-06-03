import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL_PROD 
  : import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

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
  period: string;
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
    const response = await axiosInstance.get('/sales/summary', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  // Get sales trends
  getSalesTrends: async (startDate: string, endDate: string, category: string = 'ALL', granularity: string = 'week'): Promise<SalesTrends> => {
    const response = await axiosInstance.get('/sales/trends', {
      params: { start_date: startDate, end_date: endDate, category, granularity }
    });
    return response.data;
  },

  // Get sales heatmap data
  getSalesHeatmap: async (startDate: string, endDate: string, category: string = 'ALL'): Promise<HeatmapData[]> => {
    const response = await axiosInstance.get('/sales/heatmap', {
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
    const response = await axiosInstance.get('/sales/items', {
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
    if (!import.meta.env.VITE_ENABLE_CSV_UPLOAD) {
      throw new Error('CSV upload is disabled');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('similarity_threshold', similarityThreshold.toString());
    
    const response = await axiosInstance.post('/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api; 