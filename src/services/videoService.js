import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Function to check if the server is running
export const checkServerStatus = async () => {
  try {
    await axios.get(`${API_URL}/api/health`);
    return true;
  } catch (error) {
    console.error('Server status check failed:', error);
    return false;
  }
};

export const generateVideo = async (prompt) => {
  try {
    const isServerRunning = await checkServerStatus();
    if (!isServerRunning) {
      return {
        success: false,
        error: 'Video generation service is not available. Please ensure the server is running.',
      };
    }

    const response = await axios.post(`${API_URL}/api/generate-video`, {
      prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      success: true,
      videoUrl: response.data.videoUrl,
    };
  } catch (error) {
    console.error('Error generating video:', error);
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Unable to connect to the video generation service. Please ensure the server is running.',
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timed out. Please try again.',
      };
    }

    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate video. Please try again later.',
    };
  }
};