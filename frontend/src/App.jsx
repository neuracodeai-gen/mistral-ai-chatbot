import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import Sidebar from './components/Sidebar'
import { generateUserId } from './utils/helpers'

function App() {
  const [userId] = useState(generateUserId)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Check if we're on a mobile device
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile by default */}
      <div 
        className={`fixed md:relative z-40 h-full md:h-auto md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar 
          userId={userId} 
          onClose={() => setIsSidebarOpen(false)} 
          isMobile={isMobile}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Routes */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ChatPage userId={userId} />} />
            <Route path="/chat" element={<ChatPage userId={userId} />} />
            <Route path="/chat/:chatId" element={<ChatPage userId={userId} />} />
            <Route path="/settings" element={<SettingsPage userId={userId} />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
