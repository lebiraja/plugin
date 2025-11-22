import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export interface CreateSessionRequest {
  backend: string;
  model: string;
  config?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

export interface Session {
  session_id: string;
  title: string;
  last_message_preview: string;
  updated_at: string;
  message_count: number;
  total_tokens: number;
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
  messages: any[];
  files: any[];
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

export interface SendMessageRequest {
  message: string;
  config?: any;
  tools_enabled?: {
    web_search?: boolean;
    rag?: boolean;
    deep_research?: boolean;
  };
}

export const sessionApi = {
  async createSession(
    request: CreateSessionRequest
  ): Promise<{ session_id: string; title: string }> {
    const response = await axios.post(
      `${API_BASE_URL}/sessions/create`,
      request
    );
    return response.data;
  },

  async listSessions(
    skip = 0,
    limit = 50,
    sort = "updated_at"
  ): Promise<{ sessions: Session[]; total: number }> {
    const response = await axios.get(`${API_BASE_URL}/sessions`, {
      params: { skip, limit, sort },
    });
    return response.data;
  },

  async getSession(sessionId: string): Promise<SessionDetail> {
    const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
  },

  async sendMessage(
    sessionId: string,
    request: SendMessageRequest
  ): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/sessions/${sessionId}/message`,
      request
    );
    return response.data;
  },

  async generateTitle(sessionId: string): Promise<{ title: string }> {
    const response = await axios.post(
      `${API_BASE_URL}/sessions/${sessionId}/generate-title`
    );
    return response.data;
  },

  async renameSession(
    sessionId: string,
    title: string
  ): Promise<{ success: boolean; title: string }> {
    const response = await axios.patch(
      `${API_BASE_URL}/sessions/${sessionId}/rename`,
      { title }
    );
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(
      `${API_BASE_URL}/sessions/${sessionId}`
    );
    return response.data;
  },

  async uploadFile(sessionId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_BASE_URL}/sessions/${sessionId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
