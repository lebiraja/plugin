import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Base URL for the API.
 *
 * - In the bundled app it resolves from the build-time `VITE_API_URL`
 *   (set to `/api` so the nginx reverse proxy forwards to the backend).
 * - As an npm package, consumers can override it at runtime via
 *   {@link configureApi} without rebuilding.
 */
export const DEFAULT_API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? "/api";

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Override the API base URL (for npm-package consumers). */
export function configureApi(options: { baseUrl: string }): void {
  apiClient.defaults.baseURL = options.baseUrl;
}

/** The base URL currently in effect (used by SSE helpers that bypass axios). */
export function getApiBaseUrl(): string {
  return (apiClient.defaults.baseURL as string) || DEFAULT_API_BASE_URL;
}

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
