import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chatApi } from '../utils/api'
import { formatTimestamp, truncateText, generateChatId } from '../utils/helpers'
import { Plus, Settings, Trash2, MessageSquare, X, History, Home } from 'lucide-react'

function Sidebar({ userId, onClose, isMobile }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [showNewChatForm, setShowNewChatForm] = useState(false)
  const navigate = useNavigate()

  // Fetch chats on mount
  useEffect(() => {
    fetchChats()
  }, [userId])

  const fetchChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await chatApi.listChats(0, 50)
      setChats(data)
    } catch (err) {
      setError('Failed to load chats')
      console.error('Error fetching chats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = async () => {
    try {
      setLoading(true)
      const title = newChatTitle.trim() || 'New Chat'
      
      const newChat = await chatApi.createChat(title)
      setChats([newChat, ...chats])
      setNewChatTitle('')
      setShowNewChatForm(false)
      
      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`)
      
      // Close sidebar on mobile
      if (isMobile && onClose) {
        onClose()
      }
    } catch (err) {
      setError('Failed to create new chat')
      console.error('Error creating chat:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    
    try {
      await chatApi.deleteChat(chatId)
      setChats(chats.filter(chat => chat.id !== chatId))
    } catch (err) {
      setError('Failed to delete chat')
      console.error('Error deleting chat:', err)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNewChat()
    }
  }

  return (
    <div className="w-72 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">AI Chatbot</span>
          </Link>
          
          {/* Close button for mobile */}
          {isMobile && (
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* New chat button */}
      <div className="p-4">
        {!showNewChatForm ? (
          <button 
            onClick={() => setShowNewChatForm(true)}
            className="w-full btn btn-primary space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chat title..."
              className="input"
              autoFocus
            />
            <div className="flex space-x-2">
              <button 
                onClick={handleNewChat}
                disabled={loading}
                className="flex-1 btn btn-primary"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => {
                  setShowNewChatForm(false)
                  setNewChatTitle('')
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {/* All chats link */}
          <Link 
            to="/"
            onClick={onClose}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Home</span>
          </Link>

          {/* Recent chats */}
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</span>
          </div>

          {error && (
            <div className="p-3 text-red-500 text-sm">{error}</div>
          )}

          {loading && chats.length === 0 ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            </div>
          ) : (
            chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(chat.updated_at)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
            ))
          )}

          {!loading && chats.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link 
          to="/settings"
          onClick={onClose}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </div>
  )
}

export default Sidebar
