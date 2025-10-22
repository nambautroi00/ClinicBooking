import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Calendar, Clock, User, CreditCard } from 'lucide-react';
import paymentApi from '../../api/paymentApi';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaymentInfo = async () => {
      // Lấy thông tin từ URL params
      const doctorId = searchParams.get('doctorId');
      const doctorName = searchParams.get('doctorName');
      const specialty = searchParams.get('specialty');
      const date = searchParams.get('date');
      const time = searchParams.get('time');
      const fee = searchParams.get('fee');
      const note = searchParams.get('note');
      const appointmentId = searchParams.get('appointmentId');
      const paymentId = searchParams.get('paymentId');

      // Nếu có thông tin từ PatientBookingDetail (trường hợp bình thường)
      if (doctorId && appointmentId) {
        setPaymentInfo({
          doctorId,
          doctorName,
          specialty,
          date,
          time,
          fee: parseFloat(fee) || 0,
          note,
          appointmentId,
          paymentId
        });
        return;
      }

      // Nếu là PayOS redirect, lấy thông tin từ PayOS
      const payOSId = searchParams.get('id');
      const payOSStatus = searchParams.get('status');
      const orderCode = searchParams.get('orderCode');
      const code = searchParams.get('code');

      console.log('🔍 PayOS redirect detected:', {
        payOSId,
        payOSStatus,
        orderCode,
        code
      });

      if (payOSId) {
        // Kiểm tra status và redirect tương ứng
        if (payOSStatus === 'CANCELLED') {
          console.log('🔄 Redirecting to cancel page...');
          navigate(`/payment/cancel?id=${payOSId}&status=${payOSStatus}&orderCode=${orderCode}&code=${code}`);
          return;
        }

        try {
          // Cập nhật payment status thành PAID
          console.log('🔄 Updating payment status to PAID for PayOS ID:', payOSId);
          try {
            const updateResponse = await paymentApi.updatePaymentStatusFromPayOS(payOSId, 'PAID', orderCode);
            console.log('✅ Payment status updated to PAID:', updateResponse.data);
          } catch (updateError) {
            console.error('❌ Could not update payment status:', updateError);
            console.error('❌ Update error response:', updateError.response?.data);
            console.error('❌ Update error status:', updateError.response?.status);
          }

          // Tìm payment theo PayOS Payment ID
          console.log('🔍 Looking up payment by PayOS ID:', payOSId);
          const response = await paymentApi.getPaymentByPayOSPaymentId(payOSId);
          
          if (response.data) {
            console.log('✅ Found payment:', response.data);
            const payment = response.data;
            
            // Lấy thông tin appointment từ payment
            if (payment.appointment) {
              setPaymentInfo({
                doctorId: payment.appointment.doctorId,
                doctorName: payment.appointment.doctorName || 'Bác sĩ',
                specialty: payment.appointment.specialty || 'Chuyên khoa',
                date: payment.appointment.date || new Date().toISOString().split('T')[0],
                time: payment.appointment.time || 'N/A',
                fee: payment.amount || 0,
                note: payment.appointment.note || '',
                appointmentId: payment.appointment.appointmentId,
                paymentId: payment.paymentId
              });
            } else {
              // Fallback nếu không có appointment info
              setPaymentInfo({
                doctorId: 'unknown',
                doctorName: 'Bác sĩ',
                specialty: 'Chuyên khoa',
                date: new Date().toISOString().split('T')[0],
                time: 'N/A',
                fee: payment.amount || 0,
                note: '',
                appointmentId: 'unknown',
                paymentId: payment.paymentId
              });
            }

            // Broadcast trạng thái để trang đặt lịch cập nhật ngay
            try {
              localStorage.setItem('payosStatus', 'PAID');
              localStorage.setItem('payosLastUpdate', String(Date.now()));
              window.dispatchEvent(new Event('payosStatusChanged'));
            } catch (_) {}
          }
        } catch (error) {
          console.error('❌ Error loading payment info:', error);
          // Vẫn hiển thị thông tin cơ bản
          setPaymentInfo({
            doctorId: 'unknown',
            doctorName: 'Bác sĩ',
            specialty: 'Chuyên khoa',
            date: new Date().toISOString().split('T')[0],
            time: 'N/A',
            fee: 0,
            note: '',
            appointmentId: 'unknown',
            paymentId: 'unknown'
          });
        }
      }
      
      setLoading(false);
    };

    loadPaymentInfo();
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewAppointments = () => {
    navigate('/patient/appointments');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang tải thông tin thanh toán...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy thông tin thanh toán</h2>
          <p className="text-gray-600 mb-4">Có thể thanh toán chưa được xử lý hoặc có lỗi xảy ra.</p>
          <button 
            onClick={handleGoHome}
            className="text-blue-600 hover:text-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Về trang chủ
            </button>
            <div className="text-sm text-gray-500">
              Thanh toán thành công
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600 mb-6">
              Lịch hẹn của bạn đã được xác nhận. Bạn sẽ nhận được thông báo qua email.
            </p>
            
            {paymentInfo.paymentId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Mã thanh toán:</p>
                <p className="font-mono text-lg font-semibold text-gray-900">#{paymentInfo.paymentId}</p>
              </div>
            )}
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chi tiết lịch hẹn</h2>
            
            <div className="space-y-4">
              {/* Doctor Info */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{paymentInfo.doctorName}</p>
                  <p className="text-sm text-blue-600">{paymentInfo.specialty}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(paymentInfo.date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-green-600">{paymentInfo.time}</p>
                </div>
              </div>

              {/* Fee */}
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Phí khám</p>
                  <p className="text-sm text-yellow-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(paymentInfo.fee)}
                  </p>
                </div>
              </div>

              {/* Note */}
              {paymentInfo.note && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Ghi chú:</p>
                  <p className="text-gray-900">{paymentInfo.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Bước tiếp theo:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Bạn sẽ nhận được email xác nhận trong vòng 5 phút</li>
              <li>• Vui lòng đến đúng giờ hẹn để được phục vụ tốt nhất</li>
              <li>• Mang theo CMND/CCCD để xác minh danh tính</li>
              <li>• Nếu có thay đổi, vui lòng liên hệ phòng khám trước 24h</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGoHome}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Về trang chủ
            </button>
            <button
              onClick={handleViewAppointments}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem lịch hẹn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}