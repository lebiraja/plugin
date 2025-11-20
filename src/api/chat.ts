import axios from 'axios'
import type { ModelConfig } from '../types'

const API_BASE_URL = '/api'

export interface ChatResponse {
  content: string
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  model?: string
  backend?: string
}

export async function sendMessage(
  message: string,
  backend: string,
  model: string,
  config: ModelConfig,
  history: Array<{role: string, content: string}> = []
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(`${API_BASE_URL}/chat`, {
      message,
      backend,
      model,
      config,
      history,
    })
    
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to send message to LLM')
    }
    throw error
  }
}

export async function streamMessage(
  message: string,
  backend: string,
  model: string,
  config: ModelConfig,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      backend,
      model,
      config,
    }),
  })

  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    
    if (done) break
    
    const chunk = decoder.decode(value)
    onChunk(chunk)
  }
}

export async function getAvailableModels(backend: string): Promise<string[]> {
  const response = await axios.get<{ models: string[] }>(
    `${API_BASE_URL}/models/${backend}`
  )
  
  return response.data.models
}
