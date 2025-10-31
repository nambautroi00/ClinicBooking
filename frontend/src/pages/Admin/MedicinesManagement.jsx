import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Alert } from "react-bootstrap";
import { Package, Plus, Edit, Search, Trash2 } from "lucide-react";
import medicineApi from "../../api/medicineApi";
import { toast } from "../../utils/toast";

const MedicinesManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalData, setModalData] = useState({
    medicineId: '',
    name: '',
    strength: '',
    category: '',
    price: '',
    unit: 'viên'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState(null);

  // Build unique category suggestions from current list
  const categoryOptions = React.useMemo(() => {
    try {
      const set = new Set();
      (medicines || []).forEach(m => {
        if (m && m.category && String(m.category).trim()) set.add(String(m.category).trim());
      });
      return Array.from(set);
    } catch (e) {
      return [];
    }
  }, [medicines]);

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
    setModalData({
      medicineId: '', name: '', strength: '', category: '', price: '', unit: 'viên'
    });
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setModalData({
      medicineId: medicine.medicineId || '',
      name: medicine.name || '',
      strength: medicine.strength || '',
      category: medicine.category || '',
      price: medicine.price || '',
      unit: medicine.unit || 'viên',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (medicine) => {
    setMedicineToDelete(medicine);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!medicineToDelete) return;
    try {
      await medicineApi.delete(medicineToDelete.id);
      setShowDeleteConfirm(false);
      setMedicineToDelete(null);
      loadMedicines();
      toast.success('Đã xóa thuốc thành công');
    } catch (error) {
      console.error('Lỗi khi xóa thuốc:', error);
      toast.error('Có lỗi khi xóa thuốc. Vui lòng thử lại.');
    }
  };

  const handleSave = async () => {
    // Minimal validation: medicineId, name, price required
    const trimmedId = String(modalData.medicineId || '').trim();
    const trimmedName = String(modalData.name || '').trim();
    const priceNumber = Number(modalData.price);

    if (!trimmedId || !trimmedName || modalData.price === '' || modalData.price === null || Number.isNaN(priceNumber)) {
      toast.warning('Vui lòng nhập đầy đủ và hợp lệ: Mã thuốc, Tên thuốc và Đơn giá.');
      return;
    }

    if (priceNumber <= 0) {
      toast.warning('Đơn giá phải lớn hơn 0');
      return;
    }

    // Duplicate ID check (exclude the item being edited)
    const duplicateId = medicines.some(m => String(m.medicineId).trim() === trimmedId && (!selectedMedicine || m.id !== selectedMedicine.id));
    if (duplicateId) {
      toast.error('Mã thuốc đã tồn tại. Vui lòng chọn mã khác.');
      return;
    }

    const payload = {
      medicineId: trimmedId,
      name: trimmedName,
      strength: modalData.strength || undefined,
      category: (modalData.category || '').trim() || undefined,
      // backend expects category in `note` field in current mapping, include it so updates persist
      note: (modalData.category || '').trim() || undefined,
      unitPrice: priceNumber || 0,
      unit: modalData.unit || 'viên',
    };

    try {
      if (selectedMedicine) {
        await medicineApi.update(selectedMedicine.id, payload);
        toast.success('Cập nhật thuốc thành công');
      } else {
        await medicineApi.create(payload);
        toast.success('Thêm thuốc thành công');
      }
      setShowModal(false);
      // reset
  setSelectedMedicine(null);
      setModalData({ medicineId: '', name: '', strength: '', category: '', price: '', unit: 'viên' });
      loadMedicines();
    } catch (error) {
      console.error('Lỗi khi lưu thuốc:', error);
      toast.error('Có lỗi khi lưu thuốc. Vui lòng thử lại.');
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

      {/* Stats Cards (only showing total) */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #0d6efd"}}>
            <Card.Body>
              <h3 className="text-primary">{medicines.length}</h3>
              <p className="text-muted mb-0">Tổng Loại Thuốc</p>
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
                  {/* Bỏ cột tồn kho */}
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
                    {/* Bỏ hiển thị tồn kho */}
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
                        onClick={() => handleDeleteClick(medicine)}
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
                    value={modalData.medicineId}
                    onChange={(e) => setModalData(prev => ({...prev, medicineId: e.target.value}))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên thuốc *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Tên thuốc"
                    value={modalData.name}
                    onChange={(e) => setModalData(prev => ({...prev, name: e.target.value}))}
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
                    value={modalData.strength}
                    onChange={(e) => setModalData(prev => ({...prev, strength: e.target.value}))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại thuốc</Form.Label>
                  <Form.Control
                    type="text"
                    list="categoryOptions"
                    placeholder="Nhập hoặc chọn loại thuốc"
                    value={modalData.category}
                    onChange={(e) => setModalData(prev => ({...prev, category: e.target.value}))}
                  />
                  <datalist id="categoryOptions">
                    {categoryOptions.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Đơn giá *</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Giá"
                    value={modalData.price}
                    onChange={(e) => setModalData(prev => ({...prev, price: e.target.value}))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Đơn vị</Form.Label>
                  <Form.Select value={modalData.unit} onChange={(e) => setModalData(prev => ({...prev, unit: e.target.value}))}>
                    <option value="viên">viên</option>
                    <option value="chai">chai</option>
                    <option value="ống">ống</option>
                    <option value="hộp">hộp</option>
                    <option value="gói">gói</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {/* manufacturer removed - not required */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleSave()}>
            {selectedMedicine ? 'Cập Nhật' : 'Thêm Thuốc'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác Nhận Xóa Thuốc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa thuốc <strong>{medicineToDelete?.name}</strong> ({medicineToDelete?.medicineId})?</p>
          <p className="text-muted">Thao tác này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Xóa</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MedicinesManagement;


