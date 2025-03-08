// Chat History Service to manage chat operations

// Function to save chat messages to local storage
const saveChatHistory = (messages, chatId) => {
  try {
    const userId = localStorage.getItem('authToken'); // Using auth token as user identifier
    if (!userId) return false;

    // Get existing chats or initialize empty object
    const existingChats = JSON.parse(localStorage.getItem(`chats_${userId}`)) || {};

    // Save chat with timestamp if it's a new chat
    if (!existingChats[chatId]) {
      existingChats[chatId] = {
        id: chatId,
        timestamp: new Date().toISOString(),
        title: generateChatTitle(messages),
        messages: []
      };
    }

    // Update messages
    existingChats[chatId].messages = messages;
    
    // Save back to localStorage
    localStorage.setItem(`chats_${userId}`, JSON.stringify(existingChats));
    return true;
  } catch (error) {
    console.error('Error saving chat history:', error);
    return false;
  }
};

// Function to load all chat histories for the user
const loadAllChatHistories = () => {
  try {
    const userId = localStorage.getItem('authToken');
    if (!userId) return [];

    const chats = JSON.parse(localStorage.getItem(`chats_${userId}`)) || {};
    return Object.values(chats).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error('Error loading chat histories:', error);
    return [];
  }
};

// Function to load a specific chat history
const loadChatHistory = (chatId) => {
  try {
    const userId = localStorage.getItem('authToken');
    if (!userId) return null;

    const chats = JSON.parse(localStorage.getItem(`chats_${userId}`)) || {};
    return chats[chatId] || null;
  } catch (error) {
    console.error('Error loading chat history:', error);
    return null;
  }
};

// Function to delete a chat history
const deleteChatHistory = (chatId) => {
  try {
    const userId = localStorage.getItem('authToken');
    if (!userId) return false;

    const chats = JSON.parse(localStorage.getItem(`chats_${userId}`)) || {};
    if (chats[chatId]) {
      delete chats[chatId];
      localStorage.setItem(`chats_${userId}`, JSON.stringify(chats));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return false;
  }
};

// Helper function to generate a chat title from the first message
const generateChatTitle = (messages) => {
  if (!messages || messages.length === 0) return 'New Chat';
  const firstMessage = messages[0].text;
  return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
};

export {
  saveChatHistory,
  loadAllChatHistories,
  loadChatHistory,
  deleteChatHistory
};