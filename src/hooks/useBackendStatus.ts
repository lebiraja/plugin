import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

interface BackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  /** Dynamic per-provider availability map (keys are provider ids). */
  backends: Record<string, boolean>;
}

export function useBackendStatus(checkInterval = 10000) {
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: true,
    isChecking: false,
    lastChecked: null,
    backends: {},
  });

  useEffect(() => {
    const checkStatus = async () => {
      setStatus((prev) => ({ ...prev, isChecking: true }));

      try {
        const response = await apiClient.get("/health", {
          timeout: 5000,
          // Disable retries for health checks (custom field read by the client
          // interceptor); cast through unknown to satisfy the axios config type.
          _retry: 0,
        } as unknown as Parameters<typeof apiClient.get>[1]);

        const data = response.data;

        setStatus({
          isOnline: true,
          isChecking: false,
          lastChecked: new Date(),
          backends: data.backends || {},
        });
      } catch (error) {
        setStatus({
          isOnline: false,
          isChecking: false,
          lastChecked: new Date(),
          backends: {},
        });
      }
    };

    // Check immediately on mount
    checkStatus();

    // Then check periodically
    const interval = setInterval(checkStatus, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return status;
}
