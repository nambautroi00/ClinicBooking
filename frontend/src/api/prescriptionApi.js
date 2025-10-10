import axiosClient from './axiosClient';

const prescriptionApi = {
  // Lấy tất cả đơn thuốc
  getAllPrescriptions: () => {
    return axiosClient.get('/prescriptions');
  },

  // Lấy đơn thuốc theo ID
  getPrescriptionById: (prescriptionId) => {
    return axiosClient.get(`/prescriptions/${prescriptionId}`);
  },

  // Lấy đơn thuốc theo bệnh nhân
  getPrescriptionsByPatient: (patientId) => {
    return axiosClient.get(`/prescriptions/patient/${patientId}`);
  },

  // Lấy đơn thuốc theo bác sĩ
  getPrescriptionsByDoctor: (doctorId) => {
    return axiosClient.get(`/prescriptions/doctor/${doctorId}`);
  },

  // Tạo đơn thuốc mới
  createPrescription: (prescriptionData) => {
    return axiosClient.post('/prescriptions', prescriptionData);
  },

  // Cập nhật đơn thuốc
  updatePrescription: (prescriptionId, prescriptionData) => {
    return axiosClient.put(`/prescriptions/${prescriptionId}`, prescriptionData);
  },

  // Xóa đơn thuốc
  deletePrescription: (prescriptionId) => {
    return axiosClient.delete(`/prescriptions/${prescriptionId}`);
  },

  // Lấy chi tiết đơn thuốc (bao gồm prescription items)
  getPrescriptionWithItems: (prescriptionId) => {
    return axiosClient.get(`/prescriptions/${prescriptionId}/items`);
  },

  // Thêm thuốc vào đơn
  addPrescriptionItem: (prescriptionId, itemData) => {
    return axiosClient.post(`/prescriptions/${prescriptionId}/items`, itemData);
  },

  // Cập nhật thuốc trong đơn
  updatePrescriptionItem: (prescriptionId, itemId, itemData) => {
    return axiosClient.put(`/prescriptions/${prescriptionId}/items/${itemId}`, itemData);
  },

  // Xóa thuốc khỏi đơn
  removePrescriptionItem: (prescriptionId, itemId) => {
    return axiosClient.delete(`/prescriptions/${prescriptionId}/items/${itemId}`);
  },

  // Cập nhật trạng thái đơn thuốc
  updatePrescriptionStatus: (prescriptionId, status) => {
    return axiosClient.patch(`/prescriptions/${prescriptionId}/status`, { status });
  },

  // Tìm kiếm đơn thuốc
  searchPrescriptions: (keyword) => {
    return axiosClient.get(`/prescriptions/search?keyword=${encodeURIComponent(keyword)}`);
  }
};

// API cho thuốc (Medicines)
const medicineApi = {
  // Lấy tất cả thuốc
  getAllMedicines: () => {
    return axiosClient.get('/medicines');
  },

  // Lấy thuốc theo ID
  getMedicineById: (medicineId) => {
    return axiosClient.get(`/medicines/${medicineId}`);
  },

  // Tạo thuốc mới
  createMedicine: (medicineData) => {
    return axiosClient.post('/medicines', medicineData);
  },

  // Cập nhật thông tin thuốc
  updateMedicine: (medicineId, medicineData) => {
    return axiosClient.put(`/medicines/${medicineId}`, medicineData);
  },

  // Xóa thuốc
  deleteMedicine: (medicineId) => {
    return axiosClient.delete(`/medicines/${medicineId}`);
  },

  // Tìm kiếm thuốc
  searchMedicines: (keyword) => {
    return axiosClient.get(`/medicines/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // Lấy thuốc theo loại
  getMedicinesByCategory: (category) => {
    return axiosClient.get(`/medicines/category/${encodeURIComponent(category)}`);
  },

  // Cập nhật tồn kho
  updateMedicineStock: (medicineId, stock) => {
    return axiosClient.patch(`/medicines/${medicineId}/stock`, { stock });
  },

  // Lấy thuốc sắp hết hạn
  getExpiringMedicines: (days = 30) => {
    return axiosClient.get(`/medicines/expiring?days=${days}`);
  },

  // Lấy thuốc tồn kho thấp
  getLowStockMedicines: (threshold = 100) => {
    return axiosClient.get(`/medicines/low-stock?threshold=${threshold}`);
  }
};

export { prescriptionApi, medicineApi };
export default prescriptionApi;