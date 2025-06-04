import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

console.log("API Base URL:", API_BASE_URL); // Debug log

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies in cross-origin requests
});

// Add request interceptor for debugging and CORS preflight
axiosInstance.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    console.log("Making request to:", config.url);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    // Handle CORS errors specifically
    if (error.message === "Network Error" && !error.response) {
      console.error(
        "CORS Error: Unable to reach the API. Please check if the API is running and CORS is properly configured.",
      );
      return Promise.reject(
        new Error(
          "Unable to reach the API. Please check your connection and try again.",
        ),
      );
    }

    if (error.response) {
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);

      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          return Promise.reject(
            new Error("Authentication required. Please log in again."),
          );
        case 403:
          return Promise.reject(
            new Error("You do not have permission to perform this action."),
          );
        case 404:
          return Promise.reject(
            new Error("The requested resource was not found."),
          );
        case 413:
          return Promise.reject(
            new Error("The file you are trying to upload is too large."),
          );
        case 429:
          return Promise.reject(
            new Error("Too many requests. Please try again later."),
          );
        case 500:
          return Promise.reject(
            new Error(
              "An internal server error occurred. Please try again later.",
            ),
          );
        default:
          return Promise.reject(
            new Error(
              error.response.data?.message ||
                "An error occurred while processing your request.",
            ),
          );
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
      return Promise.reject(
        new Error(
          "No response received from the server. Please check your connection and try again.",
        ),
      );
    } else {
      console.error("Error message:", error.message);
      return Promise.reject(error);
    }
  },
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
  total_sales: number;
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
  getSalesSummary: async (
    startDate: string,
    endDate: string,
  ): Promise<SalesSummary> => {
    const response = await axiosInstance.get("/sales/summary", {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // Get sales trends
  getSalesTrends: async (
    startDate: string,
    endDate: string,
    category: string = "ALL",
    granularity: string = "week",
  ): Promise<SalesTrends> => {
    const response = await axiosInstance.get("/sales/trends", {
      params: {
        start_date: startDate,
        end_date: endDate,
        category,
        granularity,
      },
    });
    return response.data;
  },

  // Get sales heatmap data
  getSalesHeatmap: async (
    startDate: string,
    endDate: string,
    category: string = "ALL",
  ): Promise<HeatmapData[]> => {
    const response = await axiosInstance.get("/sales/heatmap", {
      params: { start_date: startDate, end_date: endDate, category },
    });
    console.log("Raw heatmap response:", response.data);
    return response.data.data || [];
  },

  // Get item analytics
  getItemAnalytics: async (
    startDate: string,
    endDate: string,
    limit: number = 5,
  ): Promise<ItemAnalytics[]> => {
    const response = await axiosInstance.get("/sales/items", {
      params: { start_date: startDate, end_date: endDate, limit },
    });
    // Flatten top/bottom items for food and alcohol
    const items: ItemAnalytics[] = [];
    const { food, alcohol } = response.data;
    if (food) {
      (food.top_items || []).forEach((item: any) =>
        items.push({ ...item, category: "Food", rank_type: "Top" }),
      );
      (food.bottom_items || []).forEach((item: any) =>
        items.push({ ...item, category: "Food", rank_type: "Bottom" }),
      );
    }
    if (alcohol) {
      (alcohol.top_items || []).forEach((item: any) =>
        items.push({ ...item, category: "Alcohol", rank_type: "Top" }),
      );
      (alcohol.bottom_items || []).forEach((item: any) =>
        items.push({ ...item, category: "Alcohol", rank_type: "Bottom" }),
      );
    }
    return items;
  },

  // Upload CSV file
  uploadCSV: async (
    file: File,
    similarityThreshold: number = 0.8,
  ): Promise<any> => {
    if (!import.meta.env.VITE_ENABLE_CSV_UPLOAD) {
      throw new Error("CSV upload is disabled");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("similarity_threshold", similarityThreshold.toString());

    const response = await axiosInstance.post("/upload-csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default api;
