import { apiClient } from "./client";

export interface SearchIntegration {
  provider: string;
  name: string;
  has_value: boolean;
  masked_value: string;
  encryption_available: boolean;
}

export const integrationsApi = {
  async getSearch(): Promise<SearchIntegration> {
    const { data } = await apiClient.get("/integrations/search");
    return data;
  },

  /** Store the Serper key (plaintext sent up, encrypted server-side). */
  async setSearchKey(apiKey: string): Promise<{ has_value: boolean; masked_value: string }> {
    const { data } = await apiClient.put("/integrations/search", { api_key: apiKey });
    return data;
  },

  async testSearch(): Promise<{ ok: boolean; status?: number; error?: string }> {
    const { data } = await apiClient.post("/integrations/search/test");
    return data;
  },

  async deleteSearchKey(): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete("/integrations/search");
    return data;
  },
};
