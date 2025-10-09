import axiosClient from './axiosClient';

const appointmentApi = {
  // Tạo lịch hẹn mới
  createAppointment: (appointmentData) => {
    return axiosClient.post('/appointments', appointmentData);
  },

  // Lấy lịch hẹn theo ID
  getAppointmentById: (appointmentId) => {
    return axiosClient.get(`/appointments/${appointmentId}`);
  },

  // Lấy lịch hẹn theo bệnh nhân
  getAppointmentsByPatient: (patientId) => {
    return axiosClient.get(`/appointments?patientId=${patientId}`);
  },

  // Lấy lịch hẹn theo bác sĩ
  getAppointmentsByDoctor: (doctorId) => {
    return axiosClient.get(`/appointments/by-doctor?doctorId=${doctorId}`);
  },

  // Cập nhật lịch hẹn
  updateAppointment: (appointmentId, appointmentData) => {
    return axiosClient.put(`/appointments/${appointmentId}`, appointmentData);
  },

  // Hủy lịch hẹn
  cancelAppointment: (appointmentId) => {
    return axiosClient.put(`/appointments/${appointmentId}/cancel`);
  },

  // Xóa lịch hẹn
  deleteAppointment: (appointmentId) => {
    return axiosClient.delete(`/appointments/${appointmentId}`);
  },

  // Lấy lịch hẹn theo ngày
  getAppointmentsByDate: (date) => {
    return axiosClient.get(`/appointments?date=${date}`);
  }
};

export default appointmentApi;
