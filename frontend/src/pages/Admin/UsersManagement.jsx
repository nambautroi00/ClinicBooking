import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Badge, Dropdown, Row, Col } from 'react-bootstrap';
import { BiEdit, BiPlus, BiSearch, BiDotsVertical, BiCheckCircle, BiXCircle, BiUserCheck, BiUserPlus } from 'react-icons/bi';
import userApi from '../../api/userApi';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
    status: 'ACTIVE',
    roleId: 3 // Default to PATIENT role
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsersWithRoleInfo();
      setUsers(response.data || []);
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
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
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
        roleId: formData.roleId
      };
      
      await userApi.createUser(userData);
      
      setSuccess('Tạo người dùng mới thành công!');
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
        status: formData.status,
        roleId: formData.roleId
      };
      
      // Only include passwordHash if a new password is provided
      if (formData.password && formData.password.trim() !== '') {
        userData.passwordHash = formData.password;
      }
      
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
      status: 'ACTIVE',
      roleId: 3
    });
    setSelectedUser(null);
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
      status: user.status || 'ACTIVE',
      roleId: user.role?.id || 3
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      setLoading(true);
      
      const userData = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        status: newStatus,
        roleId: user.role?.id
      };
      
      await userApi.updateUser(user.id, userData);
      
      setSuccess(`Cập nhật trạng thái người dùng thành ${newStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}!`);
      fetchUsers();
      fetchStats();
    } catch (err) {
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
    
    const matchesRole = !filterRole || user.role?.id.toString() === filterRole;
    
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => a.id - b.id);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Người dùng</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <BiPlus /> Thêm Người dùng
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
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Hoạt động</div>
                  <div className="h4 mb-0">{stats.active}</div>
                </div>
                <i className="bi bi-check-circle fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Không hoạt động</div>
                  <div className="h4 mb-0">{stats.inactive}</div>
                </div>
                <i className="bi bi-x-circle fs-2 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Bác sĩ</div>
                  <div className="h4 mb-0">{stats.doctors}</div>
                </div>
                <i className="bi bi-person-badge fs-2 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted">Tổng số người dùng</div>
                  <div className="h4 mb-0">{stats.total}</div>
                </div>
                <i className="bi bi-people fs-2 text-info"></i>
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
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Đang tải...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">Không có người dùng nào</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>{getRoleBadge(user.role?.id)}</td>
                  <td>{getStatusBadge(user.status)}</td>
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
          <Modal.Title>Thêm Người dùng Mới</Modal.Title>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vai trò *</Form.Label>
                  <Form.Select
                    value={formData.roleId}
                    onChange={(e) => setFormData({...formData, roleId: parseInt(e.target.value)})}
                    required
                  >
                    <option value="1">Quản trị viên</option>
                    <option value="2">Bác sĩ</option>
                    <option value="3">Bệnh nhân</option>
                  </Form.Select>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Người dùng'}
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vai trò</Form.Label>
                  <Form.Select
                    value={formData.roleId}
                    onChange={(e) => setFormData({...formData, roleId: parseInt(e.target.value)})}
                  >
                    <option value="1">Quản trị viên</option>
                    <option value="2">Bác sĩ</option>
                    <option value="3">Bệnh nhân</option>
                  </Form.Select>
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
    </div>
  );
};

export default UsersManagement;