import { motion } from 'framer-motion'
import { Settings, MessageSquare, Plus, ChevronRight } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

interface LeftSidebarProps {
  onOpenSettings: () => void
}

export default function LeftSidebar({ onOpenSettings }: LeftSidebarProps) {
  const { settings } = useSettingsStore()
  const activeBackend = settings.backends.find(b => b.id === settings.activeBackend)

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 glass-panel m-4 p-4 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LLM Chat</h2>
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Model Selector */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Backend</label>
        <div className="glass-input text-sm">
          {activeBackend?.name || 'No backend selected'}
        </div>
      </div>

      {/* Active Model */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Model</label>
        <div className="glass-input text-sm truncate">
          {settings.activeModel || 'No model selected'}
        </div>
      </div>

      {/* Tools Toggles */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Active Tools</label>
        <div className="space-y-1">
          {Object.entries(settings.toolsConfig).map(([key, enabled]) => (
            <div
              key={key}
              className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                enabled ? 'bg-primary/20 text-primary' : 'bg-glass-bg text-gray-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-primary' : 'bg-gray-600'}`} />
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          ))}
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">History</label>
          <button className="p-1 hover:bg-glass-hover rounded transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          <ConversationItem title="Current Session" isActive />
        </div>
      </div>
    </motion.aside>
  )
}

function ConversationItem({ title, isActive }: { title: string; isActive?: boolean }) {
  return (
    <button
      className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between group hover:bg-glass-hover transition-colors ${
        isActive ? 'bg-glass-hover' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MessageSquare className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{title}</span>
      </div>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}
