import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Sends a message to the chatbot backend
 * @param {string} message - The user's message
 * @returns {Promise<object>} - Structured bot reply
 */
export const sendMessageToBot = async (message) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/gemini-chat`, { message }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.status && response.data.status !== 'success') {
      const errMsg = response.data.error || response.data.message || 'Lỗi từ server chatbot';
      throw new Error(errMsg);
    }

    return response.data;
  } catch (error) {
    console.error('Error sending message to bot:', error);

    if (error.response) {
      throw new Error(`Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
    } else {
      throw new Error('Có lỗi xảy ra khi gửi tin nhắn.');
    }
  }
};
