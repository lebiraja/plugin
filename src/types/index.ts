export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency?: number;
  model?: string;
  backend?: string;
  citations?: Citation[];
  retrievedContext?: RetrievedChunk[];
  reasoning?: ReasoningStep[];
}

export interface Citation {
  text: string;
  url: string;
  title?: string;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ReasoningStep {
  step: number;
  action: string;
  observation: string;
  thought: string;
}

export interface LLMBackend {
  id: string;
  name: string;
  type: "ollama" | "lmstudio" | "huggingface" | "custom";
  url: string;
  apiKey?: string;
  models: string[];
  isActive: boolean;
}

export interface ModelConfig {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ToolsConfig {
  webSearch: boolean;
  rag: boolean;
  deepResearch: boolean;
  fileUpload: boolean;
}

export interface ConversationMode {
  id: string;
  name: string;
  description: string;
  enabledTools: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  processed: boolean;
  chunks?: number;
}

export interface AppSettings {
  backends: LLMBackend[];
  activeBackend: string;
  activeModel: string;
  modelConfig: ModelConfig;
  toolsConfig: ToolsConfig;
  conversationMode: string;
  theme: "dark" | "light";
}

export interface ChatStats {
  totalTokens: number;
  totalMessages: number;
  averageLatency: number;
  estimatedCost: number;
  sessionStart: Date;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  relevance_score?: number;
  word_count?: number;
}

export interface RAGResult {
  id: string;
  content: string;
  similarity: number;
  source: string;
  metadata?: Record<string, unknown>;
}

// Deep Research Types
export interface ResearchPlan {
  main_question: string;
  sub_questions: string[];
  search_queries: string[];
  focus_areas: string[];
  required_depth: number;
}

export interface Evidence {
  source_url: string;
  title: string;
  snippet: string;
  relevance_score: number;
  quality_score: number;
  word_count: number;
}

export interface ResearchReasoningStep {
  step: number;
  question: string;
  finding: string;
  confidence: number;
  contradictions: string[];
}

export interface ResearchReport {
  executive_summary: string;
  insights: string[];
  recommendations: string[];
  caveats: string[];
}

export interface ResearchMetadata {
  time_taken: number;
  tokens_used: number;
  searches_performed: number;
  sources_scraped: number;
  llm_calls: number;
  cache_hits: number;
}

export interface ResearchResult {
  research_id: string;
  query: string;
  plan: ResearchPlan;
  evidence_count: number;
  top_evidence: Evidence[];
  reasoning_trace: ResearchReasoningStep[];
  final_report: ResearchReport;
  citations: Array<{
    id: string;
    title: string;
    url: string;
    accessed: string;
  }>;
  metadata: ResearchMetadata;
  created_at: string;
}

export interface DeepResearchRequest {
  query: string;
  backend: string;
  model: string;
  max_depth?: number;
  max_sources?: number;
}

export type ResearchStage =
  | "idle"
  | "planning"
  | "searching"
  | "reasoning"
  | "synthesizing"
  | "complete"
  | "error";

export interface ResearchProgress {
  stage: ResearchStage;
  progress: number; // 0-100
  message: string;
  current_step?: string;
}
