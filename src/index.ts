// Main App Component
export { default as App } from './App';

// Chat Components
export { UnifiedChatInterface } from './components/UnifiedChatInterface';
export { default as ChatInterface } from './components/ChatInterface';
export { default as MessageList } from './components/MessageList';
export { SessionSidebar } from './components/SessionSidebar';
export { default as RightSidebar } from './components/RightSidebar';
export { default as SettingsModal } from './components/SettingsModal';
export { default as FileCard } from './components/FileCard';
export { default as LeftSidebar } from './components/LeftSidebar';

// Common Components
export { ErrorBoundary } from './components/common/ErrorBoundary';
export { BackendStatusBanner } from './components/common/BackendStatusBanner';
export { MarkdownRenderer } from './components/common/MarkdownRenderer';

// Research Components
export { DeepResearchPanel } from './components/research/DeepResearchPanel';
export { ResearchResultsView } from './components/research/ResearchResultsView';

// Stores (Zustand)
export { useChatStore } from './store/chatStore';
export { useSettingsStore } from './store/settingsStore';
export { useSessionStore } from './store/sessionStore';
export { useFileStore } from './store/fileStore';
export { useDeepResearchStore } from './store/deepResearchStore';

// Hooks
export { useBackendStatus } from './hooks/useBackendStatus';

// API Functions
export * from './api/chat';
export * from './api/client';
export * from './api/files';
export * from './api/models';
export * from './api/sessions';
export * from './api/tools';

// Services
export { deepResearchService } from './services/deepResearchService';

// Types
export type {
  Message,
  Citation,
  RetrievedChunk,
  ReasoningStep,
  LLMBackend,
  ModelConfig,
  ToolsConfig,
  ConversationMode,
  UploadedFile,
  AppSettings,
  ChatStats,
  SearchResult,
  RAGResult,
  ResearchPlan,
  Evidence,
  ResearchReasoningStep,
  ResearchReport,
  ResearchMetadata,
  ResearchResult,
  DeepResearchRequest,
  ResearchStage,
  ResearchProgress,
} from './types';

// Utilities
export { cn } from './lib/utils';
