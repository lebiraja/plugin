import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  LLMBackend,
  ModelConfig,
  ToolsConfig,
} from "../types";
import { providerApi, type Provider } from "../api/providers";

interface SettingsStore {
  settings: AppSettings;
  /** Enabled providers fetched from the backend (source of truth; not persisted). */
  providers: Provider[];
  encryptionAvailable: boolean;
  setActiveBackend: (backendId: string) => void;
  setActiveModel: (model: string) => void;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  updateToolsConfig: (config: Partial<ToolsConfig>) => void;
  setConversationMode: (mode: string) => void;
  fetchProviders: () => Promise<void>;
}

function providerToBackend(p: Provider): LLMBackend {
  return {
    id: p.id,
    name: p.name,
    type: p.local ? (p.protocol === "ollama" ? "ollama" : "lmstudio") : "custom",
    url: p.base_url,
    models: p.default_models,
    isActive: p.enabled,
  };
}

const defaultSettings: AppSettings = {
  // Populated from the backend via fetchProviders(); empty until then.
  backends: [],
  activeBackend: "ollama-default",
  activeModel: "",
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
    deepResearch: true,
    fileUpload: true,
  },
  conversationMode: "standard",
  theme: "dark",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      providers: [],
      encryptionAvailable: false,

      fetchProviders: async () => {
        try {
          const { providers, encryption_available } = await providerApi.list();
          const enabled = providers.filter((p) => p.enabled);
          set((state) => ({
            providers,
            encryptionAvailable: encryption_available,
            settings: {
              ...state.settings,
              backends: enabled.map(providerToBackend),
              // Keep the active backend valid; fall back to the first enabled one.
              activeBackend: enabled.some((p) => p.id === state.settings.activeBackend)
                ? state.settings.activeBackend
                : enabled[0]?.id || state.settings.activeBackend,
            },
          }));
        } catch {
          /* leave existing state; BackendStatusBanner surfaces connectivity */
        }
      },

      setActiveBackend: (backendId) =>
        set((state) => ({
          settings: { ...state.settings, activeBackend: backendId },
        })),

      setActiveModel: (model) =>
        set((state) => ({ settings: { ...state.settings, activeModel: model } })),

      updateModelConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            modelConfig: { ...state.settings.modelConfig, ...config },
          },
        })),

      updateToolsConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            toolsConfig: { ...state.settings.toolsConfig, ...config },
          },
        })),

      setConversationMode: (mode) =>
        set((state) => ({
          settings: { ...state.settings, conversationMode: mode },
        })),
    }),
    {
      name: "llm-chat-settings",
      // Persist only user preferences — NEVER providers or any API key material.
      partialize: (state) => ({
        settings: {
          ...state.settings,
          backends: [],
        },
      }),
    }
  )
);
