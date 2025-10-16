import axiosClient from './axiosClient';

const messageApi = {
  // Tạo message mới
  createMessage: (data) => axiosClient.post('/messages', data),

  // Lấy messages theo conversationId
  getByConversation: (conversationId) =>
    axiosClient.get(`/messages/by-conversation?conversationId=${conversationId}`),

  // Lấy messages mới từ thời điểm since (ISO string)
  getNewMessages: (conversationId, sinceIso) =>
    axiosClient.get(`/messages/new?conversationId=${conversationId}&since=${sinceIso}`),

  // Lấy tin nhắn mới nhất của conversation
  getLatestByConversation: (conversationId) =>
    axiosClient.get(`/messages/latest/by-conversation?conversationId=${conversationId}`),

  // Lấy message theo ID
  getById: (id) => axiosClient.get(`/messages/${id}`),

  // Cập nhật message
  update: (id, data) => axiosClient.put(`/messages/${id}`, data),

  // Xoá message
  remove: (id) => axiosClient.delete(`/messages/${id}`),
};

export default messageApi;


