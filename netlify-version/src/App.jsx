import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ReactMarkdown from 'react-markdown'
import { Send, Loader2, User, Bot, Settings, Trash2, X, Copy, Menu, X as CloseIcon } from 'lucide-react'

// Storage keys
const STORAGE_KEYS = {
  USER_ID: 'groq-chatbot-user-id',
  CHATS: 'groq-chatbot-chats',
  SETTINGS: 'groq-chatbot-settings'
}

// Default settings
const DEFAULT_SETTINGS = {
  modelId: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  customInstructions: null
}

// Available models
const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { id: 'llama-3.2-90b-vision', name: 'Llama 3.2 90B Vision' },
  { id: 'llama-3.2-11b-vision', name: 'Llama 3.2 11B Vision' },
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3B' },
  { id: 'llama-3.2-1b', name: 'Llama 3.2 1B' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32768' }
]

function App() {
  // State
  const [userId, setUserId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (stored) return stored
    const newId = uuidv4()
    localStorage.setItem(STORAGE_KEYS.USER_ID, newId)
    return newId
  })
  
  const [chats, setChats] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHATS)
    return stored ? JSON.parse(stored) : []
  })
  
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS
  })
  
  const [showSettings, setShowSettings] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  const messagesEndRef = React.useRef(null)
  const inputRef = React.useRef(null)

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setShowSidebar(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats))
  }, [chats])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }, [settings])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load chat when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      const chat = chats.find(c => c.id === currentChatId)
      if (chat) {
        setMessages(chat.messages || [])
      } else {
        setMessages([])
      }
    } else {
      setMessages([])
    }
    setInputValue('')
  }, [currentChatId, chats])

  // Focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentChatId])

  // Create new chat
  const createNewChat = useCallback(() => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    }
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    if (isMobile) setShowSidebar(false)
    return newChat
  }, [isMobile])

  // Update chat title
  const updateChatTitle = useCallback((chatId, title) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title, updatedAt: new Date().toISOString() } : chat
    ))
  }, [])

  // Delete chat
  const deleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }, [currentChatId])

  // Send message
  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const content = inputValue.trim()
    setInputValue('')
    setError(null)

    try {
      setLoading(true)

      // Get current chat
      let chat = chats.find(c => c.id === currentChatId)
      
      // If no chat, create one
      if (!chat) {
        chat = createNewChat()
      }

      // Add user message
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }

      // Optimistic update
      const updatedChat = {
        ...chat,
        messages: [...(chat.messages || []), userMessage],
        updatedAt: new Date().toISOString()
      }
      
      setChats(prev => prev.map(c => c.id === chat.id ? updatedChat : c))
      setMessages(updatedChat.messages)

      // Update title if first message
      if (chat.messages && chat.messages.length === 0) {
        updateChatTitle(chat.id, content.substring(0, 40))
      }

      // Call Groq API via Netlify Function
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          settings
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage = {
        id: data.id || uuidv4(),
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString()
      }

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      }

      setChats(prev => prev.map(c => c.id === chat.id ? finalChat : c))
      setMessages(finalChat.messages)

    } catch (err) {
      setError(err.message || 'Failed to send message')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle key down
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Render message
  const renderMessage = (message) => {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'

    return (
      <div 
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
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
            ) : (
              <Bot className="w-4 h-4 text-gray-600" />
            )}
          </div>

          {/* Message content */}
          <div 
            className={`rounded-2xl px-4 py-3 ${
              isUser ? 'message-user' : 'message-assistant'
            }`}
          >
            <ReactMarkdown className="prose text-sm">
              {message.content}
            </ReactMarkdown>
            
            {/* Copy button */}
            <button
              onClick={() => copyToClipboard(message.content)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-opacity mt-1"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create new chat handler
  const handleNewChat = () => {
    createNewChat()
    if (isMobile) setShowSidebar(false)
  }

  // Toggle settings
  const toggleSettings = () => {
    setShowSettings(prev => !prev)
    if (isMobile && showSidebar) setShowSidebar(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <>
          <div 
            className={`fixed md:relative z-40 h-full md:h-auto md:translate-x-0 transition-transform duration-300 ease-in-out ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="w-72 h-full bg-white border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg">Groq Chat</span>
                  </div>
                  
                  {isMobile && (
                    <button 
                      onClick={() => setShowSidebar(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* New chat button */}
              <div className="p-4">
                <button 
                  onClick={handleNewChat}
                  className="w-full btn btn-primary space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-auto p-2">
                <div className="space-y-1">
                  {chats.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      No chats yet. Start a new conversation!
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          setCurrentChatId(chat.id)
                          if (isMobile) setShowSidebar(false)
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          currentChatId === chat.id 
                            ? 'bg-primary-50 border border-primary-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(chat.updatedAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChat(chat.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={toggleSettings}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Settings</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Overlay for mobile */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile header */}
        {isMobile && (
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowSidebar(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-medium">
                {currentChatId 
                  ? chats.find(c => c.id === currentChatId)?.title || 'New Chat'
                  : 'New Chat'
                }
              </span>
            </div>
          </header>
        )}

        {/* Chat area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
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
                    I'm your AI assistant powered by Groq's <strong>{settings.modelId}</strong> model.
                    Ask me anything!
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

            {/* Input */}
            <div className="border-t border-gray-200 p-4 md:p-6 bg-white">
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
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || loading}
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
                  Powered by Groq API
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleSettings}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md max-h-[90vh] overflow-auto">
            <SettingsModal
              settings={settings}
              setSettings={setSettings}
              onClose={toggleSettings}
              availableModels={AVAILABLE_MODELS}
            />
          </div>
        </>
      )}
    </div>
  )
}

// Settings Modal Component
function SettingsModal({ settings, setSettings, onClose, availableModels }) {
  const [formData, setFormData] = useState(settings)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSettings(formData)
    onClose()
  }

  const handleReset = () => {
    setFormData(DEFAULT_SETTINGS)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Model */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Model</label>
          <select
            name="modelId"
            value={formData.modelId}
            onChange={handleChange}
            className="input"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Temperature: {formData.temperature}</label>
            <span className="text-xs text-gray-500">{formData.temperature < 0.5 ? 'Precise' : formData.temperature > 1.5 ? 'Creative' : 'Balanced'}</span>
          </div>
          <input
            type="range"
            name="temperature"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Max Tokens: {formData.maxTokens}</label>
          </div>
          <input
            type="range"
            name="maxTokens"
            min="256"
            max="8192"
            step="256"
            value={formData.maxTokens}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Top-p */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Top-p: {formData.topP}</label>
          </div>
          <input
            type="range"
            name="topP"
            min="0"
            max="1"
            step="0.1"
            value={formData.topP}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Custom Instructions</label>
          <textarea
            name="customInstructions"
            value={formData.customInstructions || ''}
            onChange={handleChange}
            placeholder="Add custom instructions for the AI..."
            rows={3}
            className="input"
          />
          <p className="text-xs text-gray-500">
            These instructions will be prepended to every conversation
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}

// Helper component for Plus icon
function Plus() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
}

export default App
