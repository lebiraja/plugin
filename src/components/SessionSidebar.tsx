import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Cpu,
  Zap,
  PanelLeftClose,
  GripVertical,
} from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/settingsStore";
import { getModels } from "../api/models";

interface SessionSidebarProps {
  isOpen: boolean;
  width?: number;
  onToggle?: () => void;
  onResize?: (width: number) => void;
  onClose?: () => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  isOpen,
  width = 320,
  onToggle,
  onResize,
}) => {
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
  const [isResizing, setIsResizing] = useState(false);

  const backendDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeBackend = settings.backends.find(
    (b) => b.id === settings.activeBackend
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onResize) return;

      const newWidth = e.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onResize]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchModels = useCallback(async () => {
    if (!settings.activeBackend) return;

    setIsLoadingModels(true);
    try {
      const models = await getModels(settings.activeBackend);
      setAvailableModels(models);

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
    setActiveModel("");
  };

  const handleModelChange = (model: string) => {
    setActiveModel(model);
    setIsModelDropdownOpen(false);
  };

  const handleRefreshModels = async () => {
    await fetchModels();
  };

  const handleNewChat = async () => {
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h3 className="text-xs font-medium text-gray-500 uppercase px-3 mb-3 tracking-wider">
          {title}
        </h3>
        <div className="space-y-1.5">
          {sessions.map((session, index) => (
            <motion.div
              key={session.session_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => navigate(`/chat/${session.session_id}`)}
              className={`group relative px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                currentSessionId === session.session_id
                  ? "bg-primary/15 border border-primary/25 shadow-glow"
                  : "hover:bg-liquid-hover border border-transparent hover:border-liquid-border-strong"
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
                    className="flex-1 liquid-input text-sm py-2"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRename(session.session_id)}
                    className="p-1.5 hover:bg-apple-green/20 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4 text-apple-green" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelRename}
                    className="p-1.5 hover:bg-apple-red/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-apple-red" />
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 text-primary" />
                        <h4 className="font-medium text-sm truncate text-gray-100">
                          {session.title}
                        </h4>
                      </div>
                      {session.last_message_preview && (
                        <p className="text-xs text-gray-500 truncate mt-1.5 ml-6">
                          {session.last_message_preview}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-600 mt-2 ml-6">
                        <span>{formatDate(session.updated_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span>{session.message_count} msgs</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) =>
                          startRename(session.session_id, session.title, e)
                        }
                        className="p-1.5 hover:bg-liquid-hover rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) =>
                          handleDeleteSession(session.session_id, e)
                        }
                        className="p-1.5 hover:bg-apple-red/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-apple-red" />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      ref={sidebarRef}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{ width }}
      className="liquid-glass-subtle border-r border-liquid-border h-full flex flex-col shadow-liquid-lg relative"
    >
      {/* Collapse Button - Floating Glass */}
      {onToggle && (
        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="absolute top-4 -right-3 z-50 liquid-button-icon w-6 h-6 shadow-liquid"
          title="Close sidebar (Cmd+B)"
        >
          <PanelLeftClose className="w-3.5 h-3.5 text-primary" />
        </motion.button>
      )}

      {/* Resize Handle */}
      {onResize && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-primary/30 transition-colors ${
            isResizing ? "bg-primary/50" : ""
          }`}
        >
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-4 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-primary" />
          </div>
        </div>
      )}

      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-liquid-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className="w-full liquid-button-primary flex items-center justify-center space-x-2 group py-3"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">New Chat</span>
          <Sparkles className="w-4 h-4 opacity-70" />
        </motion.button>
      </div>

      {/* Backend & Model Selectors */}
      <div className="px-4 pt-4 pb-3 border-b border-liquid-border space-y-4">
        {/* Backend Selector */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase font-medium tracking-wider flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Backend</span>
          </label>
          <div className="relative" ref={backendDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsBackendDropdownOpen(!isBackendDropdownOpen)}
              className="w-full liquid-input text-sm flex items-center justify-between py-2.5"
            >
              <span className="truncate text-gray-200">
                {activeBackend?.name || "No backend selected"}
              </span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 text-primary ${
                  isBackendDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>
            <AnimatePresence>
              {isBackendDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 liquid-dropdown z-10 space-y-1"
                >
                  {settings.backends.map((backend) => (
                    <motion.button
                      key={backend.id}
                      whileHover={{ x: 4 }}
                      onClick={() => handleBackendChange(backend.id)}
                      className={`dropdown-item w-full text-left ${
                        backend.id === settings.activeBackend
                          ? "active"
                          : ""
                      }`}
                    >
                      {backend.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500 uppercase font-medium tracking-wider flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Model</span>
            </label>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={handleRefreshModels}
              disabled={isLoadingModels}
              className="p-1 hover:bg-liquid-hover rounded-lg transition-colors disabled:opacity-50"
              title="Refresh models"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-primary ${
                  isLoadingModels ? "animate-spin" : ""
                }`}
              />
            </motion.button>
          </div>
          <div className="relative" ref={modelDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isLoadingModels || availableModels.length === 0}
              className="w-full liquid-input text-sm flex items-center justify-between py-2.5 disabled:opacity-50"
            >
              <span className="truncate text-gray-200">
                {isLoadingModels
                  ? "Loading models..."
                  : settings.activeModel ||
                    (availableModels.length === 0
                      ? "No models available"
                      : "Select a model")}
              </span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 text-primary ${
                  isModelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>
            <AnimatePresence>
              {isModelDropdownOpen && availableModels.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 liquid-dropdown z-10 space-y-1 max-h-64 overflow-y-auto scrollbar-thin"
                >
                  {availableModels.map((model) => (
                    <motion.button
                      key={model}
                      whileHover={{ x: 4 }}
                      onClick={() => handleModelChange(model)}
                      className={`dropdown-item w-full text-left ${
                        model === settings.activeModel
                          ? "active"
                          : ""
                      }`}
                    >
                      <div className="truncate">{model}</div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tools Toggles */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase font-medium tracking-wider">
            Tools
          </label>
          <div className="space-y-1.5">
            {Object.entries(settings.toolsConfig).map(([key, enabled]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => updateToolsConfig({ [key]: !enabled })}
                className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all duration-300 ${
                  enabled
                    ? "bg-primary/15 border border-primary/25 text-primary shadow-glow"
                    : "bg-liquid-frosted border border-liquid-border text-gray-400 hover:bg-liquid-hover"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      enabled ? "bg-primary shadow-glow" : "bg-gray-600"
                    }`}
                  />
                  <span className="font-medium">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold ${
                    enabled ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {enabled ? "ON" : "OFF"}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-gray-400 mb-1">No conversations yet</p>
            <p className="text-xs text-gray-600">Click "New Chat" to start</p>
          </motion.div>
        ) : (
          <>
            {renderSessionGroup("Today", today)}
            {renderSessionGroup("Yesterday", yesterday)}
            {renderSessionGroup("This Week", thisWeek)}
            {renderSessionGroup("Older", older)}
          </>
        )}
      </div>
    </motion.div>
  );
};
