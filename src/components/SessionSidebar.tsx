import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  ChevronDown,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/settingsStore";
import { getModels } from "../api/models";

interface SessionSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({ isOpen }) => {
  const {
    sessions,
    currentSessionId,
    fetchSessions,
    deleteSession,
    renameSession,
    isLoadingSessions,
  } = useSessionStore();

  const { settings, setActiveBackend, setActiveModel, updateToolsConfig } =
    useSettingsStore();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isBackendDropdownOpen, setIsBackendDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const backendDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const activeBackend = settings.backends.find(
    (b) => b.id === settings.activeBackend
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch models when backend changes
  const fetchModels = useCallback(async () => {
    if (!settings.activeBackend) return;

    setIsLoadingModels(true);
    try {
      const models = await getModels(settings.activeBackend);
      setAvailableModels(models);

      // Auto-select first model if none is selected
      if (models.length > 0 && !settings.activeModel) {
        setActiveModel(models[0]);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.activeBackend, settings.activeModel, setActiveModel]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        backendDropdownRef.current &&
        !backendDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBackendDropdownOpen(false);
      }
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBackendChange = (backendId: string) => {
    setActiveBackend(backendId);
    setIsBackendDropdownOpen(false);
    setActiveModel(""); // Reset model selection when backend changes
  };

  const handleModelChange = (model: string) => {
    setActiveModel(model);
    setIsModelDropdownOpen(false);
  };

  const handleRefreshModels = async () => {
    await fetchModels();
  };

  const handleNewChat = async () => {
    // Just navigate to /chat/new, let ChatInterface handle session creation
    navigate("/chat/new");
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (window.confirm("Delete this conversation?")) {
      try {
        await deleteSession(sessionId);
        if (currentSessionId === sessionId) {
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
  };

  const startRename = (
    sessionId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleRename = async (sessionId: string) => {
    if (editTitle.trim()) {
      try {
        await renameSession(sessionId, editTitle.trim());
        setEditingId(null);
      } catch (error) {
        console.error("Failed to rename session:", error);
      }
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const groupedSessions = () => {
    const now = new Date();
    const today: typeof sessions = [];
    const yesterday: typeof sessions = [];
    const thisWeek: typeof sessions = [];
    const older: typeof sessions = [];

    sessions.forEach((session) => {
      const date = new Date(session.updated_at);
      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) today.push(session);
      else if (diffDays === 1) yesterday.push(session);
      else if (diffDays < 7) thisWeek.push(session);
      else older.push(session);
    });

    return { today, yesterday, thisWeek, older };
  };

  const { today, yesterday, thisWeek, older } = groupedSessions();

  const renderSessionGroup = (title: string, sessions: typeof today) => {
    if (sessions.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
          {title}
        </h3>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              onClick={() => navigate(`/chat/${session.session_id}`)}
              className={`group px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                currentSessionId === session.session_id
                  ? "bg-primary text-white"
                  : "hover:bg-glass-hover text-gray-300"
              }`}
            >
              {editingId === session.session_id ? (
                <div
                  className="flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(session.session_id);
                      if (e.key === "Escape") cancelRename();
                    }}
                    className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(session.session_id)}
                    className="p-1 hover:bg-green-600 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelRename}
                    className="p-1 hover:bg-red-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <h4 className="font-medium text-sm truncate">
                          {session.title}
                        </h4>
                      </div>
                      {session.last_message_preview && (
                        <p className="text-xs opacity-70 truncate mt-1">
                          {session.last_message_preview}
                        </p>
                      )}
                      <p className="text-xs opacity-50 mt-1">
                        {formatDate(session.updated_at)} •{" "}
                        {session.message_count} msgs
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) =>
                          startRename(session.session_id, session.title, e)
                        }
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) =>
                          handleDeleteSession(session.session_id, e)
                        }
                        className="p-1 hover:bg-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-glass-bg backdrop-blur-sm border-r border-glass-border h-full flex flex-col">
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-glass-border">
        <button
          onClick={handleNewChat}
          className="w-full py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Backend Selector */}
      <div className="px-4 pt-4 pb-2 border-b border-glass-border space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase font-semibold">
            Backend
          </label>
          <div className="relative" ref={backendDropdownRef}>
            <button
              onClick={() => setIsBackendDropdownOpen(!isBackendDropdownOpen)}
              className="w-full glass-input text-sm flex items-center justify-between px-3 py-2 rounded-lg bg-glass-bg hover:bg-glass-hover transition-colors"
            >
              <span className="truncate">
                {activeBackend?.name || "No backend selected"}
              </span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform ${
                  isBackendDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isBackendDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-2 z-10 space-y-1 rounded-lg shadow-lg">
                {settings.backends.map((backend) => (
                  <button
                    key={backend.id}
                    onClick={() => handleBackendChange(backend.id)}
                    className={`w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-glass-hover transition-colors ${
                      backend.id === settings.activeBackend
                        ? "bg-primary/20 text-primary"
                        : ""
                    }`}
                  >
                    {backend.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 uppercase font-semibold">
              Model
            </label>
            <button
              onClick={handleRefreshModels}
              disabled={isLoadingModels}
              className="p-1 hover:bg-glass-hover rounded transition-colors disabled:opacity-50"
              title="Refresh models"
            >
              <RefreshCw
                className={`w-3 h-3 ${isLoadingModels ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isLoadingModels || availableModels.length === 0}
              className="w-full glass-input text-sm flex items-center justify-between px-3 py-2 rounded-lg bg-glass-bg hover:bg-glass-hover transition-colors disabled:opacity-50"
            >
              <span className="truncate">
                {isLoadingModels
                  ? "Loading models..."
                  : settings.activeModel ||
                    (availableModels.length === 0
                      ? "No models available"
                      : "Select a model")}
              </span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform ${
                  isModelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isModelDropdownOpen && availableModels.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-2 z-10 space-y-1 max-h-64 overflow-y-auto scrollbar-thin rounded-lg shadow-lg">
                {availableModels.map((model) => (
                  <button
                    key={model}
                    onClick={() => handleModelChange(model)}
                    className={`w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-glass-hover transition-colors ${
                      model === settings.activeModel
                        ? "bg-primary/20 text-primary"
                        : ""
                    }`}
                  >
                    <div className="truncate">{model}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tools Toggles */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 uppercase font-semibold">
            Tools
          </label>
          <div className="space-y-1.5">
            {Object.entries(settings.toolsConfig).map(([key, enabled]) => (
              <button
                key={key}
                onClick={() => updateToolsConfig({ [key]: !enabled })}
                className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                  enabled
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-glass-bg text-gray-400 hover:bg-glass-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      enabled ? "bg-primary" : "bg-gray-600"
                    }`}
                  />
                  <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                </div>
                <div
                  className={`text-xs font-medium ${
                    enabled ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {enabled ? "ON" : "OFF"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Click "New Chat" to start</p>
          </div>
        ) : (
          <>
            {renderSessionGroup("Today", today)}
            {renderSessionGroup("Yesterday", yesterday)}
            {renderSessionGroup("This Week", thisWeek)}
            {renderSessionGroup("Older", older)}
          </>
        )}
      </div>
    </div>
  );
};
