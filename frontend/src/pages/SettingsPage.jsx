import React from 'react'
import SettingsForm from '../components/SettingsForm'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function SettingsPage({ userId }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
        </div>
      </header>

      {/* Settings form */}
      <div className="flex-1 overflow-auto">
        <SettingsForm userId={userId} onClose={() => navigate(-1)} />
      </div>
    </div>
  )
}

export default SettingsPage
