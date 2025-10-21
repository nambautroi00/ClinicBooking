import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import paymentApi from '../../api/paymentApi';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const handlePayOSRedirect = async () => {
      // Lấy thông tin từ PayOS redirect
      const payOSId = searchParams.get('id');
      const payOSStatus = searchParams.get('status');
      const orderCode = searchParams.get('orderCode');
      const code = searchParams.get('code');

      console.log('🔍 PayOS cancel redirect detected:', {
        payOSId,
        payOSStatus,
        orderCode,
        code
      });

      if (payOSId && payOSStatus === 'CANCELLED' && code === '00') {
        try {
          // Tìm payment theo PayOS Payment ID
          console.log('🔍 Looking up payment by PayOS ID:', payOSId);
          const response = await paymentApi.getPaymentByPayOSPaymentId(payOSId);
          
          if (response.data) {
            console.log('✅ Found payment:', response.data);
            const payment = response.data;
            
            // Cập nhật payment status thành CANCELLED
            try {
              console.log('🔄 Updating payment status to CANCELLED...');
              await paymentApi.updatePaymentStatus(payment.paymentId, 'CANCELLED');
              console.log('✅ Payment status updated to CANCELLED');
            } catch (updateError) {
              console.error('❌ Error updating payment status:', updateError);
            }
            
            setPaymentInfo(payment);
          }
        } catch (error) {
          console.error('❌ Error loading payment info:', error);
        }
      }
      
      setLoading(false);
    };

    handlePayOSRedirect();
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang xử lý thông tin...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
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
              Thanh toán đã hủy
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Cancel Message */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán đã hủy</h1>
            <p className="text-gray-600 mb-6">
              Bạn đã hủy quá trình thanh toán. Lịch hẹn chưa được xác nhận.
            </p>
          </div>

          {/* Payment Info */}
          {paymentInfo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin thanh toán</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã thanh toán:</span>
                  <span className="font-medium">#{paymentInfo.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-medium text-red-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(paymentInfo.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="text-red-600 font-medium">Đã hủy</span>
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin</h2>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Lịch hẹn chưa được xác nhận</h3>
                <p className="text-sm text-yellow-800">
                  Để hoàn tất đặt lịch, bạn cần thanh toán phí khám. 
                  Lịch hẹn sẽ được giữ trong 15 phút.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Các phương thức thanh toán</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Thẻ tín dụng/ghi nợ (Visa, Mastercard)</li>
                  <li>• Ví điện tử (MoMo, ZaloPay, VNPay)</li>
                  <li>• Chuyển khoản ngân hàng</li>
                  <li>• Thanh toán tại phòng khám</li>
                </ul>
              </div>
            </div>
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
              onClick={handleTryAgain}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}