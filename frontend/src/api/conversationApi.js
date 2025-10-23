import axiosClient from './axiosClient';

const conversationApi = {
  createConversation: (data) => axiosClient.post('/conversations', data),

  getConversationById: (id) => axiosClient.get(`/conversations/${id}`),

  getConversationWithMessages: (id) => axiosClient.get(`/conversations/${id}/messages`),

  getConversationsByPatient: (patientId) =>
    axiosClient.get(`/conversations/by-patient?patientId=${patientId}`),

  getConversationsByDoctor: (doctorId) =>
    axiosClient.get(`/conversations/by-doctor?doctorId=${doctorId}`),

  getConversationByPatientAndDoctor: (patientId, doctorId) =>
    axiosClient.get(
      `/conversations/by-patient-and-doctor?patientId=${patientId}&doctorId=${doctorId}`
    ),

  deleteConversation: (id) => axiosClient.delete(`/conversations/${id}`),

  countByPatient: (patientId) =>
    axiosClient.get(`/conversations/count/by-patient?patientId=${patientId}`),

  countByDoctor: (doctorId) =>
    axiosClient.get(`/conversations/count/by-doctor?doctorId=${doctorId}`),
};

export default conversationApi;
