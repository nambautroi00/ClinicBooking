import React, { useState, useEffect, useCallback } from "react";
import { Card, Container, Row, Col, Table, Modal, Badge, Alert, Tabs, Tab } from "react-bootstrap";
import { FileText, Eye, Calendar, TestTube, Camera, Download, User, Stethoscope, Pill, Clock, Search } from "lucide-react";
import medicalRecordApi from "../../api/medicalRecordApi";
import patientApi from "../../api/patientApi";

const PatientMedicalRecords = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Lấy patientId từ localStorage và API
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        const userId = userData.id;
        if (userId) {
          patientApi
            .getPatientByUserId(userId)
            .then((res) => {
              const data = res.data || res;
              setPatientId(data.patientId);
            })
            .catch((err) => {
              console.error("Error getting patient info:", err);
            });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const loadMedicalRecords = useCallback(async () => {
    if (!patientId) {
      console.log('⚠️ Chưa có patientId, bỏ qua việc tải hồ sơ bệnh án');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Đang tải hồ sơ bệnh án của bệnh nhân ID:', patientId);
      
      const response = await medicalRecordApi.getMedicalRecordsByPatient(patientId);
      console.log('✅ Response từ backend:', response);
      
      // Transform data from backend format to frontend format
      const records = Array.isArray(response.data) ? response.data.map(record => {
        console.log('🔍 Processing record:', {
          recordId: record.recordId,
          diagnosis: record.diagnosis,
          advice: record.advice,
          prescription: record.prescription,
          appointmentDate: record.appointmentDate
        });
        
        return {
          id: record.recordId,
          recordId: record.recordId,
          doctorName: record.doctorName || "Chưa cập nhật",
          visitDate: record.appointmentDate || record.createdAt,
          chiefComplaint: record.advice || "Chưa cập nhật",
          diagnosis: record.diagnosis || "Chưa cập nhật",
          treatment: record.advice || "Chưa cập nhật",
          status: "completed",
          vitalSigns: {},
          testResults: [],
          prescription: record.prescription,
          advice: record.advice || "",
          createdAt: record.createdAt,
          appointmentId: record.appointmentId,
          patientId: record.patientId,
          patientName: record.patientName
        };
      }) : [];
      
      console.log('📋 Đã xử lý', records.length, 'hồ sơ bệnh án');
      setMedicalRecords(records);
      
    } catch (error) {
      console.error('❌ Lỗi khi tải hồ sơ bệnh án từ backend:', error);
      
      // Show error message instead of mock data
      if (error.response?.status === 404) {
        setError('Không tìm thấy hồ sơ bệnh án cho bệnh nhân này');
        console.log('ℹ️ Không tìm thấy hồ sơ bệnh án cho bệnh nhân này');
        setMedicalRecords([]);
      } else if (error.response?.status === 401) {
        setError('Không có quyền truy cập hồ sơ bệnh án');
        console.error('🔒 Không có quyền truy cập hồ sơ bệnh án');
        setMedicalRecords([]);
      } else {
        setError(`Không thể kết nối đến server: ${error.message}`);
        console.error('🔌 Không thể kết nối đến server backend');
        setMedicalRecords([]);
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadMedicalRecords();
    }
  }, [patientId, loadMedicalRecords]);

  // Filtered list based on search and status filter
  const filteredRecords = (medicalRecords || []).filter(record => {
    const raw = (searchTerm || '').toString().trim().toLowerCase();
    if (filterStatus && filterStatus !== 'all' && record.status !== filterStatus) return false;
    if (!raw) return true;
    return (
      (String(record.recordId) || '').toLowerCase().includes(raw) ||
      (record.doctorName || '').toLowerCase().includes(raw) ||
      (record.diagnosis || '').toLowerCase().includes(raw)
    );
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "primary", text: "Đang điều trị" },
      completed: { variant: "success", text: "Hoàn thành" },
      followup: { variant: "warning", text: "Cần tái khám" },
      cancelled: { variant: "danger", text: "Đã hủy" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: "Không xác định" };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleExportPDF = async (recordId) => {
    try {
      console.log('📄 Đang xuất PDF cho hồ sơ:', recordId);
      alert('Tính năng xuất PDF sẽ được cập nhật sau!');
    } catch (error) {
      console.error('❌ Lỗi khi xuất PDF:', error);
      alert('Không thể xuất PDF. Vui lòng thử lại.');
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
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
                      Hồ Sơ Bệnh Án
                    </h2>
                    <p className="text-muted mb-0" style={{fontSize: '0.9rem'}}>Quản lý hồ sơ khám bệnh và điều trị</p>
                  </div>
                </div>
                <div>
                  {/* No create button for patient view; keep space for balance */}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{background: '#fff', borderRadius: '12px'}}>
            <Card.Body className="p-3" style={{position: 'relative', minHeight: 110}}>
              <div style={{position: 'absolute', top: 12, right: 12, opacity: 0.9}}>
                <FileText size={20} color="#0d6efd" />
              </div>
              <h6 style={{fontWeight: 600}}>Tổng Bệnh Án</h6>
              <h3 className="mt-2 text-primary">{medicalRecords.length}</h3>
              <small className="text-muted">Hồ sơ bệnh án</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{background: '#fff', borderRadius: '12px'}}>
            <Card.Body className="p-3" style={{position: 'relative', minHeight: 110}}>
              <div style={{position: 'absolute', top: 12, right: 12, opacity: 0.9}}>
                <span role="img" aria-label="done">✅</span>
              </div>
              <h6 style={{fontWeight: 600}}>Đã Hoàn Thành</h6>
              <h3 className="mt-2 text-success">{medicalRecords.filter(r => r.status === 'completed').length}</h3>
              <small className="text-muted">Hoàn tất điều trị</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{background: '#fff', borderRadius: '12px'}}>
            <Card.Body className="p-3" style={{position: 'relative', minHeight: 110}}>
              <div style={{position: 'absolute', top: 12, right: 12, opacity: 0.9}}>
                <span role="img" aria-label="treat">⏳</span>
              </div>
              <h6 style={{fontWeight: 600}}>Đang Điều Trị</h6>
              <h3 className="mt-2 text-warning">{medicalRecords.filter(r => r.status === 'active').length}</h3>
              <small className="text-muted">Đang theo dõi</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{background: '#fff', borderRadius: '12px'}}>
            <Card.Body className="p-3" style={{position: 'relative', minHeight: 110}}>
              <div style={{position: 'absolute', top: 12, right: 12, opacity: 0.9}}>
                <span role="img" aria-label="new">✨</span>
              </div>
              <h6 style={{fontWeight: 600}}>Mới</h6>
              <h3 className="mt-2 text-primary">{medicalRecords.filter(r => r.status === 'new').length}</h3>
              <small className="text-muted">Hồ sơ mới</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={9}>
          <div className="position-relative">
            <Search className="position-absolute" size={20} style={{left: "16px", top: "14px", color: "#9ca3af"}} />
            <input
              className="form-control"
              type="text"
              placeholder="Tìm kiếm theo mã hồ sơ, bác sĩ hoặc chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{paddingLeft: '48px', height: '48px', borderRadius: '12px', border: '1px solid #e5e7eb'}}
            />
          </div>
        </Col>
        <Col md={3} className="d-flex align-items-center justify-content-end">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{height: '48px', borderRadius: '12px'}}>
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="active">Đang điều trị</option>
            <option value="followup">Cần tái khám</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </Col>
      </Row>

      {/* Medical Records Cards */}
      <Row>
        <Col>
          {loading ? (
            <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
              <Card.Body>
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Đang tải hồ sơ bệnh án...</p>
                </div>
              </Card.Body>
            </Card>
          ) : error ? (
            <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
              <Card.Body>
                <Alert variant="danger" className="text-center border-0">
                  <FileText size={48} className="mb-3 text-danger" />
                  <h5>Lỗi tải dữ liệu</h5>
                  <p>{error}</p>
                  <button 
                    className="btn btn-outline-danger btn-sm" 
                    onClick={() => {
                      setError(null);
                      loadMedicalRecords();
                    }}
                  >
                    Thử lại
                  </button>
                </Alert>
              </Card.Body>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card className="shadow-sm border-0" style={{borderRadius: '16px'}}>
              <Card.Body>
                <Alert variant="info" className="text-center m-4" style={{backgroundColor: '#e6f7fb', borderRadius: 8}}>
                  <FileText size={48} className="mb-3 text-muted" />
                  <h5>Không tìm thấy hồ sơ bệnh án nào</h5>
                  <p className="mb-0">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </Alert>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredRecords.map((record) => (
                <Col key={record.id} md={6} lg={4}>
                  <Card 
                    className="h-100 shadow-sm border-0"
                    style={{ borderRadius: 12, cursor: 'pointer', transition: 'all 0.22s ease' }}
                    onClick={() => handleViewRecord(record)}
                  >
                    <div style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: '12px 16px'}}>
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-white">Hồ sơ #{record.recordId}</h6>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <User size={16} className="me-2 text-primary" />
                          <strong className="text-dark">{record.doctorName}</strong>
                        </div>
                        <div className="d-flex align-items-center mb-2 text-muted">
                          <Calendar size={16} className="me-2" />
                          <small>{record.visitDate ? new Date(record.visitDate).toLocaleDateString('vi-VN') : 'N/A'}</small>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex align-items-start">
                          <Stethoscope size={16} className="me-2 text-success mt-1" />
                          <div className="flex-grow-1">
                            <small className="text-muted d-block mb-1">Chẩn đoán</small>
                            <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>
                              {record.diagnosis || "Chưa cập nhật"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <div>
                          {record.prescription ? (
                            <Badge bg="success" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                              <Pill size={12} className="me-1" />
                              Có đơn thuốc
                            </Badge>
                          ) : (
                            <Badge bg="secondary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                              <Pill size={12} className="me-1" />
                              Chưa kê đơn
                            </Badge>
                          )}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={(e) => { e.stopPropagation(); handleViewRecord(record); }}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} className="me-1" />
                          Xem
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* View Medical Record Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="text-white">
            <FileText className="me-2" size={24} />
            Chi Tiết Hồ Sơ Bệnh Án
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedRecord && (
            <Tabs defaultActiveKey="general" className="mb-0">
              <Tab eventKey="general" title={
                <span>
                  <Stethoscope size={16} className="me-1" />
                  Thông tin khám
                </span>
              }>
                <div className="p-4">
                  {/* Header Info Card */}
                  <Card className="mb-4 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Card.Body className="text-white">
                      <Row>
                        <Col md={6}>
                          <div className="d-flex align-items-center mb-2">
                            <FileText size={20} className="me-2" />
                            <h5 className="mb-0">Hồ sơ #{selectedRecord.recordId}</h5>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <User size={18} className="me-2" />
                            <span>{selectedRecord.doctorName}</span>
                          </div>
                        </Col>
                        <Col md={6} className="text-md-end">
                          <div className="d-flex align-items-center justify-content-md-end mb-2">
                            <Calendar size={18} className="me-2" />
                            <span>{new Date(selectedRecord.visitDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-md-end">
                            {getStatusBadge(selectedRecord.status)}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Diagnosis Card */}
                  <Card className="mb-3 border-0 shadow-sm">
                    <Card.Header className="bg-light border-0">
                      <h6 className="mb-0 d-flex align-items-center">
                        <Stethoscope size={18} className="me-2 text-primary" />
                        Chẩn đoán
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                        {selectedRecord.diagnosis || "Chưa cập nhật"}
                      </p>
                    </Card.Body>
                  </Card>

                  {/* Advice Card */}
                  {selectedRecord.advice && (
                    <Card className="mb-3 border-0 shadow-sm">
                      <Card.Header className="bg-light border-0">
                        <h6 className="mb-0 d-flex align-items-center">
                          <FileText size={18} className="me-2 text-success" />
                          Lời khuyên
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>
                          {selectedRecord.advice}
                        </p>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Prescription Card */}
                  {selectedRecord.prescription && (
                    <Card className="mb-3 border-0 shadow-sm">
                      <Card.Header className="bg-light border-0">
                        <h6 className="mb-0 d-flex align-items-center">
                          <Pill size={18} className="me-2 text-danger" />
                          Đơn thuốc
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        {selectedRecord.prescription.notes && (
                          <div className="mb-3 p-3 bg-light rounded">
                            <strong>Ghi chú:</strong>
                            <p className="mb-0 mt-1">{selectedRecord.prescription.notes}</p>
                          </div>
                        )}
                        {selectedRecord.prescription.items && selectedRecord.prescription.items.length > 0 ? (
                          <div>
                            <strong className="mb-3 d-block">Thuốc kê đơn:</strong>
                            <Row className="g-3">
                              {selectedRecord.prescription.items.map((item, index) => (
                                <Col md={6} key={index}>
                                  <Card className="border h-100">
                                    <Card.Body className="p-3">
                                      <div className="d-flex align-items-start mb-2">
                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                             style={{ width: '28px', height: '28px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                          {index + 1}
                                        </div>
                                        <div className="flex-grow-1">
                                          <h6 className="mb-1 text-primary">{item.medicineName || `Thuốc ${index + 1}`}</h6>
                                          <div className="small text-muted">
                                            <div className="mb-1">
                                              <strong>Liều dùng:</strong> {item.dosage || 'N/A'}
                                            </div>
                                            <div className="mb-1">
                                              <strong>Thời gian:</strong> {item.duration || 'N/A'}
                                            </div>
                                            <div className="mb-1">
                                              <strong>Số lượng:</strong> {item.quantity || 1}
                                            </div>
                                            {item.price && (
                                              <div className="mb-1">
                                                <strong>Đơn giá:</strong> <span className="text-success fw-bold">{item.price.toLocaleString('vi-VN')} ₫</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        ) : (
                          <Alert variant="info" className="mb-0">
                            <Pill size={16} className="me-2" />
                            Không có thuốc nào được kê
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="tests" title={
                <span>
                  <TestTube size={16} className="me-1" />
                  Xét nghiệm
                </span>
              }>
                <div className="p-4">
                  <h6 className="mb-4 d-flex align-items-center">
                    <TestTube size={20} className="me-2 text-info" />
                    Kết quả xét nghiệm
                  </h6>
                  {selectedRecord.testResults && selectedRecord.testResults.length > 0 ? (
                    <Row className="g-3">
                      {selectedRecord.testResults.map((test, index) => (
                        <Col md={6} key={index}>
                          <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-info text-white">
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{test.type}</strong>
                                <small>
                                  {new Date(test.date).toLocaleDateString('vi-VN')}
                                </small>
                              </div>
                            </Card.Header>
                            <Card.Body>
                              <p className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                {test.result}
                              </p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Alert variant="info" className="border-0">
                      <TestTube size={24} className="me-2" />
                      Chưa có kết quả xét nghiệm nào
                    </Alert>
                  )}
                </div>
              </Tab>
              
              <Tab eventKey="images" title={
                <span>
                  <Camera size={16} className="me-1" />
                  Hình ảnh
                </span>
              }>
                <div className="p-4">
                  <h6 className="mb-4 d-flex align-items-center">
                    <Camera size={20} className="me-2 text-warning" />
                    Hình ảnh y học
                  </h6>
                  {selectedRecord.medicalImages && selectedRecord.medicalImages.length > 0 ? (
                    <Row className="g-3">
                      {selectedRecord.medicalImages.map((image, index) => (
                        <Col md={4} key={index}>
                          <Card className="border-0 shadow-sm h-100">
                            <Card.Img 
                              variant="top" 
                              src={image.url} 
                              style={{ height: '200px', objectFit: 'cover' }}
                            />
                            <Card.Body>
                              <Card.Title className="h6">{image.type}</Card.Title>
                              <small className="text-muted">
                                <Clock size={14} className="me-1" />
                                {image.date}
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Alert variant="info" className="border-0">
                      <Camera size={24} className="me-2" />
                      Chưa có hình ảnh y học nào
                    </Alert>
                  )}
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light">
          <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
            Đóng
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleExportPDF(selectedRecord?.id)}
          >
            <Download className="me-2" size={16} />
            Xuất PDF
          </button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PatientMedicalRecords;