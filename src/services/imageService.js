import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const generateImage = async (prompt) => {
  try {
    const response = await axios.post(`${API_URL}/api/generate-image`, {
      prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      imageUrl: response.data.imageUrl,
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to generate image',
    };
  }
};