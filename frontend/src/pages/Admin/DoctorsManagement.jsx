import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Badge, Dropdown } from 'react-bootstrap';
import { BiEdit, BiPlus, BiSearch, BiUser, BiDotsVertical, BiCheckCircle, BiXCircle, BiTrash, BiUserCheck } from 'react-icons/bi';
import UserSelector from '../../components/UserSelector';
import doctorApi from '../../api/doctorApi';
import departmentApi from '../../api/departmentApi';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createMode, setCreateMode] = useState('new'); // 'new' hoặc 'existing'

  // Form states
  const [formData, setFormData] = useState({
    // Thông tin User (cho bác sĩ mới)
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    // Thông tin Doctor
    bio: '',
    specialty: '',
    departmentId: ''
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      
      const response = await doctorApi.getAllDoctors();
      
      // Xử lý response data
      let doctorsData = [];
      if (response.data) {
        // Nếu response.data là array trực tiếp
        if (Array.isArray(response.data)) {
          doctorsData = response.data;
        }
        // Nếu response.data có content property (Page object)
        else if (response.data.content && Array.isArray(response.data.content)) {
          doctorsData = response.data.content;
        }
      }
      
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Lỗi khi tải danh sách bác sĩ: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAllDepartmentsList();
      
      // Xử lý response data
      let departmentsData = [];
      if (response.data) {
        // Nếu response.data có content property (Page object)
        if (response.data.content) {
          departmentsData = response.data.content;
        } 
        // Nếu response.data là array trực tiếp
        else if (Array.isArray(response.data)) {
          departmentsData = response.data;
        }
      }
      
      setDepartments(departmentsData);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khoa:', err);
      setDepartments([]); // Set empty array as fallback
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    
    if (createMode === 'new') {
      // Tạo bác sĩ mới hoàn toàn
      await createNewDoctor(e);
    } else {
      // Tạo bác sĩ từ user có sẵn
      await createDoctorFromExistingUser(e);
    }
  };

  const createNewDoctor = async (e) => {
    try {
      setLoading(true);
      
      const response = await doctorApi.registerDoctor(formData);
      
      setSuccess('Tạo bác sĩ mới thành công!');
      setShowCreateModal(false);
      resetForm();
      fetchDoctors();
    } catch (err) {
      setError('Lỗi khi tạo bác sĩ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDoctorFromExistingUser = async (e) => {
    // Validation
    if (!selectedUser) {
      setError('Vui lòng chọn user để tạo bác sĩ');
      return;
    }

    try {
      setLoading(true);
      
      const doctorData = {
        userId: selectedUser.id,
        bio: formData.bio,
        specialty: formData.specialty,
        departmentId: formData.departmentId
      };
      
      const response = await doctorApi.createDoctor(doctorData);
      
      setSuccess('Tạo bác sĩ từ user có sẵn thành công!');
      setShowCreateModal(false);
      resetForm();
      fetchDoctors();
    } catch (err) {
      setError('Lỗi khi tạo bác sĩ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDoctor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await doctorApi.updateDoctorWithUser(selectedDoctor.doctorId, formData);
      
      setSuccess('Cập nhật thông tin bác sĩ và thông tin cá nhân thành công!');
      setShowEditModal(false);
      resetForm();
      fetchDoctors();
    } catch (err) {
      setError('Lỗi khi cập nhật bác sĩ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      setLoading(true);
      
      const response = await doctorApi.deleteDoctor(selectedDoctor.doctorId);
      
      setSuccess('Vô hiệu hóa bác sĩ thành công! (Chuyển thành Không hoạt động)');
      setShowDeleteModal(false);
      fetchDoctors();
    } catch (err) {
      setError('Lỗi khi xóa bác sĩ: ' + err.message);
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
      bio: '',
      specialty: '',
      departmentId: ''
    });
    setSelectedDoctor(null);
    setSelectedUser(null);
    setCreateMode('new');
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowUserSelector(false);
  };

  const openUserSelector = () => {
    setShowUserSelector(true);
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      email: doctor.user?.email || '',
      password: '',
      firstName: doctor.user?.firstName || '',
      lastName: doctor.user?.lastName || '',
      phone: doctor.user?.phone || '',
      gender: doctor.user?.gender || '',
      dateOfBirth: doctor.user?.dateOfBirth || '',
      address: doctor.user?.address || '',
      bio: doctor.bio || '',
      specialty: doctor.specialty || '',
      departmentId: doctor.department?.id || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };


  const handleStatusChange = async (doctor, newStatus) => {
    try {
      setLoading(true);
      
      const doctorData = {
        status: newStatus,
        bio: doctor.bio,
        specialty: doctor.specialty,
        departmentId: doctor.department?.id
      };
      
      const response = await doctorApi.updateDoctor(doctor.doctorId, doctorData);
      
      setSuccess(`Cập nhật trạng thái bác sĩ thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}!`);
      fetchDoctors();
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
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

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !filterDepartment || doctor.department?.id.toString() === filterDepartment;
    
    const matchesStatus = !filterStatus || doctor.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }).sort((a, b) => a.doctorId - b.doctorId);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Bác sĩ</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <BiPlus /> Thêm Bác sĩ
        </Button>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Thống kê nhanh - Dashboard Style */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Hoạt động</div>
                  <div className="h4 mb-0">{doctors.filter(d => d.status === 'ACTIVE').length}</div>
                </div>
                <i className="bi bi-check-circle fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Không hoạt động</div>
                  <div className="h4 mb-0">{doctors.filter(d => d.status === 'INACTIVE').length}</div>
                </div>
                <i className="bi bi-x-circle fs-2 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Tổng số bác sĩ</div>
                  <div className="h4 mb-0">{doctors.length}</div>
                </div>
                <i className="bi bi-person-badge fs-2 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <BiSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="🔍 Tìm kiếm theo tên hoặc chuyên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0"
            />
          </div>
        </div>
        <div className="col-md-3">
          <Form.Select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border-0 shadow-sm"
          >
            <option value="">🏥 Tất cả khoa</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.departmentName}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-3">
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-0 shadow-sm"
          >
            <option value="">📊 Tất cả trạng thái</option>
            <option value="ACTIVE">✅ Hoạt động</option>
            <option value="INACTIVE">⏸️ Không hoạt động</option>
          </Form.Select>
        </div>
        <div className="col-md-2">
          <button 
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('');
              setFilterStatus('');
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Làm mới
          </button>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Chuyên khoa</th>
              <th>Khoa</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Đang tải...</td>
              </tr>
            ) : filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">Không có bác sĩ nào</td>
              </tr>
            ) : (
              filteredDoctors.map(doctor => (
                <tr key={doctor.doctorId}>
                  <td>{doctor.doctorId}</td>
                  <td>{doctor.user?.firstName} {doctor.user?.lastName}</td>
                  <td>{doctor.user?.email}</td>
                  <td>{doctor.user?.phone}</td>
                  <td>{doctor.specialty}</td>
                  <td>{doctor.department?.departmentName}</td>
                  <td>{getStatusBadge(doctor.status)}</td>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(doctor)}
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
                          {doctor.status !== 'ACTIVE' && (
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(doctor, 'ACTIVE')}
                              className="text-success fw-semibold"
                            >
                              <i className="bi bi-check-circle me-2"></i>
                              Kích hoạt
                            </Dropdown.Item>
                          )}
                          {doctor.status !== 'INACTIVE' && (
                            <Dropdown.Item 
                              onClick={() => handleStatusChange(doctor, 'INACTIVE')}
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

      {/* Create Doctor Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Thêm Bác sĩ Mới</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDoctor}>
          <Modal.Body>
            {/* Chọn chế độ tạo */}
            <Form.Group className="mb-4">
              <Form.Label>Chọn cách tạo bác sĩ:</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  name="createMode"
                  id="newDoctor"
                  label="Tạo bác sĩ mới hoàn toàn"
                  checked={createMode === 'new'}
                  onChange={() => setCreateMode('new')}
                />
                <Form.Check
                  type="radio"
                  name="createMode"
                  id="existingUser"
                  label="Tạo từ user có sẵn"
                  checked={createMode === 'existing'}
                  onChange={() => setCreateMode('existing')}
                />
              </div>
            </Form.Group>

            {createMode === 'new' ? (
              // Form tạo bác sĩ mới hoàn toàn
              <>
                <div className="row">
                  <div className="col-md-6">
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
                  </div>
                  <div className="col-md-6">
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
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
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
                  </div>
                  <div className="col-md-6">
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
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Điện thoại</Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Nhập số điện thoại"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Giới tính</Form.Label>
                      <Form.Select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày sinh</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Khoa *</Form.Label>
                      <Form.Select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        required
                      >
                        <option value="">Chọn khoa</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
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
                  <Form.Label>Chuyên khoa *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    required
                    placeholder="Nhập chuyên khoa"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tiểu sử</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Nhập tiểu sử bác sĩ"
                  />
                </Form.Group>
              </>
            ) : (
              // Form tạo từ user có sẵn
              <>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Chọn User *</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="text"
                          value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : ''}
                          placeholder="Chọn user để tạo bác sĩ"
                          readOnly
                          required
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={openUserSelector}
                          className="d-flex align-items-center gap-1"
                        >
                          <BiUser /> Chọn
                        </Button>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Khoa *</Form.Label>
                      <Form.Select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                        required
                      >
                        <option value="">Chọn khoa</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Chuyên khoa *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    required
                    placeholder="Nhập chuyên khoa"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tiểu sử</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Nhập tiểu sử bác sĩ"
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : createMode === 'new' ? 'Tạo Bác sĩ Mới' : 'Tạo từ User có sẵn'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa Thông tin Bác sĩ</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditDoctor}>
          <Modal.Body>
            {/* Thông tin User */}
            <h6 className="text-primary mb-3">📋 Thông tin cá nhân</h6>
            <div className="row">
              <div className="col-md-6">
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
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
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
              </div>
              <div className="col-md-6">
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
              </div>
            </div>

            {/* Thông tin Doctor */}
            <h6 className="text-primary mb-3 mt-4">👨‍⚕️ Thông tin bác sĩ</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Khoa</Form.Label>
                  <Form.Select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formData.status || selectedDoctor?.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="border-0 shadow-sm"
                  >
                    <option value="ACTIVE">✅ Hoạt động</option>
                    <option value="INACTIVE">⏸️ Không hoạt động</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Chuyên khoa</Form.Label>
              <Form.Control
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                required
                placeholder="Nhập chuyên khoa"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tiểu sử</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Nhập tiểu sử bác sĩ"
              />
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

      {/* Soft Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận vô hiệu hóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn vô hiệu hóa bác sĩ <strong>{selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName}</strong>?
          <br />
          <small className="text-muted">Hành động này sẽ chuyển trạng thái bác sĩ thành "Không hoạt động". Dữ liệu vẫn có thể khôi phục bằng cách đổi lại trạng thái.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="warning" onClick={handleDeleteDoctor} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
          </Button>
        </Modal.Footer>
      </Modal>


      {/* User Selector Modal */}
      <UserSelector
        show={showUserSelector}
        onHide={() => setShowUserSelector(false)}
        onSelect={handleUserSelect}
        departments={departments}
      />
    </div>
  );
};

export default DoctorsManagement;



