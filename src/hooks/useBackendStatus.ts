import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

interface BackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  backends: {
    ollama: boolean;
    lmstudio: boolean;
  };
}

export function useBackendStatus(checkInterval = 10000) {
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: true,
    isChecking: false,
    lastChecked: null,
    backends: {
      ollama: false,
      lmstudio: false,
    },
  });

  useEffect(() => {
    const checkStatus = async () => {
      setStatus((prev) => ({ ...prev, isChecking: true }));

      try {
        const response = await apiClient.get("/health", {
          timeout: 5000,
          _retry: 0, // Disable retries for health checks
        } as any);

        const data = response.data;

        setStatus({
          isOnline: true,
          isChecking: false,
          lastChecked: new Date(),
          backends: data.backends || { ollama: false, lmstudio: false },
        });
      } catch (error) {
        setStatus({
          isOnline: false,
          isChecking: false,
          lastChecked: new Date(),
          backends: { ollama: false, lmstudio: false },
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
