import { create } from 'zustand'
import type { UploadedFile } from '../types'

interface FileStore {
  files: UploadedFile[]
  selectedFiles: string[]
  addFile: (file: UploadedFile) => void
  removeFile: (fileId: string) => void
  toggleFileSelection: (fileId: string) => void
  clearSelection: () => void
  updateFileProcessing: (fileId: string, processed: boolean, chunks?: number) => void
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  selectedFiles: [],

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
    })),

  removeFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
      selectedFiles: state.selectedFiles.filter((id) => id !== fileId),
    })),

  toggleFileSelection: (fileId) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(fileId)
        ? state.selectedFiles.filter((id) => id !== fileId)
        : [...state.selectedFiles, fileId],
    })),

  clearSelection: () => set({ selectedFiles: [] }),

  updateFileProcessing: (fileId, processed, chunks) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, processed, chunks } : f
      ),
    })),
}))
