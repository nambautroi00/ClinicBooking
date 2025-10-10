import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Badge, Alert } from "react-bootstrap";
import { FileText, Eye, User, Calendar, Search } from "lucide-react";
import prescriptionApi from "../../api/prescriptionApi";

const PrescriptionsManagement = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const prescriptionsRes = await prescriptionApi.getAllPrescriptions();
      
      const prescriptionsData = (prescriptionsRes.data || []).map(prescription => ({
        id: prescription.id,
        prescriptionId: prescription.prescriptionId || `DT${String(prescription.id).padStart(3, '0')}`,
        patientId: prescription.patient?.patientId || prescription.patientId,
        patientName: prescription.patient?.user?.fullName || prescription.patientName,
        doctorName: prescription.doctor?.user?.fullName || prescription.doctorName,
        diagnosis: prescription.diagnosis,
        prescriptionDate: prescription.prescriptionDate || prescription.createdDate,
        totalAmount: prescription.totalAmount || 0,
        status: prescription.status || 'new',
        medicines: prescription.prescriptionItems?.map(item => ({
          id: item.id,
          medicineId: item.medicine?.medicineId || item.medicineId,
          medicineName: item.medicine?.name || item.medicineName,
          quantity: item.quantity,
          dosage: item.dosage,
          duration: item.duration,
          price: item.price || (item.quantity * (item.medicine?.price || 0)),
          instructions: item.instructions
        })) || []
      }));

      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Lỗi khi tải đơn thuốc:', error);
      console.warn('PrescriptionsManagement: backend unavailable, no mock fallback.');
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
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                        >
                          <Eye size={14} className="me-1" />
                          Xem
                        </Button>
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
    </Container>
  );
};

export default PrescriptionsManagement;