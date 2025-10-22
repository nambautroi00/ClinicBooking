import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Form, Alert } from "react-bootstrap";
import { Pill, Plus, User, Search, ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { prescriptionApi, medicineApi } from "../../api/prescriptionApi";
import patientApi from "../../api/patientApi";

const PrescriptionForm = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState(null);

  // Get appointment info from navigation state
  const appointmentInfo = location.state?.appointment;
  const patientInfo = location.state?.patientInfo;

  // Form state for new prescription
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    diagnosis: '',
    medicines: []
  });

  // Current medicine being added
  const [currentMedicine, setCurrentMedicine] = useState({
    medicineId: '',
    quantity: 1,
    dosage: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    loadMedicines();
    loadPatients();
  }, []);

  // Auto-fill patient info if coming from appointment
  useEffect(() => {
    if (appointmentInfo && patientInfo) {
      setFormData(prev => ({
        ...prev,
        patientId: patientInfo.patientId || patientInfo.id,
        patientName: patientInfo.patientName || patientInfo.name,
        diagnosis: '' // Doctor will fill this
      }));
    }
  }, [appointmentInfo, patientInfo]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      console.log('🔍 Đang tải danh sách thuốc...');
      const medicinesRes = await medicineApi.getAllMedicines();
      
      const medicinesData = medicinesRes.data.map(medicine => ({
        id: medicine.id || Math.random(),
        medicineId: medicine.medicineId || 'N/A',
        name: medicine.name || 'Không rõ tên',
        strength: medicine.strength || '',
        category: medicine.note || medicine.category || 'Không phân loại',
        price: medicine.unit_price || medicine.unitPrice || medicine.price || 0,
        unit: medicine.unit || 'đơn vị',
        description: medicine.description || ''
      }));

      console.log('✅ Đã tải danh sách thuốc:', medicinesData);
      setMedicines(medicinesData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách thuốc từ backend:', error);
      
      if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập danh sách thuốc');
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
      }
      
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      console.log('🔍 Đang tải danh sách bệnh nhân...');
      const patientsRes = await patientApi.getAllPatients();
      
      const patientsData = patientsRes.data.map(patient => ({
        id: patient.id || Math.random(),
        patientId: patient.patientId || 'N/A',
        name: (patient.user?.lastName && patient.user?.firstName) ? 
              (patient.user.lastName + " " + patient.user.firstName) :
              (patient.lastName && patient.firstName) ?
              (patient.lastName + " " + patient.firstName) :
              "Không rõ tên",
        phone: patient.user?.phone || patient.phone || "",
        email: patient.user?.email || patient.email || "",
        address: patient.user?.address || patient.address || "",
        healthInsuranceNumber: patient.healthInsuranceNumber || ""
      }));

      console.log('✅ Đã tải danh sách bệnh nhân:', patientsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách bệnh nhân từ backend:', error);
      
      if (error.response?.status === 401) {
        console.error('🔒 Không có quyền truy cập danh sách bệnh nhân');
      } else {
        console.error('🔌 Không thể kết nối đến server backend');
      }
      
      setPatients([]);
    }
  };

  // Enhanced search filter with error handling
  const filteredMedicines = React.useMemo(() => {
    try {
      if (!medicines || medicines.length === 0) {
        console.log('🔍 No medicines to filter');
        return [];
      }

      if (!searchTerm || !searchTerm.trim()) {
        console.log('🔍 No search term, returning all medicines:', medicines.length);
        return medicines;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      console.log('🔍 Filtering with search term:', searchLower);
      
      const filtered = medicines.filter(medicine => {
        try {
          if (!medicine) return false;
          
          const name = (medicine.name || '').toLowerCase();
          const medicineId = (medicine.medicineId || '').toLowerCase();
          const category = (medicine.category || '').toLowerCase();
          const strength = (medicine.strength || '').toLowerCase();
          
          return name.includes(searchLower) ||
                 medicineId.includes(searchLower) ||
                 category.includes(searchLower) ||
                 strength.includes(searchLower);
        } catch (error) {
          console.error('❌ Error filtering medicine:', medicine, error);
          return false;
        }
      });
      
      console.log('🔍 Filtered medicines:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ Error in filteredMedicines:', error);
      return [];
    }
  }, [medicines, searchTerm]);

  // Safe search handler with error handling
  const handleSearchChange = (e) => {
    try {
      const value = e.target.value;
      console.log('🔍 Search input changed:', value);
      setSearchTerm(value);
      setSearchError(null);
    } catch (error) {
      console.error('❌ Error in search input:', error);
      setSearchError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    }
  };

  const handleSelectPatient = (patientId) => {
    const patient = patients.find(p => p.patientId === patientId);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patientId: patient.patientId,
        patientName: patient.name
      }));
    }
  };

  const handleAddMedicine = () => {
    console.log('🔍 Current medicine data:', currentMedicine);
    console.log('📋 Available medicines:', medicines.map(m => ({ id: m.id, name: m.name })));

    if (!currentMedicine.medicineId || !currentMedicine.quantity || !currentMedicine.dosage) {
      alert('Vui lòng điền đầy đủ thông tin thuốc');
      return;
    }

    console.log('🔍 Looking for medicine with ID:', currentMedicine.medicineId);
    console.log('🔍 Parsed ID:', parseInt(currentMedicine.medicineId));

    // Try multiple ways to find the medicine
    let selectedMedicine = medicines.find(m => m.id == currentMedicine.medicineId) || // Use loose equality
                          medicines.find(m => m.id === parseInt(currentMedicine.medicineId)) ||
                          medicines.find(m => m.id.toString() === currentMedicine.medicineId.toString());

    console.log('✅ Found medicine:', selectedMedicine);

    if (!selectedMedicine) {
      console.error('❌ Không tìm thấy thuốc với ID:', currentMedicine.medicineId);
      console.error('Available IDs:', medicines.map(m => `${m.id} (${typeof m.id})`));
      alert(`Thuốc không hợp lệ. ID: ${currentMedicine.medicineId} không tìm thấy trong danh sách.`);
      return;
    }

    const newMedicine = {
      ...currentMedicine,
      id: Date.now(),
      medicineId: selectedMedicine.medicineId,
      medicineName: selectedMedicine.name,
      price: selectedMedicine.price * currentMedicine.quantity,
      unitPrice: selectedMedicine.price,
      unit: selectedMedicine.unit
    };

    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine]
    }));

    // Reset current medicine
    setCurrentMedicine({
      medicineId: '',
      quantity: 1,
      dosage: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemoveMedicine = (medicineIndex) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, index) => index !== medicineIndex)
    }));
  };

  const handleSavePrescription = async () => {
    console.log('🔍 Checking form data before save:', formData);
    console.log('🔍 Current medicines:', formData.medicines);

    if (!formData.patientId || !formData.diagnosis || formData.medicines.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin đơn thuốc');
      return;
    }

    try {
      // Validate medicine data
      const invalidMedicines = formData.medicines.filter(med => 
        !med.medicineId || !med.quantity || !med.dosage
      );

      if (invalidMedicines.length > 0) {
        console.error('❌ Có thuốc thiếu thông tin:', invalidMedicines);
        alert('Có thuốc trong đơn chưa đầy đủ thông tin. Vui lòng kiểm tra lại.');
        return;
      }

      const prescriptionData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        diagnosis: formData.diagnosis,
        totalAmount: formData.medicines.reduce((sum, med) => sum + (med.price || 0), 0),
        medicines: formData.medicines.map(med => ({
          medicineId: med.medicineId,
          medicineName: med.medicineName,
          quantity: parseInt(med.quantity) || 1,
          dosage: med.dosage || '',
          duration: med.duration || '',
          instructions: med.instructions || '',
          unitPrice: med.unitPrice || 0,
          price: med.price || 0,
          unit: med.unit || 'viên'
        })),
        appointmentId: appointmentId || null,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0]
      };

      console.log('💾 Đang lưu đơn thuốc:', JSON.stringify(prescriptionData, null, 2));
      
      try {
        const result = await prescriptionApi.createPrescription(prescriptionData);
        console.log('✅ API response:', result);
        
        // Show success message with more details
        alert(`✅ Đã lưu đơn thuốc thành công!\n\n📋 Bệnh nhân: ${formData.patientName}\n💊 Số loại thuốc: ${formData.medicines.length}\n💰 Tổng tiền: ${prescriptionData.totalAmount.toLocaleString('vi-VN')} ₫`);
        
        // Navigate back to prescriptions list
        console.log('🚀 Navigating to /doctor/prescriptions...');
        navigate('/doctor/prescriptions', { 
          state: { 
            message: 'Đã kê đơn thuốc thành công!',
            newPrescription: true 
          } 
        });

      } catch (apiError) {
        console.error('❌ Lỗi khi lưu đơn thuốc vào database:', apiError);
        
        let errorMessage = '❌ Không thể lưu đơn thuốc vào hệ thống.\n\n';
        
        if (apiError.response?.status === 401) {
          errorMessage += 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (apiError.response?.status === 400) {
          errorMessage += 'Thông tin đơn thuốc không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (apiError.response?.status === 500) {
          errorMessage += 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        }
        
        alert(errorMessage);
        return; // Don't navigate on error
      }

    } catch (error) {
      console.error('❌ Lỗi không mong đợi:', error);
      
      // More detailed error message
      let errorMessage = '❌ Không thể lưu đơn thuốc.\n\n';
      
      if (error.response) {
        errorMessage += `Lỗi server: ${error.response.status} - ${error.response.data?.message || 'Không rõ lý do'}`;
      } else if (error.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage += `Lỗi: ${error.message}`;
      }
      
      errorMessage += '\n\nVui lòng thử lại hoặc liên hệ quản trị viên.';
      
      alert(errorMessage);
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
                  <div className="d-flex align-items-center mb-2">
                    <Link to="/doctor/prescriptions" className="btn btn-outline-secondary me-3">
                      <ArrowLeft size={18} className="me-1" />
                      Quay lại
                    </Link>
                    <h4 className="mb-0">
                      <Pill className="me-2" size={24} />
                      {appointmentInfo ? 'Kê Đơn Thuốc - Khám Bệnh' : 'Kê Đơn Thuốc Mới'}
                    </h4>
                  </div>
                  {appointmentInfo ? (
                    <div className="mb-2">
                      <small className="text-muted">Lịch hẹn: {appointmentInfo.appointmentTime || 'N/A'} - {appointmentInfo.appointmentDate || 'N/A'}</small>
                      <br />
                      <small className="text-info">Bệnh nhân: {patientInfo?.name || 'Không rõ'} | ID: {appointmentInfo.appointmentId || 'N/A'}</small>
                    </div>
                  ) : (
                    <small className="text-muted">Tạo đơn thuốc cho bệnh nhân</small>
                  )}
                </div>
                <Button 
                  variant="success" 
                  onClick={handleSavePrescription}
                  disabled={
                    formData.medicines.length === 0 || 
                    !formData.patientId || 
                    !formData.diagnosis.trim() ||
                    formData.medicines.some(med => !med.medicineId || !med.quantity || !med.dosage)
                  }
                >
                  <Save className="me-2" size={18} />
                  Lưu đơn thuốc
                </Button>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={7}>
          {/* Patient Selection */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Thông tin bệnh nhân</h6>
            </Card.Header>
            <Card.Body>
              {appointmentInfo ? (
                <Alert variant="info">
                  <div><strong>Từ lịch hẹn:</strong> {patientInfo?.name || 'Không rõ tên'}</div>
                  <div><strong>ID:</strong> {patientInfo?.id || 'N/A'}</div>
                  {patientInfo?.phone && <div><strong>SĐT:</strong> {patientInfo.phone}</div>}
                </Alert>
              ) : (
                <Form.Select 
                  value={formData.patientId}
                  onChange={(e) => handleSelectPatient(e.target.value)}
                >
                  <option value="">Chọn bệnh nhân...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.patientId}>
                      {patient.name} - {patient.patientId}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Card.Body>
          </Card>

          {/* Diagnosis */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Chẩn đoán</h6>
            </Card.Header>
            <Card.Body>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập chẩn đoán bệnh..."
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({...prev, diagnosis: e.target.value}))}
              />
            </Card.Body>
          </Card>

          {/* Add Medicine */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Thêm thuốc vào đơn</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chọn thuốc</Form.Label>
                    <Form.Select
                      value={currentMedicine.medicineId}
                      onChange={(e) => {
                        console.log('📝 Selected medicine ID from select:', e.target.value, typeof e.target.value);
                        setCurrentMedicine(prev => ({...prev, medicineId: e.target.value}));
                      }}
                    >
                      <option value="">Chọn thuốc...</option>
                      {filteredMedicines.map(medicine => (
                        <option key={medicine.id} value={medicine.id}>
                          {(medicine.name || 'Không rõ tên')} - {(medicine.category || 'Không rõ loại')}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={currentMedicine.quantity}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Liều dùng</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="VD: 1 viên x 3 lần/ngày"
                      value={currentMedicine.dosage}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, dosage: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Thời gian sử dụng</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="VD: 7 ngày"
                      value={currentMedicine.duration}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, duration: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Hướng dẫn sử dụng</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="VD: Uống sau ăn"
                  value={currentMedicine.instructions}
                  onChange={(e) => setCurrentMedicine(prev => ({...prev, instructions: e.target.value}))}
                />
              </Form.Group>

              <Button variant="primary" onClick={handleAddMedicine}>
                <Plus size={18} className="me-1" />
                Thêm thuốc
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {/* Medicine Search */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <Search size={18} className="me-2" />
                Tìm kiếm thuốc ({filteredMedicines.length} thuốc)
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="position-relative mb-3">
                <Search className="position-absolute" size={18} style={{left: "12px", top: "12px", color: "#6c757d"}} />
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên thuốc, mã thuốc, loại..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{paddingLeft: "45px"}}
                />
                {searchError && (
                  <small className="text-danger mt-1 d-block">{searchError}</small>
                )}
              </div>

              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-2">Đang tải danh sách thuốc...</div>
                </div>
              ) : (
                <div style={{maxHeight: "350px", overflowY: "auto"}}>
                  {filteredMedicines.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Search size={48} className="mb-3" style={{opacity: 0.3}} />
                      <div>Không tìm thấy thuốc nào</div>
                      <small>Thử từ khóa khác</small>
                    </div>
                  ) : (
                    <>
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map(medicine => {
                          try {
                            return (
                              <div 
                                key={medicine.id || `medicine-${Math.random()}`} 
                                className="border rounded p-3 mb-2 cursor-pointer hover-bg-light" 
                                onClick={() => {
                                  try {
                                    console.log('🖱️ Clicked medicine from search:', medicine.id, typeof medicine.id, medicine.name);
                                    setCurrentMedicine(prev => ({...prev, medicineId: medicine.id}));
                                  } catch (error) {
                                    console.error('❌ Error clicking medicine:', error);
                                  }
                                }}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  border: currentMedicine.medicineId == medicine.id ? '2px solid #007bff' : '1px solid #dee2e6'
                                }}
                                onMouseEnter={(e) => {
                                  try {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                  } catch (error) {
                                    console.error('❌ Error on mouse enter:', error);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  try {
                                    e.target.style.backgroundColor = 'white';
                                  } catch (error) {
                                    console.error('❌ Error on mouse leave:', error);
                                  }
                                }}
                              >
                        <div className="d-flex justify-content-between">
                          <div style={{flex: 1}}>
                            <div className="fw-bold text-primary">{medicine.name || 'Không rõ tên'}</div>
                            <small className="text-muted d-block">
                              <span className="badge bg-secondary me-1">{medicine.medicineId || 'N/A'}</span>
                              {medicine.category || 'Không rõ loại'} • {medicine.strength || 'N/A'}
                            </small>
                            {medicine.description && (
                              <small className="text-info d-block mt-1">
                                {medicine.description}
                              </small>
                            )}
                          </div>
                          <div className="text-end ms-3">
                            <div className="fw-bold text-success">
                              {(medicine.price || 0).toLocaleString('vi-VN')} ₫
                            </div>
                            <small className="text-muted">/{medicine.unit || 'đơn vị'}</small>
                          </div>
                        </div>
                      </div>
                            );
                          } catch (error) {
                            console.error('❌ Error rendering medicine:', medicine, error);
                            return null;
                          }
                        })
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <Search size={48} className="mb-3" style={{opacity: 0.3}} />
                          <div>Không tìm thấy thuốc nào</div>
                          <small>Thử từ khóa khác</small>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Current Prescription */}
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <Pill size={18} className="me-2" />
                Đơn thuốc hiện tại ({formData.medicines.length} thuốc)
              </h6>
            </Card.Header>
            <Card.Body>
              {formData.medicines.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Pill size={48} className="mb-3" style={{opacity: 0.3}} />
                  <div>Chưa có thuốc nào trong đơn</div>
                  <small>Thêm thuốc từ danh sách bên trái</small>
                </div>
              ) : (
                <div style={{maxHeight: "400px", overflowY: "auto"}}>
                  {formData.medicines.map((medicine, index) => (
                    <div key={index} className="border rounded p-2 mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{flex: 1}}>
                          <div className="fw-bold">{medicine.medicineName}</div>
                          <small className="text-muted d-block">
                            Số lượng: {medicine.quantity} {medicine.unit}
                          </small>
                          <small className="text-primary d-block">
                            {medicine.dosage}
                          </small>
                          {medicine.duration && (
                            <small className="text-info d-block">
                              Thời gian: {medicine.duration}
                            </small>
                          )}
                          {medicine.instructions && (
                            <small className="text-success d-block">
                              Hướng dẫn: {medicine.instructions}
                            </small>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveMedicine(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 pt-3 border-top">
                    <div className="fw-bold text-end">
                      Tổng tiền: {formData.medicines.reduce((sum, med) => sum + (med.price || 0), 0).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrescriptionForm;