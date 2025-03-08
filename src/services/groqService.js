import { selectModel, trackModelUsage } from './modelConfig';

const GROQ_API_ENDPOINTS = {
  chat: 'https://api.groq.com/openai/v1/chat/completions',
  vision: 'https://api.groq.com/openai/v1/images/generations'
};
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const sendMessageToGroq = async (message, tier = 'standard') => {
  // Determine if the message is requesting image generation
  const type = message.toLowerCase().includes('generate image') || 
               message.toLowerCase().includes('create image') || 
               message.toLowerCase().includes('make image') ? 'vision' : 'chat';
  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ API key is not configured');
    }

    // Select the best available model based on type and current usage
    const selectedModel = selectModel(type, tier);

    const endpoint = GROQ_API_ENDPOINTS[type] || GROQ_API_ENDPOINTS.chat;
    const payload = type === 'vision' ? {
      prompt: message,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    } : {
      model: selectedModel.id,
      messages: [{ role: 'user', content: message }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Track the usage of the model
    trackModelUsage(selectedModel.id, data.usage?.total_tokens || 0);
    
    return {
      success: true,
      content: type === 'vision' ? data.data[0].url : data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error in sendMessageToGroq:', error);
    return {
      success: false,
      error: error.message || 'Sorry, there was an error processing your request.'
    };
  }
}