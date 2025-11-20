import axios from 'axios'

const API_BASE_URL = '/api'

export interface ModelsResponse {
  models: string[]
}

export async function getModels(backend: string): Promise<string[]> {
  try {
    const response = await axios.get<ModelsResponse>(`${API_BASE_URL}/models/${backend}`)
    
    return response.data.models
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = error.response?.data?.detail || error.message
      console.error('Failed to fetch models:', errorMsg)
      
      // Show user-friendly error in the UI
      if (error.response?.status === 503) {
        console.warn('Backend service not running. Make sure Ollama or LM Studio is started.')
      }
      return []
    }
    throw error
  }
}
