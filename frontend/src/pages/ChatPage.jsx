import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ChatContainer from '../components/ChatContainer'
import { Plus, Settings } from 'lucide-react'

function ChatPage({ userId }) {
  const { chatId } = useParams()
  const [title, setTitle] = useState('New Chat')

  useEffect(() => {
    // Update title when chat changes
    if (!chatId) {
      setTitle('New Chat')
    }
  }, [chatId])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Desktop header */}
      <header className="hidden md:block border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <div className="flex items-center space-x-2">
            <a 
              href="/settings"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </a>
          </div>
        </div>
      </header>

      {/* Chat container */}
      <ChatContainer 
        userId={userId} 
        chatId={chatId} 
        onTitleChange={setTitle}
      />
    </div>
  )
}

export default ChatPage
