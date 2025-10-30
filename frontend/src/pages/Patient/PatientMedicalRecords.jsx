import React, { useState, useEffect, useCallback } from "react";
import { Card, Container, Row, Col, Table, Modal, Badge, Alert, Tabs, Tab } from "react-bootstrap";
import { FileText, Eye, Calendar, TestTube, Camera, Download } from "lucide-react";
import medicalRecordApi from "../../api/medicalRecordApi";
import patientApi from "../../api/patientApi";

const PatientMedicalRecords = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [error, setError] = useState(null);

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
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-0">
                        <FileText className="me-2" size={24} />
                        Hồ Sơ Bệnh Án Của Tôi
                      </h4>
                      <small className="text-muted">Xem lịch sử khám bệnh và hồ sơ y tế</small>
                    </div>
                  </div>
                </Card.Header>
              </Card>
            </Col>
      </Row>

      {/* Medical Records Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Lịch Sử Khám Bệnh</h6>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Đang tải hồ sơ bệnh án...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="text-center">
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
              ) : medicalRecords.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <FileText size={48} className="mb-3 text-muted" />
                  <h5>Chưa có hồ sơ bệnh án nào</h5>
                  <p>Bạn chưa có lịch sử khám bệnh nào trong hệ thống.</p>
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Mã hồ sơ</th>
                      <th>Bác sĩ khám</th>
                      <th>Ngày khám</th>
                      <th>Chẩn đoán</th>
                      <th>Đơn thuốc</th>
                      <th>Trạng thái</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="fw-bold text-primary">
                          {record.recordId}
                        </td>
                        <td>
                          <div>
                            <strong>{record.doctorName}</strong>
                          </div>
                        </td>
                        <td>
                          <Calendar size={14} className="me-1" />
                          {record.visitDate ? new Date(record.visitDate).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td>{record.diagnosis || "Chưa cập nhật"}</td>
                        <td>
                          {record.prescription ? (
                            <Badge bg="success">Có đơn thuốc</Badge>
                          ) : (
                            <Badge bg="secondary">Chưa kê đơn</Badge>
                          )}
                        </td>
                        <td>{getStatusBadge(record.status)}</td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleViewRecord(record)}
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleExportPDF(record.id)}
                              title="Xuất PDF"
                            >
                              <Download size={14} />
                            </button>
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

      {/* View Medical Record Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FileText className="me-2" size={24} />
            Chi Tiết Hồ Sơ Bệnh Án
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <Tabs defaultActiveKey="general" className="mb-3">
              <Tab eventKey="general" title="Thông tin khám">
                <Row>
                  <Col md={6}>
                    <h6>Thông tin khám bệnh</h6>
                    <p><strong>Mã hồ sơ:</strong> {selectedRecord.recordId}</p>
                    <p><strong>Bác sĩ khám:</strong> {selectedRecord.doctorName}</p>
                    <p><strong>Ngày khám:</strong> {new Date(selectedRecord.visitDate).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> {getStatusBadge(selectedRecord.status)}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Sinh hiệu</h6>
                    {selectedRecord.vitalSigns && (
                      <>
                        <p><strong>Huyết áp:</strong> {selectedRecord.vitalSigns.bloodPressure} mmHg</p>
                        <p><strong>Nhịp tim:</strong> {selectedRecord.vitalSigns.heartRate} bpm</p>
                        <p><strong>Nhiệt độ:</strong> {selectedRecord.vitalSigns.temperature}°C</p>
                        <p><strong>Cân nặng:</strong> {selectedRecord.vitalSigns.weight} kg</p>
                        <p><strong>Chiều cao:</strong> {selectedRecord.vitalSigns.height} cm</p>
                      </>
                    )}
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col>
                    <h6>Chẩn đoán</h6>
                    <p>{selectedRecord.diagnosis || "Chưa cập nhật"}</p>
                    
                    {selectedRecord.advice && (
                      <>
                        <h6>Lời khuyên</h6>
                        <p>{selectedRecord.advice}</p>
                      </>
                    )}
                    
                    {selectedRecord.prescription && (
                      <>
                        <h6>Đơn thuốc</h6>
                        <div className="bg-light p-3 rounded">
                          {selectedRecord.prescription.notes && (
                            <p><strong>Ghi chú:</strong> {selectedRecord.prescription.notes}</p>
                          )}
                          {selectedRecord.prescription.items && selectedRecord.prescription.items.length > 0 ? (
                            <div className="mt-2">
                              <strong>Thuốc kê đơn:</strong>
                              <ul className="mt-2">
                                {selectedRecord.prescription.items.map((item, index) => (
                                  <li key={index} className="mb-2">
                                    <strong>{item.medicineName || `Thuốc ${index + 1}`}</strong>
                                    <br />
                                    <small className="text-muted">
                                      Liều: {item.dosage || 'N/A'} | 
                                      Thời gian: {item.duration || 'N/A'} | 
                                      Số lượng: {item.quantity || 1}
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-muted">Không có thuốc nào được kê</p>
                          )}
                        </div>
                      </>
                    )}
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="tests" title="Xét nghiệm">
                <h6>Kết quả xét nghiệm</h6>
                {selectedRecord.testResults && selectedRecord.testResults.length > 0 ? (
                  selectedRecord.testResults.map((test, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header>
                        <strong>{test.type}</strong>
                        <small className="text-muted ms-2">
                          {new Date(test.date).toLocaleDateString('vi-VN')}
                        </small>
                      </Card.Header>
                      <Card.Body>
                        <pre style={{margin: 0, fontFamily: 'inherit'}}>{test.result}</pre>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <Alert variant="info">
                    <TestTube size={24} className="me-2" />
                    Chưa có kết quả xét nghiệm nào
                  </Alert>
                )}
              </Tab>
              
              <Tab eventKey="images" title="Hình ảnh">
                <h6>Hình ảnh y học</h6>
                {selectedRecord.medicalImages && selectedRecord.medicalImages.length > 0 ? (
                  <Row>
                    {selectedRecord.medicalImages.map((image, index) => (
                      <Col md={4} key={index} className="mb-3">
                        <Card>
                          <Card.Img variant="top" src={image.url} />
                          <Card.Body>
                            <Card.Title>{image.type}</Card.Title>
                            <small className="text-muted">{image.date}</small>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Alert variant="info">
                    <Camera size={24} className="me-2" />
                    Chưa có hình ảnh y học nào
                  </Alert>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
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