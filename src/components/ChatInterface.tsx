import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Paperclip, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    const initSession = async () => {
      if (sessionId === "new") {
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
        try {
          await loadSession(sessionId);
          setCurrentSessionId(sessionId);
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
      setLoadingStatus("Generating response...");

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

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      const result = await sessionApi.uploadFile(sessionId!, file);

      addFile({
        id: result.file_id || result.fileId,
        name: result.filename || result.name,
        type: file.type,
        size: result.size,
        uploadedAt: new Date(Date.now()),
        processed: result.embedded || result.processed,
        chunks: result.chunks,
      });

      const session = await sessionApi.getSession(sessionId!);
      setSessionFiles(session.files || []);

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
      {/* Header - Liquid Glass */}
      <header className="liquid-glass m-4 mb-0 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Chat</h1>
          <p className="text-sm text-gray-500">
            {settings.activeModel || "Select a model to start"}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleRightSidebar}
          className={`liquid-button-icon ${
            isRightSidebarOpen
              ? "bg-primary/15 border-primary/25"
              : ""
          }`}
          aria-label="Toggle stats sidebar"
        >
          <BarChart3 className="w-5 h-5 text-primary" />
        </motion.button>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Session Files Display */}
      {sessionFiles.length > 0 && (
        <div className="px-8 pb-4">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-liquid-bg-secondary backdrop-blur-lg border border-liquid-border text-sm text-gray-300">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {loadingStatus}
          </div>
        </div>
      )}

      {/* Input Area - Liquid Glass */}
      <div className="liquid-glass m-4 mt-0 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png"
            className="hidden"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="liquid-button-icon self-end mb-0.5"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </motion.button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="liquid-input w-full resize-none min-h-[44px] max-h-[200px] scrollbar-thin py-3"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || isLoading}
            className={`rounded-xl p-2.5 self-end mb-0.5 transition-all ${
              input.trim() && !isLoading
                ? "liquid-button-primary"
                : "bg-liquid-bg-tertiary text-gray-500 cursor-not-allowed border border-liquid-border"
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
