import axiosClient from './axiosClient';

const conversationApi = {
  // Tạo conversation mới
  createConversation: (data) => {
    const url = '/conversations';
    return axiosClient.post(url, data);
  },

  // Lấy conversation theo ID
  getConversationById: (id) => {
    const url = `/conversations/${id}`;
    return axiosClient.get(url);
  },

  // Lấy conversation với messages (đúng route backend)
  getConversationWithMessages: (id) => {
    const url = `/conversations/${id}/messages`;
    return axiosClient.get(url);
  },

  // Lấy danh sách conversation của patient (đúng route backend)
  getConversationsByPatient: (patientId) => {
    const url = `/conversations/by-patient?patientId=${patientId}`;
    return axiosClient.get(url);
  },

  // Lấy danh sách conversation của doctor (đúng route backend)
  getConversationsByDoctor: (doctorId) => {
    const url = `/conversations/by-doctor?doctorId=${doctorId}`;
    return axiosClient.get(url);
  },

  // Lấy conversation giữa patient và doctor (đúng route backend)
  getConversationByPatientAndDoctor: (patientId, doctorId) => {
    const url = `/conversations/by-patient-and-doctor?patientId=${patientId}&doctorId=${doctorId}`;
    return axiosClient.get(url);
  },

  // Xóa conversation
  deleteConversation: (id) => {
    const url = `/conversations/${id}`;
    return axiosClient.delete(url);
  },

  // Đếm conversation theo patient/doctor (tuỳ dùng)
  countByPatient: (patientId) => axiosClient.get(`/conversations/count/by-patient?patientId=${patientId}`),
  countByDoctor: (doctorId) => axiosClient.get(`/conversations/count/by-doctor?doctorId=${doctorId}`)
};

export default conversationApi;

