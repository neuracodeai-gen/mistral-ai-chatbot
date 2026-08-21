import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Loader2, User, Bot, Trash2, Edit2, Check, X, Copy } from 'lucide-react'
import { chatApi } from '../utils/api'
import { formatTimestamp, isEmpty, generateChatTitle } from '../utils/helpers'

function ChatContainer({ userId, chatId, onTitleChange }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatInfo, setChatInfo] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch chat and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (chatId) {
          // Fetch chat info
          const chat = await chatApi.getChat(chatId)
          setChatInfo(chat)
          if (onTitleChange && chat.title) {
            onTitleChange(chat.title)
          }
          
          // Fetch messages
          const chatMessages = await chatApi.getMessages(chatId)
          setMessages(chatMessages)
        } else {
          // New chat - start fresh
          setMessages([])
          setChatInfo(null)
          if (onTitleChange) {
            onTitleChange('New Chat')
          }
        }
      } catch (err) {
        setError('Failed to load chat')
        console.error('Error fetching chat:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chatId, onTitleChange])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (isEmpty(inputValue) || loading) return

    const content = inputValue.trim()
    if (isEmpty(content)) return

    try {
      setLoading(true)
      setError(null)
      setInputValue('')

      // Optimistic update - add user message immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        token_count: null
      }
      
      setMessages(prev => [...prev, userMessage])

      // If this is a new chat, create it first
      let currentChatId = chatId
      if (!currentChatId) {
        const title = generateChatTitle(content)
        const newChat = await chatApi.createChat(title)
        currentChatId = newChat.id
        setChatInfo(newChat)
        if (onTitleChange) {
          onTitleChange(title)
        }
      }

      // Send the message and get response
      const response = await chatApi.sendMessage(currentChatId, content)
      
      // Update the user message with actual ID and timestamp
      const updatedMessages = messages.map(msg => 
        msg.id === userMessage.id ? { ...msg, id: response.id, timestamp: response.timestamp } : msg
      )
      
      // Add the assistant response
      setMessages([...updatedMessages, response])

    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
      // Remove the optimistic user message
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    if (!chatId) return
    
    try {
      await chatApi.deleteChat(chatId)
      setMessages([])
      setChatInfo(null)
      if (onTitleChange) {
        onTitleChange('New Chat')
      }
    } catch (err) {
      setError('Failed to clear chat')
      console.error('Error clearing chat:', err)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const renderMessage = (message) => {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'
    const isSystem = message.role === 'system'

    return (
      <div 
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${isSystem ? 'mb-2' : ''}`}
      >
        <div 
          className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-600' : 'bg-gray-200'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : isAssistant ? (
              <Bot className="w-4 h-4 text-gray-600" />
            ) : (
              <span className="text-xs text-gray-500">S</span>
            )}
          </div>

          {/* Message content */}
          <div 
            className={`rounded-2xl px-4 py-3 ${isSystem ? 'rounded-lg' : ''} ${
              isUser ? 'message-user' : isAssistant ? 'message-assistant' : 'message-system'
            }`}
          >
            {isSystem ? (
              <span className="text-xs">{message.content}</span>
            ) : (
              <ReactMarkdown className="prose text-sm">
                {message.content}
              </ReactMarkdown>
            )}
            
            {/* Message actions */}
            {!isSystem && (
              <div className="flex items-center justify-end mt-2 -mb-2 -mr-1">
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-opacity"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header - shown only on mobile or when chat exists */}
      {(chatId || messages.length > 0) && (
        <div className="md:hidden border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{chatInfo?.title || 'New Chat'}</span>
            <button
              onClick={handleClearChat}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">
              {error}
              <button 
                onClick={() => setError(null)}
                className="float-right mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Hello!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                I'm your AI assistant powered by Groq's {import.meta.env.VITE_MODEL_ID || 'llama-3.3-70b-versatile'} model.
                Ask me anything, and I'll do my best to help!
              </p>
            </div>
          )}

          <div className="space-y-2">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loading ? "Waiting for response..." : "Type your message... (Shift+Enter for new line)"}
              disabled={loading}
              className="input w-full pr-12 resize-none min-h-[44px] max-h-[200px]"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={isEmpty(inputValue) || loading}
              className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:bg-primary-400"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by Groq API with llama-3.3-70b-versatile model
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatContainer
