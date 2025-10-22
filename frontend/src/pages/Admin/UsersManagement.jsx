import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Modal, Button, Form, Table, Alert, Badge, Dropdown, Row, Col } from 'react-bootstrap';
import { BiEdit, BiPlus, BiSearch, BiDotsVertical, BiCheckCircle, BiXCircle, BiUserCheck, BiUserPlus } from 'react-icons/bi';
import userApi from '../../api/userApi';
import doctorApi from '../../api/doctorApi';
import fileUploadApi from '../../api/fileUploadApi';
import { getFullAvatarUrl } from '../../utils/avatarUtils';

// Utility functions
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Tính tuổi chính xác (xét cả tháng và ngày)
  return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;
};

const validateAgeByRole = (dateOfBirth, roleType) => {
  const age = calculateAge(dateOfBirth);
  
  if (roleType === 'admin' && age < 18) {
    return 'Admin phải từ 18 tuổi trở lên';
  }
  
  if (roleType === 'doctor' && age < 22) {
    return 'Bác sĩ phải từ 22 tuổi trở lên';
  }
  
  return null; // No error
};

const UsersManagement = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    doctors: 0,
    patients: 0,
    active: 0,
    inactive: 0
  });

  // State để theo dõi thống kê được lọc
  const [filteredStats, setFilteredStats] = useState({
    total: 0,
    admins: 0,
    doctors: 0,
    patients: 0,
    active: 0,
    inactive: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createUserType, setCreateUserType] = useState('admin'); // 'admin' hoặc 'doctor'

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    avatarUrl: '',
    status: 'ACTIVE',
    roleId: 1, // Default to ADMIN role
    // Các trường chung cho admin và doctor
    degree: '',
    experience: '',
    idNumber: '',
    // Các trường đặc biệt cho bác sĩ
    specialty: '',
    departmentId: '',
    bio: '',
    licenseNumber: '',
    workingHours: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Role mapping
  const roleMap = {
    1: { name: 'ADMIN', label: 'Quản trị viên', color: 'danger' },
    2: { name: 'DOCTOR', label: 'Bác sĩ', color: 'primary' },
    3: { name: 'PATIENT', label: 'Bệnh nhân', color: 'success' }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Gọi lại fetchUsers và fetchStats khi filterRole thay đổi
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filterRole]);

  // Cập nhật thống kê khi có thay đổi filter hoặc users
  useEffect(() => {
    updateFilteredStats();
  }, [users, filterRole, filterStatus, searchTerm]);

  // Auto hide alerts after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Deep-link: open profile modal by ?userId=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdParam = params.get('userId');
    if (!userIdParam) return;
    const idNum = Number(userIdParam);
    if (!idNum) return;
    const found = users.find(u => u.id === idNum);
    if (found) {
      openEditModal(found);
    }
  }, [location.search, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Nếu đang lọc theo bác sĩ, sử dụng API bác sĩ trực tiếp
      if (filterRole === '2') {
        const response = await doctorApi.getAllDoctors();
        let doctorsData = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            doctorsData = response.data;
          } else if (response.data.content && Array.isArray(response.data.content)) {
            doctorsData = response.data.content;
          }
        }
        
        // Convert doctor data to user format
        const convertedUsers = doctorsData.map(doctor => ({
          id: doctor.user?.id || doctor.doctorId, // Sử dụng userId thay vì doctorId
          doctorId: doctor.doctorId, // Giữ lại doctorId để tham chiếu
          email: doctor.user?.email,
          firstName: doctor.user?.firstName,
          lastName: doctor.user?.lastName,
          phone: doctor.user?.phone,
          gender: doctor.user?.gender,
          dateOfBirth: doctor.user?.dateOfBirth,
          address: doctor.user?.address,
          avatarUrl: doctor.user?.avatarUrl,
          createdAt: doctor.user?.createdAt,
          status: doctor.user?.status || 'ACTIVE', // Đảm bảo có status mặc định
          role: doctor.user?.role || { id: 2, name: 'DOCTOR' }, // Đảm bảo có role cho bác sĩ
          // Doctor specific info
          specialty: doctor.specialty,
          departmentName: doctor.department?.departmentName,
          departmentId: doctor.department?.id,
          bio: doctor.bio,
          doctorStatus: doctor.status
        }));
        
        
        setUsers(convertedUsers);
      } else {
        // Sử dụng API user cho các trường hợp khác
        const response = await userApi.getAllUsersWithPatientInfo();
        
        
        setUsers(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Lỗi khi tải danh sách người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const userStats = await userApi.getUserStats();
      
      // Nếu đang lọc theo bác sĩ, cập nhật số lượng bác sĩ từ API bác sĩ
      if (filterRole === '2') {
        try {
          const doctorResponse = await doctorApi.getAllDoctors();
          let doctorsCount = 0;
          
          if (doctorResponse.data) {
            if (Array.isArray(doctorResponse.data)) {
              doctorsCount = doctorResponse.data.length;
            } else if (doctorResponse.data.content && Array.isArray(doctorResponse.data.content)) {
              doctorsCount = doctorResponse.data.content.length;
            }
          }
          
          userStats.doctors = doctorsCount;
          console.log('Updated doctors count from doctor API:', doctorsCount);
        } catch (err) {
          console.error('Error fetching doctor count:', err);
        }
      }
      
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  // Cập nhật thống kê dựa trên bộ lọc hiện tại
  const updateFilteredStats = () => {
    const filtered = users.filter(user => {
      const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Khi sử dụng API bác sĩ, không cần filter theo role nữa vì đã lọc sẵn
      const matchesRole = !filterRole || (filterRole === '2' ? true : user.role?.id.toString() === filterRole);
      
      const matchesStatus = !filterStatus || user.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    const newFilteredStats = {
      total: filtered.length,
      admins: filtered.filter(user => user.role?.id === 1).length,
      doctors: filtered.filter(user => user.role?.id === 2 || filterRole === '2').length,
      patients: filtered.filter(user => user.role?.id === 3).length,
      active: filtered.filter(user => user.status === 'ACTIVE').length,
      inactive: filtered.filter(user => user.status === 'INACTIVE').length
    };

    setFilteredStats(newFilteredStats);
  };

  // Hàm xử lý click vào thẻ thống kê để lọc
  const handleStatsClick = (filterType, value) => {
    switch (filterType) {
      case 'role':
        setFilterRole(value);
        setFilterStatus('');
        setSearchTerm('');
        break;
      case 'status':
        setFilterStatus(value);
        setFilterRole('');
        setSearchTerm('');
        break;
      case 'all':
        setFilterRole('');
        setFilterStatus('');
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation bắt buộc cơ bản
    if (!formData.email || !formData.email.trim()) {
      setError('Email là bắt buộc');
      return;
    }
    if (!formData.password || !formData.password.trim()) {
      setError('Mật khẩu là bắt buộc');
      return;
    }
    if (!formData.firstName || !formData.firstName.trim()) {
      setError('Tên là bắt buộc');
      return;
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      setError('Họ là bắt buộc');
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      setError('Số điện thoại là bắt buộc');
      return;
    }
    
    // Validation số điện thoại (10-11 số)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Số điện thoại phải có từ 10-11 chữ số');
      return;
    }
    if (!formData.gender) {
      setError('Giới tính là bắt buộc');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Ngày sinh là bắt buộc');
      return;
    }
    if (!formData.address || !formData.address.trim()) {
      setError('Địa chỉ là bắt buộc');
      return;
    }
    
    // Validation tuổi
    const ageError = validateAgeByRole(formData.dateOfBirth, createUserType);
    if (ageError) {
      setError(ageError);
      return;
    }
    
    // Validation các trường chung cho admin và doctor
    if (!formData.degree || !formData.degree.trim()) {
      setError('Bằng cấp là bắt buộc');
      return;
    }
    if (!formData.experience || !formData.experience.trim()) {
      setError('Kinh nghiệm làm việc là bắt buộc');
      return;
    }
    if (!formData.idNumber || !formData.idNumber.trim()) {
      setError('Số CCCD/CMND là bắt buộc');
      return;
    }
    
    // Validation đặc biệt cho bác sĩ
    if (createUserType === 'doctor') {
      if (!formData.specialty || !formData.specialty.trim()) {
        setError('Chuyên khoa là bắt buộc cho bác sĩ');
        return;
      }
      if (!formData.departmentId) {
        setError('Khoa là bắt buộc cho bác sĩ');
        return;
      }
      if (!formData.licenseNumber || !formData.licenseNumber.trim()) {
        setError('Số chứng chỉ hành nghề là bắt buộc cho bác sĩ');
        return;
      }
      if (!formData.workingHours || !formData.workingHours.trim()) {
        setError('Giờ làm việc là bắt buộc cho bác sĩ');
        return;
      }
    }
    
    // Clear error before proceeding
    setError('');
    
    try {
      setLoading(true);
      
      // Prepare user data with hashed password
      const userData = {
        email: formData.email,
        passwordHash: formData.password, // Backend expects passwordHash field
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        avatarUrl: formData.avatarUrl, // Add avatarUrl
        roleId: formData.roleId
      };
      
      // Tạo user trước
      const createdUser = await userApi.createUser(userData);
      
      // Nếu là bác sĩ, tạo thông tin bác sĩ
      if (createUserType === 'doctor') {
        const doctorData = {
          userId: createdUser.data.id,
          specialty: formData.specialty,
          departmentId: parseInt(formData.departmentId),
          bio: formData.bio || '',
          status: 'ACTIVE'
        };
        
        await doctorApi.createDoctor(doctorData);
      }
      
      setSuccess(`Tạo ${createUserType === 'admin' ? 'quản trị viên' : 'bác sĩ'} mới thành công!`);
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError('Lỗi khi tạo người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Validation bắt buộc cơ bản
    if (!formData.email || !formData.email.trim()) {
      setError('Email là bắt buộc');
      return;
    }
    if (!formData.firstName || !formData.firstName.trim()) {
      setError('Tên là bắt buộc');
      return;
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      setError('Họ là bắt buộc');
      return;
    }
    if (!formData.phone || !formData.phone.trim()) {
      setError('Số điện thoại là bắt buộc');
      return;
    }
    
    // Validation số điện thoại (10-11 số)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Số điện thoại phải có từ 10-11 chữ số');
      return;
    }
    
    if (!formData.gender) {
      setError('Giới tính là bắt buộc');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Ngày sinh là bắt buộc');
      return;
    }
    if (!formData.address || !formData.address.trim()) {
      setError('Địa chỉ là bắt buộc');
      return;
    }
    
    // Validation tuổi
    const userRole = selectedUser?.role?.name || (formData.roleId === 1 ? 'Admin' : 'Doctor');
    const roleType = userRole.toLowerCase();
    const ageError = validateAgeByRole(formData.dateOfBirth, roleType);
    if (ageError) {
      setError(ageError);
      return;
    }
    
    // Clear error before proceeding
    setError('');
    
    try {
      setLoading(true);
      
      // Prepare user data, only include passwordHash if password is provided
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        avatarUrl: formData.avatarUrl, // Add avatarUrl
        status: formData.status,
        roleId: formData.roleId
      };
      
      // Only include passwordHash if a new password is provided
      if (formData.password && formData.password.trim() !== '') {
        userData.passwordHash = formData.password;
      }
      
      console.log('User Data to send:', userData);
      
      await userApi.updateUser(selectedUser.id, userData);
      
      setSuccess('Cập nhật thông tin người dùng thành công!');
      setShowEditModal(false);
      resetForm();
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError('Lỗi khi cập nhật người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      
      await userApi.deleteUser(selectedUser.id);
      
      setSuccess('Vô hiệu hóa người dùng thành công!');
      setShowDeleteModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError('Lỗi khi xóa người dùng: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      avatarUrl: '',
      status: 'ACTIVE',
      roleId: 1,
      // Reset các trường chung cho admin và doctor
      degree: '',
      experience: '',
      idNumber: '',
      // Reset các trường đặc biệt cho bác sĩ
      specialty: '',
      departmentId: '',
      bio: '',
      licenseNumber: '',
      workingHours: ''
    });
    setSelectedUser(null);
  };

  const openCreateModal = (userType) => {
    setCreateUserType(userType);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      avatarUrl: '',
      status: 'ACTIVE',
      roleId: userType === 'admin' ? 1 : 2, // 1 = ADMIN, 2 = DOCTOR
      // Reset các trường chung cho admin và doctor
      degree: '',
      experience: '',
      idNumber: '',
      // Reset các trường đặc biệt cho bác sĩ
      specialty: '',
      departmentId: '',
      bio: '',
      licenseNumber: '',
      workingHours: ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    
    
    setFormData({
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      avatarUrl: user.avatarUrl || '',
      status: user.status || 'ACTIVE',
      roleId: user.role?.id || 1
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Chỉ cho phép file ảnh (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploading(true);
    try {
      // For new user creation, we don't have userId yet, so pass null
      const userId = selectedUser?.id || null;
      const response = await fileUploadApi.uploadImage(file, userId, 'user');
      
      // 🔍 DEBUG: Log upload response
      console.log('=== UPLOAD DEBUG ===');
      console.log('Upload response:', response.data);
      console.log('Response URL:', response.data.url);
      console.log('====================');
      
      if (response.data.success) {
        const newAvatarUrl = response.data.url;
        console.log('Setting avatar URL:', newAvatarUrl);
        
        setFormData(prev => {
          const newFormData = {
            ...prev,
            avatarUrl: newAvatarUrl
          };
          console.log('New form data:', newFormData);
          return newFormData;
        });
        
        alert('Upload ảnh thành công!');
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Lỗi khi upload ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      setLoading(true);
      
      
      // Lấy thông tin user hiện tại để tránh lỗi validation
      const currentUserResponse = await userApi.getUserById(user.id);
      const currentUser = currentUserResponse.data;
      
      // Tạo userData với thông tin hiện tại và chỉ thay đổi status
      const userData = {
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone,
        gender: currentUser.gender,
        dateOfBirth: currentUser.dateOfBirth,
        address: currentUser.address,
        avatarUrl: currentUser.avatarUrl,
        status: newStatus,
        roleId: currentUser.role?.id || user.role?.id || (filterRole === '2' ? 2 : user.role?.id)
      };
      
      // Cập nhật user
      await userApi.updateUser(user.id, userData);
      
      setSuccess(`Cập nhật trạng thái người dùng thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}!`);
      
      // Refresh dữ liệu
      await fetchUsers();
      await fetchStats();
    } catch (err) {
      console.error('Status change error:', err);
      setError('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { variant: 'success', text: 'Hoạt động' },
      'INACTIVE': { variant: 'warning', text: 'Không hoạt động' }
    };
    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getRoleBadge = (roleId) => {
    const role = roleMap[roleId];
    if (!role) return <Badge bg="secondary">Unknown</Badge>;
    
    return (
      <Badge bg={role.color}>
        {role.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Khi sử dụng API bác sĩ, không cần filter theo role nữa vì đã lọc sẵn
    const matchesRole = !filterRole || (filterRole === '2' ? true : user.role?.id.toString() === filterRole);
    
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => a.id - b.id);

  return (
    <div className="container-fluid">
      <style jsx>{`
        .stats-card {
          border: 1px solid #e3e6f0;
          border-radius: 0.35rem;
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
          transition: all 0.3s ease;
        }
        
        .stats-card:hover {
          box-shadow: 0 0.25rem 2rem 0 rgba(58, 59, 69, 0.25);
          border-color: #5a5c69;
        }
        
        .stats-card:active {
          transform: translateY(1px);
        }
        
        .stats-card .card-body {
          padding: 1rem;
        }
        
        .stats-card .h4 {
          font-weight: 700;
          color: #5a5c69;
        }
        
        .stats-card:hover .h4 {
          color: #3a3b45;
        }
        
        .stats-card .text-muted {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stats-card small {
          font-size: 0.75rem;
          opacity: 0.7;
        }
        
        .stats-card i {
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        
        .stats-card:hover i {
          opacity: 1;
        }
      `}</style>
      {/* Toast Notifications - Hiển thị ở góc trên bên phải */}
      {error && (
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            minWidth: '350px',
            maxWidth: '500px',
            backgroundColor: '#f8d7da',
            border: '1px solid #dc3545',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 25px rgba(220, 53, 69, 0.3)',
            animation: 'slideInRight 0.5s ease-out',
            fontSize: '16px',
            fontWeight: '500',
            color: '#721c24'
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-3 fs-4" style={{ color: '#dc3545' }}></i>
              <div>
                <strong>Lỗi:</strong> {error}
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
              style={{ fontSize: '12px' }}
            ></button>
          </div>
        </div>
      )}
      {success && (
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            minWidth: '350px',
            maxWidth: '500px',
            backgroundColor: '#d1edff',
            border: '1px solid #28a745',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)',
            animation: 'slideInRight 0.5s ease-out',
            fontSize: '16px',
            fontWeight: '500',
            color: '#155724'
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-3 fs-4" style={{ color: '#28a745' }}></i>
              <div>
                <strong>Thành công:</strong> {success}
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
              style={{ fontSize: '12px' }}
            ></button>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Người dùng</h2>
        <Dropdown>
          <Dropdown.Toggle variant="primary" className="d-flex align-items-center gap-2">
            <BiPlus /> Thêm
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => openCreateModal('admin')}>
              <i className="bi bi-person-gear me-2"></i>
              Thêm Quản trị viên
            </Dropdown.Item>
            <Dropdown.Item onClick={() => openCreateModal('doctor')}>
              <i className="bi bi-person-badge me-2"></i>
              Thêm Bác sĩ
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Thống kê nhanh - Dashboard Style với khả năng click để lọc */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('all', '')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Tổng số</div>
                  <div className="h4 mb-0">{filteredStats.total}</div>
                  <small className="text-muted">/ {stats.total}</small>
                </div>
                <i className="bi bi-people fs-2 text-info"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('role', '1')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Quản trị viên</div>
                  <div className="h4 mb-0">{filteredStats.admins}</div>
                  <small className="text-muted">/ {stats.admins}</small>
                </div>
                <i className="bi bi-shield-check fs-2 text-danger"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('role', '2')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Bác sĩ</div>
                  <div className="h4 mb-0">{filteredStats.doctors}</div>
                  <small className="text-muted">/ {stats.doctors}</small>
                </div>
                <i className="bi bi-person-badge fs-2 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('role', '3')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Bệnh nhân</div>
                  <div className="h4 mb-0">{filteredStats.patients}</div>
                  <small className="text-muted">/ {stats.patients}</small>
                </div>
                <i className="bi bi-person-heart fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('status', 'ACTIVE')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Hoạt động</div>
                  <div className="h4 mb-0">{filteredStats.active}</div>
                  <small className="text-muted">/ {stats.active}</small>
                </div>
                <i className="bi bi-check-circle fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div 
            className="card stats-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => handleStatsClick('status', 'INACTIVE')}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Không hoạt động</div>
                  <div className="h4 mb-0">{filteredStats.inactive}</div>
                  <small className="text-muted">/ {stats.inactive}</small>
                </div>
                <i className="bi bi-x-circle fs-2 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị thông tin bộ lọc hiện tại */}
      {(filterRole || filterStatus || searchTerm) && (
        <div className="alert alert-info mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <i className="bi bi-funnel me-2"></i>
              <strong>Bộ lọc hiện tại:</strong>
              {filterRole && (
                <span className="badge bg-primary ms-2">
                  Vai trò: {roleMap[filterRole]?.label}
                </span>
              )}
              {filterStatus && (
                <span className="badge bg-secondary ms-2">
                  Trạng thái: {filterStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              )}
              {searchTerm && (
                <span className="badge bg-info ms-2">
                  Tìm kiếm: "{searchTerm}"
                </span>
              )}
              {filterRole === '2' && (
                <span className="badge bg-warning ms-2">
                  Hiển thị: {filteredUsers.length} / {stats.doctors} bác sĩ
                </span>
              )}
              {filterRole === '3' && (
                <span className="badge bg-warning ms-2">
                  Hiển thị: {filteredUsers.length} / {stats.patients} bệnh nhân
                </span>
              )}
            </div>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setFilterRole('');
                setFilterStatus('');
                setSearchTerm('');
              }}
            >
              <i className="bi bi-x-lg me-1"></i>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <BiSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0"
            />
          </div>
        </div>
        <div className="col-md-3">
          <Form.Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border-0 shadow-sm"
          >
            <option value="">Tất cả vai trò</option>
            <option value="1">Quản trị viên</option>
            <option value="2">Bác sĩ</option>
            <option value="3">Bệnh nhân</option>
          </Form.Select>
        </div>
        <div className="col-md-3">
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-0 shadow-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </Form.Select>
        </div>
        <div className="col-md-2">
          <button 
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm('');
              setFilterRole('');
              setFilterStatus('');
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Làm mới
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Avatar</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
           {!filterRole && <th>Vai trò</th>}
           {filterRole === '2' && <th>Chuyên khoa</th>}
           {filterRole === '2' && <th>Khoa</th>}
              <th>Trạng thái</th>
              {filterRole === '3' && (
                <th>Bảo hiểm y tế</th>
              )}
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={
                  filterRole === '3' ? "9" : 
                  filterRole === '2' ? "10" : 
                  filterRole === '1' ? "8" : // Bỏ 2 cột admin (cấp độ, quyền hạn)
                  filterRole ? "8" : "9"
                } className="text-center">Đang tải...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={
                  filterRole === '3' ? "9" : 
                  filterRole === '2' ? "10" : 
                  filterRole === '1' ? "8" : // Bỏ 2 cột admin (cấp độ, quyền hạn)
                  filterRole ? "8" : "9"
                } className="text-center">Không có người dùng nào</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {user.avatarUrl ? (
                        <>
                          <img 
                            src={getFullAvatarUrl(user.avatarUrl)} 
                            alt="Avatar" 
                            style={{
                              width: '40px', 
                              height: '40px', 
                              objectFit: 'cover', 
                              borderRadius: '50%',
                              border: '2px solid #dee2e6'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                          <div 
                            style={{
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%',
                              backgroundColor: '#6c757d',
                              display: 'none',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '16px'
                            }}
                          >
                            <i className="bi bi-person"></i>
                          </div>
                        </>
                      ) : (
                        <div 
                          style={{
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%',
                            backgroundColor: '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '16px'
                          }}
                        >
                          <i className="bi bi-person"></i>
                        </div>
                      )}
                  </td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  {!filterRole && <td>{getRoleBadge(user.role?.id)}</td>}
                  {filterRole === '2' && (
                    <td>
                      <span className="badge bg-info">
                        {user.specialty || 'Chưa cập nhật'}
                      </span>
                    </td>
                  )}
                  {filterRole === '2' && (
                    <td>
                      <span className="badge bg-secondary">
                        {user.departmentName || 'Chưa phân khoa'}
                      </span>
                    </td>
                  )}
                  <td>{getStatusBadge(user.status)}</td>
                  {filterRole === '3' && (
                    <td>
                      {user.healthInsuranceNumber ? (
                        <span className="badge bg-success">
                          <i className="bi bi-shield-check me-1"></i>
                          {user.healthInsuranceNumber}
                        </span>
                      ) : (
                        <span className="badge bg-warning">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Chưa có
                        </span>
                      )}
                    </td>
                  )}
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        title="Chỉnh sửa"
                      >
                        <BiEdit />
                      </Button>
                      
                      <Dropdown>
                        <Dropdown.Toggle 
                          variant="outline-secondary" 
                          size="sm"
                          title="Tùy chọn"
                        >
                          <BiDotsVertical />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          {/* Nút xem chi tiết cho bác sĩ và bệnh nhân */}
                          {(filterRole === '2' || filterRole === '3') && (
                            <Dropdown.Item 
                              onClick={() => openDetailModal(user)}
                              className="text-info fw-semibold"
                            >
                              <i className="bi bi-eye me-2"></i>
                              Xem chi tiết
                            </Dropdown.Item>
                          )}
                          {user.status !== 'ACTIVE' && (
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(user, 'ACTIVE')}
                              className="text-success fw-semibold"
                            >
                              <i className="bi bi-check-circle me-2"></i>
                              Kích hoạt
                            </Dropdown.Item>
                          )}
                          {user.status !== 'INACTIVE' && (
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(user, 'INACTIVE')}
                              className="text-warning fw-semibold"
                            >
                              <i className="bi bi-pause-circle me-2"></i>
                              Tạm dừng
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {createUserType === 'admin' ? (
              <>
                <i className="bi bi-person-gear me-2"></i>
                Thêm Quản trị viên Mới
              </>
            ) : (
              <>
                <i className="bi bi-person-badge me-2"></i>
                Thêm Bác sĩ Mới
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="Nhập email"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu *</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Họ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    placeholder="Nhập họ"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    placeholder="Nhập tên"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Điện thoại *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giới tính *</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    required
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày sinh *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số CCCD/CMND *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                    required
                    placeholder="Nhập số CCCD/CMND"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Các trường chung cho admin và doctor */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bằng cấp *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    required
                    placeholder="VD: Cử nhân, Thạc sĩ, Tiến sĩ..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kinh nghiệm làm việc *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    required
                    placeholder="VD: 5 năm, 10 năm..."
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ *</Form.Label>
              <Form.Control
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                placeholder="Nhập địa chỉ"
              />
            </Form.Group>
            
            {/* Các trường đặc biệt cho bác sĩ */}
            {createUserType === 'doctor' && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chuyên khoa *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.specialty || ''}
                        onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                        required
                        placeholder="Nhập chuyên khoa"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Khoa *</Form.Label>
                      <Form.Select
                        value={formData.departmentId || ''}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        required
                      >
                        <option value="">Chọn khoa</option>
                        <option value="1">Khoa Nội</option>
                        <option value="2">Khoa Ngoại</option>
                        <option value="3">Khoa Sản</option>
                        <option value="4">Khoa Nhi</option>
                        <option value="5">Khoa Tim mạch</option>
                        <option value="6">Khoa Thần kinh</option>
                        <option value="7">Khoa Da liễu</option>
                        <option value="8">Khoa Mắt</option>
                        <option value="9">Khoa Tai mũi họng</option>
                        <option value="10">Khoa Xương khớp</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số chứng chỉ hành nghề *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.licenseNumber || ''}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        required
                        placeholder="Nhập số chứng chỉ hành nghề"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giờ làm việc *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.workingHours || ''}
                        onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
                        required
                        placeholder="VD: 8:00-17:00, Thứ 2-6"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Giới thiệu bản thân</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Nhập giới thiệu về bản thân và chuyên môn..."
                  />
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Ảnh đại diện</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mb-2"
              />
              
              {/* Visual indicators */}
              <div className="mb-2">
                {formData.avatarUrl ? (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>Đã có ảnh
                  </span>
                ) : (
                  <span className="badge bg-warning">
                    <i className="bi bi-exclamation-triangle me-1"></i>Chưa có ảnh
                  </span>
                )}
              </div>
              
              
              {formData.avatarUrl && (
                <div className="mt-2">
                  <img 
                    src={getFullAvatarUrl(formData.avatarUrl)} 
                    alt="Avatar preview" 
                    style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}
                  />
                </div>
              )}
              {uploading && (
                <div className="text-muted">
                  <small>Đang upload ảnh...</small>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Quản trị viên'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa Thông tin Người dùng</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="Nhập email"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Để trống nếu không đổi mật khẩu"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Họ *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    placeholder="Nhập họ"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    placeholder="Nhập tên"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày sinh</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Nhập địa chỉ"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ảnh đại diện</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mb-2"
              />
              
              {/* Visual indicators */}
              <div className="mb-2">
                {formData.avatarUrl ? (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>Đã có ảnh
                  </span>
                ) : (
                  <span className="badge bg-warning">
                    <i className="bi bi-exclamation-triangle me-1"></i>Chưa có ảnh
                  </span>
                )}
              </div>
              
              
              {formData.avatarUrl && (
                <div className="mt-2">
                  <img 
                    src={getFullAvatarUrl(formData.avatarUrl)} 
                    alt="Avatar preview" 
                    style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}
                  />
                </div>
              )}
              {uploading && (
                <div className="text-muted">
                  <small>Đang upload ảnh...</small>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận vô hiệu hóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn vô hiệu hóa người dùng <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
          <br />
          <small className="text-muted">Hành động này sẽ chuyển trạng thái người dùng thành "Không hoạt động". Dữ liệu vẫn có thể khôi phục bằng cách đổi lại trạng thái.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="warning" onClick={handleDeleteUser} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {filterRole === '2' ? (
              <>
                <i className="bi bi-person-badge me-2"></i>
                Thông tin chi tiết bác sĩ
              </>
            ) : filterRole === '3' ? (
              <>
                <i className="bi bi-person-heart me-2"></i>
                Thông tin chi tiết bệnh nhân
              </>
            ) : (
              <>
                <i className="bi bi-person me-2"></i>
                Thông tin chi tiết người dùng
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="row">
              {/* Thông tin cơ bản */}
              <div className="col-md-6">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-person me-2"></i>Thông tin cá nhân
                </h6>
                <div className="mb-3">
                  <strong>Họ tên:</strong>
                  <p className="mb-1">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div className="mb-3">
                  <strong>Email:</strong>
                  <p className="mb-1">{selectedUser.email}</p>
                </div>
                <div className="mb-3">
                  <strong>Điện thoại:</strong>
                  <p className="mb-1">{selectedUser.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="mb-3">
                  <strong>Giới tính:</strong>
                  <p className="mb-1">
                    {selectedUser.gender === 'MALE' ? 'Nam' : 
                     selectedUser.gender === 'FEMALE' ? 'Nữ' : 
                     selectedUser.gender || 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="mb-3">
                  <strong>Ngày sinh:</strong>
                  <p className="mb-1">
                    {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="mb-3">
                  <strong>Địa chỉ:</strong>
                  <p className="mb-1">{selectedUser.address || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Thông tin chuyên môn cho bác sĩ hoặc thông tin y tế cho bệnh nhân */}
              <div className="col-md-6">
                {filterRole === '2' ? (
                  <>
                    <h6 className="text-success mb-3">
                      <i className="bi bi-stethoscope me-2"></i>Thông tin chuyên môn
                    </h6>
                    <div className="mb-3">
                      <strong>Chuyên khoa:</strong>
                      <p className="mb-1">
                        <span className="badge bg-info">
                          {selectedUser.specialty || 'Chưa cập nhật'}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <strong>Khoa:</strong>
                      <p className="mb-1">
                        <span className="badge bg-secondary">
                          {selectedUser.departmentName || 'Chưa phân khoa'}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
                      <strong>Giới thiệu:</strong>
                      <div className="border rounded p-2 bg-light">
                        {selectedUser.bio || 'Chưa có thông tin giới thiệu'}
                      </div>
                    </div>
                  </>
                ) : filterRole === '3' ? (
                  <>
                    <h6 className="text-success mb-3">
                      <i className="bi bi-heart-pulse me-2"></i>Thông tin y tế
                    </h6>
                    <div className="mb-3">
                      <strong>Bảo hiểm y tế:</strong>
                      <p className="mb-1">
                        {selectedUser.healthInsuranceNumber ? (
                          <span className="badge bg-success">
                            <i className="bi bi-shield-check me-1"></i>
                            {selectedUser.healthInsuranceNumber}
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Chưa có
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mb-3">
                      <strong>Tiền sử bệnh án:</strong>
                      <div className="border rounded p-2 bg-light" style={{maxHeight: '150px', overflowY: 'auto'}}>
                        {selectedUser.medicalHistory ? (
                          <div style={{whiteSpace: 'pre-wrap'}}>
                            {selectedUser.medicalHistory}
                          </div>
                        ) : (
                          <span className="text-muted">Chưa có thông tin tiền sử bệnh án</span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <strong>Ngày tạo hồ sơ bệnh nhân:</strong>
                      <p className="mb-1">
                        {selectedUser.patientCreatedAt ? new Date(selectedUser.patientCreatedAt).toLocaleDateString('vi-VN') : 'Không xác định'}
                      </p>
                    </div>
                    <div className="mb-3">
                      <strong>Trạng thái hồ sơ:</strong>
                      <p className="mb-1">
                        {selectedUser.patientStatus ? (
                          <span className={`badge ${selectedUser.patientStatus === 'ACTIVE' ? 'bg-success' : 'bg-warning'}`}>
                            {selectedUser.patientStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Chưa xác định</span>
                        )}
                      </p>
                    </div>
                  </>
                ) : null}
                
                <div className="mb-3">
                  <strong>Trạng thái tài khoản:</strong>
                  <p className="mb-1">{getStatusBadge(selectedUser.status)}</p>
                </div>
                <div className="mb-3">
                  <strong>Ngày tạo tài khoản:</strong>
                  <p className="mb-1">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : 'Không xác định'}
                  </p>
                </div>
              </div>

              {/* Avatar */}
              {selectedUser.avatarUrl && (
                <div className="col-12 text-center mt-3">
                  <h6 className="text-info mb-3">
                    <i className="bi bi-image me-2"></i>Ảnh đại diện
                  </h6>
                  <img 
                    src={getFullAvatarUrl(selectedUser.avatarUrl)} 
                    alt="Avatar" 
                    className="rounded-circle border"
                    style={{width: '150px', height: '150px', objectFit: 'cover'}}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={() => {
            setShowDetailModal(false);
            openEditModal(selectedUser);
          }}>
            <i className="bi bi-pencil me-2"></i>
            Chỉnh sửa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UsersManagement;