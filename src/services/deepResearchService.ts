import { apiClient } from "../api/client";
import { DeepResearchRequest, ResearchResult } from "../types";

export const deepResearchService = {
  /** Conduct comprehensive deep research (blocking). */
  async conductResearch(request: DeepResearchRequest): Promise<ResearchResult> {
    const { data } = await apiClient.post<ResearchResult>(
      "/deep-research/conduct",
      request
    );
    return data;
  },

  /** Get research status by id. */
  async getResearchStatus(researchId: string): Promise<{
    research_id: string;
    status: string;
    progress?: string;
  }> {
    const { data } = await apiClient.get(
      `/deep-research/status/${researchId}`
    );
    return data;
  },

  /** Cache statistics. */
  async getCacheStats(): Promise<{
    cache_size: number;
    cached_research: Array<{
      research_id: string;
      query: string;
      created_at: string;
      sources: number;
      cache_hits: number;
    }>;
  }> {
    const { data } = await apiClient.get("/deep-research/cache/stats");
    return data;
  },

  /** Clear the research cache. */
  async clearCache(): Promise<{
    success: boolean;
    cleared_count: number;
    message: string;
  }> {
    const { data } = await apiClient.delete("/deep-research/cache/clear");
    return data;
  },
};
