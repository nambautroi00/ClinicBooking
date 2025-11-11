import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Badge, Alert } from "react-bootstrap";
import { FileText, Eye, User, Calendar, Search, Trash2 } from "lucide-react";
import prescriptionApi, { exportPrescriptionPdf } from "../../api/prescriptionApi";
import { toast } from "../../utils/toast";

const PrescriptionsManagement = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportId, setExportId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, diagnosis: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ patientId: "", appointmentId: "", diagnosis: "", items: [{ medicineId: "", quantity: 1, dosage: "" }] });

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const prescriptionsRes = await prescriptionApi.getAllPrescriptions();
      
      const prescriptionsData = (prescriptionsRes.data || []).map(prescription => ({
        id: prescription.prescriptionId, // Backend returns prescriptionId as the primary key
        prescriptionId: prescription.prescriptionId || 'N/A',
        patientId: prescription.patientId,
        patientName: prescription.patientName || 'Chưa có tên',
        doctorId: prescription.doctorId,
        doctorName: prescription.doctorName || 'Chưa có tên',
        diagnosis: prescription.notes || prescription.diagnosis || 'Chưa có chẩn đoán',
        prescriptionDate: prescription.createdAt || prescription.createdDate,
        totalAmount: prescription.totalAmount || 0,
        status: 'new', // Default status since backend doesn't have status field
        medicines: (prescription.items || []).map(item => ({
          id: item.itemId,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity || 1,
          dosage: item.dosage,
          duration: item.duration,
          price: item.price || 0,
          instructions: item.note || item.instructions
        }))
      }));

      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Lỗi khi tải đơn thuốc:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { variant: "primary", text: "Mới" },
      pending: { variant: "warning", text: "Chờ xử lý" },
      completed: { variant: "success", text: "Hoàn thành" },
      cancelled: { variant: "danger", text: "Hủy" }
    };
    return statusConfig[status] || { variant: "secondary", text: "Không xác định" };
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    (prescription.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prescription.prescriptionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prescription.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const handleDeleteClick = (prescription) => {
    setPrescriptionToDelete(prescription);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await prescriptionApi.deletePrescription(prescriptionToDelete.id);
      setShowDeleteConfirm(false);
      setPrescriptionToDelete(null);
      loadPrescriptions();
      toast.success("Đã xóa đơn thuốc thành công");
    } catch (error) {
      console.error('Lỗi khi xóa đơn thuốc:', error);
      toast.error('Không thể xóa đơn thuốc. Vui lòng thử lại.');
    }
  };

  const openEdit = (prescription) => {
    setEditForm({ id: prescription.id, diagnosis: prescription.diagnosis || "" });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) return;
    try {
      // Find the prescription being edited
      const currentPrescription = prescriptions.find(p => p.id === editForm.id);
      if (!currentPrescription) {
        toast.error('Không tìm thấy đơn thuốc');
        return;
      }
      
      // Only update notes (diagnosis), don't send items to avoid recreating them
      // Backend will keep existing items unchanged when items is null/not provided
      const payload = {
        notes: editForm.diagnosis // Backend uses 'notes' field and syncs with MedicalRecord diagnosis
      };
      
      console.log('📤 Updating prescription notes only:', editForm.id, payload);
      await prescriptionApi.updatePrescription(editForm.id, payload);
      setShowEditModal(false);
      toast.success("Cập nhật đơn thuốc thành công");
      // Reload prescriptions to see the changes
      await loadPrescriptions();
    } catch (err) {
      console.error('❌ Lỗi cập nhật đơn thuốc:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật đơn thuốc');
    }
  };

  const addCreateItem = () => {
    setCreateForm(prev => ({ ...prev, items: [...prev.items, { medicineId: "", quantity: 1, dosage: "" }] }));
  };

  const removeCreateItem = (idx) => {
    setCreateForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSaveCreate = async () => {
    // Basic validation similar to doctor flow
    if (!createForm.diagnosis || createForm.items.length === 0) {
      toast.warning('Vui lòng nhập chẩn đoán và ít nhất 1 thuốc');
      return;
    }
    const invalid = createForm.items.some(it => !it.medicineId || !it.dosage || !it.quantity || Number(it.quantity) <= 0);
    if (invalid) {
      toast.warning('Thông tin thuốc không hợp lệ');
      return;
    }
    try {
      const payload = {
        ...(createForm.appointmentId && { appointmentId: parseInt(createForm.appointmentId) }),
        // backend uses notes in create (the doctor flow maps diagnosis -> notes)
        notes: createForm.diagnosis,
        items: createForm.items.map(it => ({
          medicineId: parseInt(it.medicineId),
          quantity: parseInt(it.quantity) || 1,
          dosage: it.dosage,
          duration: it.duration || "",
          note: it.note || "",
        }))
      };
      await prescriptionApi.createPrescription(payload);
      setShowCreateModal(false);
      setCreateForm({ patientId: "", appointmentId: "", diagnosis: "", items: [{ medicineId: "", quantity: 1, dosage: "" }] });
      toast.success('Tạo đơn thuốc thành công');
      loadPrescriptions();
    } catch (err) {
      console.error('Lỗi tạo đơn thuốc:', err);
      toast.error('Không thể tạo đơn thuốc');
    }
  };

  const downloadBlob = (data, filename) => {
    const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPrescription = async (id) => {
    if (!id) return;
    const res = await exportPrescriptionPdf(id);
    downloadBlob(res.data, `prescription-${id}.pdf`);
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="d-flex align-items-center mb-2">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px'
                    }}>
                      <FileText size={24} color="white" />
                    </div>
                    <div>
                      <h2 className="mb-0" style={{fontSize: '1.75rem', fontWeight: 700, color: '#1f2937'}}>
                        Quản Lý Đơn Thuốc
                      </h2>
                      <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>Xem và quản lý các đơn thuốc đã được kê</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px'
          }}>
            <Card.Body className="p-4" style={{position: 'relative', minHeight: 140}}>
              <div style={{position: 'absolute', top: 16, right: 16, opacity: 0.9}}>
                <FileText size={28} color="rgba(255,255,255,0.95)" />
              </div>
              <div className="mb-3">
                <h6 className="mb-1" style={{fontWeight: 600}}>Tổng Đơn Thuốc</h6>
              </div>
              <h2 className="mb-1" style={{fontSize: '2.5rem', fontWeight: 700}}>{prescriptions.length}</h2>
              <small style={{opacity: 0.95}}>Đơn thuốc trong hệ thống</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            borderRadius: '16px'
          }}>
            <Card.Body className="p-4" style={{position: 'relative', minHeight: 140}}>
              <div style={{position: 'absolute', top: 16, right: 16, opacity: 0.95, fontSize: 20}}>
                <span role="img" aria-label="check">✅</span>
              </div>
              <div className="mb-3">
                <h6 className="mb-1" style={{fontWeight: 600}}>Đã Hoàn Thành</h6>
              </div>
              <h2 className="mb-1" style={{fontSize: '2.5rem', fontWeight: 700}}>{prescriptions.filter(p => p.status === 'completed').length}</h2>
              <small style={{opacity: 0.95}}>Đơn đã xử lý xong</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: '16px'
          }}>
            <Card.Body className="p-4" style={{position: 'relative', minHeight: 140}}>
              <div style={{position: 'absolute', top: 16, right: 16, opacity: 0.95, fontSize: 20}}>
                <span role="img" aria-label="clock">⏳</span>
              </div>
              <div className="mb-3">
                <h6 className="mb-1" style={{fontWeight: 600}}>Chờ Xử Lý</h6>
              </div>
              <h2 className="mb-1" style={{fontSize: '2.5rem', fontWeight: 700}}>{prescriptions.filter(p => p.status === 'pending').length}</h2>
              <small style={{opacity: 0.95}}>Đơn đang chờ duyệt</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: '16px'
          }}>
            <Card.Body className="p-4" style={{position: 'relative', minHeight: 140}}>
              <div style={{position: 'absolute', top: 16, right: 16, opacity: 0.95, fontSize: 20}}>
                <span role="img" aria-label="new">✨</span>
              </div>
              <div className="mb-3">
                <h6 className="mb-1" style={{fontWeight: 600}}>Mới</h6>
              </div>
              <h2 className="mb-1" style={{fontSize: '2.5rem', fontWeight: 700}}>{prescriptions.filter(p => p.status === 'new').length}</h2>
              <small style={{opacity: 0.95}}>Đơn mới tạo</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={9}>
          <div className="position-relative">
            <Search className="position-absolute" size={20} style={{left: "16px", top: "14px", color: "#9ca3af"}} />
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên bệnh nhân, mã đơn thuốc, chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: "48px",
                height: '48px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </Col>
        <Col md={3} className="d-flex align-items-center justify-content-end">
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            style={{
              height: '48px',
              borderRadius: '12px',
              paddingLeft: '18px',
              paddingRight: '18px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <FileText className="me-2" size={18} />
            Tạo đơn thuốc
          </Button>
        </Col>
      </Row>

      {/* Prescriptions Table */}
      <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <Alert variant="info" className="text-center m-4">
              <FileText size={48} className="mb-3 text-muted" />
              <h5>Không tìm thấy đơn thuốc nào</h5>
              <p className="mb-0">Thử thay đổi từ khóa tìm kiếm</p>
            </Alert>
          ) : (
            <Table responsive hover className="align-middle">
              <thead style={{backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6'}}>
                <tr>
                  <th style={{fontWeight: 600}}>Mã Đơn</th>
                  <th style={{fontWeight: 600}}>Bệnh Nhân</th>
                  <th style={{fontWeight: 600}}>Bác Sĩ</th>
                  <th style={{fontWeight: 600}}>Chẩn Đoán</th>
                  <th style={{fontWeight: 600}}>Ngày Kê</th>
                  <th style={{fontWeight: 600}}>Số Thuốc</th>
                  <th style={{fontWeight: 600}}>Tổng Tiền</th>
                  <th style={{fontWeight: 600, textAlign: 'center'}}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map(prescription => {
                  return (
                    <tr key={prescription.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                      <td>
                        <strong className="text-primary" style={{fontSize: '0.95rem'}}>{prescription.prescriptionId}</strong>
                      </td>
                      <td>
                        <div>
                          <strong style={{fontSize: '0.95rem'}}>{prescription.patientName}</strong>
                          <div>
                            <small className="text-muted">{prescription.patientId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{fontSize: '0.95rem'}}>{prescription.doctorName}</span>
                      </td>
                      <td>
                        <span style={{fontSize: '0.9rem'}}>{prescription.diagnosis}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          <span style={{fontSize: '0.9rem'}}>{new Date(prescription.prescriptionDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 500,
                          padding: '6px 12px',
                          borderRadius: '6px'
                        }}>
                          {prescription.medicines.length} loại
                        </span>
                      </td>
                      <td>
                        <strong className="text-success" style={{fontSize: '0.95rem'}}>
                          {(prescription.totalAmount || 0).toLocaleString('vi-VN')} ₫
                        </strong>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewPrescription(prescription)}
                            title="Xem chi tiết"
                            style={{borderRadius: '8px'}}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openEdit(prescription)}
                            title="Chỉnh sửa"
                            style={{borderRadius: '8px'}}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleExportPrescription(prescription.id)}
                            title="Xuất PDF"
                            style={{borderRadius: '8px'}}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(prescription)}
                            title="Xóa đơn thuốc"
                            style={{borderRadius: '8px'}}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Prescription Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Chi Tiết Đơn Thuốc - {selectedPrescription?.prescriptionId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrescription && (
            <div>
              {/* Prescription Header */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <User className="me-2" size={18} />
                    Thông Tin Đơn Thuốc
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Mã đơn:</strong> {selectedPrescription.prescriptionId}</p>
                      <p><strong>Bệnh nhân:</strong> {selectedPrescription.patientName}</p>
                      <p><strong>Mã BN:</strong> {selectedPrescription.patientId}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Bác sĩ:</strong> {selectedPrescription.doctorName}</p>
                      <p><strong>Chẩn đoán:</strong> {selectedPrescription.diagnosis}</p>
                      <p><strong>Ngày kê:</strong> {new Date(selectedPrescription.prescriptionDate).toLocaleDateString('vi-VN')}</p>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg={getStatusBadge(selectedPrescription.status).variant} className="fs-6">
                      {getStatusBadge(selectedPrescription.status).text}
                    </Badge>
                    <h5 className="text-success mb-0">
                      Tổng: {(selectedPrescription.totalAmount || 0).toLocaleString('vi-VN')} ₫
                    </h5>
                  </div>
                </Card.Body>
              </Card>

              {/* Medicines List */}
              <Card>
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FileText className="me-2" size={18} />
                    Danh Sách Thuốc ({selectedPrescription.medicines.length})
                  </h6>
                </Card.Header>
                <Card.Body>
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <div key={medicine.id} className={`border rounded p-3 ${index < selectedPrescription.medicines.length - 1 ? 'mb-3' : ''}`}>
                      <Row>
                        <Col md={8}>
                          <h6 className="text-primary">{medicine.medicineName}</h6>
                          <p className="mb-1"><strong>Mã thuốc:</strong> {medicine.medicineId}</p>
                          <p className="mb-1"><strong>Liều dùng:</strong> {medicine.dosage}</p>
                          <p className="mb-1"><strong>Thời gian:</strong> {medicine.duration}</p>
                          <p className="mb-0"><strong>Hướng dẫn:</strong> {medicine.instructions}</p>
                        </Col>
                        <Col md={4} className="text-end">
                          <p className="mb-1"><strong>Số lượng:</strong> {medicine.quantity || 0}</p>
                          <h6 className="text-success">Thành tiền: {(medicine.price || 0).toLocaleString('vi-VN')} ₫</h6>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác Nhận Xóa Đơn Thuốc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa đơn thuốc <strong>{prescriptionToDelete?.prescriptionId}</strong>?</p>
          <p className="text-muted">Thao tác này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <Trash2 size={14} className="me-1" />
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh Sửa Đơn Thuốc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Chẩn đoán</Form.Label>
              <Form.Control
                type="text"
                value={editForm.diagnosis}
                onChange={(e) => setEditForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Nhập chẩn đoán"
              />
            </Form.Group>
            <Alert variant="info" className="mt-3">
              <small>Lưu ý: Chỉ có thể cập nhật chẩn đoán. Để thay đổi thuốc, vui lòng tạo đơn thuốc mới.</small>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</Button>
          <Button variant="success" onClick={handleSaveEdit}>Lưu</Button>
        </Modal.Footer>
      </Modal>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tạo Đơn Thuốc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã lịch hẹn (tùy chọn)</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.appointmentId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, appointmentId: e.target.value }))}
                    placeholder="Nhập appointmentId nếu có"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chẩn đoán</Form.Label>
                  <Form.Control
                    type="text"
                    value={createForm.diagnosis}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-2">Thuốc trong đơn</h6>
            {createForm.items.map((it, idx) => (
              <Row key={idx} className="g-2 align-items-end mb-2">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Mã thuốc</Form.Label>
                    <Form.Control
                      type="number"
                      value={it.medicineId}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        items: prev.items.map((x, i) => i === idx ? { ...x, medicineId: e.target.value } : x)
                      }))}
                      placeholder="VD: 101"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        items: prev.items.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x)
                      }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Liều dùng</Form.Label>
                    <Form.Control
                      type="text"
                      value={it.dosage}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        items: prev.items.map((x, i) => i === idx ? { ...x, dosage: e.target.value } : x)
                      }))}
                      placeholder="VD: 1 viên x 3 lần/ngày"
                    />
                  </Form.Group>
                </Col>
                <Col md={1} className="text-end">
                  <Button variant="outline-danger" size="sm" onClick={() => removeCreateItem(idx)}>×</Button>
                </Col>
              </Row>
            ))}
            <Button variant="outline-primary" size="sm" onClick={addCreateItem} className="mt-1">Thêm thuốc</Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleSaveCreate}>Tạo</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PrescriptionsManagement;