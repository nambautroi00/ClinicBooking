import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function Register() {
  // Địa chỉ VN
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  React.useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/p/").then(res => setProvinces(res.data));
  }, []);
  React.useEffect(() => {
    if (selectedProvince) {
      axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`).then(res => setDistricts(res.data.districts));
      setSelectedDistrict("");
      setWards([]);
      setSelectedWard("");
    }
  }, [selectedProvince]);
  React.useEffect(() => {
    if (selectedDistrict) {
      axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`).then(res => setWards(res.data.wards));
      setSelectedWard("");
    }
  }, [selectedDistrict]);
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
    // Validate
    if (!form.lastName.trim()) return setError('Vui lòng nhập họ');
    if (!form.firstName.trim()) return setError('Vui lòng nhập tên');
    if (!form.email.trim() || !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i.test(form.email)) return setError('Email không hợp lệ');
    if (!form.password || form.password.length < 6) return setError('Mật khẩu phải từ 6 ký tự');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu và xác nhận mật khẩu không khớp');
    if (!form.phone || !/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số và bắt đầu bằng số 0');
    if (!form.gender) return setError('Vui lòng chọn giới tính');
    if (!form.dateOfBirth) return setError('Vui lòng chọn ngày sinh');
    // Ngày sinh trên 10 tuổi
    const dob = new Date(form.dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    if (dob > minDate) return setError('Bạn phải trên 10 tuổi');
    // Địa chỉ: cho phép null, chỉ validate nếu chọn 1 trong 3 dropdown
    if (selectedProvince || selectedDistrict || selectedWard) {
      if (!selectedProvince) return setError('Vui lòng chọn Tỉnh/Thành phố');
      if (!selectedDistrict) return setError('Vui lòng chọn Quận/Huyện');
      if (!selectedWard) return setError('Vui lòng chọn Phường/Xã');
    }

    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.replace(/\D/g, ''), // chỉ lấy ký tự số
        gender: form.gender || null,
        dob: form.dateOfBirth || null,
        address: (selectedProvince && selectedDistrict && selectedWard)
          ? [
              wards.find(w => w.code === selectedWard)?.name,
              districts.find(d => d.code === selectedDistrict)?.name,
              provinces.find(p => p.code === selectedProvince)?.name
            ].filter(Boolean).join(", ")
          : null,
        healthInsuranceNumber: null,
        medicalHistory: null,
      };
      const res = await axiosClient.post('/patients/register', payload);
      if (res.status === 201 || res.status === 202) {
        localStorage.setItem('pendingOtpEmail', form.email);
        navigate('/verify-otp');
      } else {
        const data = res.data;
        const message = typeof data === 'string' ? data : data?.message;
        setError(message || 'Đăng ký thất bại');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Email đã tồn tại, vui lòng dùng email khác');
      } else {
        const serverMessage = err.response?.data?.message;
        if (err.response?.status === 400 && err.response?.data?.errors) {
          const firstField = Object.keys(err.response.data.errors)[0];
          setError(err.response.data.errors[firstField]);
        } else if (serverMessage) {
          setError(serverMessage);
        } else {
          setError(err.message || 'Lỗi mạng');
        }
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
              <option value="OTHER">Khác</option>
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
            <div className="grid grid-cols-3 gap-2 mb-2">
              <select className="w-full rounded border px-2 py-2" value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}>
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select className="w-full rounded border px-2 py-2" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedProvince}>
                <option value="">Chọn Quận/Huyện</option>
                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
              <select className="w-full rounded border px-2 py-2" value={selectedWard} onChange={e => setSelectedWard(e.target.value)} disabled={!selectedDistrict}>
                <option value="">Chọn Phường/Xã</option>
                {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select>
            </div>
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
