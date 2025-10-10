import React, { useState, useEffect } from "react";
import axios from "axios";
import { Menu, X, Search, Phone, Globe, Facebook, Twitter, Instagram, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import userApi from "../../api/userApi";

export default function Header() {
  // Địa chỉ VN
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  // Load tỉnh/thành phố khi mở modal
  useEffect(() => {
    axios.get("https://provinces.open-api.vn/api/p/").then(res => setProvinces(res.data));
  }, []);

  // Load quận/huyện khi chọn tỉnh
  useEffect(() => {
    if (selectedProvince) {
      axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`).then(res => setDistricts(res.data.districts));
      setSelectedDistrict("");
      setWards([]);
      setSelectedWard("");
    }
  }, [selectedProvince]);

  // Load phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (selectedDistrict) {
      axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`).then(res => setWards(res.data.wards));
      setSelectedWard("");
    }
  }, [selectedDistrict]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    address: '', 
    dateOfBirth: '', 
    gender: '' 
  });
  const [profileErrors, setProfileErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch (e) { setUser(null); }
    }

    const onStorage = (e) => {
      if (e.key === 'user') {
        const val = e.newValue;
        if (val) setUser(JSON.parse(val)); else setUser(null);
      }
    };
    const onUserChanged = () => {
      const val = localStorage.getItem('user');
      if (val) setUser(JSON.parse(val)); else setUser(null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('userChanged', onUserChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('userChanged', onUserChanged);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Convert dateOfBirth from DD/MM/YYYY to YYYY-MM-DD for date input
      let formattedDate = user.dateOfBirth || '';
      if (formattedDate && formattedDate.includes('/')) {
        const parts = formattedDate.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || (user.username || ''),
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: formattedDate,
        gender: user.gender || ''
      });
      // Validate initial data
      const errors = validateProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || (user.username || ''),
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: formattedDate,
        gender: user.gender || ''
      });
      
      console.log('Initial profile validation:', errors);
      setProfileErrors(errors);
    }
  }, [user]);

  const validateProfile = (data) => {
    console.log('Validating profile data:', data);
    const errors = {};
    if (!data.firstName || data.firstName.trim().length === 0) errors.firstName = 'Họ không được để trống';
    if (!data.lastName || data.lastName.trim().length === 0) errors.lastName = 'Tên không được để trống';
    if (!data.email || data.email.trim().length === 0) errors.email = 'Email không được để trống';
    else {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
      if (!re.test(data.email)) errors.email = 'Email không hợp lệ';
    }
        // phone: bắt buộc, chỉ cho đúng 10 số, bắt đầu bằng 0
        if (!data.phone || data.phone.trim().length === 0) {
          errors.phone = 'Số điện thoại không được để trống';
        } else if (!/^0\d{9}$/.test(data.phone)) {
          errors.phone = 'Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.';
        }

        // Địa chỉ: cho phép null, chỉ validate nếu chọn 1 trong 3 dropdown
        if (selectedProvince || selectedDistrict || selectedWard) {
          if (!selectedProvince) {
            errors.address = 'Vui lòng chọn Tỉnh/Thành phố.';
          } else if (!selectedDistrict) {
            errors.address = 'Vui lòng chọn Quận/Huyện.';
          } else if (!selectedWard) {
            errors.address = 'Vui lòng chọn Phường/Xã.';
          }
        }
    // dateOfBirth: phải trên 10 tuổi
    if (data.dateOfBirth && data.dateOfBirth.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ (yyyy-mm-dd)';
      } else {
        const dob = new Date(data.dateOfBirth);
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        if (dob > minDate) {
          errors.dateOfBirth = 'Bạn phải trên 10 tuổi.';
        }
      }
    }
    return errors;
  };

  const menuItems = [
    { label: "Trang chủ", href: "#home" },
    { label: "Cơ sở y tế", href: "#facilities" },
    { label: "Chuyên khoa", href: "#specialties" },
    { label: "Bác sĩ", href: "#doctors" },
    { label: "Đặt lịch", href: "#booking" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top thin info bar */}
      <div className="bg-[#e9f6ff] border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-[#034ea2]">
              <a href="tel:19002115" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Hotline: 1900 2115</span>
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button className="flex items-center gap-1 text-[#6b7280] hover:text-[#034ea2]">
                <Globe className="h-4 w-4" />
                <span>VN</span>
              </button>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 py-4">
          {/* Logo */}
          <Link to="#home" className="flex items-center gap-3 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0d6efd] text-white">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d6efd]">MediCare</div>
              <div className="text-xs text-gray-500">Tìm bác sĩ, đặt lịch nhanh chóng</div>
            </div>
          </Link>

          {/* Center search - large pill */}
          <div className="flex-1">
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cfe9ff]"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-medium text-gray-700 hover:text-[#0d6efd]">
                  {item.label}
                </a>
              ))}
            </nav>
            {/* If user is logged in show name + logout, otherwise show login button */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  className="text-sm font-medium hover:underline"
                  onClick={() => setShowProfile(true)}
                >
                  {user.firstName || user.email}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await axiosClient.post('/auth/logout', { token: localStorage.getItem('token') });
                    } catch (e) {
                      // ignore
                    }
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('userChanged'));
                    navigate('/');
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:inline-block rounded-md bg-[#0d6efd] px-4 py-2 text-white">Đăng nhập</Link>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" placeholder="Tìm kiếm..." className="pl-10 bg-gray-100 w-full rounded-md py-2" />
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 space-y-3">
            {menuItems.map((item) => (
              <a key={item.label} href={item.href} className="block text-sm font-medium text-gray-700 hover:text-[#0d6efd]" onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link to="/login" className="w-full inline-block rounded-md bg-[#0d6efd] px-3 py-1 text-white text-center">Đăng nhập</Link>
          </nav>
        )}
      </div>
      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Thông tin tài khoản</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowProfile(false)}>Đóng</button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const errs = validateProfile(profileForm);
              console.log('Validation errors:', errs);
              console.log('Profile form data:', profileForm);
              if (Object.keys(errs).length > 0) { setProfileErrors(errs); return; }

              if (!user || !user.id) {
                console.log('No user ID, updating localStorage only');
                // just update localStorage
                const updated = { ...user, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                window.dispatchEvent(new Event('userChanged'));
                setShowProfile(false);
                alert('Cập nhật thông tin (local) thành công');
                return;
              }
              try {
                // Convert data to match backend API format
                const apiData = {
                  email: profileForm.email?.trim() || null,
                  firstName: profileForm.firstName?.trim() || null,
                  lastName: profileForm.lastName?.trim() || null,
                  phone: profileForm.phone?.trim() || null,
                  address: [
                    profileForm.address?.trim(),
                    wards.find(w => w.code === selectedWard)?.name,
                    districts.find(d => d.code === selectedDistrict)?.name,
                    provinces.find(p => p.code === selectedProvince)?.name
                  ].filter(Boolean).join(", "),
                  gender: profileForm.gender?.trim().toUpperCase() || null, // Convert to enum format
                  dateOfBirth: profileForm.dateOfBirth?.trim() || null
                };
                
                console.log('Calling API to update user:', user.id, apiData);
                const res = await userApi.updateUser(user.id, apiData);
                console.log('API response:', res);
                const updatedUser = res.data || { ...user, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('userChanged'));
                setShowProfile(false);
                alert('Cập nhật thông tin tài khoản thành công');
              } catch (err) {
                console.error('Failed to update user', err);
                console.error('Error response:', err.response?.data);
                // fallback: update localStorage so UI reflects changes
                const updated = { ...user, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                window.dispatchEvent(new Event('userChanged'));
                setShowProfile(false);
                alert('Lỗi: ' + (err.response?.data?.message || err.message) + ' — Thay đổi đã lưu tạm thời trên trình duyệt');
              }
            }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Họ</label>
                  <input className={`w-full rounded border px-3 py-2 ${profileErrors.firstName ? 'border-red-500 bg-red-50' : ''}`} value={profileForm.firstName}
                    onChange={(e) => { 
                      const newForm = { ...profileForm, firstName: e.target.value };
                      setProfileForm(newForm);
                      // Re-validate immediately
                      const newErrors = validateProfile(newForm);
                      setProfileErrors(newErrors);
                    }} />
                  {profileErrors.firstName && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                      {profileErrors.firstName}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Tên</label>
                  <input className={`w-full rounded border px-3 py-2 ${profileErrors.lastName ? 'border-red-500 bg-red-50' : ''}`} value={profileForm.lastName}
                    onChange={(e) => { 
                      const newForm = { ...profileForm, lastName: e.target.value };
                      setProfileForm(newForm);
                      // Re-validate immediately
                      const newErrors = validateProfile(newForm);
                      setProfileErrors(newErrors);
                    }} />
                  {profileErrors.lastName && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                      {profileErrors.lastName}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Email</label>
                <input type="email" className={`w-full rounded border px-3 py-2 ${profileErrors.email ? 'border-red-500 bg-red-50' : ''}`} value={profileForm.email}
                  onChange={(e) => { 
                    const newForm = { ...profileForm, email: e.target.value };
                    setProfileForm(newForm);
                    // Re-validate immediately
                    const newErrors = validateProfile(newForm);
                    setProfileErrors(newErrors);
                  }} />
                {profileErrors.email && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                    {profileErrors.email}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Số điện thoại</label>
                  <input type="tel" className={`w-full rounded border px-3 py-2 focus:outline-none ${profileErrors.phone ? 'border-2 border-red-500 bg-red-50 placeholder-red-400' : ''}`} value={profileForm.phone}
                    placeholder="Nhập số điện thoại"
                    onChange={(e) => { 
                      const newForm = { ...profileForm, phone: e.target.value };
                      setProfileForm(newForm);
                      // Re-validate immediately
                      const newErrors = validateProfile(newForm);
                      setProfileErrors(newErrors);
                    }} />
                  {profileErrors.phone && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                      <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                      {profileErrors.phone}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Giới tính</label>
                  <select className="w-full rounded border px-3 py-2" value={profileForm.gender}
                    onChange={(e) => { setProfileForm(f => ({ ...f, gender: e.target.value })); }}>
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Ngày sinh</label>
                <input type="date" className={`w-full rounded border px-3 py-2 ${profileErrors.dateOfBirth ? 'border-red-500 bg-red-50' : ''}`} value={profileForm.dateOfBirth}
                  onChange={(e) => { 
                    const newForm = { ...profileForm, dateOfBirth: e.target.value };
                    setProfileForm(newForm);
                    // Re-validate immediately
                    const newErrors = validateProfile(newForm);
                    setProfileErrors(newErrors);
                  }} />
                {profileErrors.dateOfBirth && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                    {profileErrors.dateOfBirth}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Địa chỉ</label>
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
                {profileErrors.address && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></span>
                    {profileErrors.address}
                  </div>
                )}
              </div>

              {/* Tổng hợp lỗi validation */}
              {Object.keys(profileErrors).length > 0 && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1 text-red-700">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    <strong>Có lỗi nhập liệu, vui lòng kiểm tra lại:</strong>
                  </div>
                  <ul className="ml-4 list-disc">
                    {Object.entries(profileErrors).map(([field, error]) => (
                      <li key={field} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2" onClick={() => setShowProfile(false)}>Hủy</button>
                <button type="submit" 
                  disabled={false}
                  className="rounded px-4 py-2 text-white bg-[#0d6efd] hover:bg-blue-600"
                  onClick={() => console.log('Profile Errors:', profileErrors, 'Error count:', Object.keys(profileErrors).length)}
                >
                  Lưu {Object.keys(profileErrors).length > 0 && `(${Object.keys(profileErrors).length} lỗi)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
