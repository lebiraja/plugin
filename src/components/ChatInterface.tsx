import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Paperclip, PanelRight, Loader2 } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useSessionStore } from "../store/sessionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useFileStore } from "../store/fileStore";
import MessageList from "./MessageList";
import FileCard from "./FileCard";
import { sessionApi, type SessionFile } from "../api/sessions";
import { streamSessionMessage } from "../api/stream";
import type { Message } from "../types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInterfaceProps {
  onToggleRightSidebar: () => void;
  isRightSidebarOpen: boolean;
}

export default function ChatInterface({
  onToggleRightSidebar,
}: ChatInterfaceProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [sessionFiles, setSessionFiles] = useState<SessionFile[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setStreaming, updateStats, setCurrentContext, setCurrentSearchResults } =
    useChatStore();
  const { loadSession, createSession, setCurrentSessionId } = useSessionStore();
  const { settings } = useSettingsStore();
  const { addFile } = useFileStore();

  // Initialize / load the session and hydrate messages from the server.
  useEffect(() => {
    const init = async () => {
      if (sessionId === "new") {
        try {
          const newId = await createSession(
            settings.activeBackend,
            settings.activeModel,
            settings.modelConfig
          );
          navigate(`/chat/${newId}`, { replace: true });
        } catch {
          /* surfaced via store error */
        }
        return;
      }
      if (!sessionId) return;
      await loadSession(sessionId);
      setCurrentSessionId(sessionId);
      const session = await sessionApi.getSession(sessionId);
      setMessages(
        session.messages.map((m) => ({
          id: m.message_id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          tokens: m.tokens,
          latency: m.latency,
          model: m.model,
          citations: m.citations?.map((c) => ({
            text: c.snippet,
            url: c.url,
            title: c.title,
          })),
        }))
      );
      setSessionFiles(session.files || []);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const query = input.trim();
      if (!query || isLoading || !sessionId || sessionId === "new") return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        timestamp: new Date(),
      };
      const assistantId = crypto.randomUUID();
      const assistantSeed: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantSeed]);
      setInput("");
      setIsLoading(true);
      setStreaming(true);
      setStreamingId(assistantId);

      const start = Date.now();
      try {
        for await (const event of streamSessionMessage(sessionId, {
          message: query,
          backend: settings.activeBackend,
          model: settings.activeModel,
          tools_enabled: {
            web_search: settings.toolsConfig.webSearch,
            rag: settings.toolsConfig.rag && sessionFiles.length > 0,
          },
        })) {
          if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: event.detail || "Generation failed." }
                  : m
              )
            );
            break;
          }
          if (event.type === "token" && event.content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m
              )
            );
          } else if (event.type === "done") {
            const latency = event.latency ?? Date.now() - start;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      tokens: event.tokens,
                      latency,
                      citations: event.citations?.map((c) => ({
                        text: c.snippet,
                        url: c.url,
                        title: c.title,
                      })),
                    }
                  : m
              )
            );
            if (event.tokens) updateStats(event.tokens.total, latency);
            if (event.retrieved_context)
              setCurrentContext(
                event.retrieved_context.map((r) => ({
                  id: r.source,
                  content: r.content,
                  similarity: r.similarity,
                  source: r.source,
                }))
              );
            if (event.citations)
              setCurrentSearchResults(
                event.citations.map((c) => ({
                  title: c.title,
                  url: c.url,
                  snippet: c.snippet,
                }))
              );
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, there was an error processing your request." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        setStreaming(false);
        setStreamingId(null);
      }
    },
    [
      input,
      isLoading,
      sessionId,
      sessionFiles.length,
      settings.toolsConfig,
      settings.activeBackend,
      settings.activeModel,
      setStreaming,
      updateStats,
      setCurrentContext,
      setCurrentSearchResults,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    try {
      const result = await sessionApi.uploadFile(sessionId, file);
      addFile({
        id: result.file_id,
        name: result.filename,
        type: file.type,
        size: result.size,
        uploadedAt: new Date(),
        processed: result.embedded,
        chunks: result.chunks,
      });
      const session = await sessionApi.getSession(sessionId);
      setSessionFiles(session.files || []);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to upload file");
    }
  };

  // Auto-grow the textarea.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="font-display text-2xl leading-none">Chat</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {settings.activeModel || "Select a model to start"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightSidebar}
          aria-label="Toggle stats sidebar"
        >
          <PanelRight className="h-5 w-5" />
        </Button>
      </header>

      <MessageList messages={messages} isLoading={isLoading} streamingId={streamingId} />

      {sessionFiles.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Knowledge Base ({sessionFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {sessionFiles.map((file) => (
              <FileCard
                key={file.file_id}
                filename={file.filename}
                size={file.size}
                type={file.type}
                chunks={file.chunks}
                compact
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-card p-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png"
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message…"
            rows={1}
            disabled={isLoading}
            className="max-h-[200px] min-h-[40px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
