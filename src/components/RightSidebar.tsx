import {
  FileText,
  Database,
  Activity,
  Trash2,
  Loader2,
  PanelRightClose,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFileStore } from "../store/fileStore";
import { useChatStore } from "../store/chatStore";
import { deleteFile } from "../api/files";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { NumberTicker } from "./ui/number-ticker";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  width?: number;
  onToggle?: () => void;
  onResize?: (width: number) => void;
}

export default function RightSidebar({
  width = 320,
  onToggle,
  onResize,
}: RightSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing || !onResize || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      if (newWidth >= 240 && newWidth <= 600) onResize(newWidth);
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

  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className="relative flex h-screen flex-col border-l border-border bg-background"
    >
      {onResize && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className={cn(
            "absolute left-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/30",
            isResizing && "bg-primary/50"
          )}
        />
      )}

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Inspector</span>
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
            <PanelRightClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="stats" className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 pt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">
              <Activity className="h-3.5 w-3.5" /> Stats
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-3.5 w-3.5" /> Files
            </TabsTrigger>
            <TabsTrigger value="context">
              <Database className="h-3.5 w-3.5" /> Context
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="stats" className="mt-0">
              <StatsPanel />
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <FilesPanel />
            </TabsContent>
            <TabsContent value="context" className="mt-0">
              <ContextPanel />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}

function StatsPanel() {
  const { stats } = useChatStore();
  const cards = [
    { label: "Total Tokens", value: stats.totalTokens, decimals: 0 },
    { label: "Messages", value: stats.totalMessages, decimals: 0 },
    { label: "Avg Latency", value: Math.round(stats.averageLatency), decimals: 0, suffix: " ms" },
    { label: "Est. Cost", value: stats.estimatedCost, decimals: 4, prefix: "$" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-3">
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div className="mt-1 font-mono text-xl font-semibold">
            {c.prefix}
            <NumberTicker value={c.value} decimalPlaces={c.decimals} suffix={c.suffix} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function FilesPanel() {
  const { files, removeFile } = useFileStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (fileId: string) => {
    if (!confirm("Delete this file from the knowledge base?")) return;
    setDeleting(fileId);
    try {
      await deleteFile(fileId);
      removeFile(fileId);
    } catch {
      alert("Failed to delete file. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        <Database className="mx-auto mb-2 h-10 w-10 opacity-30" />
        <p>No files in knowledge base</p>
        <p className="mt-1 text-xs">Upload files to enable RAG</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
          >
            <Card className="group flex items-start gap-2 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                  {file.chunks ? ` · ${file.chunks} chunks` : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                disabled={deleting === file.id}
                onClick={() => handleDelete(file.id)}
              >
                {deleting === file.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ContextPanel() {
  const { currentContext, currentSearchResults } = useChatStore();

  if (currentContext.length === 0 && currentSearchResults.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No context retrieved yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentContext.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            From Documents ({currentContext.length})
          </p>
          {currentContext.map((chunk) => (
            <Card key={chunk.id} className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-primary">{chunk.source}</span>
                <Badge variant="secondary">{(chunk.similarity * 100).toFixed(0)}%</Badge>
              </div>
              <p className="line-clamp-3 text-xs text-muted-foreground">{chunk.content}</p>
            </Card>
          ))}
        </div>
      )}

      {currentSearchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Web Search ({currentSearchResults.length})
          </p>
          {currentSearchResults.map((result, idx) => (
            <Card key={idx} className="p-3">
              <div className="mb-1 line-clamp-1 text-xs font-medium">{result.title}</div>
              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                {result.snippet}
              </p>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-xs text-primary hover:underline"
              >
                {result.url}
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
