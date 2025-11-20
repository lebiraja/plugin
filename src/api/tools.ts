import axios from 'axios'
import type { SearchResult, RAGResult } from '../types'

const API_BASE_URL = '/api'

export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const response = await axios.post<{ results: SearchResult[] }>(
      `${API_BASE_URL}/tools/search`,
      {
        query,
        max_results: maxResults,
      }
    )
    return response.data.results
  } catch (error) {
    console.error('Web search failed:', error)
    return [] // Return empty array on failure
  }
}

export async function ragQuery(
  query: string,
  fileIds: string[] = [],
  topK = 3
): Promise<RAGResult[]> {
  try {
    const response = await axios.post<{ results: RAGResult[] }>(
      `${API_BASE_URL}/tools/rag/query`,
      {
        query,
        file_ids: fileIds,
        top_k: topK,
      }
    )
    return response.data.results
  } catch (error) {
    console.error('RAG query failed:', error)
    return [] // Return empty array on failure
  }
}
