export const modelConfigs = {
  chat: {
    // High-performance models with higher rate limits
    highPerformance: [
      {
        id: 'mixtral-8x7b-32768',
        requestsPerMinute: 30,
        requestsPerDay: 14400,
        tokensPerMinute: 5000,
        tokensPerDay: 500000,
        priority: 1
      },
      {
        id: 'llama3-70b-8192',
        requestsPerMinute: 30,
        requestsPerDay: 14400,
        tokensPerMinute: 6000,
        tokensPerDay: 500000,
        priority: 2
      }
    ],
    // Standard models with balanced performance
    standard: [
      {
        id: 'llama-3.2-3b-preview',
        requestsPerMinute: 30,
        requestsPerDay: 7000,
        tokensPerMinute: 7000,
        tokensPerDay: 500000,
        priority: 1
      },
      {
        id: 'llama-3.2-1b-preview',
        requestsPerMinute: 30,
        requestsPerDay: 7000,
        tokensPerMinute: 7000,
        tokensPerDay: 500000,
        priority: 2
      }
    ]
  },
  vision: {
    standard: [
      {
        id: 'llama-3.2-11b-vision-preview',
        requestsPerMinute: 30,
        requestsPerDay: 7000,
        tokensPerMinute: 7000,
        tokensPerDay: 500000,
        priority: 1
      },
      {
        id: 'llama-3.2-90b-vision-preview',
        requestsPerMinute: 15,
        requestsPerDay: 3500,
        tokensPerMinute: 7000,
        tokensPerDay: 250000,
        priority: 2
      }
    ]
  },
  speech: {
    standard: [
      {
        id: 'whisper-large-v3-turbo',
        requestsPerMinute: 20,
        requestsPerDay: 2000,
        audioSecondsPerHour: 7200,
        audioSecondsPerDay: 28800,
        priority: 1
      },
      {
        id: 'whisper-large-v3',
        requestsPerMinute: 20,
        requestsPerDay: 2000,
        audioSecondsPerHour: 7200,
        audioSecondsPerDay: 28800,
        priority: 2
      }
    ]
  }
};

// Usage tracking for rate limiting
const usage = {
  models: new Map()
};

// Reset usage counters periodically
setInterval(() => {
  usage.models.clear();
}, 60000); // Reset every minute

// Get model usage
const getModelUsage = (modelId) => {
  if (!usage.models.has(modelId)) {
    usage.models.set(modelId, {
      requests: 0,
      tokens: 0,
      lastReset: Date.now()
    });
  }
  return usage.models.get(modelId);
};

// Update model usage
const updateModelUsage = (modelId, tokens = 0) => {
  const modelUsage = getModelUsage(modelId);
  modelUsage.requests++;
  modelUsage.tokens += tokens;
};

// Check if model is within rate limits
const isWithinRateLimits = (model) => {
  const modelUsage = getModelUsage(model.id);
  return modelUsage.requests < model.requestsPerMinute;
};

// Select the best available model based on type and current usage
export const selectModel = (type = 'chat', tier = 'standard') => {
  const models = modelConfigs[type]?.[tier] || modelConfigs.chat.standard;
  
  // Find the first available model that's within rate limits
  const availableModel = models.find(model => isWithinRateLimits(model));
  
  if (!availableModel) {
    throw new Error('No models available within rate limits');
  }
  
  return availableModel;
};

// Track model usage and return the model ID that was used
export const trackModelUsage = (modelId, tokens = 0) => {
  updateModelUsage(modelId, tokens);
  return modelId;
};
