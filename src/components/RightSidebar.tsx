import { FileText, Database, Activity } from 'lucide-react'
import { useState } from 'react'
import { useFileStore } from '../store/fileStore'
import { useChatStore } from '../store/chatStore'

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<'files' | 'stats' | 'context'>('stats')

  return (
    <aside className="w-80 glass-panel m-4 p-4 flex flex-col gap-4 h-[calc(100vh-2rem)]">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-glass-bg rounded-lg">
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
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
        active ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400">Session Stats</h3>
      <div className="grid grid-cols-2 gap-2">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-glass-bg rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
            <div className="text-lg font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilesPanel() {
  const { files } = useFileStore()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">Uploaded Files</h3>
        <span className="text-xs text-gray-500">{files.length} files</span>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No files uploaded yet
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="bg-glass-bg rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {file.chunks && ` · ${file.chunks} chunks`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContextPanel() {
  const { currentContext, currentSearchResults } = useChatStore()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400">Retrieved Context</h3>
      
      {currentContext.length === 0 && currentSearchResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No context retrieved yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* RAG Results */}
          {currentContext.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-2">
                From Documents ({currentContext.length})
              </div>
              <div className="space-y-2">
                {currentContext.map((chunk) => (
                  <div key={chunk.id} className="bg-glass-bg rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-primary">
                        {chunk.source}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(chunk.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-3">
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
              <div className="text-xs font-semibold text-gray-400 mb-2">
                Web Search ({currentSearchResults.length})
              </div>
              <div className="space-y-2">
                {currentSearchResults.map((result, idx) => (
                  <div key={idx} className="bg-glass-bg rounded-lg p-3 text-sm">
                    <div className="font-medium text-xs mb-1 line-clamp-1">
                      {result.title}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {result.snippet}
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate block"
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
