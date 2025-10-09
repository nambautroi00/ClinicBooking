import axiosClient from './axiosClient';

const paymentApi = {
  getTotalRevenue: () => axiosClient.get('/payments/total-revenue').then(r => r.data),
  getHistoryByPatient: (patientId) => axiosClient.get('/payments/history', { params: { patientId } }).then(r => r.data),
};

export default paymentApi;


