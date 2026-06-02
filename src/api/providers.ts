import { apiClient } from "./client";

export interface Provider {
  id: string;
  name: string;
  protocol: "ollama" | "openai";
  base_url: string;
  requires_key: boolean;
  has_key: boolean;
  masked_key: string;
  enabled: boolean;
  local: boolean;
  default_models: string[];
}

export interface UpsertProviderRequest {
  id: string;
  name?: string;
  base_url?: string;
  /** Plaintext key — sent to the backend (encrypted there), never persisted locally. */
  api_key?: string;
  enabled: boolean;
}

export const providerApi = {
  async list(): Promise<{ providers: Provider[]; encryption_available: boolean }> {
    const { data } = await apiClient.get("/providers");
    return data;
  },

  async upsert(request: UpsertProviderRequest): Promise<Provider> {
    const { data } = await apiClient.post("/providers", request);
    return data;
  },

  async test(providerId: string): Promise<{ ok: boolean; status?: number; error?: string }> {
    const { data } = await apiClient.post(`/providers/${providerId}/test`);
    return data;
  },

  async remove(providerId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`/providers/${providerId}`);
    return data;
  },
};
