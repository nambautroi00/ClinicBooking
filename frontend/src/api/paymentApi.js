import axiosClient from './axiosClient';

// Thanh toán booking
export async function payBooking({
  cardHolderName,
  cardNumber,
  expireDate,
  cvv,
  method, // 'credit_card' | 'paypal' | 'stripe'
  amount,
  bookingId,
}) {
  // Payload gửi lên backend
  const payload = {
    cardHolderName,
    cardNumber,
    expireDate,
    cvv,
    method,
    amount,
    bookingId,
  };
  // Gọi API thanh toán
  return axiosClient.post('/payments/checkout', payload);
}

const paymentApi = {
  getTotalRevenue: () => axiosClient.get('/payments/total-revenue').then(r => r.data),
  getHistoryByPatient: (patientId) => axiosClient.get('/payments/history', { params: { patientId } }).then(r => r.data),
};

export default paymentApi;


