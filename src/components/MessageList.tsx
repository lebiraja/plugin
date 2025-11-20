import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { User, Bot, Loader2 } from 'lucide-react'
import type { Message } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} index={index} />
        ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-glass-bg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div className="assistant-message message-bubble">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1, type: "spring" }}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-gradient-to-br from-primary to-primary-dark' : 'bg-glass-bg backdrop-blur-xl'
        }`}
      >
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
      </motion.div>

      <div className={`flex-1 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.15 }}
          className={`message-bubble relative group ${
            isUser 
              ? 'user-message bg-gradient-to-br from-primary to-primary-dark' 
              : 'assistant-message bg-glass-bg backdrop-blur-xl border border-glass-border'
          }`}
        >
          {/* Glow effect for assistant messages */}
          {!isUser && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          
          <div className="prose prose-invert prose-sm max-w-none relative z-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Citations if available */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-glass-border space-y-1">
              <div className="text-xs text-gray-400 font-medium">Sources:</div>
              {message.citations.map((citation, idx) => (
                <a
                  key={idx}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary hover:underline"
                >
                  [{idx + 1}] {citation.title}
                </a>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
          className="flex items-center gap-3 mt-2 text-xs text-gray-500"
        >
          <span>{format(message.timestamp, 'HH:mm')}</span>
          {message.tokens && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {message.tokens.total} tokens
            </span>
          )}
          {message.latency && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              {message.latency}ms
            </span>
          )}
          {message.model && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              {message.model}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
