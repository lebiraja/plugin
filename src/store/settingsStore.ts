import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, LLMBackend, ModelConfig, ToolsConfig } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateBackend: (backend: LLMBackend) => void
  setActiveBackend: (backendId: string) => void
  setActiveModel: (model: string) => void
  updateModelConfig: (config: Partial<ModelConfig>) => void
  updateToolsConfig: (config: Partial<ToolsConfig>) => void
  setConversationMode: (mode: string) => void
  addBackend: (backend: LLMBackend) => void
  removeBackend: (backendId: string) => void
}

const defaultSettings: AppSettings = {
  backends: [
    {
      id: 'ollama-default',
      name: 'Ollama',
      type: 'ollama',
      url: 'http://localhost:11434',
      models: [],
      isActive: true,
    },
    {
      id: 'lmstudio-default',
      name: 'LM Studio',
      type: 'lmstudio',
      url: 'http://localhost:1234',
      models: [],
      isActive: false,
    },
  ],
  activeBackend: 'ollama-default',
  activeModel: '',
  modelConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2048,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  toolsConfig: {
    webSearch: true,
    rag: true,
    deepResearch: false,
    fileUpload: true,
  },
  conversationMode: 'standard',
  theme: 'dark',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateBackend: (backend) =>
        set((state) => ({
          settings: {
            ...state.settings,
            backends: state.settings.backends.map((b) =>
              b.id === backend.id ? backend : b
            ),
          },
        })),

      setActiveBackend: (backendId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            activeBackend: backendId,
          },
        })),

      setActiveModel: (model) =>
        set((state) => ({
          settings: {
            ...state.settings,
            activeModel: model,
          },
        })),

      updateModelConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            modelConfig: {
              ...state.settings.modelConfig,
              ...config,
            },
          },
        })),

      updateToolsConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            toolsConfig: {
              ...state.settings.toolsConfig,
              ...config,
            },
          },
        })),

      setConversationMode: (mode) =>
        set((state) => ({
          settings: {
            ...state.settings,
            conversationMode: mode,
          },
        })),

      addBackend: (backend) =>
        set((state) => ({
          settings: {
            ...state.settings,
            backends: [...state.settings.backends, backend],
          },
        })),

      removeBackend: (backendId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            backends: state.settings.backends.filter((b) => b.id !== backendId),
          },
        })),
    }),
    {
      name: 'llm-chat-settings',
    }
  )
)
