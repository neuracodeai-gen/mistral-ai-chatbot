import React, { useState, useEffect } from 'react'
import { settingsApi } from '../utils/api'
import { X, Check, Thermometer, Sliders, MessageSquare, Type, Trash2 } from 'lucide-react'

function SettingsForm({ userId, onClose }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    model_id: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
    custom_instructions: ''
  })

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (userId) {
          const userSettings = await settingsApi.getSettings()
          setSettings(userSettings)
          setFormData({
            model_id: userSettings.model_id || 'llama-3.3-70b-versatile',
            temperature: userSettings.temperature || 0.7,
            max_tokens: userSettings.max_tokens || 4096,
            top_p: userSettings.top_p || 0.9,
            custom_instructions: userSettings.custom_instructions || ''
          })
        } else {
          // Use default settings
          const defaultSettings = await settingsApi.getDefaultSettings()
          setFormData({
            model_id: defaultSettings.model_id,
            temperature: defaultSettings.temperature,
            max_tokens: defaultSettings.max_tokens,
            top_p: defaultSettings.top_p,
            custom_instructions: defaultSettings.custom_instructions || ''
          })
        }
      } catch (err) {
        setError('Failed to load settings')
        console.error('Error fetching settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      
      // Validate form data
      if (formData.temperature < 0 || formData.temperature > 2) {
        setError('Temperature must be between 0 and 2')
        return
      }
      
      if (formData.max_tokens < 1 || formData.max_tokens > 8192) {
        setError('Max tokens must be between 1 and 8192')
        return
      }
      
      if (formData.top_p < 0 || formData.top_p > 1) {
        setError('Top-p must be between 0 and 1')
        return
      }

      // Save settings
      const updatedSettings = await settingsApi.updateSettings(formData)
      setSettings(updatedSettings)
      setSuccess(true)
      
      // Close after a delay
      setTimeout(() => {
        if (onClose) onClose()
      }, 1000)
    } catch (err) {
      setError('Failed to save settings')
      console.error('Error saving settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        model_id: settings.model_id || 'llama-3.3-70b-versatile',
        temperature: settings.temperature || 0.7,
        max_tokens: settings.max_tokens || 4096,
        top_p: settings.top_p || 0.9,
        custom_instructions: settings.custom_instructions || ''
      })
    }
  }

  const handleClearCustomInstructions = () => {
    setFormData(prev => ({
      ...prev,
      custom_instructions: ''
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-600 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Model
          </label>
          <select
            name="model_id"
            value={formData.model_id}
            onChange={handleChange}
            className="input"
            disabled={saving}
          >
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
            <option value="llama-3.2-90b-vision">Llama 3.2 90B Vision</option>
            <option value="llama-3.2-11b-vision">Llama 3.2 11B Vision</option>
            <option value="llama-3.2-3b">Llama 3.2 3B</option>
            <option value="llama-3.2-1b">Llama 3.2 1B</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B 32768</option>
          </select>
          <p className="text-xs text-gray-500">
            The AI model to use for generating responses
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Thermometer className="w-4 h-4 inline mr-2" />
            Temperature: {formData.temperature}
          </label>
          <input
            type="range"
            name="temperature"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={saving}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Precise</span>
            <span>Creative</span>
          </div>
          <p className="text-xs text-gray-500">
            Controls randomness. Lower values produce more deterministic responses.
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Type className="w-4 h-4 inline mr-2" />
            Max Tokens: {formData.max_tokens}
          </label>
          <input
            type="range"
            name="max_tokens"
            min="1"
            max="8192"
            step="256"
            value={formData.max_tokens}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={saving}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1</span>
            <span>8192</span>
          </div>
          <p className="text-xs text-gray-500">
            Maximum number of tokens (words and punctuation) in the response.
          </p>
        </div>

        {/* Top-p */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Sliders className="w-4 h-4 inline mr-2" />
            Top-p: {formData.top_p}
          </label>
          <input
            type="range"
            name="top_p"
            min="0"
            max="1"
            step="0.1"
            value={formData.top_p}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={saving}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>1</span>
          </div>
          <p className="text-xs text-gray-500">
            Nucleus sampling parameter. Lower values focus on more likely tokens.
          </p>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Custom Instructions
            </label>
            {formData.custom_instructions && (
              <button
                type="button"
                onClick={handleClearCustomInstructions}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <textarea
            name="custom_instructions"
            value={formData.custom_instructions}
            onChange={handleChange}
            placeholder="Add custom instructions for the AI. For example: 'You are a helpful assistant that always responds in a friendly tone.'"
            rows={4}
            className="input"
            disabled={saving}
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
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary space-x-2"
            disabled={saving}
          >
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            {success && !saving && <Check className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SettingsForm
