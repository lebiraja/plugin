import axios from 'axios'

const API_BASE_URL = '/api'

export interface UploadResponse {
  fileId: string
  name: string
  size: number
  processed: boolean
  chunks?: number
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/files/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to upload file')
    }
    throw error
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  await axios.delete(`${API_BASE_URL}/files/${fileId}`)
}

export async function getFilesList(): Promise<UploadResponse[]> {
  const response = await axios.get<{ files: UploadResponse[] }>(
    `${API_BASE_URL}/files`
  )
  
  return response.data.files
}
