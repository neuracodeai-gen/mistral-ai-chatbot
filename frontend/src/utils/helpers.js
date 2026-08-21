/**
 * Utility helper functions for the AI chatbot
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique user ID and store it in localStorage
 */
export function generateUserId() {
  const storageKey = 'ai-chatbot-user-id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
}

/**
 * Generate a unique chat ID
 */
export function generateChatId() {
  return uuidv4();
}

/**
 * Generate a unique message ID
 */
export function generateMessageId() {
  return uuidv4();
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Format a date for display
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Debounce a function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a default chat title from the first message
 */
export function generateChatTitle(firstMessage, maxLength = 40) {
  if (!firstMessage) return 'New Chat';
  
  // Remove common prefixes
  let title = firstMessage.replace(/^(Hey|Hi|Hello|Hey there|Hi there|What's up|Yo|Greetings)[,.!\s]*/i, '');
  
  // Trim and truncate
  title = title.trim();
  
  if (title.length === 0) {
    return 'New Chat';
  }
  
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...';
  }
  
  return title;
}

/**
 * Check if a string is empty or whitespace
 */
export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Get initials from a name
 */
export function getInitials(name, maxLength = 2) {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  let initials = '';
  
  for (let i = 0; i < Math.min(words.length, maxLength); i++) {
    if (words[i].length > 0) {
      initials += words[i][0].toUpperCase();
    }
  }
  
  return initials || '?';
}
