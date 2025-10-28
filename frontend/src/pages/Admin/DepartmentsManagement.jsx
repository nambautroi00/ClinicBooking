import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { BiEdit, BiTrash, BiPlus, BiSearch, BiRefresh, BiBuilding, BiUserCheck, BiUserX, BiStats } from 'react-icons/bi';
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
    description: '',
    imageUrl: '',
    status: 'ACTIVE'
  });

  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');


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

  // Calculate statistics
  const getDepartmentStats = () => {
    const total = departments.length;
    const active = departments.filter(d => d.status === 'ACTIVE').length;
    const maintenance = departments.filter(d => d.status === 'INACTIVE' || d.status === 'MAINTENANCE').length;
    const closed = departments.filter(d => d.status === 'CLOSED').length;

    return { total, active, maintenance, closed };
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'MAINTENANCE': return 'warning';
      case 'CLOSED': return 'danger';
      default: return 'secondary';
    }
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Bảo trì';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'CLOSED': return 'Đóng cửa';
      default: return 'Không xác định';
    }
  };

  // Filter departments
  const getFilteredDepartments = () => {
    let filtered = departments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedStatus !== 'Tất cả trạng thái') {
      let statusValue;
      switch (selectedStatus) {
        case 'Hoạt động': statusValue = 'ACTIVE'; break;
        case 'Bảo trì': statusValue = 'INACTIVE'; break;
        case 'Đóng cửa': statusValue = 'CLOSED'; break;
        default: statusValue = selectedStatus;
      }
      filtered = filtered.filter(d => d.status === statusValue);
    }

    return filtered;
  };

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8080/api/files/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({ ...prev, imageUrl: result.url }));
        return result.url;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError('Lỗi khi upload ảnh: ' + err.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadImageWithDepartmentId = async (departmentId, file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departmentId', departmentId.toString());
      
      console.log('uploadImageWithDepartmentId - departmentId:', departmentId);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const response = await fetch(`http://localhost:8080/api/files/upload?departmentId=${departmentId}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      throw new Error('Lỗi khi upload ảnh: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create department first to get ID
      const departmentData = {
        departmentName: formData.departmentName,
        description: formData.description,
        imageUrl: '', // Will be updated after upload
        status: formData.status
      };
      
      const createdDepartment = await departmentApi.createDepartment(departmentData);
      const departmentId = createdDepartment.data.id;
      
      // Upload image with department ID if selected
      if (selectedImage) {
        try {
          const imageUrl = await uploadImageWithDepartmentId(departmentId, selectedImage);
          if (imageUrl) {
            // Update department with image URL
            await departmentApi.updateDepartment(departmentId, {
              departmentName: formData.departmentName,
              description: formData.description,
              imageUrl: imageUrl
            });
          }
        } catch (imageErr) {
          console.error('Error uploading image:', imageErr);
          // Department is already created, just show warning
          setError('Khoa đã được tạo nhưng có lỗi khi upload ảnh: ' + imageErr.message);
        }
      }
      
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
      
      // Upload image first if selected using department-specific endpoint
      let imageUrl = formData.imageUrl;
      if (selectedImage) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedImage);
          uploadFormData.append('departmentId', selectedDepartment.id.toString());
          
          console.log('Uploading image for department ID:', selectedDepartment.id);
          console.log('Selected image file:', selectedImage.name, selectedImage.type);
          console.log('FormData entries:');
          for (let [key, value] of uploadFormData.entries()) {
            console.log(key, value);
          }
          console.log('URL:', `http://localhost:8080/api/files/upload?departmentId=${selectedDepartment.id}`);
          
          // Try department-specific endpoint first
          let response;
          try {
            response = await fetch(`http://localhost:8080/api/departments/${selectedDepartment.id}/upload-image`, {
              method: 'POST',
              body: uploadFormData
            });
          } catch (endpointError) {
            console.log('Department endpoint failed, trying general upload:', endpointError);
            response = await fetch(`http://localhost:8080/api/files/upload?departmentId=${selectedDepartment.id}`, {
              method: 'POST',
              body: uploadFormData
            });
          }
          
          const result = await response.json();
          
          if (result.success) {
            imageUrl = result.url;
            console.log('Upload successful, new imageUrl:', imageUrl);
          } else {
            throw new Error(result.message);
          }
        } catch (imageErr) {
          setError('Lỗi khi upload ảnh: ' + imageErr.message);
          return;
        }
      }
      
      const departmentData = {
        departmentName: formData.departmentName,
        description: formData.description,
        imageUrl: imageUrl,
        status: formData.status
      };
      
      console.log('Updating department with data:', departmentData);
      await departmentApi.updateDepartment(selectedDepartment.id, departmentData);
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
      description: '',
      imageUrl: '',
      status: 'ACTIVE'
    });
    setSelectedDepartment(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentName: department.departmentName || '',
      description: department.description || '',
      imageUrl: department.imageUrl || '',
      status: department.status || 'ACTIVE'
    });
    setSelectedImage(null);
    setImagePreview(department.imageUrl || null);
    setShowEditModal(true);
  };

  const openDeleteModal = (department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  const stats = getDepartmentStats();
  const filteredDepartments = getFilteredDepartments();

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

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body className="py-3">
              <BiBuilding className="text-primary mb-2" style={{ fontSize: '24px' }} />
              <h6 className="mb-1">Tổng số</h6>
              <h4 className="mb-0 text-primary">{stats.total} / {stats.total}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body className="py-3">
              <BiStats className="text-success mb-2" style={{ fontSize: '24px' }} />
              <h6 className="mb-1">Hoạt động</h6>
              <h4 className="mb-0 text-success">{stats.active} / {stats.total}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body className="py-3">
              <BiUserCheck className="text-warning mb-2" style={{ fontSize: '24px' }} />
              <h6 className="mb-1">Bảo trì</h6>
              <h4 className="mb-0 text-warning">{stats.maintenance}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center h-100">
            <Card.Body className="py-3">
              <BiUserX className="text-danger mb-2" style={{ fontSize: '24px' }} />
              <h6 className="mb-1">Đóng cửa</h6>
              <h4 className="mb-0 text-danger">{stats.closed}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-3">
        <Col md={4}>
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
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="Tất cả trạng thái">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Bảo trì">Bảo trì</option>
            <option value="Đóng cửa">Đóng cửa</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button 
            variant="outline-secondary" 
            onClick={fetchDepartments}
            className="w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <BiRefresh /> Làm mới
          </Button>
        </Col>
      </Row>

      {/* Departments Table */}
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên khoa</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Đang tải...</td>
              </tr>
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Không có khoa nào</td>
              </tr>
            ) : (
              filteredDepartments.map(department => (
                <tr key={department.id}>
                  <td>{department.id}</td>
                  <td>
                    {department.imageUrl ? (
                      <img 
                        src={`http://localhost:8080${department.imageUrl}`} 
                        alt={department.departmentName}
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        display: department.imageUrl ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d',
                        fontSize: '12px'
                      }}
                    >
                      No Image
                    </div>
                  </td>
                  <td>{department.departmentName}</td>
                  <td>{department.description || '-'}</td>
                  <td>
                    <Badge bg={getStatusBadgeColor(department.status)}>
                      {getStatusDisplayText(department.status)}
                    </Badge>
                  </td>
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
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                required
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Bảo trì</option>
                <option value="CLOSED">Đóng cửa</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Ảnh khoa</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}
              {uploadingImage && (
                <div className="text-muted small mt-1">
                  Đang upload ảnh...
                </div>
              )}
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
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                required
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Bảo trì</option>
                <option value="CLOSED">Đóng cửa</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Ảnh khoa</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      width: '150px', 
                      height: '150px', 
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}
              {uploadingImage && (
                <div className="text-muted small mt-1">
                  Đang upload ảnh...
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



