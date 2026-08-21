/**
 * API client for the AI chatbot
 */

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include user ID
api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('ai-chatbot-user-id');
    if (userId && config.headers) {
      config.headers.Authorization = `Bearer ${userId}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error statuses
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login if needed
          break;
        case 404:
          // Not found
          break;
        case 500:
          // Server error
          break;
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Chat API functions
 */
export const chatApi = {
  // Create a new chat
  createChat: async (title = 'New Chat', systemPrompt = null) => {
    const response = await api.post('/chats/', {
      title,
      system_prompt: systemPrompt,
    });
    return response.data;
  },

  // Get all chats
  listChats: async (skip = 0, limit = 100) => {
    const response = await api.get('/chats/', {
      params: { skip, limit },
    });
    return response.data;
  },

  // Get a specific chat
  getChat: async (chatId) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  // Update a chat
  updateChat: async (chatId, updates) => {
    const response = await api.put(`/chats/${chatId}`, updates);
    return response.data;
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    await api.delete(`/chats/${chatId}`);
    return true;
  },

  // Get messages for a chat
  getMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },

  // Send a message to a chat
  sendMessage: async (chatId, content, role = 'user') => {
    const response = await api.post(`/chats/${chatId}/messages`, {
      role,
      content,
    });
    return response.data;
  },

  // Stream a message (SSE)
  streamMessage: async (chatId, content, onMessage, onError) => {
    const eventSource = new EventSource(
      `/api/v1/chats/${chatId}/messages/stream?content=${encodeURIComponent(content)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        onError(error);
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      onError(error);
    };

    return () => {
      eventSource.close();
    };
  },
};

/**
 * Settings API functions
 */
export const settingsApi = {
  // Get user settings
  getSettings: async () => {
    const response = await api.get('/settings/');
    return response.data;
  },

  // Update user settings
  updateSettings: async (updates) => {
    const response = await api.put('/settings/', updates);
    return response.data;
  },

  // Get default settings
  getDefaultSettings: async () => {
    const response = await api.get('/settings/default');
    return response.data;
  },
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

/**
 * General API info
 */
export const getApiInfo = async () => {
  const response = await api.get('/');
  return response.data;
};

export default api;
