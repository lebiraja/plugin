import { useBackendStatus } from "../../hooks/useBackendStatus";

export function BackendStatusBanner() {
  const { isOnline, backends } = useBackendStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-sm px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div>
            <p className="text-white font-medium text-sm">
              Backend Connection Lost
            </p>
            <p className="text-white/80 text-xs">
              {Object.values(backends).some(Boolean)
                ? "Reconnecting..."
                : "No LLM providers available. Start a local backend or add a provider in Settings."}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
