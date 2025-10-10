import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    role: 'PATIENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      // Backend PatientController.registerPatient expects PatientRegisterRequest fields
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        gender: form.gender || null,
        dob: form.dateOfBirth || null, // field name expected by backend
        address: form.address || null,
        healthInsuranceNumber: null,
        medicalHistory: null,
      };

      const res = await axiosClient.post('/patients/register', payload);

      // Treat 201 (created) and 202 (accepted - pending OTP) as success
      if (res.status === 201 || res.status === 202) {
        // store pending email so VerifyOtp page can use it
        localStorage.setItem('pendingOtpEmail', form.email);
        navigate('/verify-otp');
      } else {
        const data = res.data;
        // res.data may be a string or object
        const message = typeof data === 'string' ? data : data?.message;
        setError(message || 'Đăng ký thất bại');
      }
    } catch (err) {
      // GlobalExceptionHandler returns { message, ... }
      const serverMessage = err.response?.data?.message;
      // Validation errors include errors map under 'errors'
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const firstField = Object.keys(err.response.data.errors)[0];
        setError(err.response.data.errors[firstField]);
      } else if (serverMessage) {
        setError(serverMessage);
      } else {
        setError(err.message || 'Lỗi mạng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl rounded-lg border bg-white p-8 shadow">
        <h2 className="mb-2 text-2xl font-semibold text-[#0d6efd]">Đăng ký tài khoản</h2>
        <p className="mb-6 text-sm text-gray-600">Tạo tài khoản để đặt lịch và quản lý hồ sơ sức khỏe.</p>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Giới tính</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-md border border-gray-200 px-3 py-2">
              <option value="">Chọn</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ngày sinh</label>
            <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò</label>
            <select name="role" value={form.role} onChange={handleChange} className="w-full rounded-md border border-gray-200 px-3 py-2">
              <option value="PATIENT">Bệnh nhân</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="w-full rounded-md border border-gray-200 px-3 py-2" />
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <button type="submit" disabled={loading} className="rounded-md bg-[#0d6efd] px-4 py-2 text-white">
              {loading ? 'Đang gửi...' : 'Đăng ký'}
            </button>
            <a href="/login" className="text-sm text-[#0d6efd] hover:underline">Đã có tài khoản? Đăng nhập</a>
          </div>
        </form>
      </div>
    </div>
  );
}
