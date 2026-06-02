import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Bot, ExternalLink, Sparkles } from "lucide-react";
import type { Message } from "../types";
import { MarkdownRenderer } from "./common/MarkdownRenderer";
import { ShimmerText } from "./ui/shimmer-text";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingId?: string | null;
}

export default function MessageList({
  messages,
  isLoading,
  streamingId,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              streaming={message.id === streamingId}
            />
          ))}
        </AnimatePresence>

        {isLoading && !streamingId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <ShimmerText className="font-medium">Thinking…</ShimmerText>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function MessageRow({
  message,
  streaming,
}: {
  message: Message;
  streaming: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn("flex flex-col gap-2", isUser && "items-end")}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {!isUser && <Bot className="h-3.5 w-3.5 text-primary" />}
        <span>{isUser ? "You" : message.model || "Assistant"}</span>
        <span className="text-muted-foreground/50">
          {message.timestamp && format(message.timestamp, "HH:mm")}
        </span>
      </div>

      <div
        className={cn(
          "max-w-full rounded-lg px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="relative">
            <MarkdownRenderer content={message.content} />
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary align-middle" />
            )}
          </div>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-border/60 pt-3">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            {message.citations.map((c, idx) => (
              <a
                key={idx}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  [{idx + 1}] {c.title || c.url}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {!isUser && (message.tokens || message.latency) && (
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground/70">
          {message.tokens && <span>{message.tokens.total} tok</span>}
          {message.latency && <span>{Math.round(message.latency)} ms</span>}
        </div>
      )}
    </motion.div>
  );
}
