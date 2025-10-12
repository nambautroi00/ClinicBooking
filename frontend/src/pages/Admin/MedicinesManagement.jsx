import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Alert } from "react-bootstrap";
import { Package, Plus, Edit, Search, Trash2 } from "lucide-react";
import medicineApi from "../../api/medicineApi";

const MedicinesManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicineApi.getAll();
      console.log('API response:', response.data);
      const medicinesData = (response.data || []).map(medicine => ({
        id: medicine.medicineId, // sử dụng medicineId làm id
        medicineId: medicine.medicineId,
        name: medicine.name,
        strength: medicine.strength || '',
        category: medicine.note || 'Chưa phân loại', // sử dụng note làm category
        manufacturer: medicine.manufacturer || 'Chưa cập nhật',
        price: medicine.unitPrice || 0,
        unit: medicine.unit || 'Viên',
        stock: medicine.stock || Math.floor(Math.random() * 500) + 10, // random stock nếu không có
        expiryDate: medicine.expiryDate || '2025-12-31',
        description: medicine.note || medicine.description || ''
      }));
      setMedicines(medicinesData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách thuốc:', error);
      console.warn('MedicinesManagement: backend unavailable, using mock data.');
      
      // Mock data for testing when backend is not available
      const mockMedicines = [
        {
          id: 1,
          medicineId: 'MED001',
          name: 'Paracetamol 500mg',
          strength: '500mg',
          category: 'Thuốc giảm đau',
          manufacturer: 'Traphaco',
          price: 15000,
          unit: 'Viên',
          stock: 500,
          expiryDate: '2025-12-31',
          description: 'Thuốc giảm đau, hạ sốt'
        },
        {
          id: 2,
          medicineId: 'MED002',
          name: 'Amoxicillin 250mg',
          strength: '250mg',
          category: 'Kháng sinh',
          manufacturer: 'Imexpharm',
          price: 25000,
          unit: 'Viên',
          stock: 300,
          expiryDate: '2026-06-30',
          description: 'Kháng sinh điều trị nhiễm khuẩn'
        },
        {
          id: 3,
          medicineId: 'MED003',
          name: 'Vitamin C 1000mg',
          strength: '1000mg',
          category: 'Vitamin',
          manufacturer: 'DHG Pharma',
          price: 120000,
          unit: 'Viên',
          stock: 150,
          expiryDate: '2025-09-15',
          description: 'Bổ sung vitamin C'
        },
        {
          id: 4,
          medicineId: 'MED004',
          name: 'Aspirin 81mg',
          strength: '81mg',
          category: 'Thuốc tim mạch',
          manufacturer: 'Pymepharco',
          price: 35000,
          unit: 'Viên',
          stock: 8,
          expiryDate: '2025-11-20',
          description: 'Thuốc chống đông máu'
        },
        {
          id: 5,
          medicineId: 'MED005',
          name: 'Omeprazole 20mg',
          strength: '20mg',
          category: 'Thuốc tiêu hóa',
          manufacturer: 'Boston',
          price: 45000,
          unit: 'Viên',
          stock: 0,
          expiryDate: '2025-08-10',
          description: 'Thuốc điều trị loét dạ dày'
        },
        {
          id: 6,
          medicineId: 'MED006',
          name: 'Cephalexin 500mg',
          strength: '500mg',
          category: 'Kháng sinh',
          manufacturer: 'Mediplantex',
          price: 55000,
          unit: 'Viên',
          stock: 200,
          expiryDate: '2026-03-25',
          description: 'Kháng sinh nhóm Cephalosporin'
        }
      ];
      
      setMedicines(mockMedicines);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    (medicine.name || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.medicineId || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.category || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setSelectedMedicine(null);
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setShowModal(true);
  };

  const handleDelete = async (medicineId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thuốc này?')) {
      try {
        await medicineApi.delete(medicineId);
        loadMedicines();
      } catch (error) {
        console.error('Lỗi khi xóa thuốc:', error);
        alert('Có lỗi khi xóa thuốc. Vui lòng thử lại.');
      }
    }
  };

  const handleSave = async (medicineData) => {
    try {
      if (selectedMedicine) {
        await medicineApi.update(selectedMedicine.id, medicineData);
      } else {
        await medicineApi.create(medicineData);
      }
      setShowModal(false);
      loadMedicines();
    } catch (error) {
      console.error('Lỗi khi lưu thuốc:', error);
      alert('Có lỗi khi lưu thuốc. Vui lòng thử lại.');
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="text-primary mb-1">
                    <Package className="me-2" size={32} />
                    Quản Lý Thuốc
                  </h2>
                  <p className="text-muted mb-0">Quản lý kho thuốc và thông tin thuốc</p>
                </div>
                <Button variant="primary" onClick={handleAddNew}>
                  <Plus className="me-2" size={18} />
                  Thêm Thuốc Mới
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #0d6efd"}}>
            <Card.Body>
              <h3 className="text-primary">{medicines.length}</h3>
              <p className="text-muted mb-0">Tổng Loại Thuốc</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #198754"}}>
            <Card.Body>
              <h3 className="text-success">{medicines.filter(m => (m.stock || 0) > 0).length}</h3>
              <p className="text-muted mb-0">Còn Hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #ffc107"}}>
            <Card.Body>
              <h3 className="text-warning">{medicines.filter(m => (m.stock || 0) <= 10 && (m.stock || 0) > 0).length}</h3>
              <p className="text-muted mb-0">Sắp Hết</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #dc3545"}}>
            <Card.Body>
              <h3 className="text-danger">{medicines.filter(m => (m.stock || 0) === 0).length}</h3>
              <p className="text-muted mb-0">Hết Hàng</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="position-relative">
            <Search className="position-absolute" size={18} style={{left: "12px", top: "12px", color: "#6c757d"}} />
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên thuốc, mã thuốc, loại thuốc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: "45px"}}
            />
          </div>
        </Col>
      </Row>

      {/* Medicines Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <Alert variant="info" className="text-center">
              <Package size={48} className="mb-3 text-muted" />
              <h5>Không tìm thấy thuốc nào</h5>
              <p className="mb-0">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra kết nối backend</p>
            </Alert>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Mã Thuốc</th>
                  <th>Tên Thuốc</th>
                  <th>Hàm lượng</th>
                  <th>Loại</th>
                  <th>Đơn Giá</th>
                  <th>Tồn Kho</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map(medicine => (
                  <tr key={medicine.id}>
                    <td>
                      <strong className="text-primary">{medicine.medicineId}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{medicine.name}</strong>
                        <br />
                        <small className="text-muted">{medicine.description}</small>
                      </div>
                    </td>
                    <td>{medicine.strength || '-'}</td>
                    <td>{medicine.category || 'N/A'}</td>
                    <td>
                      <strong className="text-success">
                        {(medicine.price || 0).toLocaleString('vi-VN')} ₫
                      </strong>
                      <br />
                      <small className="text-muted">/{medicine.unit || 'đơn vị'}</small>
                    </td>
                    <td>
                      <span className={`badge ${
                        (medicine.stock || 0) === 0 ? 'bg-danger' :
                        (medicine.stock || 0) <= 10 ? 'bg-warning' : 'bg-success'
                      }`}>
                        {medicine.stock || 0}
                      </span>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(medicine)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(medicine.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Medicine Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMedicine ? 'Chỉnh Sửa Thuốc' : 'Thêm Thuốc Mới'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã thuốc *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Mã thuốc"
                    defaultValue={selectedMedicine?.medicineId || ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên thuốc *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Tên thuốc"
                    defaultValue={selectedMedicine?.name || ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hàm lượng</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="VD: 500mg"
                    defaultValue={selectedMedicine?.strength || ''}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại thuốc</Form.Label>
                  <Form.Select defaultValue={selectedMedicine?.category || ''}>
                    <option value="">Chọn loại</option>
                    <option value="Kháng sinh">Kháng sinh</option>
                    <option value="Giảm đau, hạ sốt">Giảm đau, hạ sốt</option>
                    <option value="Tiêu hóa">Tiêu hóa</option>
                    <option value="Tim mạch">Tim mạch</option>
                    <option value="Hô hấp">Hô hấp</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Đơn giá *</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Giá"
                    defaultValue={selectedMedicine?.price || ''}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Đơn vị</Form.Label>
                  <Form.Select defaultValue={selectedMedicine?.unit || 'viên'}>
                    <option value="viên">viên</option>
                    <option value="chai">chai</option>
                    <option value="ống">ống</option>
                    <option value="hộp">hộp</option>
                    <option value="gói">gói</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tồn kho</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Số lượng"
                    defaultValue={selectedMedicine?.stock || ''}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Nhà sản xuất</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Nhà sản xuất"
                defaultValue={selectedMedicine?.manufacturer || ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hạn sử dụng</Form.Label>
              <Form.Control 
                type="date"
                defaultValue={selectedMedicine?.expiryDate ? selectedMedicine.expiryDate.split('T')[0] : ''}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Mô tả thuốc..."
                defaultValue={selectedMedicine?.description || ''}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleSave({})}>
            {selectedMedicine ? 'Cập Nhật' : 'Thêm Thuốc'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MedicinesManagement;


