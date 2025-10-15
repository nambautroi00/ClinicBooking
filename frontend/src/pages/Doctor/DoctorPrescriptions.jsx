import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Alert, Badge } from "react-bootstrap";
import { Pill, Plus, Eye, Search, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { prescriptionApi } from "../../api/prescriptionApi";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [doctorId, setDoctorId] = useState(null);

  // Lấy doctorId từ cookie và API
  useEffect(() => {
    const userId = Cookies.get("userId");
    if (userId) {
      doctorApi
        .getDoctorByUserId(userId)
        .then((res) => {
          const data = res.data || res;
          setDoctorId(data.doctorId);
        })
        .catch((err) => {
          console.error("Error getting doctor info:", err);
        });
    }
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadPrescriptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Đang tải danh sách đơn thuốc...');
      
      const response = await prescriptionApi.getPrescriptionsByDoctor(doctorId);
      console.log('✅ Đã tải danh sách đơn thuốc:', response.data);
      
      setPrescriptions(response.data);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách đơn thuốc:', error);
      console.warn('DoctorPrescriptions: backend unavailable, using mock data.');
      
      // Mock data for testing
      const mockPrescriptions = [
        {
          id: 1,
          prescriptionId: "DT001",
          patientId: "BN001",
          patientName: "Nguyễn Văn An",
          diagnosis: "Viêm họng cấp",
          totalAmount: 125000,
          status: "active",
          createdDate: "2025-10-15",
          prescriptionItems: [
            {
              id: 1,
              medicineName: "Amoxicillin 500mg",
              quantity: 10,
              dosage: "1 viên x 3 lần/ngày",
              duration: "7 ngày",
              instructions: "Uống sau ăn",
              price: 50000
            },
            {
              id: 2,
              medicineName: "Paracetamol 500mg", 
              quantity: 15,
              dosage: "1-2 viên khi sốt",
              duration: "5 ngày",
              instructions: "Uống khi cần thiết",
              price: 75000
            }
          ]
        },
        {
          id: 2,
          prescriptionId: "DT002",
          patientId: "BN002",
          patientName: "Trần Thị Bình",
          diagnosis: "Đau dạ dày",
          totalAmount: 89000,
          status: "completed",
          createdDate: "2025-10-14",
          prescriptionItems: [
            {
              id: 3,
              medicineName: "Omeprazole 20mg",
              quantity: 14,
              dosage: "1 viên x 2 lần/ngày",
              duration: "14 ngày", 
              instructions: "Uống trước ăn 30 phút",
              price: 89000
            }
          ]
        },
        {
          id: 3,
          prescriptionId: "DT003",
          patientId: "BN003",
          patientName: "Lê Minh Cường",
          diagnosis: "Tăng huyết áp",
          totalAmount: 156000,
          status: "active",
          createdDate: "2025-10-13",
          prescriptionItems: [
            {
              id: 4,
              medicineName: "Amlodipine 5mg",
              quantity: 30,
              dosage: "1 viên x 1 lần/ngày",
              duration: "30 ngày",
              instructions: "Uống vào buổi sáng",
              price: 156000
            }
          ]
        }
      ];
      
      setPrescriptions(mockPrescriptions);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      (prescription.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.prescriptionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || prescription.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "success", text: "Đang sử dụng" },
      completed: { variant: "primary", text: "Hoàn thành" },
      expired: { variant: "warning", text: "Hết hạn" },
      cancelled: { variant: "danger", text: "Đã hủy" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: "Không xác định" };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowModal(true);
  };

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    try {
      console.log(`🔄 Cập nhật trạng thái đơn thuốc ${prescriptionId} thành ${newStatus}`);
      
      await prescriptionApi.updatePrescriptionStatus(prescriptionId, newStatus);
      
      setPrescriptions(prev => 
        prev.map(p => 
          p.id === prescriptionId 
            ? { ...p, status: newStatus }
            : p
        )
      );
      
      console.log('✅ Đã cập nhật trạng thái thành công');
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật trạng thái:', error);
      alert('Có lỗi khi cập nhật trạng thái đơn thuốc');
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">
                    <Pill className="me-2" size={24} />
                    Quản Lý Đơn Thuốc
                  </h4>
                  <small className="text-muted">Danh sách đơn thuốc đã kê cho bệnh nhân</small>
                </div>
                <Link to="/doctor/prescriptions/new">
                  <Button variant="success">
                    <Plus className="me-2" size={18} />
                    Kê Đơn Thuốc Mới
                  </Button>
                </Link>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
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
        <Col md={4}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang sử dụng</option>
            <option value="completed">Hoàn thành</option>
            <option value="expired">Hết hạn</option>
            <option value="cancelled">Đã hủy</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Prescriptions Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Danh Sách Đơn Thuốc</h6>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Đang tải danh sách đơn thuốc...</p>
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <Pill size={48} className="mb-3 text-muted" />
                  <h5>Không có đơn thuốc nào</h5>
                  <p>Chưa có đơn thuốc nào phù hợp với tiêu chí tìm kiếm.</p>
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Mã đơn thuốc</th>
                      <th>Bệnh nhân</th>
                      <th>Chẩn đoán</th>
                      <th>Tổng tiền</th>
                      <th>Ngày kê</th>
                      <th>Trạng thái</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription.id}>
                        <td className="fw-bold text-primary">
                          {prescription.prescriptionId}
                        </td>
                        <td>
                          <div>
                            <strong>{prescription.patientName}</strong>
                            <br />
                            <small className="text-muted">ID: {prescription.patientId}</small>
                          </div>
                        </td>
                        <td>{prescription.diagnosis}</td>
                        <td className="fw-bold text-success">
                          {prescription.totalAmount?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td>
                          <Calendar size={14} className="me-1" />
                          {new Date(prescription.createdDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td>{getStatusBadge(prescription.status)}</td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewPrescription(prescription)}
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </Button>
                            {prescription.status === 'active' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleUpdateStatus(prescription.id, 'completed')}
                                title="Đánh dấu hoàn thành"
                              >
                                ✓
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Prescription Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Pill className="me-2" size={24} />
            Chi Tiết Đơn Thuốc
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrescription && (
            <>
              {/* Prescription Info */}
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Thông tin đơn thuốc</h6>
                  <p><strong>Mã đơn:</strong> {selectedPrescription.prescriptionId}</p>
                  <p><strong>Ngày kê:</strong> {new Date(selectedPrescription.createdDate).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedPrescription.status)}</p>
                </Col>
                <Col md={6}>
                  <h6>Thông tin bệnh nhân</h6>
                  <p><strong>Tên:</strong> {selectedPrescription.patientName}</p>
                  <p><strong>Mã BN:</strong> {selectedPrescription.patientId}</p>
                  <p><strong>Chẩn đoán:</strong> {selectedPrescription.diagnosis}</p>
                </Col>
              </Row>

              {/* Prescription Items */}
              <h6>Danh sách thuốc</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Tên thuốc</th>
                    <th>SL</th>
                    <th>Liều dùng</th>
                    <th>Thời gian</th>
                    <th>Hướng dẫn</th>
                    <th>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrescription.prescriptionItems?.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.medicineName}</strong></td>
                      <td>{item.quantity}</td>
                      <td>{item.dosage}</td>
                      <td>{item.duration}</td>
                      <td>{item.instructions}</td>
                      <td className="text-success fw-bold">
                        {item.price?.toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="5" className="text-end">Tổng cộng:</th>
                    <th className="text-success">
                      {selectedPrescription.totalAmount?.toLocaleString('vi-VN')} ₫
                    </th>
                  </tr>
                </tfoot>
              </Table>
            </>
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

export default DoctorPrescriptions;