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
  const [editForm, setEditForm] = useState({ id: null, diagnosis: "", status: "new" });
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
        prescriptionId: prescription.prescriptionId ? `DT${String(prescription.prescriptionId).padStart(3, '0')}` : 'N/A',
        patientId: prescription.patientId,
        patientName: prescription.patientName || 'Chưa có tên',
        doctorId: prescription.doctorId,
        doctorName: prescription.doctorName || 'Chưa có tên',
        diagnosis: prescription.diagnosis || prescription.notes || 'Chưa có chẩn đoán',
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
    setEditForm({ id: prescription.id, diagnosis: prescription.diagnosis || "", status: prescription.status || "new" });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) return;
    try {
      // Find the prescription being edited to get its current items
      const currentPrescription = prescriptions.find(p => p.id === editForm.id);
      const payload = {
        notes: editForm.diagnosis, // Backend uses 'notes' field
        items: currentPrescription ? currentPrescription.medicines.map(m => ({
          medicineId: m.medicineId,
          quantity: m.quantity,
          dosage: m.dosage,
          duration: m.duration,
          note: m.instructions
        })) : []
      };
      
      await prescriptionApi.updatePrescription(editForm.id, payload);
      setShowEditModal(false);
      toast.success("Cập nhật đơn thuốc thành công");
      loadPrescriptions();
    } catch (err) {
      console.error('Lỗi cập nhật đơn thuốc:', err);
      toast.error('Không thể cập nhật đơn thuốc');
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
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="text-primary mb-1">
                    <FileText className="me-2" size={32} />
                    Quản Lý Đơn Thuốc
                  </h2>
                  <p className="text-muted mb-0">Xem và quản lý các đơn thuốc đã được kê</p>
                </div>
                <div>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Tạo đơn thuốc
                  </Button>
                </div>
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
              <h3 className="text-primary">{prescriptions.length}</h3>
              <p className="text-muted mb-0">Tổng Đơn Thuốc</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #198754"}}>
            <Card.Body>
              <h3 className="text-success">{prescriptions.filter(p => p.status === 'completed').length}</h3>
              <p className="text-muted mb-0">Đã Hoàn Thành</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #ffc107"}}>
            <Card.Body>
              <h3 className="text-warning">{prescriptions.filter(p => p.status === 'pending').length}</h3>
              <p className="text-muted mb-0">Chờ Xử Lý</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #dc3545"}}>
            <Card.Body>
              <h3 className="text-primary">{prescriptions.filter(p => p.status === 'new').length}</h3>
              <p className="text-muted mb-0">Mới</p>
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
              placeholder="Tìm kiếm theo tên bệnh nhân, mã đơn thuốc, chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: "45px"}}
            />
          </div>
        </Col>
      </Row>

      {/* Prescriptions Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FileText size={48} className="mb-3 text-muted" />
              <h5>Không tìm thấy đơn thuốc nào</h5>
              <p className="mb-0">Thử thay đổi từ khóa tìm kiếm</p>
            </Alert>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Mã Đơn</th>
                  <th>Bệnh Nhân</th>
                  <th>Bác Sĩ</th>
                  <th>Chẩn Đoán</th>
                  <th>Ngày Kê</th>
                  <th>Số Thuốc</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map(prescription => {
                  const statusConfig = getStatusBadge(prescription.status);
                  return (
                    <tr key={prescription.id}>
                      <td>
                        <strong className="text-primary">{prescription.prescriptionId}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{prescription.patientName}</strong>
                          <br />
                          <small className="text-muted">{prescription.patientId}</small>
                        </div>
                      </td>
                      <td>{prescription.doctorName}</td>
                      <td>{prescription.diagnosis}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {new Date(prescription.prescriptionDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">{prescription.medicines.length} loại</Badge>
                      </td>
                      <td>
                        <strong className="text-success">
                          {(prescription.totalAmount || 0).toLocaleString('vi-VN')} ₫
                        </strong>
                      </td>
                      <td>
                        <Badge bg={statusConfig.variant}>
                          {statusConfig.text}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewPrescription(prescription)}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openEdit(prescription)}
                            title="Chỉnh sửa"
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleExportPrescription(prescription.id)}
                            title="Xuất PDF"
                          >
                            PDF
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(prescription)}
                            title="Xóa đơn thuốc"
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
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="new">Mới</option>
                <option value="pending">Chờ xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Hủy</option>
              </Form.Select>
            </Form.Group>
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