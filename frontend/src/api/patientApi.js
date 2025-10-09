import axiosClient from './axiosClient';

const patientApi = {
  // Lấy tất cả bệnh nhân
  getAllPatients: () => axiosClient.get('/patients'),

  // Lấy bệnh nhân theo ID
  getPatientById: (patientId) => axiosClient.get(`/patients/${patientId}`),

  // Tìm kiếm theo tên (nếu backend hỗ trợ)
  searchByName: (keyword) => axiosClient.get(`/patients/search`, { params: { keyword } }),
};

export default patientApi;



