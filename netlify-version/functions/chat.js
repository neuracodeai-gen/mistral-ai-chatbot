/**
 * Netlify Function for Groq Chat API
 * Handles chat requests and returns AI responses
 */

const groq = require('groq');

// Initialize Groq client
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL_ID = process.env.MODEL_ID || 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
}

const client = new groq.Groq({ apiKey: GROQ_API_KEY });

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { messages, settings = {} } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    // Get settings with defaults
    const modelId = settings.modelId || MODEL_ID;
    const temperature = settings.temperature || 0.7;
    const maxTokens = settings.maxTokens || 4096;
    const topP = settings.topP || 0.9;
    
    // Add custom instructions as system message if provided
    const apiMessages = [...messages];
    if (settings.customInstructions) {
      // Remove existing system messages
      const filtered = apiMessages.filter(msg => msg.role !== 'system');
      // Add custom instructions as first message
      apiMessages = [
        { role: 'system', content: settings.customInstructions },
        ...filtered
      ];
    }

    // Make Groq API call
    const response = await client.chat.completions.create({
      model: modelId,
      messages: apiMessages,
      temperature: parseFloat(temperature),
      max_tokens: parseInt(maxTokens),
      top_p: parseFloat(topP),
      stream: false
    });

    // Extract response
    const choice = response.choices[0];
    const message = choice.message;

    // Return formatted response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: response.id,
        role: 'assistant',
        content: message.content || '',
        timestamp: new Date().toISOString(),
        model: modelId,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : null
      })
    };

  } catch (error) {
    console.error('Error in chat function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate response',
        details: error.message || String(error)
      })
    };
  }
};
