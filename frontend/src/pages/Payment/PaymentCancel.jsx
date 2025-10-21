import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import paymentApi from '../../api/paymentApi';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [error, setError] = useState(null);

  // Lấy thông tin từ PayOS redirect
  const payOSId = searchParams.get('id');
  const status = searchParams.get('status');
  const orderCode = searchParams.get('orderCode');
  const code = searchParams.get('code');

  useEffect(() => {
    const handlePaymentCancel = async () => {
      if (!payOSId) {
        setError('Không tìm thấy thông tin thanh toán');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 PayOS Cancel Redirect:', {
          payOSId,
          status,
          orderCode,
          code
        });

        // Cập nhật payment status thành CANCELLED
        try {
          await paymentApi.updatePaymentStatusFromPayOS(payOSId, 'CANCELLED', orderCode);
          console.log('✅ Payment status updated to CANCELLED');
        } catch (updateError) {
          console.warn('⚠️ Could not update payment status:', updateError);
        }

        // Lấy thông tin payment sau khi cập nhật
        const response = await paymentApi.getPaymentByPayOSPaymentId(payOSId);
        if (response.data) {
          setPaymentInfo(response.data);
          console.log('✅ Payment info loaded:', response.data);
        }
      } catch (err) {
        console.error('❌ Error loading payment info:', err);
        setError('Không thể tải thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentCancel();
  }, [payOSId, status, orderCode, code]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang xử lý thông tin thanh toán...</p>
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
            
            {/* Payment Info */}
            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Thông tin thanh toán</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Mã thanh toán:</strong> {paymentInfo.paymentId}</p>
                  <p><strong>Trạng thái:</strong> 
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      {paymentInfo.status}
                    </span>
                  </p>
                  {paymentInfo.amount && (
                    <p><strong>Số tiền:</strong> {paymentInfo.amount.toLocaleString('vi-VN')} VND</p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

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