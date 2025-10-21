import React, { useState, useEffect } from "react";
import axios from "axios";
import { Menu, X, Search, Phone, Globe, Facebook, Twitter, Instagram, Heart, User, Camera, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import userApi from "../../api/userApi";
import fileUploadApi from "../../api/fileUploadApi";

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
  const [showMobileHeader, setShowMobileHeader] = useState(false);
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
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

  // Hàm lấy avatar URL
  const getAvatarUrl = (user) => {
    if (user?.avatarUrl) {
      // Nếu avatar bắt đầu bằng /uploads/, thêm base URL
      if (user.avatarUrl.startsWith('/uploads/')) {
        return `http://localhost:8080${user.avatarUrl}`;
      }
      return user.avatarUrl;
    }
    // Fallback cho avatar cũ (để tương thích ngược)
    if (user?.avatar) {
      // Nếu avatar bắt đầu bằng /uploads/, thêm base URL
      if (user.avatar.startsWith('/uploads/')) {
        return `http://localhost:8080${user.avatar}`;
      }
      return user.avatar;
    }
    if (user?.picture) {
      return user.picture; // Google avatar
    }
    return null;
  };

  // Hàm tạo avatar mặc định
  const getDefaultAvatar = (user) => {
    const name = user?.firstName || user?.email || 'User';
    const initial = name.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff&size=40&bold=true`;
  };

  // Kiểm tra kích thước ảnh
  const checkImageSize = (file, callback) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      callback({ width, height, isValid: width >= 200 && height >= 200 });
    };
    img.src = URL.createObjectURL(file);
  };

  // Xử lý upload avatar
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File quá lớn. Vui lòng chọn file nhỏ hơn 2MB.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh.');
        return;
      }
      
      // Kiểm tra kích thước ảnh
      checkImageSize(file, ({ width, height, isValid }) => {
        if (!isValid) {
          alert(`Ảnh quá nhỏ. Kích thước tối thiểu: 200x200px. Ảnh hiện tại: ${width}x${height}px\n\nẢnh sẽ không được thay đổi. Vui lòng chọn ảnh có kích thước lớn hơn.`);
          return;
        }
        
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Xử lý click avatar để preview
  const handleAvatarClick = (e) => {
    e.stopPropagation(); // Ngăn event bubbling
    const avatarUrl = getAvatarUrl(user);
    if (avatarUrl) {
      setPreviewImage(avatarUrl);
      setShowAvatarPreview(true);
    } else {
      // Nếu không có avatar, mở profile để upload
      setShowProfile(true);
    }
  };

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
        // phone: optional cho Google users, chỉ validate format nếu có nhập
        if (data.phone && data.phone.trim().length > 0) {
          if (!/^0\d{9}$/.test(data.phone)) {
            errors.phone = 'Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.';
          }
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
    { label: "Trang chủ", href: "/" },
    { label: "Chuyên khoa", href: "/#specialties" },
    { label: "Dịch vụ", href: "/#services" },
    { label: "Bác sĩ tư vấn", href: "/video-consultation" },
    { label: "Bài viết", href: "/articles" },
    { label: "Đặt lịch", href: "/#booking" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top thin info bar */}
      <div className="bg-[#e9f6ff] border-b">
        <div className="w-full px-2">
          <div className="max-w-full mx-auto flex h-9 items-center justify-between text-sm">
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
      <div className="w-full px-2">
        <div className="max-w-full mx-auto flex items-center gap-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#0d6efd] text-white">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-[#0d6efd]">ClinicBooking</div>
              <div className="text-xs text-gray-500">Tìm bác sĩ, đặt lịch nhanh chóng</div>
            </div>
            <div className="sm:hidden">
              <div className="text-sm font-bold text-[#0d6efd]">CB</div>
            </div>
          </Link>

          {/* Center search - large pill */}
          <div className="flex-1 hidden sm:block">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-6">
              {menuItems.map((item) => {
                const handleClick = (e) => {
                  if (item.href.includes('#')) {
                    e.preventDefault();
                    const [path, anchor] = item.href.split('#');
                    navigate(path);
                    setTimeout(() => {
                      const element = document.getElementById(anchor);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }
                };

                return (
                  <Link 
                    key={item.label} 
                    to={item.href} 
                    className="text-sm font-medium text-gray-700 hover:text-[#0d6efd]"
                    onClick={handleClick}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {/* If user is logged in show name + logout, otherwise show login button */}
            {user ? (
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                {/* Messages link for patients */}
                {(() => {
                  const roleName = user.role?.name || user.role?.roleName || '';
                  const isPatient = roleName.toLowerCase().includes('patient');
                  return isPatient && (
                    <Link 
                      to="/patient/messages" 
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      <MessageCircle size={16} />
                      Tin nhắn
                    </Link>
                  );
                })()}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                    onClick={handleAvatarClick}
                    title={getAvatarUrl(user) ? "Click để xem ảnh phóng to" : "Click để thêm ảnh đại diện"}
                  >
                    {getAvatarUrl(user) ? (
                      <img 
                        src={getAvatarUrl(user)} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center text-white text-sm sm:text-base font-bold ${getAvatarUrl(user) ? 'hidden' : 'flex'}`}
                      style={{ backgroundImage: `url(${getDefaultAvatar(user)})`, backgroundSize: 'cover' }}
                    >
                      {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <button
                    className="text-sm font-medium hover:underline"
                    onClick={() => setShowProfile(true)}
                  >
                    {user.firstName || user.email}
                  </button>
                </div>
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
            <button 
              className="md:hidden p-1" 
              onClick={() => {
                setShowMobileHeader(!showMobileHeader);
                setMobileMenuOpen(!mobileMenuOpen);
              }} 
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showMobileHeader && (
          <div className="md:hidden pb-3">
            <div className="max-w-full mx-auto px-2 relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="search" placeholder="Tìm kiếm..." className="pl-10 bg-gray-100 w-full rounded-md py-2" />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {showMobileHeader && (
          <nav className="md:hidden border-t py-4 space-y-3 max-w-full mx-auto px-2">
            {menuItems.map((item) => {
              const handleClick = (e) => {
                setMobileMenuOpen(false);
                setShowMobileHeader(false);
                if (item.href.includes('#')) {
                  e.preventDefault();
                  const [path, anchor] = item.href.split('#');
                  navigate(path);
                  setTimeout(() => {
                    const element = document.getElementById(anchor);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }
              };

              return (
                <Link 
                  key={item.label} 
                  to={item.href} 
                  className="block text-sm font-medium text-gray-700 hover:text-[#0d6efd]"
                  onClick={handleClick}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* Messages link for patients in mobile */}
            {(() => {
              const roleName = user?.role?.name || user?.role?.roleName || '';
              const isPatient = roleName.toLowerCase().includes('patient');
              return user && isPatient && (
                <Link 
                  to="/patient/messages" 
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0d6efd]" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowMobileHeader(false);
                  }}
                >
                  <MessageCircle size={16} />
                  Tin nhắn
                </Link>
              );
            })()}
            {user ? (
              <div className="space-y-2">
                <button
                  className="w-full text-left text-sm font-medium text-gray-700 hover:text-[#0d6efd]"
                  onClick={() => {
                    setShowProfile(true);
                    setMobileMenuOpen(false);
                    setShowMobileHeader(false);
                  }}
                >
                  {user.firstName || user.email}
                </button>
                <button
                  className="w-full inline-block rounded-md border border-red-200 bg-white px-3 py-1 text-red-600 text-center hover:bg-red-50"
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
                    setMobileMenuOpen(false);
                    setShowMobileHeader(false);
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="w-full inline-block rounded-md bg-[#0d6efd] px-3 py-1 text-white text-center">Đăng nhập</Link>
            )}
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

            {/* Avatar Upload Section */}
            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : getAvatarUrl(user) ? (
                    <img 
                      src={getAvatarUrl(user)} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${(avatarPreview || getAvatarUrl(user)) ? 'hidden' : 'flex'}`}
                    style={{ backgroundImage: `url(${getDefaultAvatar(user)})`, backgroundSize: 'cover' }}
                  >
                    {(user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Ảnh đại diện</h4>
                <p className="text-sm text-gray-500">Nhấn vào biểu tượng camera để thay đổi ảnh</p>
                {avatarFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Đã chọn: {avatarFile.name}
                  </p>
                )}
              </div>
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
                alert('Cập nhật thành công');
                return;
              }
              try {
                // Handle avatar upload first if there's a new avatar
                let avatarUrl = user?.avatarUrl || user?.avatar || user?.picture; // Keep existing avatar
                if (avatarFile) {
                  setUploadingAvatar(true);
                  console.log('Uploading avatar file:', avatarFile.name);
                  try {
                    const uploadResponse = await fileUploadApi.uploadImage(avatarFile, user?.id, 'user');
                    console.log('Upload response:', uploadResponse.data);
                    
                    if (uploadResponse.data.success) {
                      avatarUrl = uploadResponse.data.url;
                      console.log('Avatar uploaded successfully:', avatarUrl);
                    } else {
                      console.error('Upload failed:', uploadResponse.data.message);
                    alert('Lỗi upload ảnh: ' + uploadResponse.data.message + '\n\nẢnh đại diện sẽ không thay đổi. Vui lòng thử lại.');
                    setUploadingAvatar(false);
                    // Reset avatar states khi upload lỗi
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    return;
                    }
                  } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    alert('Lỗi khi upload ảnh: ' + (uploadError.response?.data?.message || uploadError.message) + '\n\nẢnh đại diện sẽ không thay đổi. Vui lòng thử lại.');
                    setUploadingAvatar(false);
                    // Reset avatar states khi upload lỗi
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    return;
                  } finally {
                    setUploadingAvatar(false);
                  }
                }

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
                  dateOfBirth: profileForm.dateOfBirth?.trim() || null,
                  avatarUrl: avatarUrl || user?.avatarUrl || user?.avatar || user?.picture // Keep existing avatar if no new one
                };
                
                console.log('Calling API to update user:', user.id, apiData);
                const res = await userApi.updateUser(user.id, apiData);
                console.log('API response:', res);
                const updatedUser = res.data || { ...user, ...profileForm, avatarUrl: avatarUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                window.dispatchEvent(new Event('userChanged'));
                
                // Reset avatar states
                setAvatarFile(null);
                setAvatarPreview(null);
                setShowProfile(false);
                
                // Force refresh user data to get updated avatar
                const updatedUserData = { ...updatedUser, avatar: avatarUrl };
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                setUser(updatedUserData);
                window.dispatchEvent(new Event('userChanged'));
                
                alert('Cập nhật thành công');
              } catch (err) {
                console.error('Failed to update user', err);
                console.error('Error response:', err.response?.data);
                // fallback: update localStorage so UI reflects changes
                const updated = { ...user, ...profileForm };
                // Note: In fallback mode, we don't change avatar - keep existing one
                // Only update profile info, not avatar
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                window.dispatchEvent(new Event('userChanged'));
                
                // Reset avatar states but don't update avatar
                setAvatarFile(null);
                setAvatarPreview(null);
                setShowProfile(false);
                alert('Lỗi: ' + (err.response?.data?.message || err.message) + ' — Thông tin đã được cập nhật nhưng ảnh đại diện không thay đổi do lỗi upload');
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
                  <label className="block text-sm text-gray-600">Số điện thoại <span className="text-gray-400">(Tùy chọn)</span></label>
                  <input type="tel" className={`w-full rounded border px-3 py-2 focus:outline-none ${profileErrors.phone ? 'border-2 border-red-500 bg-red-50 placeholder-red-400' : ''}`} value={profileForm.phone}
                    placeholder="Nhập số điện thoại (không bắt buộc)"
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
                  disabled={uploadingAvatar}
                  className={`rounded px-4 py-2 text-white ${uploadingAvatar ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0d6efd] hover:bg-blue-600'}`}
                  onClick={() => console.log('Profile Errors:', profileErrors, 'Error count:', Object.keys(profileErrors).length)}
                >
                  {uploadingAvatar ? 'Đang upload ảnh...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {showAvatarPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAvatarPreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Xem trước ảnh đại diện</h3>
              <button 
                onClick={() => setShowAvatarPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-center">
                <img 
                  src={previewImage} 
                  alt="Avatar Preview" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Ảnh đại diện hiện tại của bạn
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Click "Chỉnh sửa" để thay đổi ảnh đại diện
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setShowAvatarPreview(false);
                      setShowProfile(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setShowAvatarPreview(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
