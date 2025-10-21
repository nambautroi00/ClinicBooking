import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Table, Modal, Form, Badge, Alert } from "react-bootstrap";
import { Search, Plus, Eye, Edit, FileText, User, Calendar, Clock } from "lucide-react";
import medicalRecordApi from "../../api/medicalRecordApi";

const MedicalRecords = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Lấy dữ liệu từ backend
  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {
    try {
      setLoading(true);
      // Lấy tất cả hồ sơ bệnh án từ backend
      const response = await medicalRecordApi.getAllMedicalRecords();
      
      // Chuyển đổi dữ liệu từ backend format sang frontend format
      const records = response.data.map(record => ({
        id: record.id,
        patientId: record.patient?.patientId || record.patientId,
        patientName: record.patient?.user?.fullName || record.patientName,
        age: record.patient?.age || record.age,
        gender: record.patient?.gender || record.gender,
        phone: record.patient?.user?.phone || record.phone,
        diagnosis: record.diagnosis,
        symptoms: record.symptoms,
        treatmentPlan: record.treatmentPlan,
        doctorName: record.doctor?.user?.fullName || record.doctorName,
        appointmentDate: record.appointmentDate || record.createdDate,
        createdDate: record.createdDate,
        status: record.status || 'new',
        notes: record.notes || ""
      }));

      setMedicalRecords(records);
    } catch (error) {
      console.error('❌ Lỗi khi tải hồ sơ bệnh án từ backend:', error);
      
      // Show error message instead of mock data
      if (error.response?.status === 404) {
        console.log('ℹ️ Không tìm thấy hồ sơ bệnh án');
        setMedicalRecords([]);
      } else if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập hồ sơ bệnh án');
        setMedicalRecords([]);
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
        setMedicalRecords([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { variant: "primary", text: "Mới" },
      "in-progress": { variant: "warning", text: "Đang điều trị" },
      completed: { variant: "success", text: "Hoàn thành" }
    };
    return statusConfig[status] || { variant: "secondary", text: "Không xác định" };
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = (record.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setShowModal(true);
  };

  const handleSaveRecord = async (recordData) => {
    try {
      setLoading(true);
      
      if (selectedRecord) {
        // Cập nhật hồ sơ có sẵn
        await medicalRecordApi.updateMedicalRecord(selectedRecord.id, recordData);
      } else {
        // Tạo hồ sơ mới
        await medicalRecordApi.createMedicalRecord(recordData);
      }
      
      // Tải lại danh sách
      await loadMedicalRecords();
      setShowModal(false);
      
      // Thông báo thành công (có thể dùng toast notification)
      console.log('Lưu hồ sơ bệnh án thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu hồ sơ bệnh án:', error);
      alert('Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
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
                    <FileText className="me-2" size={32} />
                    Hồ Sơ Bệnh Án
                  </h2>
                  <p className="text-muted mb-0">Quản lý hồ sơ khám bệnh và điều trị</p>
                </div>
                <Button variant="primary" onClick={handleNewRecord}>
                  <Plus className="me-2" size={18} />
                  Tạo Bệnh Án Mới
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
              <h3 className="text-primary">{medicalRecords.length}</h3>
              <p className="text-muted mb-0">Tổng Bệnh Án</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #198754"}}>
            <Card.Body>
              <h3 className="text-success">{medicalRecords.filter(r => r.status === 'completed').length}</h3>
              <p className="text-muted mb-0">Đã Hoàn Thành</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #ffc107"}}>
            <Card.Body>
              <h3 className="text-warning">{medicalRecords.filter(r => r.status === 'in-progress').length}</h3>
              <p className="text-muted mb-0">Đang Điều Trị</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0" style={{borderLeft: "4px solid #dc3545"}}>
            <Card.Body>
              <h3 className="text-primary">{medicalRecords.filter(r => r.status === 'new').length}</h3>
              <p className="text-muted mb-0">Mới</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="position-relative">
            <Search className="position-absolute" size={18} style={{left: "12px", top: "12px", color: "#6c757d"}} />
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên bệnh nhân, mã BN, chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: "45px"}}
            />
          </div>
        </Col>
        <Col md={4}>
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="in-progress">Đang điều trị</option>
            <option value="completed">Hoàn thành</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Medical Records Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FileText size={48} className="mb-3 text-muted" />
              <h5>Không tìm thấy bệnh án nào</h5>
              <p className="mb-0">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            </Alert>
          ) : (
            <Table responsive hover>
              <thead className="table-light">
                <tr>
                  <th>Mã BN</th>
                  <th>Bệnh nhân</th>
                  <th>Tuổi/Giới tính</th>
                  <th>Chẩn đoán</th>
                  <th>Ngày khám</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => {
                  const statusConfig = getStatusBadge(record.status);
                  return (
                    <tr key={record.id}>
                      <td>
                        <strong className="text-primary">{record.patientId}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{record.patientName}</strong>
                          <br />
                          <small className="text-muted">{record.phone}</small>
                        </div>
                      </td>
                      <td>{record.age} tuổi / {record.gender}</td>
                      <td>
                        <strong>{record.diagnosis}</strong>
                        <br />
                        <small className="text-muted">{record.symptoms}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {new Date(record.appointmentDate).toLocaleDateString('vi-VN')}
                        </div>
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
                          onClick={() => handleViewRecord(record)}
                          className="me-2"
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

      {/* Medical Record Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRecord ? `Bệnh Án - ${selectedRecord.patientName}` : "Tạo Bệnh Án Mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord ? (
            <div>
              {/* Patient Info */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <User className="me-2" size={18} />
                    Thông Tin Bệnh Nhân
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Mã BN:</strong> {selectedRecord.patientId}</p>
                      <p><strong>Họ tên:</strong> {selectedRecord.patientName}</p>
                      <p><strong>Tuổi:</strong> {selectedRecord.age}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Giới tính:</strong> {selectedRecord.gender}</p>
                      <p><strong>Điện thoại:</strong> {selectedRecord.phone}</p>
                      <p><strong>Bác sĩ:</strong> {selectedRecord.doctorName}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Medical Details */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <FileText className="me-2" size={18} />
                    Thông Tin Y Tế
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <p><strong>Triệu chứng:</strong></p>
                      <p className="ps-3">{selectedRecord.symptoms}</p>
                      
                      <p><strong>Chẩn đoán:</strong></p>
                      <p className="ps-3">{selectedRecord.diagnosis}</p>
                      
                      <p><strong>Phương án điều trị:</strong></p>
                      <p className="ps-3">{selectedRecord.treatmentPlan}</p>
                      
                      {selectedRecord.notes && (
                        <>
                          <p><strong>Ghi chú:</strong></p>
                          <p className="ps-3">{selectedRecord.notes}</p>
                        </>
                      )}
                    </Col>
                  </Row>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Badge bg={getStatusBadge(selectedRecord.status).variant} className="fs-6">
                      {getStatusBadge(selectedRecord.status).text}
                    </Badge>
                    <div className="text-muted">
                      <Clock size={14} className="me-1" />
                      Tạo ngày: {new Date(selectedRecord.createdDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ) : (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã bệnh nhân</Form.Label>
                    <Form.Control type="text" placeholder="Nhập mã bệnh nhân" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ tên bệnh nhân</Form.Label>
                    <Form.Control type="text" placeholder="Nhập họ tên" />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tuổi</Form.Label>
                    <Form.Control type="number" placeholder="Tuổi" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Giới tính</Form.Label>
                    <Form.Select>
                      <option>Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Điện thoại</Form.Label>
                    <Form.Control type="tel" placeholder="Số điện thoại" />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Triệu chứng</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Mô tả triệu chứng..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Chẩn đoán</Form.Label>
                <Form.Control type="text" placeholder="Chẩn đoán bệnh..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Phương án điều trị</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Phương án điều trị..." />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control as="textarea" rows={2} placeholder="Ghi chú thêm..." />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
          {!selectedRecord && (
            <Button variant="primary">
              Lưu Bệnh Án
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MedicalRecords;