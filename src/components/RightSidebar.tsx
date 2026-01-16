import { FileText, Database, Activity, Trash2, Loader2, PanelRightClose, GripVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useFileStore } from '../store/fileStore'
import { useChatStore } from '../store/chatStore'
import { deleteFile } from '../api/files'

interface RightSidebarProps {
  width?: number;
  onToggle?: () => void;
  onResize?: (width: number) => void;
}

export default function RightSidebar({ width = 320, onToggle, onResize }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'stats' | 'context'>('stats')
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !onResize || !sidebarRef.current) return;

      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = sidebarRect.right - e.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onResize]);

  return (
    <aside
      ref={sidebarRef}
      style={{ width }}
      className="liquid-glass m-4 p-4 flex flex-col gap-4 h-[calc(100vh-2rem)] relative"
    >
      {/* Collapse Button - Floating Glass */}
      {onToggle && (
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="absolute top-4 -left-3 z-50 liquid-button-icon w-6 h-6 shadow-liquid"
          title="Close sidebar (Cmd+\\)"
        >
          <PanelRightClose className="w-3.5 h-3.5 text-primary" />
        </motion.button>
      )}

      {/* Resize Handle */}
      {onResize && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize group hover:bg-primary/30 transition-colors ${
            isResizing ? 'bg-primary/50' : ''
          }`}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-4 h-16 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-primary" />
          </div>
        </div>
      )}

      {/* Floating Tab Bar */}
      <div className="floating-tab-bar">
        <TabButton
          icon={<Activity className="w-4 h-4" />}
          label="Stats"
          active={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
        />
        <TabButton
          icon={<FileText className="w-4 h-4" />}
          label="Files"
          active={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
        />
        <TabButton
          icon={<Database className="w-4 h-4" />}
          label="Context"
          active={activeTab === 'context'}
          onClick={() => setActiveTab('context')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'stats' && <StatsPanel />}
        {activeTab === 'files' && <FilesPanel />}
        {activeTab === 'context' && <ContextPanel />}
      </div>
    </aside>
  )
}

interface TabButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function TabButton({ icon, label, active, onClick }: TabButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`floating-tab-item flex-1 ${active ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  )
}

function StatsPanel() {
  const { stats } = useChatStore()

  const statCards = [
    { label: 'Total Tokens', value: stats.totalTokens.toLocaleString() },
    { label: 'Messages', value: stats.totalMessages },
    { label: 'Avg Latency', value: `${Math.round(stats.averageLatency)}ms` },
    { label: 'Est. Cost', value: `$${stats.estimatedCost.toFixed(4)}` },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Session Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className="stat-card"
          >
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-lg font-semibold text-gray-100">{stat.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FilesPanel() {
  const { files, removeFile } = useFileStore()
  const [deletingFile, setDeletingFile] = useState<string | null>(null)

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file from the knowledge base?')) {
      return
    }

    setDeletingFile(fileId)
    try {
      await deleteFile(fileId)
      removeFile(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file. Please try again.')
    } finally {
      setDeletingFile(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Knowledge Base</h3>
        <span className="text-xs text-gray-600">{files.length} files</span>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <Database className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No files in knowledge base</p>
          <p className="text-xs mt-1 text-gray-600">Upload files to enable RAG</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="stat-card hover:bg-liquid-hover transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-gray-200">{file.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    {file.chunks && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>{file.chunks} chunks</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  disabled={deletingFile === file.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-accent-red/20 rounded-lg transition-all disabled:opacity-50"
                  title="Delete file"
                >
                  {deletingFile === file.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent-red" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-accent-red" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContextPanel() {
  const { currentContext, currentSearchResults } = useChatStore()

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Retrieved Context</h3>

      {currentContext.length === 0 && currentSearchResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No context retrieved yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* RAG Results */}
          {currentContext.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                From Documents ({currentContext.length})
              </div>
              <div className="space-y-2">
                {currentContext.map((chunk) => (
                  <div key={chunk.id} className="stat-card text-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">
                        {chunk.source}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(chunk.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-3">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {currentSearchResults.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">
                Web Search ({currentSearchResults.length})
              </div>
              <div className="space-y-2">
                {currentSearchResults.map((result, idx) => (
                  <div key={idx} className="stat-card text-sm">
                    <div className="font-medium text-xs mb-1 line-clamp-1 text-gray-200">
                      {result.title}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {result.snippet}
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-light hover:underline truncate block"
                    >
                      {result.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
