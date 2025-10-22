import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User, Clock, MapPin, Phone, Mail, Calendar as CalendarIcon, CreditCard, DollarSign, Edit, Save, X, Camera, Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import paymentApi from '../../../api/paymentApi';
import patientApi from '../../../api/patientApi';
import userApi from '../../../api/userApi';
import fileUploadApi from '../../../api/fileUploadApi';
import addressApi from '../../../api/addressApi';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Helper function để xử lý style an toàn
  const safeSetStyle = (target, styles) => {
    if (target && target.style) {
      Object.assign(target.style, styles);
    }
  };
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [user, setUser] = useState(null);

  // States for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(true);

  // Address states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // Đọc tab từ URL params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['appointments', 'payments', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Lấy thông tin user và patientId từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('🔍 PatientDashboard - Loading user from localStorage:', parsedUser);
        console.log('🔍 PatientDashboard - User picture field:', parsedUser?.picture);
        console.log('🔍 PatientDashboard - User avatar field:', parsedUser?.avatar);
        setUser(parsedUser);
        const userId = parsedUser.id;
        if (userId) {
          patientApi
            .getPatientByUserId(userId)
            .then((res) => {
              const data = res.data || res;
              setPatientId(data.patientId);
            })
            .catch((err) => {
              console.error("Error getting patient info:", err);
            });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Parse existing address and set dropdowns
  useEffect(() => {
    if (user?.address && provinces.length > 0) {
      console.log('🔍 Parsing address:', user.address);
      const parsedAddress = addressApi.parseAddressFlexible(user.address);
      console.log('🔍 Parsed address:', parsedAddress);
      if (parsedAddress) {
        // Find province
        const province = addressApi.findProvinceByName(provinces, parsedAddress.province);
        console.log('🔍 Found province:', province);
        if (province) {
          setSelectedProvince(province.code);
        }
      }
    }
  }, [user?.address, provinces]);

  // Load districts when province is set from existing address
  useEffect(() => {
    if (selectedProvince && user?.address && districts.length > 0) {
      console.log('🔍 Loading districts for province:', selectedProvince);
      console.log('🔍 Available districts:', districts.length);
      const parsedAddress = addressApi.parseAddressFlexible(user.address);
      console.log('🔍 Parsed address for district:', parsedAddress);
      if (parsedAddress) {
        // Find district
        const district = addressApi.findDistrictByName(districts, parsedAddress.district);
        console.log('🔍 Found district:', district);
        if (district) {
          setSelectedDistrict(district.code);
        }
      }
    }
  }, [selectedProvince, districts, user?.address]);

  // Load wards when district is set from existing address
  useEffect(() => {
    if (selectedDistrict && user?.address && wards.length > 0) {
      console.log('🔍 Loading wards for district:', selectedDistrict);
      console.log('🔍 Available wards:', wards.length);
      const parsedAddress = addressApi.parseAddressFlexible(user.address);
      console.log('🔍 Parsed address for ward:', parsedAddress);
      if (parsedAddress) {
        // Find ward
        const ward = addressApi.findWardByName(wards, parsedAddress.ward);
        console.log('🔍 Found ward:', ward);
        if (ward) {
          setSelectedWard(ward.code);
        }
      }
    }
  }, [selectedDistrict, wards, user?.address]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await addressApi.getProvinces();
        setProvinces(response.data);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      const loadDistricts = async () => {
        try {
          const response = await addressApi.getDistricts(selectedProvince);
          setDistricts(response.data.districts);
          setSelectedDistrict('');
          setWards([]);
          setSelectedWard('');
        } catch (error) {
          console.error('Error loading districts:', error);
        }
      };
      loadDistricts();
    }
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const loadWards = async () => {
        try {
          const response = await addressApi.getWards(selectedDistrict);
          setWards(response.data.wards);
          setSelectedWard('');
        } catch (error) {
          console.error('Error loading wards:', error);
        }
      };
      loadWards();
    }
  }, [selectedDistrict]);

  // Lấy danh sách thanh toán
  useEffect(() => {
    if (patientId && activeTab === 'payments') {
      loadPayments();
    }
  }, [patientId, activeTab]);

  // Lấy danh sách lịch hẹn
  useEffect(() => {
    if (patientId && activeTab === 'appointments') {
      loadAppointments();
    }
  }, [patientId, activeTab]);

  // Initialize form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        email: user.email || '',
        healthInsurance: user.healthInsurance || ''
      });
    }
  }, [user]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const response = await paymentApi.getPaymentsByPatient(patientId);
      const paymentsData = Array.isArray(response.data) ? response.data : [];
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      // Tạm thời sử dụng mock data để tránh lỗi
      setTimeout(() => {
        setAppointments([]);
        setLoadingAppointments(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
      setLoadingAppointments(false);
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { variant: "warning", text: "Chờ thanh toán" },
      COMPLETED: { variant: "success", text: "Đã thanh toán" },
      FAILED: { variant: "danger", text: "Thanh toán thất bại" },
      CANCELLED: { variant: "secondary", text: "Đã hủy" },
      REFUNDED: { variant: "info", text: "Đã hoàn tiền" }
    };

    const config = statusConfig[status] || { variant: "secondary", text: status };
    return <span className={`badge bg-${config.variant}`}>{config.text}</span>;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return 'Số điện thoại không được để trống';
    if (!phone.startsWith('0')) return 'Số điện thoại phải bắt đầu bằng số 0';
    if (phone.length !== 10) return 'Số điện thoại phải có đúng 10 số';
    if (!/^[0-9]+$/.test(phone)) return 'Số điện thoại chỉ được chứa số';
    return '';
  };

  const validateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Ngày sinh không được để trống';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 10 ? 'Bạn phải trên 10 tuổi' : '';
    }

    return age < 10 ? 'Bạn phải trên 10 tuổi' : '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email không được để trống';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Email không đúng định dạng';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Mật khẩu không được để trống';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[.,@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (.,@#$%...)';
    return '';
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    let error = '';
    if (name === 'phone') {
      error = validatePhone(value);
    } else if (name === 'dateOfBirth') {
      error = validateAge(value);
    } else if (name === 'email') {
      error = validateEmail(value);
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password errors when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle avatar click - show modal for preview
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  // Handle change avatar - open file picker directly
  const handleChangeAvatar = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('Kích thước file không được vượt quá 5MB');
          return;
        }

        try {
          setUploading(true);
          console.log('🚀 Starting avatar upload...');
          console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
          console.log('👤 User ID:', user.id);

          // Upload avatar trực tiếp cho user
          const uploadResponse = await userApi.uploadAvatar(user.id, file);
          console.log('📤 Upload response:', uploadResponse);
          console.log('📤 Upload response data:', uploadResponse.data);
          console.log('📤 Upload response status:', uploadResponse.status);

          const avatarUrl = uploadResponse.data; // Backend trả về URL trực tiếp
          console.log('🔗 Avatar URL:', avatarUrl);

          // Update local user data
          const updatedUser = { ...user, avatar: avatarUrl };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('💾 Local storage updated with new avatar');

          // Dispatch event to update header
          console.log('📡 Dispatching userChanged event...');
          window.dispatchEvent(new Event('userChanged'));
          console.log('📡 Event dispatched successfully');

          // Force refresh header after a short delay
          setTimeout(() => {
            console.log('🔄 Force refreshing header...');
            window.dispatchEvent(new Event('userChanged'));
          }, 100);

          setSuccessMessage('Cập nhật ảnh đại diện thành công!');
          setIsSuccess(true);
          setShowSuccessModal(true);
        } catch (error) {
          console.error('❌ Error updating avatar:', error);
          console.error('❌ Error details:', error.response?.data || error.message);
          setSuccessMessage(`Có lỗi xảy ra khi cập nhật ảnh đại diện: ${error.message}`);
          setIsSuccess(false);
          setShowSuccessModal(true);
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  // Close avatar modal
  const handleCloseAvatar = () => {
    setShowAvatarModal(false);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setUploading(true);
      setErrors({});

      // Validate all fields
      const newErrors = {};

      // Required fields
      if (!formData.firstName?.trim()) newErrors.firstName = 'Họ tên không được để trống';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Tên không được để trống';

      // Phone validation
      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;

      // Email validation
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;

      // Age validation
      const ageError = validateAge(formData.dateOfBirth);
      if (ageError) newErrors.dateOfBirth = ageError;

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setUploading(false);
        return;
      }

      // Create address from dropdowns
      let address = '';
      if (selectedWard && selectedDistrict && selectedProvince) {
        const wardName = wards.find(w => w.code === selectedWard)?.name;
        const districtName = districts.find(d => d.code === selectedDistrict)?.name;
        const provinceName = provinces.find(p => p.code === selectedProvince)?.name;

        if (wardName && districtName && provinceName) {
          address = `${wardName}, ${districtName}, ${provinceName}`;
        }
      }

      // Update user data (without avatar)
      const updateData = {
        ...formData,
        address: address
      };

      await userApi.updateUserProfile(user.id, updateData);

      // Update local user data
      const updatedUser = { ...user, ...updateData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dispatch event to update header
      window.dispatchEvent(new Event('userChanged'));

      setIsEditing(false);
      setSuccessMessage('Cập nhật thông tin thành công!');
      setIsSuccess(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccessMessage('Có lỗi xảy ra khi cập nhật thông tin');
      setIsSuccess(false);
      setShowSuccessModal(true);
    } finally {
      setUploading(false);
    }
  };

  // Save password changes
  const handleSavePassword = async () => {
    try {
      setPasswordErrors({});

      // Validate password fields
      const newPasswordErrors = {};

      if (!passwordData.currentPassword?.trim()) {
        newPasswordErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
      }

      if (!passwordData.newPassword?.trim()) {
        newPasswordErrors.newPassword = 'Mật khẩu mới không được để trống';
      } else {
        const passwordError = validatePassword(passwordData.newPassword);
        if (passwordError) newPasswordErrors.newPassword = passwordError;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        newPasswordErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
      }

      if (Object.keys(newPasswordErrors).length > 0) {
        setPasswordErrors(newPasswordErrors);
        return;
      }

      setUploading(true);
      await userApi.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({ currentPassword: '', newPassword: '' });
      setIsEditingPassword(false);
      setSuccessMessage('Đổi mật khẩu thành công!');
      setIsSuccess(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({
        currentPassword: 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra'
      });
    } finally {
      setUploading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      address: user.address || '',
      email: user.email || '',
      healthInsurance: user.healthInsurance || ''
    });
    setErrors({});
  };

  // Cancel password editing
  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Lịch khám</h4>
              <button className="btn btn-outline-primary">
                <i className="bi bi-funnel me-2"></i>Lọc
              </button>
            </div>

            {loadingAppointments ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Đang tải dữ liệu...</p>
              </div>
            ) : appointments.length > 0 ? (
              <div className="row g-0" style={{ height: 'calc(100vh - 300px)' }}>
                {/* Left Panel - Appointment List */}
                <div className="col-md-4 border-end">
                  <div className="p-3 border-bottom">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mã giao dịch, tên dịch vụ, tên bệnh nhân..."
                        style={{ fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <div className="p-3" style={{ height: 'calc(100% - 80px)', overflowY: 'auto' }}>
                    {appointments.map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className="border rounded p-3 mb-3 cursor-pointer"
                        style={{
                          backgroundColor: index === 0 ? '#f8f9fa' : 'white',
                          border: index === 0 ? '2px solid #007bff' : '1px solid #dee2e6'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold">{appointment.patientName || 'Bệnh nhân'}</h6>
                            <p className="mb-1 text-muted small">
                              {appointment.appointmentTime || '17:45'} - {appointment.appointmentDate || '21/10/2025'}
                            </p>
                            <p className="mb-1 text-muted small">{appointment.patientName || 'Quang'}</p>
                            <span className={`badge ${appointment.status === 'CONFIRMED' ? 'bg-success' :
                                appointment.status === 'PENDING' ? 'bg-warning' :
                                  appointment.status === 'CANCELLED' ? 'bg-danger' :
                                    'bg-info'
                              }`}>
                              {appointment.status === 'CONFIRMED' ? 'Đã đặt lịch' :
                                appointment.status === 'PENDING' ? 'Chờ xác nhận' :
                                  appointment.status === 'CANCELLED' ? 'Đã hủy' :
                                    'Đã đặt lịch'}
                            </span>
                          </div>
                          <div className="text-end">
                            <div className="text-muted small">STT</div>
                            <div className="fw-bold text-primary" style={{ fontSize: '24px' }}>{index + 1}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Panel - Appointment Details */}
                <div className="col-md-8">
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <span className="text-success fw-bold">STT: {1}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-calendar-check text-success me-2"></i>
                        <span className="text-success fw-bold">Đã đặt lịch</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center mb-4">
                      <img
                        src="/images/default-doctor.jpg"
                        alt="Doctor"
                        className="rounded-circle me-3"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{appointments[0]?.patientName || 'Lê Thị Minh Hồng'}</h5>
                        <p className="text-muted mb-0">250 Nguyễn Xí, P.13, Q. Bình Thạnh, TP.HCM</p>
                      </div>
                      <div className="text-center">
                        <div className="bg-light p-2 rounded">
                          <div className="text-muted small">QR Code</div>
                          <div style={{ width: '80px', height: '80px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Information */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Thông tin đặt khám</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="form-label text-muted small">Mã phiếu khám</label>
                          <p className="fw-medium">YMA2510210480</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Ngày khám</label>
                          <p className="fw-medium">21/10/2025</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Giờ khám</label>
                          <p className="fw-medium text-success">17:45-17:50 (Buổi chiều)</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Chuyên khoa</label>
                          <p className="fw-medium">Nhi khoa</p>
                        </div>
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Thông tin bệnh nhân</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="form-label text-muted small">Mã bệnh nhân</label>
                          <p className="fw-medium text-primary">YMP252466879</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Họ và tên</label>
                          <p className="fw-medium">Quang</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Năm sinh</label>
                          <p className="fw-medium">09/11/2004</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Số điện thoại</label>
                          <p className="fw-medium">0906545241</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Giới tính</label>
                          <p className="fw-medium">Nam</p>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small">Địa chỉ</label>
                          <p className="fw-medium text-muted">Chưa cập nhật</p>
                        </div>
                      </div>
                    </div>

                    {/* Results Section */}
                    <div>
                      <h6 className="fw-bold mb-3">Kết quả</h6>
                      <hr />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <h5>Chưa có lịch hẹn nào</h5>
                <p className="text-muted">Bạn chưa có lịch hẹn nào. Hãy đặt lịch với bác sĩ để bắt đầu!</p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/patient/book-appointment'}
                >
                  Đặt lịch ngay
                </button>
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="p-0" style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>

            <div className="row g-0 h-100">
              {/* Left Panel - Profile Card */}
              <div className="col-md-4 border-end" style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <div className="p-4">
                  {/* Profile Card */}
                  <div className="card border-0 shadow-lg" style={{ borderRadius: '25px', background: 'linear-gradient(135deg, #a8d8ea 0%, #7bb3d3 100%)', overflow: 'hidden' }}>
                    <div className="card-body text-center p-4">
                      {/* Avatar Section */}
                      <div className="position-relative d-inline-block mb-3">
                        <div
                          className="position-relative"
                          style={{ cursor: 'pointer' }}
                          onClick={handleAvatarClick}
                          title="Click để xem ảnh đại diện"
                        >
                          {(() => {
                            console.log('🔍 PatientDashboard - User data:', user);
                            console.log('🔍 PatientDashboard - User avatarUrl:', user?.avatarUrl);
                            console.log('🔍 PatientDashboard - User avatar:', user?.avatar);
                            console.log('🔍 PatientDashboard - User picture:', user?.picture);

                            // Ưu tiên: Uploaded avatar > Google avatar (avatarUrl) > Google picture
                            let avatarSrc = null;

                            if (user?.avatarUrl) {
                              // Avatar đã upload hoặc Google avatar (ưu tiên cao nhất)
                              avatarSrc = user.avatarUrl.startsWith('/uploads/') ?
                                `http://localhost:8080${user.avatarUrl}` : user.avatarUrl;
                              console.log('✅ PatientDashboard - Using avatarUrl:', avatarSrc);
                            } else if (user?.picture) {
                              // Google picture trực tiếp
                              avatarSrc = user.picture;
                              console.log('✅ PatientDashboard - Using Google picture:', avatarSrc);
                            }

                            if (avatarSrc) {
                              return (
                                <img
                                  src={avatarSrc}
                                  alt="Avatar"
                                  className="rounded-circle shadow-lg"
                                  style={{
                                    width: '90px',
                                    height: '90px',
                                    objectFit: 'cover',
                                    border: '3px solid #87CEEB' // Xanh biển nhẹ
                                  }}
                                  onError={(e) => {
                                    console.log('❌ PatientDashboard - Avatar failed to load, showing initials');
                                    safeSetStyle(e.target, { display: 'none' });
                                    if (e.target.nextSibling) {
                                      safeSetStyle(e.target.nextSibling, { display: 'flex' });
                                     }
                                  }}
                                />
                              );
                            }

                            // Chỉ hiển thị initials cho tài khoản thông thường (không có Google avatar)
                            return (
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-lg"
                                style={{
                                  width: '90px',
                                  height: '90px',
                                  background: 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 100%)',
                                  fontSize: '32px',
                                  border: '3px solid #87CEEB' // Xanh biển nhẹ
                                }}
                              >
                                {(() => {
                                  // Tạo initials từ tên
                                  if (user?.firstName && user?.lastName) {
                                    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
                                  } else if (user?.firstName) {
                                    return user.firstName.charAt(0).toUpperCase();
                                  } else if (user?.fullName) {
                                    const names = user.fullName.split(' ');
                                    if (names.length >= 2) {
                                      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
                                    }
                                    return user.fullName.charAt(0).toUpperCase();
                                  } else if (user?.name) {
                                    const names = user.name.split(' ');
                                    if (names.length >= 2) {
                                      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
                                    }
                                    return user.name.charAt(0).toUpperCase();
                                  } else if (user?.email) {
                                    return user.email.charAt(0).toUpperCase();
                                  } else {
                                    return 'U';
                                  }
                                })()}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* User Info */}
                      <h5 className="fw-bold mb-2 text-white" style={{ fontSize: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {(() => {
                          if (!user) return 'Chưa đăng nhập';

                          // Kiểm tra nếu có fullName từ Google
                          if (user.fullName) {
                            return user.fullName;
                          }

                          // Kiểm tra firstName và lastName
                          if (user.firstName && user.lastName) {
                            return `${user.firstName} ${user.lastName}`;
                          }

                          // Kiểm tra name từ Google
                          if (user.name) {
                            return user.name;
                          }

                          // Fallback to email
                          if (user.email) {
                            return user.email.split('@')[0];
                          }

                          return 'Chưa cập nhật';
                        })()}
                      </h5>
                      <small className="text-white-50 mb-4 d-block" style={{ fontSize: '13px' }}>
                        {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </small>

                      {/* Change Avatar Button - Integrated */}
                      <button
                        className="btn btn-outline-secondary btn-sm shadow-sm w-100"
                        style={{
                          fontSize: '12px',
                          borderRadius: '15px',
                          fontWeight: '500',
                          background: 'transparent',
                          border: '2px solid #6c757d',
                          color: '#6c757d',
                          transition: 'all 0.3s ease',
                          padding: '6px 12px'
                        }}
                        onClick={handleChangeAvatar}
                        disabled={uploading}
                        onMouseEnter={(e) => {
                          if (!uploading) {
                            e.target.style.backgroundColor = '#6c757d';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6c757d';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        {uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang tải...
                          </>
                        ) : (
                          <>
                            <Camera size={16} className="me-2" />
                            Thay đổi ảnh
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Profile Details */}
              <div className="col-md-8" style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <div className="p-3">

                  {/* Alert */}
                  <div className="alert alert-warning d-flex align-items-center mb-4" style={{
                    backgroundColor: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '12px 16px',
                    boxShadow: '0 2px 8px rgba(255,193,7,0.3)'
                  }}>
                    <div className="me-3" style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#fdcb6e',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px rgba(253,203,110,0.6)'
                    }}></div>
                    <small className="mb-0 fw-medium" style={{ fontSize: '12px', color: '#2d3436' }}>
                      Hoàn thiện thông tin để đặt khám và quản lý hồ sơ y tế được tốt hơn.
                    </small>
                  </div>

                  {/* Basic Information */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0" style={{ fontSize: '16px', color: '#2d3436' }}>Thông tin cơ bản</h6>
                      {!isEditing && (
                        <button
                          className="btn btn-outline-secondary btn-sm shadow-sm"
                          style={{
                            fontSize: '12px',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            background: 'white',
                            border: '2px solid #6c757d',
                            color: '#6c757d',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => setIsEditing(true)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#6c757d';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.color = '#6c757d';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          <Edit size={14} className="me-1" />
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Họ</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName || ''}
                              onChange={handleInputChange}
                              className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                              style={{
                                fontSize: '13px',
                                borderRadius: '10px',
                                border: '2px solid #e9ecef',
                                transition: 'all 0.3s ease',
                                padding: '8px 12px'
                              }}
                              onFocus={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#667eea',
                                  boxShadow: '0 0 0 0.2rem rgba(102,126,234,0.25)'
                                });
                              }}
                              onBlur={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#e9ecef',
                                  boxShadow: 'none'
                                });
                              }}
                            />
                            {errors.firstName && <div className="invalid-feedback" style={{ fontSize: '10px' }}>{errors.firstName}</div>}
                          </div>
                        ) : (
                          <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>
                            {(() => {
                              if (user?.firstName) return user.firstName;
                              if (user?.fullName) {
                                const names = user.fullName.split(' ');
                                return names[0] || 'Chưa cập nhật';
                              }
                              if (user?.name) {
                                const names = user.name.split(' ');
                                return names[0] || 'Chưa cập nhật';
                              }
                              return 'Chưa cập nhật';
                            })()}
                          </p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Tên</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName || ''}
                              onChange={handleInputChange}
                              className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                              style={{
                                fontSize: '13px',
                                borderRadius: '10px',
                                border: '2px solid #e9ecef',
                                transition: 'all 0.3s ease',
                                padding: '8px 12px'
                              }}
                              onFocus={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#667eea',
                                  boxShadow: '0 0 0 0.2rem rgba(102,126,234,0.25)'
                                });
                              }}
                              onBlur={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#e9ecef',
                                  boxShadow: 'none'
                                });
                              }}
                            />
                            {errors.lastName && <div className="invalid-feedback" style={{ fontSize: '10px' }}>{errors.lastName}</div>}
                          </div>
                        ) : (
                          <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>
                            {(() => {
                              if (user?.lastName) return user.lastName;
                              if (user?.fullName) {
                                const names = user.fullName.split(' ');
                                return names[names.length - 1] || 'Chưa cập nhật';
                              }
                              if (user?.name) {
                                const names = user.name.split(' ');
                                return names[names.length - 1] || 'Chưa cập nhật';
                              }
                              return 'Chưa cập nhật';
                            })()}
                          </p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Điện thoại</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              name="phone"
                              value={formData.phone || ''}
                              onChange={handleInputChange}
                              className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                              style={{
                                fontSize: '13px',
                                borderRadius: '10px',
                                border: '2px solid #e9ecef',
                                transition: 'all 0.3s ease',
                                padding: '8px 12px'
                              }}
                              onFocus={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#667eea',
                                  boxShadow: '0 0 0 0.2rem rgba(102,126,234,0.25)'
                                });
                              }}
                              onBlur={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#e9ecef',
                                  boxShadow: 'none'
                                });
                              }}
                            />
                            {errors.phone && <div className="invalid-feedback" style={{ fontSize: '10px' }}>{errors.phone}</div>}
                          </div>
                        ) : (
                          <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>{user?.phone || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Ngày sinh</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth || ''}
                            onChange={handleInputChange}
                            className="form-control"
                            style={{
                              fontSize: '13px',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              transition: 'all 0.3s ease',
                              padding: '8px 12px'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#667eea';
                              e.target.style.boxShadow = '0 0 0 0.2rem rgba(102,126,234,0.25)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e9ecef';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        ) : (
                          <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Giới tính</label>
                        {isEditing ? (
                          <select
                            name="gender"
                            value={formData.gender || ''}
                            onChange={handleInputChange}
                            className="form-control"
                            style={{
                              fontSize: '13px',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              transition: 'all 0.3s ease',
                              padding: '8px 12px'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#667eea';
                              e.target.style.boxShadow = '0 0 0 0.2rem rgba(102,126,234,0.25)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e9ecef';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        ) : (
                          <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>{user?.gender || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                      {/* Address Section - All on one row */}
                      <div className="col-12">
                        <div className="row">
                          <div className="col-4">
                            <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Tỉnh/TP</label>
                            {isEditing ? (
                              <select
                                name="selectedProvince"
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                className="form-control"
                                style={{
                                  fontSize: '13px',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  transition: 'all 0.3s ease',
                                  padding: '8px 12px'
                                }}
                              >
                                <option value="">Chọn tỉnh/thành phố</option>
                                {provinces.map(province => (
                                  <option key={province.code} value={province.code}>
                                    {province.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>
                                {(() => {
                                  if (user?.address && provinces.length > 0) {
                                    const parsedAddress = addressApi.parseAddressFlexible(user.address);
                                    if (parsedAddress) {
                                      const province = addressApi.findProvinceByName(provinces, parsedAddress.province);
                                      return province?.name || 'Chưa cập nhật';
                                    }
                                  }
                                  return 'Chưa cập nhật';
                                })()}
                              </p>
                            )}
                          </div>
                          <div className="col-4">
                            <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Quận/Huyện</label>
                            {isEditing ? (
                              <select
                                name="selectedDistrict"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="form-control"
                                style={{
                                  fontSize: '13px',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  transition: 'all 0.3s ease',
                                  padding: '8px 12px'
                                }}
                                disabled={!selectedProvince}
                              >
                                <option value="">Chọn quận/huyện</option>
                                {districts.map(district => (
                                  <option key={district.code} value={district.code}>
                                    {district.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>
                                {(() => {
                                  if (user?.address && districts.length > 0) {
                                    const parsedAddress = addressApi.parseAddressFlexible(user.address);
                                    if (parsedAddress) {
                                      const district = addressApi.findDistrictByName(districts, parsedAddress.district);
                                      return district?.name || 'Chưa cập nhật';
                                    }
                                  }
                                  return 'Chưa cập nhật';
                                })()}
                              </p>
                            )}
                          </div>
                          <div className="col-4">
                            <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Phường/Xã</label>
                            {isEditing ? (
                              <select
                                name="selectedWard"
                                value={selectedWard}
                                onChange={(e) => setSelectedWard(e.target.value)}
                                className="form-control"
                                style={{
                                  fontSize: '13px',
                                  borderRadius: '10px',
                                  border: '2px solid #e9ecef',
                                  transition: 'all 0.3s ease',
                                  padding: '8px 12px'
                                }}
                                disabled={!selectedDistrict}
                              >
                                <option value="">Chọn phường/xã</option>
                                {wards.map(ward => (
                                  <option key={ward.code} value={ward.code}>
                                    {ward.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="mb-0 fw-medium" style={{ fontSize: '13px', color: '#2d3436' }}>
                                {(() => {
                                  if (user?.address && wards.length > 0) {
                                    const parsedAddress = addressApi.parseAddressFlexible(user.address);
                                    if (parsedAddress) {
                                      const ward = addressApi.findWardByName(wards, parsedAddress.ward);
                                      return ward?.name || 'Chưa cập nhật';
                                    }
                                  }
                                  return 'Chưa cập nhật';
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3" style={{ fontSize: '16px', color: '#2d3436' }}>Thông tin bổ sung</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Mã BHYT</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="healthInsurance"
                            value={formData.healthInsurance || ''}
                            onChange={handleInputChange}
                            className="form-control"
                            style={{
                              fontSize: '13px',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              transition: 'all 0.3s ease',
                              padding: '8px 12px'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#667eea';
                              e.target.style.boxShadow = '0 0 0 0.2rem rgba(102,126,234,0.25)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e9ecef';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        ) : (
                          <p className="mb-0 fw-medium text-muted" style={{ fontSize: '13px' }}>{user?.healthInsurance || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Email</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email || ''}
                              onChange={handleInputChange}
                              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                              style={{
                                fontSize: '13px',
                                borderRadius: '10px',
                                border: '2px solid #e9ecef',
                                transition: 'all 0.3s ease',
                                padding: '8px 12px'
                              }}
                              onFocus={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#667eea',
                                  boxShadow: '0 0 0 0.2rem rgba(102,126,234,0.25)'
                                });
                              }}
                              onBlur={(e) => {
                                safeSetStyle(e.target, {
                                  borderColor: '#e9ecef',
                                  boxShadow: 'none'
                                });
                              }}
                            />
                            {errors.email && <div className="invalid-feedback" style={{ fontSize: '10px' }}>{errors.email}</div>}
                          </div>
                        ) : (
                          <p className="mb-0 fw-medium text-muted" style={{ fontSize: '13px' }}>{user?.email || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Lịch sử bệnh án</label>
                        {isEditing ? (
                          <textarea
                            name="medicalHistory"
                            value={formData.medicalHistory || ''}
                            onChange={handleInputChange}
                            className="form-control"
                            rows="4"
                            placeholder="Nhập lịch sử bệnh án, tiền sử bệnh lý, dị ứng thuốc..."
                            style={{
                              fontSize: '13px',
                              borderRadius: '10px',
                              border: '2px solid #e9ecef',
                              transition: 'all 0.3s ease',
                              padding: '8px 12px',
                              resize: 'vertical'
                            }}
                            onFocus={(e) => {
                              safeSetStyle(e.target, {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 0.2rem rgba(102,126,234,0.25)'
                              });
                            }}
                            onBlur={(e) => {
                              safeSetStyle(e.target, {
                                borderColor: '#e9ecef',
                                boxShadow: 'none'
                              });
                            }}
                          />
                        ) : (
                          <div className="p-3" style={{ 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '10px', 
                            border: '1px solid #e9ecef',
                            minHeight: '80px'
                          }}>
                            <p className="mb-0 fw-medium text-muted" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                              {user?.medicalHistory || 'Chưa cập nhật lịch sử bệnh án'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="d-flex gap-3 mb-4">
                      <button
                        className="btn btn-outline-success btn-sm shadow-sm"
                        onClick={handleSaveProfile}
                        disabled={uploading}
                        style={{
                          fontSize: '13px',
                          padding: '8px 20px',
                          borderRadius: '25px',
                          background: 'transparent',
                          border: '2px solid #00b894',
                          color: '#00b894',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!uploading) {
                            safeSetStyle(e.target, {
                              backgroundColor: '#00b894',
                              color: 'white',
                              transform: 'translateY(-1px)'
                            });
                          }
                        }}
                        onMouseLeave={(e) => {
                          safeSetStyle(e.target, {
                            backgroundColor: 'transparent',
                            color: '#00b894',
                            transform: 'translateY(0)'
                          });
                        }}
                      >
                        {uploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save size={14} className="me-2" />
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm shadow-sm"
                        onClick={handleCancelEdit}
                        style={{
                          fontSize: '13px',
                          padding: '8px 20px',
                          borderRadius: '25px',
                          border: '2px solid #e17055',
                          color: '#e17055',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          safeSetStyle(e.target, {
                            backgroundColor: '#e17055',
                            color: 'white',
                            transform: 'translateY(-1px)'
                          });
                        }}
                        onMouseLeave={(e) => {
                          safeSetStyle(e.target, {
                            backgroundColor: 'transparent',
                            color: '#e17055',
                            transform: 'translateY(0)'
                          });
                        }}
                      >
                        <X size={14} className="me-2" />
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Change Password Section */}
                  <div className="card shadow-sm" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="card-title mb-0 fw-bold" style={{ fontSize: '16px', color: '#2d3436' }}>Thay đổi mật khẩu</h6>
                        {!isEditingPassword && (
                          <button
                            className="btn btn-outline-secondary btn-sm shadow-sm"
                            onClick={() => setIsEditingPassword(true)}
                            style={{
                              fontSize: '12px',
                              padding: '6px 16px',
                              borderRadius: '20px',
                              background: 'white',
                              border: '2px solid #6c757d',
                              color: '#6c757d',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              safeSetStyle(e.target, {
                                backgroundColor: '#6c757d',
                                color: 'white',
                                transform: 'translateY(-1px)'
                              });
                            }}
                            onMouseLeave={(e) => {
                              safeSetStyle(e.target, {
                                backgroundColor: 'white',
                                color: '#6c757d',
                                transform: 'translateY(0)'
                              });
                            }}
                          >
                            <Edit size={14} className="me-1" />
                            Chỉnh sửa
                          </button>
                        )}
                      </div>
                      {isEditingPassword ? (
                        <div>
                          <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Mật khẩu hiện tại *</label>
                            <div className="position-relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                                placeholder="Mật khẩu hiện tại của bạn"
                                style={{
                                  fontSize: '13px',
                                  borderRadius: '10px',
                                  border: passwordErrors.currentPassword ? '2px solid #dc3545' : '2px solid #e9ecef',
                                  transition: 'all 0.3s ease',
                                  padding: '8px 40px 8px 12px',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'textfield',
                                  backgroundImage: 'none'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#667eea';
                                  e.target.style.boxShadow = '0 0 0 0.2rem rgba(102,126,234,0.25)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e9ecef';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  padding: '0 12px',
                                  color: '#6c757d',
                                  fontSize: '16px'
                                }}
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                            {passwordErrors.currentPassword && (
                              <div className="mt-1" style={{ fontSize: '12px', color: '#dc3545' }}>
                                {passwordErrors.currentPassword}
                              </div>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-medium" style={{ fontSize: '12px', color: '#636e72' }}>Mật khẩu mới *</label>
                            <div className="position-relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                                placeholder="Nhập mật khẩu mới"
                                style={{
                                  fontSize: '13px',
                                  borderRadius: '10px',
                                  border: passwordErrors.newPassword ? '2px solid #dc3545' : '2px solid #e9ecef',
                                  transition: 'all 0.3s ease',
                                  padding: '8px 40px 8px 12px',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'textfield',
                                  backgroundImage: 'none'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#667eea';
                                  e.target.style.boxShadow = '0 0 0 0.2rem rgba(102,126,234,0.25)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e9ecef';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  padding: '0 12px',
                                  color: '#6c757d',
                                  fontSize: '16px'
                                }}
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                            {passwordErrors.newPassword && (
                              <div className="mt-1" style={{ fontSize: '12px', color: '#dc3545' }}>
                                {passwordErrors.newPassword}
                              </div>
                            )}
                          </div>
                          <div className="d-flex gap-3">
                            <button
                              className="btn btn-outline-success btn-sm shadow-sm"
                              onClick={handleSavePassword}
                              disabled={uploading}
                              style={{
                                fontSize: '13px',
                                padding: '8px 20px',
                                borderRadius: '25px',
                                background: 'transparent',
                                border: '2px solid #00b894',
                                color: '#00b894',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!uploading) {
                                  e.target.style.backgroundColor = '#00b894';
                                  e.target.style.color = 'white';
                                  e.target.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#00b894';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              {uploading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm shadow-sm"
                              onClick={handleCancelPassword}
                              style={{
                                fontSize: '13px',
                                padding: '8px 20px',
                                borderRadius: '25px',
                                border: '2px solid #e17055',
                                color: '#e17055',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#e17055';
                                e.target.style.color = 'white';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#e17055';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted d-flex align-items-center" style={{ fontSize: '12px' }}>
                          <i className="bi bi-info-circle me-2"></i>
                          Nhấn "Chỉnh sửa" để thay đổi mật khẩu
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="p-0">
            {/* Header */}
            <div className="bg-white border-bottom px-4 py-3">
              <h4 className="mb-0 fw-bold">Lịch sử thanh toán</h4>
            </div>

            <div className="p-4">
              {loadingPayments ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Đang tải lịch sử thanh toán...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-5">
                  <CreditCard size={64} className="text-muted mb-3" />
                  <h5>Chưa có giao dịch nào</h5>
                  <p className="text-muted">Bạn chưa có lịch sử thanh toán nào trong hệ thống.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Mã giao dịch</th>
                        <th>Dịch vụ</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                        <th>Ngày thanh toán</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="fw-bold text-primary">
                            #{payment.id}
                          </td>
                          <td>
                            <div>
                              <strong>{payment.serviceName || payment.appointment?.doctor?.user?.fullName || 'Dịch vụ khám bệnh'}</strong>
                              <br />
                              <small className="text-muted">
                                {payment.description || 'Thanh toán lịch hẹn khám bệnh'}
                              </small>
                            </div>
                          </td>
                          <td className="fw-bold text-success">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <CreditCard size={16} className="me-2 text-muted" />
                              <span>{payment.paymentMethod || 'Chuyển khoản'}</span>
                            </div>
                          </td>
                          <td>{getPaymentStatusBadge(payment.status)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Clock size={16} className="me-2 text-muted" />
                              <span>
                                {payment.paymentDate ?
                                  new Date(payment.paymentDate).toLocaleDateString('vi-VN') :
                                  '--'
                                }
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title="Xem chi tiết"
                            >
                              <DollarSign size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        {/* Left Sidebar Navigation */}
        <div className="col-md-3 col-lg-2">
          <div className="bg-white rounded shadow-sm p-0" style={{ minHeight: '500px' }}>
            <div className="list-group list-group-flush">
              <button
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'appointments' ? 'active' : ''
                  }`}
                onClick={() => setActiveTab('appointments')}
                style={{
                  backgroundColor: activeTab === 'appointments' ? '#e3f2fd' : 'transparent',
                  fontWeight: activeTab === 'appointments' ? 'bold' : 'normal',
                  color: activeTab === 'appointments' ? '#1976d2' : '#333',
                  borderLeft: activeTab === 'appointments' ? '4px solid #1976d2' : '4px solid transparent'
                }}
              >
                <Calendar className="me-2" size={18} />
                Lịch khám
              </button>

              <button
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'payments' ? 'active' : ''
                  }`}
                onClick={() => setActiveTab('payments')}
                style={{
                  backgroundColor: activeTab === 'payments' ? '#e3f2fd' : 'transparent',
                  fontWeight: activeTab === 'payments' ? 'bold' : 'normal',
                  color: activeTab === 'payments' ? '#1976d2' : '#333',
                  borderLeft: activeTab === 'payments' ? '4px solid #1976d2' : '4px solid transparent'
                }}
              >
                <CreditCard className="me-2" size={18} />
                Lịch sử thanh toán
              </button>

              <button
                className={`list-group-item list-group-item-action border-0 py-3 d-flex align-items-center ${activeTab === 'profile' ? 'active' : ''
                  }`}
                onClick={() => setActiveTab('profile')}
                style={{
                  backgroundColor: activeTab === 'profile' ? '#e3f2fd' : 'transparent',
                  fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
                  color: activeTab === 'profile' ? '#1976d2' : '#333',
                  borderLeft: activeTab === 'profile' ? '4px solid #1976d2' : '4px solid transparent'
                }}
              >
                <User className="me-2" size={18} />
                Tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          <div className={`bg-white shadow-sm ${activeTab === 'profile' ? '' : 'rounded'}`} style={{ minHeight: '500px' }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Avatar Modal - Simple Preview */}
      {showAvatarModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden', maxWidth: '400px' }}>
              <div className="modal-body p-0 text-center">
                {/* Large Avatar Display */}
                <div className="p-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith('/uploads/') ? `http://localhost:8080${user.avatarUrl}` : user.avatarUrl}
                      alt="Avatar"
                      className="img-fluid rounded-circle shadow-lg"
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        border: '4px solid white',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto shadow-lg"
                      style={{
                        width: '200px',
                        height: '200px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '60px',
                        border: '4px solid white',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }}
                    >
                      {(() => {
                        if (!user) return 'U';

                        // Tạo initials từ tên
                        if (user.firstName && user.lastName) {
                          return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
                        } else if (user.firstName) {
                          return user.firstName.charAt(0).toUpperCase();
                        } else if (user.fullName) {
                          const names = user.fullName.split(' ');
                          if (names.length >= 2) {
                            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
                          }
                          return user.fullName.charAt(0).toUpperCase();
                        } else if (user.name) {
                          const names = user.name.split(' ');
                          if (names.length >= 2) {
                            return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
                          }
                          return user.name.charAt(0).toUpperCase();
                        } else if (user.email) {
                          return user.email.charAt(0).toUpperCase();
                        } else {
                          return 'U';
                        }
                      })()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-3 bg-white">
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={handleCloseAvatar}
                      style={{
                        borderRadius: '15px',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '6px 16px'
                      }}
                    >
                      <i className="bi bi-x-lg me-1"></i>
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3"
                      onClick={handleChangeAvatar}
                      disabled={uploading}
                      style={{
                        borderRadius: '15px',
                        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '6px 16px',
                        boxShadow: '0 2px 8px rgba(102,126,234,0.3)'
                      }}
                    >
                      {uploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Đang tải...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-pencil me-1"></i>
                          Chỉnh sửa
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className={`modal-title ${isSuccess ? 'text-success' : 'text-danger'}`}>
                  <i className={`bi ${isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  {isSuccess ? 'Thành công' : 'Lỗi'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSuccessModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="mb-3">
                  <i className={`bi ${isSuccess ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'}`} style={{ fontSize: '48px' }}></i>
                </div>
                <p className="mb-0">{successMessage}</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button
                  type="button"
                  className={`btn ${isSuccess ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => setShowSuccessModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
