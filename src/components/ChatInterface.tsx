import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Paperclip, BarChart3 } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useSessionStore } from "../store/sessionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useFileStore } from "../store/fileStore";
import MessageList from "./MessageList.tsx";
import FileCard from "./FileCard";
import { sessionApi } from "../api/sessions";

interface ChatInterfaceProps {
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
}

export default function ChatInterface({
  onToggleRightSidebar,
  isRightSidebarOpen,
}: ChatInterfaceProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    addMessage,
    clearMessages,
    setStreaming,
    updateStats,
    setCurrentContext,
    setCurrentSearchResults,
  } = useChatStore();

  const { loadSession, createSession, setCurrentSessionId } = useSessionStore();

  const { settings } = useSettingsStore();
  const { addFile } = useFileStore();

  const [sessionFiles, setSessionFiles] = useState<any[]>([]);

  // Load session on mount or when sessionId changes
  useEffect(() => {
    const initSession = async () => {
      if (sessionId === "new") {
        // Create new session
        try {
          const newSessionId = await createSession(
            settings.activeBackend,
            settings.activeModel,
            settings.modelConfig
          );
          navigate(`/chat/${newSessionId}`, { replace: true });
        } catch (error) {
          console.error("Failed to create session:", error);
        }
      } else if (sessionId) {
        // Load existing session
        try {
          await loadSession(sessionId);
          setCurrentSessionId(sessionId);
          // Load messages into chat store
          const session = await sessionApi.getSession(sessionId);
          clearMessages();
          session.messages.forEach((msg: any) => {
            addMessage({
              id: msg.message_id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              tokens: msg.tokens,
              latency: msg.latency,
              citations: msg.citations,
              retrievedContext: msg.retrieved_context,
            });
          });
          // Load session files
          setSessionFiles(session.files || []);
        } catch (error) {
          console.error("Failed to load session:", error);
        }
      }
    };

    initSession();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId || sessionId === "new") return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const userQuery = input.trim();
    setInput("");
    setIsLoading(true);
    setStreaming(true);

    try {
      const startTime = Date.now();

      // Use session API to send message (backend handles RAG and web search)
      setLoadingStatus("🤖 Generating response...");

      const response = await sessionApi.sendMessage(sessionId, {
        message: userQuery,
        tools_enabled: {
          web_search: settings.toolsConfig.webSearch,
          rag: settings.toolsConfig.rag && sessionFiles.length > 0,
        },
      });

      const latency = Date.now() - startTime;
      const assistantMessage = {
        id: response.assistant_message_id,
        role: "assistant" as const,
        content: response.content,
        timestamp: new Date(),
        tokens: response.tokens,
        latency,
        model: response.model,
        backend: response.backend,
        retrievedContext: response.retrieved_context || undefined,
        citations: response.citations || undefined,
      };

      addMessage(assistantMessage);

      // Update context and search results in store for display
      if (response.retrieved_context) {
        setCurrentContext(response.retrieved_context);
      }
      if (response.citations) {
        setCurrentSearchResults(
          response.citations.map((c: any) => ({
            title: c.title,
            url: c.url,
            snippet: c.text,
          }))
        );
      }

      if (response.tokens) {
        updateStats(response.tokens.total, latency);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
      setStreaming(false);
      setLoadingStatus("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      // Upload to session
      const result = await sessionApi.uploadFile(sessionId!, file);

      // Add to local file store for UI
      addFile({
        id: result.file_id || result.fileId,
        name: result.filename || result.name,
        type: file.type,
        size: result.size,
        uploadedAt: new Date(Date.now()),
        processed: result.embedded || result.processed,
        chunks: result.chunks,
      });

      // Refresh session to get updated files list
      const session = await sessionApi.getSession(sessionId!);
      setSessionFiles(session.files || []);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error instanceof Error ? error.message : "Failed to upload file");
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="glass-panel m-4 mb-0 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-gray-400">
            {settings.activeModel || "Select a model to start"}
          </p>
        </div>
        <button
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isRightSidebarOpen
              ? "bg-primary/20 text-primary"
              : "hover:bg-glass-hover"
          }`}
          aria-label="Toggle stats sidebar"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Session Files Display */}
      {sessionFiles.length > 0 && (
        <div className="px-8 pb-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">
              Knowledge Base ({sessionFiles.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {sessionFiles.map((file) => (
                <FileCard
                  key={file.file_id}
                  filename={file.filename}
                  size={file.size}
                  type={file.type}
                  chunks={file.chunks}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Status Indicator */}
      {loadingStatus && (
        <div className="px-8 pb-2">
          <div className="glass-panel px-4 py-2 inline-flex items-center gap-2 text-sm text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {loadingStatus}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="glass-panel m-4 mt-0 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-glass-hover rounded-lg transition-colors self-end mb-1"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="glass-input w-full resize-none min-h-[44px] max-h-[200px] scrollbar-thin"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all self-end mb-1 ${
              input.trim() && !isLoading
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-glass-bg text-gray-500 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
