export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  latency?: number
  model?: string
  backend?: string
  citations?: Citation[]
  retrievedContext?: RetrievedChunk[]
  reasoning?: ReasoningStep[]
}

export interface Citation {
  text: string
  url: string
  title?: string
}

export interface RetrievedChunk {
  id: string
  content: string
  similarity: number
  source: string
  metadata?: Record<string, unknown>
}

export interface ReasoningStep {
  step: number
  action: string
  observation: string
  thought: string
}

export interface LLMBackend {
  id: string
  name: string
  type: 'ollama' | 'lmstudio' | 'huggingface' | 'custom'
  url: string
  apiKey?: string
  models: string[]
  isActive: boolean
}

export interface ModelConfig {
  temperature: number
  topP: number
  maxTokens: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface ToolsConfig {
  webSearch: boolean
  rag: boolean
  deepResearch: boolean
  fileUpload: boolean
}

export interface ConversationMode {
  id: string
  name: string
  description: string
  enabledTools: string[]
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: Date
  processed: boolean
  chunks?: number
}

export interface AppSettings {
  backends: LLMBackend[]
  activeBackend: string
  activeModel: string
  modelConfig: ModelConfig
  toolsConfig: ToolsConfig
  conversationMode: string
  theme: 'dark' | 'light'
}

export interface ChatStats {
  totalTokens: number
  totalMessages: number
  averageLatency: number
  estimatedCost: number
  sessionStart: Date
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface RAGResult {
  id: string
  content: string
  similarity: number
  source: string
  metadata?: Record<string, unknown>
}
