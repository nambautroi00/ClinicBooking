import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Sends a message to the chatbot backend
 * @param {string} message - The user's message
 * @returns {Promise<string>} - The bot's reply
 */
export const sendMessageToBot = async (message) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/gemini-chat`, {
      message: message
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // If backend indicates failure, throw so frontend can show an error
    if (response.data && response.data.status && response.data.status !== 'success') {
      const errMsg = response.data.error || response.data.message || 'Lỗi từ server chatbot';
      throw new Error(errMsg);
    }

    // Return the reply from the response
    return response.data.message;
  } catch (error) {
    console.error('Error sending message to bot:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối.');
    } else {
      // Something else happened
      throw new Error('Có lỗi xảy ra khi gửi tin nhắn.');
    }
  }
};
