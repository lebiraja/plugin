import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  ChevronDown,
  RefreshCw,
  PanelLeftClose,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../store/sessionStore";
import { useSettingsStore } from "../store/settingsStore";
import { getModels } from "../api/models";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SessionSidebarProps {
  isOpen: boolean;
  width?: number;
  onToggle?: () => void;
  onResize?: (width: number) => void;
  onClose?: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  webSearch: "Web Search",
  rag: "RAG",
  deepResearch: "Deep Research",
  fileUpload: "File Upload",
};

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
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeBackend = settings.backends.find(
    (b) => b.id === settings.activeBackend
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing || !onResize) return;
      const w = e.clientX;
      if (w >= 240 && w <= 600) onResize(w);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
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
      if (models.length > 0 && !settings.activeModel) setActiveModel(models[0]);
    } catch {
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.activeBackend, settings.activeModel, setActiveModel]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await deleteSession(sessionId);
    if (currentSessionId === sessionId) navigate("/");
  };

  const handleRename = async (sessionId: string) => {
    if (editTitle.trim()) {
      await renameSession(sessionId, editTitle.trim());
      setEditingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(hours / 24);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const grouped = () => {
    const now = Date.now();
    const groups: Record<string, typeof sessions> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: [],
    };
    sessions.forEach((s) => {
      const d = Math.floor((now - new Date(s.updated_at).getTime()) / 86_400_000);
      if (d === 0) groups["Today"].push(s);
      else if (d === 1) groups["Yesterday"].push(s);
      else if (d < 7) groups["This Week"].push(s);
      else groups["Older"].push(s);
    });
    return groups;
  };

  if (!isOpen) return null;

  return (
    <motion.aside
      ref={sidebarRef}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      style={{ width }}
      className="relative flex h-screen flex-col border-r border-border bg-background"
    >
      {onResize && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className={cn(
            "absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/30",
            isResizing && "bg-primary/50"
          )}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-xl">Sessions</span>
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="px-4 pb-3">
        <Button className="w-full" onClick={() => navigate("/chat/new")}>
          <Plus className="h-4 w-4" /> New Chat
        </Button>
      </div>

      {/* Backend / Model / Tools */}
      <div className="space-y-4 border-y border-border px-4 py-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Backend
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">{activeBackend?.name || "Select"}</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
              {settings.backends.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => {
                    setActiveBackend(b.id);
                    setActiveModel("");
                  }}
                >
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Model
            </Label>
            <button
              onClick={fetchModels}
              disabled={isLoadingModels}
              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              title="Refresh models"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoadingModels && "animate-spin")} />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={availableModels.length === 0}>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">
                  {isLoadingModels
                    ? "Loading…"
                    : settings.activeModel ||
                      (availableModels.length === 0 ? "No models" : "Select")}
                </span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
              {availableModels.map((m) => (
                <DropdownMenuItem key={m} onClick={() => setActiveModel(m)}>
                  <span className="truncate">{m}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Tools
          </Label>
          {Object.entries(settings.toolsConfig).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{TOOL_LABELS[key] ?? key}</span>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => updateToolsConfig({ [key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoadingSessions ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Click "New Chat" to start
              </p>
            </div>
          ) : (
            Object.entries(grouped()).map(([title, group]) =>
              group.length === 0 ? null : (
                <div key={title} className="mb-5">
                  <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {title}
                  </h3>
                  <div className="space-y-1">
                    <AnimatePresence initial={false}>
                      {group.map((session) => (
                        <motion.div
                          key={session.session_id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => navigate(`/chat/${session.session_id}`)}
                          className={cn(
                            "group cursor-pointer rounded-lg border px-3 py-2.5 transition-colors",
                            currentSessionId === session.session_id
                              ? "border-primary/40 bg-primary/10"
                              : "border-transparent hover:bg-accent"
                          )}
                        >
                          {editingId === session.session_id ? (
                            <div
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(session.session_id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="h-7 text-sm"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => handleRename(session.session_id)}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
                                  <h4 className="truncate text-sm font-medium">
                                    {session.title}
                                  </h4>
                                </div>
                                {session.last_message_preview && (
                                  <p className="mt-1 ml-[1.375rem] truncate text-xs text-muted-foreground">
                                    {session.last_message_preview}
                                  </p>
                                )}
                                <div className="mt-1.5 ml-[1.375rem] flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70">
                                  <span>{formatDate(session.updated_at)}</span>
                                  <span>·</span>
                                  <span>{session.message_count} msgs</span>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(session.session_id);
                                    setEditTitle(session.title);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => handleDelete(session.session_id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
};
