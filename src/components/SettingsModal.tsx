import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'tools' | 'backends'>('model')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-glass-border">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-glass-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-4 border-b border-glass-border">
                <TabButton
                  label="Model Settings"
                  active={activeTab === 'model'}
                  onClick={() => setActiveTab('model')}
                />
                <TabButton
                  label="Tools"
                  active={activeTab === 'tools'}
                  onClick={() => setActiveTab('tools')}
                />
                <TabButton
                  label="Backends"
                  active={activeTab === 'backends'}
                  onClick={() => setActiveTab('backends')}
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                {activeTab === 'model' && <ModelSettings />}
                {activeTab === 'tools' && <ToolsSettings />}
                {activeTab === 'backends' && <BackendsSettings />}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-glass-border">
                <button onClick={onClose} className="glass-button">
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition-all ${
        active ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function ModelSettings() {
  const { settings, updateModelConfig } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Temperature</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.modelConfig.temperature}
          onChange={(e) => updateModelConfig({ temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Precise</span>
          <span>{settings.modelConfig.temperature}</span>
          <span>Creative</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Top P</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.modelConfig.topP}
          onChange={(e) => updateModelConfig({ topP: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="text-xs text-gray-400 mt-1 text-center">
          {settings.modelConfig.topP}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Max Tokens</label>
        <input
          type="number"
          value={settings.modelConfig.maxTokens}
          onChange={(e) => updateModelConfig({ maxTokens: parseInt(e.target.value) })}
          className="glass-input w-full"
        />
      </div>
    </div>
  )
}

function ToolsSettings() {
  const { settings, updateToolsConfig } = useSettingsStore()

  const tools = [
    { key: 'webSearch', label: 'Web Search', description: 'Enable live web search capabilities' },
    { key: 'rag', label: 'RAG', description: 'Retrieval-Augmented Generation from uploaded files' },
    { key: 'deepResearch', label: 'Deep Research', description: 'Multi-step iterative reasoning' },
    { key: 'fileUpload', label: 'File Upload', description: 'Upload and process documents' },
  ]

  return (
    <div className="space-y-4">
      {tools.map((tool) => (
        <div key={tool.key} className="flex items-start gap-3 p-4 rounded-lg bg-glass-bg">
          <input
            type="checkbox"
            checked={settings.toolsConfig[tool.key as keyof typeof settings.toolsConfig]}
            onChange={(e) => updateToolsConfig({ [tool.key]: e.target.checked })}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium">{tool.label}</div>
            <div className="text-sm text-gray-400">{tool.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BackendsSettings() {
  const { settings } = useSettingsStore()

  return (
    <div className="space-y-4">
      {settings.backends.map((backend) => (
        <div key={backend.id} className="p-4 rounded-lg bg-glass-bg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{backend.name}</div>
            <div className={`w-2 h-2 rounded-full ${backend.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
          <div className="text-sm text-gray-400">{backend.url}</div>
          <div className="text-xs text-gray-500 mt-1">{backend.type}</div>
        </div>
      ))}
    </div>
  )
}
