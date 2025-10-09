import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem('pendingOtpEmail') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (email) {
      // send OTP on mount
      axiosClient.post('/auth/send-otp', { email })
        .then(res => setMessage('Mã OTP đã được gửi vào email'))
        .catch(err => setMessage(err.response?.data?.message || 'Không thể gửi OTP'));
    }
  }, [email]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axiosClient.post('/auth/verify-otp', { email, otp });
      if (res.status === 200) {
        // verified
        localStorage.removeItem('pendingOtpEmail');
        navigate('/login');
      } else {
        setMessage(res.data?.message || 'Xác thực thất bại');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi xác thực');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!email) return;
    axiosClient.post('/auth/send-otp', { email })
      .then(() => setMessage('Mã OTP đã được gửi lại'))
      .catch(err => setMessage(err.response?.data?.message || 'Không thể gửi OTP'));
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow">
        <h2 className="mb-4 text-2xl font-semibold text-[#0d6efd]">Xác thực OTP</h2>
        <p className="mb-4 text-sm text-gray-600">Nhập mã OTP đã được gửi tới email <strong>{email}</strong></p>
        {message && <div className="mb-4 text-sm text-gray-700">{message}</div>}

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Mã OTP</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>

          <div className="flex items-center justify-between">
            <button type="submit" className="rounded-md bg-[#0d6efd] px-4 py-2 text-white" disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác thực'}</button>
            <button type="button" onClick={handleResend} className="text-sm text-[#0d6efd] hover:underline">Gửi lại OTP</button>
          </div>
        </form>
      </div>
    </div>
  );
}
