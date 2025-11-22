import axios from "axios";
import { DeepResearchRequest, ResearchResult } from "../types";

const API_BASE_URL = "http://localhost:8000/api";

export const deepResearchService = {
  /**
   * Conduct comprehensive deep research
   */
  async conductResearch(request: DeepResearchRequest): Promise<ResearchResult> {
    const response = await axios.post<ResearchResult>(
      `${API_BASE_URL}/deep-research/conduct`,
      request
    );
    return response.data;
  },

  /**
   * Get research status by ID
   */
  async getResearchStatus(researchId: string): Promise<{
    research_id: string;
    status: string;
    progress?: string;
  }> {
    const response = await axios.get(
      `${API_BASE_URL}/deep-research/status/${researchId}`
    );
    return response.data;
  },

  /**
   * Get cache statistics
   */
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
    const response = await axios.get(
      `${API_BASE_URL}/deep-research/cache/stats`
    );
    return response.data;
  },

  /**
   * Clear research cache
   */
  async clearCache(): Promise<{
    success: boolean;
    cleared_count: number;
    message: string;
  }> {
    const response = await axios.delete(
      `${API_BASE_URL}/deep-research/cache/clear`
    );
    return response.data;
  },
};
