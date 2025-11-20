import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, BarChart3 } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { useSettingsStore } from '../store/settingsStore'
import { useFileStore } from '../store/fileStore'
import MessageList from './MessageList.tsx'
import { sendMessage } from '../api/chat'
import { uploadFile } from '../api/files'
import { webSearch, ragQuery } from '../api/tools'
import type { RAGResult, SearchResult } from '../types'

interface ChatInterfaceProps {
  onToggleRightSidebar: () => void
  isRightSidebarOpen: boolean
}

export default function ChatInterface({ onToggleRightSidebar, isRightSidebarOpen }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { messages, addMessage, setStreaming, updateStats, setCurrentContext, setCurrentSearchResults } = useChatStore()
  const { settings } = useSettingsStore()
  const { files, addFile, selectedFiles } = useFileStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    const userQuery = input.trim()
    setInput('')
    setIsLoading(true)
    setStreaming(true)

    try {
      const startTime = Date.now()
      let contextText = ''
      let ragResults: RAGResult[] = []
      let searchResults: SearchResult[] = []

      // Perform RAG query if enabled and files are available
      if (settings.toolsConfig.rag && files.length > 0) {
        const fileIds = selectedFiles.length > 0 ? selectedFiles : files.map(f => f.id)
        ragResults = await ragQuery(userQuery, fileIds, 3)
        setCurrentContext(ragResults)
        
        if (ragResults.length > 0) {
          contextText += '\n\n--- Retrieved Context ---\n'
          ragResults.forEach((result, idx) => {
            contextText += `[${idx + 1}] From ${result.source}:\n${result.content}\n\n`
          })
        }
      }

      // Perform web search if enabled
      if (settings.toolsConfig.webSearch) {
        searchResults = await webSearch(userQuery, 3)
        setCurrentSearchResults(searchResults)
        
        if (searchResults.length > 0) {
          contextText += '\n\n--- Web Search Results ---\n'
          searchResults.forEach((result, idx) => {
            contextText += `[${idx + 1}] ${result.title}\n${result.snippet}\nSource: ${result.url}\n\n`
          })
        }
      }

      // Combine context with user query
      const enhancedPrompt = contextText 
        ? `${contextText}\n--- User Question ---\n${userQuery}\n\nPlease answer the question using the context provided above.`
        : userQuery

      const response = await sendMessage(
        enhancedPrompt,
        settings.activeBackend,
        settings.activeModel,
        settings.modelConfig
      )

      const latency = Date.now() - startTime
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: response.content,
        timestamp: new Date(),
        tokens: response.tokens,
        latency,
        model: response.model,
        backend: response.backend,
        retrievedContext: ragResults.length > 0 ? ragResults : undefined,
        citations: searchResults.length > 0 
          ? searchResults.map(r => ({ text: r.snippet, url: r.url, title: r.title }))
          : undefined,
      }

      addMessage(assistantMessage)
      if (response.tokens) {
        updateStats(response.tokens.total, latency)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
      setStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      const result = await uploadFile(file)
      addFile({
        id: result.fileId,
        name: result.name,
        type: file.type,
        size: result.size,
        uploadedAt: new Date(Date.now()),
        processed: result.processed,
        chunks: result.chunks,
      })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="glass-panel m-4 mb-0 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-gray-400">
            {settings.activeModel || 'Select a model to start'}
          </p>
        </div>
        <button
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isRightSidebarOpen ? 'bg-primary/20 text-primary' : 'hover:bg-glass-hover'
          }`}
          aria-label="Toggle stats sidebar"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input Area */}
      <div className="glass-panel m-4 mt-0 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-glass-hover rounded-lg transition-colors self-end mb-1"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="glass-input w-full resize-none min-h-[44px] max-h-[200px] scrollbar-thin"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all self-end mb-1 ${
              input.trim() && !isLoading
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-glass-bg text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
