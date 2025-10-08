import axiosClient from './axiosClient';

const doctorApi = {
  // Lấy tất cả bác sĩ
  getAllDoctors: () => {
    return axiosClient.get('/doctors');
  },

  // Lấy bác sĩ theo ID
  getDoctorById: (doctorId) => {
    return axiosClient.get(`/doctors/${doctorId}`);
  },

  // Lấy bác sĩ theo khoa
  getDoctorsByDepartment: (departmentId) => {
    return axiosClient.get(`/doctors?departmentId=${departmentId}`);
  },

  // Tạo bác sĩ mới
  createDoctor: (doctorData) => {
    return axiosClient.post('/doctors', doctorData);
  },

  // Cập nhật thông tin bác sĩ
  updateDoctor: (doctorId, doctorData) => {
    return axiosClient.put(`/doctors/${doctorId}`, doctorData);
  },

  // Xóa bác sĩ
  deleteDoctor: (doctorId) => {
    return axiosClient.delete(`/doctors/${doctorId}`);
  },

  // Tìm kiếm bác sĩ
  searchDoctors: (searchTerm) => {
    return axiosClient.get(`/doctors/search?q=${encodeURIComponent(searchTerm)}`);
  }
};

export default doctorApi;
