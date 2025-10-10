import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert } from 'react-bootstrap';
import { BiEdit, BiTrash, BiPlus, BiSearch } from 'react-icons/bi';
import departmentApi from '../../api/departmentApi';

const DepartmentsManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    departmentName: '',
    description: ''
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentApi.getAllDepartmentsList();
      // API trả về Page object, cần lấy content
      setDepartments(response.data?.content || []);
    } catch (err) {
      setError('Lỗi khi tải danh sách khoa: ' + err.message);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await departmentApi.createDepartment(formData);
      setSuccess('Tạo khoa thành công!');
      setShowCreateModal(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      setError('Lỗi khi tạo khoa: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await departmentApi.updateDepartment(selectedDepartment.id, formData);
      setSuccess('Cập nhật thông tin khoa thành công!');
      setShowEditModal(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      setError('Lỗi khi cập nhật khoa: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      setLoading(true);
      await departmentApi.deleteDepartment(selectedDepartment.id);
      setSuccess('Xóa khoa thành công!');
      setShowDeleteModal(false);
      fetchDepartments();
    } catch (err) {
      setError('Lỗi khi xóa khoa: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      departmentName: '',
      description: ''
    });
    setSelectedDepartment(null);
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentName: department.departmentName || '',
      description: department.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const filteredDepartments = departments.filter(department => 
    department.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.id - b.id);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Khoa</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          className="d-flex align-items-center gap-2"
        >
          <BiPlus /> Thêm Khoa
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

      {/* Search */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <BiSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên khoa</th>
              <th>Mô tả</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center">Đang tải...</td>
              </tr>
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">Không có khoa nào</td>
              </tr>
            ) : (
              filteredDepartments.map(department => (
                <tr key={department.id}>
                  <td>{department.id}</td>
                  <td>{department.departmentName}</td>
                  <td>{department.description || '-'}</td>
                  <td>-</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(department)}
                      >
                        <BiEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(department)}
                      >
                        <BiTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Department Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm Khoa Mới</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDepartment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên khoa</Form.Label>
              <Form.Control
                type="text"
                value={formData.departmentName}
                onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                required
                placeholder="Nhập tên khoa"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Nhập mô tả khoa"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo Khoa'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa Thông tin Khoa</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditDepartment}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên khoa</Form.Label>
              <Form.Control
                type="text"
                value={formData.departmentName}
                onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
                required
                placeholder="Nhập tên khoa"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Nhập mô tả khoa"
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa khoa <strong>{selectedDepartment?.departmentName}</strong>?
          <br />
          <small className="text-muted">Hành động này không thể hoàn tác.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteDepartment} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DepartmentsManagement;



