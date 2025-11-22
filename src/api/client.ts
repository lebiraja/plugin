import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Create axios instance
export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: number;
    };

    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config._retry = config._retry || 0;

    // Determine if we should retry
    const shouldRetry =
      (!error.response || error.response.status >= 500) &&
      config._retry < MAX_RETRIES;

    if (shouldRetry) {
      config._retry += 1;

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config._retry - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `Retrying request (attempt ${config._retry}/${MAX_RETRIES})...`
      );
      return apiClient(config);
    }

    // Format error message
    const errorData = error.response?.data as
      | { detail?: string; error?: string }
      | undefined;
    const errorMessage =
      errorData?.detail ||
      errorData?.error ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
