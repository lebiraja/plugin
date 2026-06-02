import { apiClient } from "./client";

export interface SessionModelConfig {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface CreateSessionRequest {
  backend: string;
  model: string;
  config?: SessionModelConfig;
}

export interface Session {
  session_id: string;
  title: string;
  last_message_preview: string;
  updated_at: string;
  message_count: number;
  total_tokens: number;
}

export interface SessionMessage {
  message_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tokens?: { prompt: number; completion: number; total: number };
  latency?: number;
  model?: string;
  backend?: string;
  citations?: Array<{ title: string; url: string; snippet: string }>;
  retrieved_context?: Array<{ source: string; content: string; similarity: number }>;
}

export interface SessionFile {
  file_id: string;
  filename: string;
  path: string;
  type: string;
  size: number;
  embedded: boolean;
  chunks: number;
  uploaded_at: string;
}

export interface SessionDetail {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model_config: {
    backend: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  messages: SessionMessage[];
  files: SessionFile[];
  metadata: {
    total_messages: number;
    total_tokens: number;
    tools_usage_count: {
      web_search: number;
      rag: number;
      deep_research: number;
    };
    last_message_preview: string;
  };
}

export interface ToolsEnabled {
  web_search?: boolean;
  rag?: boolean;
  deep_research?: boolean;
}

export interface SendMessageRequest {
  message: string;
  backend?: string;
  model?: string;
  config?: SessionModelConfig;
  tools_enabled?: ToolsEnabled;
}

export interface AssistantMessageResponse {
  message_id: string;
  role: "assistant";
  content: string;
  tokens?: { prompt: number; completion: number; total: number };
  latency?: number;
  citations?: Array<{ title: string; url: string; snippet: string }>;
  retrieved_context?: Array<{ source: string; content: string; similarity: number }>;
}

export const sessionApi = {
  async createSession(
    request: CreateSessionRequest
  ): Promise<{ session_id: string; title: string }> {
    const { data } = await apiClient.post("/sessions/create", request);
    return data;
  },

  async listSessions(
    skip = 0,
    limit = 50,
    sort = "updated_at"
  ): Promise<{ sessions: Session[]; total: number }> {
    const { data } = await apiClient.get("/sessions", {
      params: { skip, limit, sort },
    });
    return data;
  },

  async getSession(sessionId: string): Promise<SessionDetail> {
    const { data } = await apiClient.get(`/sessions/${sessionId}`);
    return data;
  },

  async sendMessage(
    sessionId: string,
    request: SendMessageRequest
  ): Promise<AssistantMessageResponse> {
    const { data } = await apiClient.post(
      `/sessions/${sessionId}/message`,
      request
    );
    return data;
  },

  async generateTitle(sessionId: string): Promise<{ title: string }> {
    const { data } = await apiClient.post(
      `/sessions/${sessionId}/generate-title`
    );
    return data;
  },

  async renameSession(
    sessionId: string,
    title: string
  ): Promise<{ success: boolean; title: string }> {
    const { data } = await apiClient.patch(`/sessions/${sessionId}/rename`, {
      title,
    });
    return data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/sessions/${sessionId}`);
    return data;
  },

  /**
   * Upload a file into a session and embed it for RAG. Scoped to the session so
   * the chunks are retrievable in that session's RAG queries.
   */
  async uploadFile(sessionId: string, file: File): Promise<SessionFile> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(
      `/sessions/${sessionId}/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};
