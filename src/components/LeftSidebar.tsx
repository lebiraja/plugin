import { motion } from 'framer-motion'
import { Settings, MessageSquare, Plus, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getModels } from '../api/models'

interface LeftSidebarProps {
  onOpenSettings: () => void
}

export default function LeftSidebar({ onOpenSettings }: LeftSidebarProps) {
  const { settings, setActiveBackend, setActiveModel, updateToolsConfig } = useSettingsStore()
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isBackendDropdownOpen, setIsBackendDropdownOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  
  const backendDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  
  const activeBackend = settings.backends.find(b => b.id === settings.activeBackend)

  // Fetch models when backend changes
  const fetchModels = useCallback(async () => {
    if (!settings.activeBackend) return
    
    console.log('Fetching models for backend:', settings.activeBackend)
    setIsLoadingModels(true)
    try {
      const models = await getModels(settings.activeBackend)
      console.log('Received models:', models)
      setAvailableModels(models)
      
      // Auto-select first model if none is selected
      if (models.length > 0 && !settings.activeModel) {
        console.log('Auto-selecting first model:', models[0])
        setActiveModel(models[0])
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }, [settings.activeBackend, settings.activeModel, setActiveModel])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backendDropdownRef.current && !backendDropdownRef.current.contains(event.target as Node)) {
        setIsBackendDropdownOpen(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBackendChange = (backendId: string) => {
    setActiveBackend(backendId)
    setIsBackendDropdownOpen(false)
    setActiveModel('') // Reset model selection when backend changes
  }

  const handleModelChange = (model: string) => {
    setActiveModel(model)
    setIsModelDropdownOpen(false)
  }

  const handleRefreshModels = async () => {
    await fetchModels()
  }

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

      {/* Backend Selector */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Backend</label>
        <div className="relative" ref={backendDropdownRef}>
          <button
            onClick={() => setIsBackendDropdownOpen(!isBackendDropdownOpen)}
            className="w-full glass-input text-sm flex items-center justify-between"
          >
            <span>{activeBackend?.name || 'No backend selected'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isBackendDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isBackendDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-2 z-10 space-y-1">
              {settings.backends.map((backend) => (
                <button
                  key={backend.id}
                  onClick={() => handleBackendChange(backend.id)}
                  className={`w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-glass-hover transition-colors ${
                    backend.id === settings.activeBackend ? 'bg-primary/20 text-primary' : ''
                  }`}
                >
                  {backend.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Model Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Model</label>
          <button
            onClick={handleRefreshModels}
            disabled={isLoadingModels}
            className="p-1 hover:bg-glass-hover rounded transition-colors disabled:opacity-50"
            title="Refresh models"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            disabled={isLoadingModels || availableModels.length === 0}
            className="w-full glass-input text-sm flex items-center justify-between disabled:opacity-50"
          >
            <span className="truncate">
              {isLoadingModels 
                ? 'Loading models...' 
                : settings.activeModel || (availableModels.length === 0 ? 'No models available' : 'Select a model')
              }
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isModelDropdownOpen && availableModels.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-panel p-2 z-10 space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
              {availableModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelChange(model)}
                  className={`w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-glass-hover transition-colors ${
                    model === settings.activeModel ? 'bg-primary/20 text-primary' : ''
                  }`}
                >
                  <div className="truncate">{model}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tools Toggles */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Tools</label>
        <div className="space-y-2">
          {Object.entries(settings.toolsConfig).map(([key, enabled]) => (
            <button
              key={key}
              onClick={() => updateToolsConfig({ [key]: !enabled })}
              className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all ${
                enabled 
                  ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                  : 'bg-glass-bg text-gray-400 hover:bg-glass-hover'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-gray-600'
                }`} />
                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className={`text-xs font-medium ${
                enabled ? 'text-primary' : 'text-gray-500'
              }`}>
                {enabled ? 'ON' : 'OFF'}
              </div>
            </button>
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
