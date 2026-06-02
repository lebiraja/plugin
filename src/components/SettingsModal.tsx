import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Settings } from 'lucide-react'
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
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-md z-40"
          />

          {/* Modal - Elevated Liquid Glass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="liquid-glass-elevated w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-liquid-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-100">Settings</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="liquid-button-icon"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>

              {/* Floating Tab Bar */}
              <div className="p-4 border-b border-liquid-border">
                <div className="floating-tab-bar max-w-md mx-auto">
                  <TabButton
                    label="Model"
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
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                {activeTab === 'model' && <ModelSettings />}
                {activeTab === 'tools' && <ToolsSettings />}
                {activeTab === 'backends' && <BackendsSettings />}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-liquid-border">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="liquid-button-glass"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="liquid-button-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </motion.button>
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
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`floating-tab-item flex-1 ${active ? 'active' : ''}`}
    >
      {label}
    </motion.button>
  )
}

function ModelSettings() {
  const { settings, updateModelConfig } = useSettingsStore()

  return (
    <div className="space-y-6">
      {/* Temperature Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-200">Temperature</label>
          <span className="text-sm text-primary font-medium">{settings.modelConfig.temperature}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.modelConfig.temperature}
          onChange={(e) => updateModelConfig({ temperature: parseFloat(e.target.value) })}
          className="w-full h-2 bg-liquid-bg-secondary rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Top P Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-200">Top P</label>
          <span className="text-sm text-primary font-medium">{settings.modelConfig.topP}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.modelConfig.topP}
          onChange={(e) => updateModelConfig({ topP: parseFloat(e.target.value) })}
          className="w-full h-2 bg-liquid-bg-secondary rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Max Tokens Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">Max Tokens</label>
        <input
          type="number"
          value={settings.modelConfig.maxTokens}
          onChange={(e) => updateModelConfig({ maxTokens: parseInt(e.target.value) })}
          className="liquid-input"
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
    <div className="space-y-3">
      {tools.map((tool) => {
        const enabled = settings.toolsConfig[tool.key as keyof typeof settings.toolsConfig]
        return (
          <motion.div
            key={tool.key}
            whileHover={{ scale: 1.01 }}
            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
              enabled
                ? 'bg-primary/10 border border-primary/25'
                : 'bg-liquid-frosted border border-liquid-border hover:bg-liquid-hover'
            }`}
            onClick={() => updateToolsConfig({ [tool.key]: !enabled })}
          >
            {/* Toggle */}
            <div className={`liquid-toggle mt-0.5 ${enabled ? 'active' : ''}`}>
              <span className="liquid-toggle-thumb" />
            </div>
            <div className="flex-1">
              <div className={`font-medium ${enabled ? 'text-primary' : 'text-gray-200'}`}>
                {tool.label}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{tool.description}</div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function BackendsSettings() {
  const { settings } = useSettingsStore()

  return (
    <div className="space-y-3">
      {settings.backends.map((backend) => (
        <div key={backend.id} className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-200">{backend.name}</div>
            <div className={`w-2.5 h-2.5 rounded-full ${backend.isActive ? 'bg-apple-green shadow-glow' : 'bg-gray-600'}`} />
          </div>
          <div className="text-sm text-gray-500">{backend.url}</div>
          <div className="text-xs text-gray-600 mt-1">{backend.type}</div>
        </div>
      ))}
    </div>
  )
}
