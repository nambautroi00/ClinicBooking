import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Button, Form, Badge, Alert, Modal } from "react-bootstrap";
import { Pill, Plus, User, Calendar, Search } from "lucide-react";
import { prescriptionApi, medicineApi } from "../../api/prescriptionApi";

const PrescriptionForm = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Form state for new prescription
  const [formData, setFormData] = useState({
    patientId: '',
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
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      console.log('🔍 Đang tải danh sách thuốc...');
      
      const medicinesRes = await medicineApi.getAllMedicines();
      
      const medicinesData = medicinesRes.data.map(medicine => ({
        id: medicine.id,
        medicineId: medicine.medicineId,
        name: medicine.name,
        strength: medicine.strength || '',
        category: medicine.note || medicine.category,
        price: medicine.unit_price || medicine.unitPrice || medicine.price || 0,
        unit: medicine.unit,
        description: medicine.description
      }));

      console.log('✅ Đã tải danh sách thuốc:', medicinesData);
      setMedicines(medicinesData);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách thuốc:', error);
      // Fallback to mock data
      loadMockMedicines();
    } finally {
      setLoading(false);
    }
  };

  const loadMockMedicines = () => {
    const mockMedicines = [
      {
        id: 1,
        medicineId: "TH001",
        name: "Amoxicillin 500mg",
        strength: "500mg",
        category: "Kháng sinh",
        price: 10000,
        unit: "viên",
        description: "Kháng sinh phổ rộng điều trị nhiễm khuẩn"
      },
      {
        id: 2,
        medicineId: "TH002", 
        name: "Paracetamol 500mg",
        strength: "500mg",
        category: "Giảm đau, hạ sốt",
        price: 5000,
        unit: "viên",
        description: "Thuốc giảm đau, hạ sốt"
      },
      {
        id: 3,
        medicineId: "TH003",
        name: "Omeprazole 20mg", 
        strength: "20mg",
        category: "Tiêu hóa",
        price: 15000,
        unit: "viên",
        description: "Ức chế bơm proton điều trị loét dạ dày"
      }
    ];
    
    console.log('📋 Sử dụng mock medicines');
    setMedicines(mockMedicines);
  };

  const filteredMedicines = medicines.filter(medicine =>
    (medicine.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.medicineId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMedicine = () => {
    if (!currentMedicine.medicineId || !currentMedicine.quantity || !currentMedicine.dosage) {
      alert('Vui lòng điền đầy đủ thông tin thuốc');
      return;
    }

    const selectedMedicine = medicines.find(m => m.id === parseInt(currentMedicine.medicineId));
    if (!selectedMedicine) {
      alert('Thuốc không hợp lệ');
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

  const handleRemoveMedicine = (index) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.medicines.reduce((total, med) => total + (med.price || 0), 0);
  };

  const handleSavePrescription = async () => {
    if (!formData.patientId || !formData.diagnosis || formData.medicines.length === 0) {
      alert('Vui lòng điền đầy đủ thông tin đơn thuốc');
      return;
    }

    try {
      const prescriptionData = {
        patientId: formData.patientId,
        diagnosis: formData.diagnosis,
        totalAmount: calculateTotal(),
        prescriptionItems: formData.medicines.map(med => ({
          medicineId: parseInt(med.medicineId),
          quantity: med.quantity,
          dosage: med.dosage,
          duration: med.duration,
          instructions: med.instructions,
          price: med.price
        }))
      };

      console.log('💾 Lưu đơn thuốc:', prescriptionData);
      
      const response = await prescriptionApi.createPrescription(prescriptionData);
      console.log('✅ Đã lưu đơn thuốc:', response);
      
      alert('Đã lưu đơn thuốc thành công!');
      
      // Reset form
      setFormData({
        patientId: '',
        diagnosis: '',
        medicines: []
      });
      
    } catch (error) {
      console.error('❌ Lỗi khi lưu đơn thuốc:', error);
      alert('Có lỗi khi lưu đơn thuốc. Vui lòng thử lại.');
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
                    <Pill className="me-2" size={32} />
                    Kê Đơn Thuốc
                  </h2>
                  <p className="text-muted mb-0">Tạo đơn thuốc cho bệnh nhân</p>
                </div>
                <Button 
                  variant="success" 
                  onClick={handleSavePrescription}
                  disabled={formData.medicines.length === 0}
                >
                  <Plus className="me-2" size={18} />
                  Lưu Đơn Thuốc
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={7}>
          {/* Prescription Form */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <User className="me-2" size={18} />
                Thông Tin Đơn Thuốc
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã bệnh nhân *</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Nhập mã bệnh nhân"
                      value={formData.patientId}
                      onChange={(e) => setFormData(prev => ({...prev, patientId: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Chẩn đoán *</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Chẩn đoán bệnh"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData(prev => ({...prev, diagnosis: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Add Medicine */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Thêm thuốc vào đơn</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên thuốc *</Form.Label>
                    <Form.Select
                      value={currentMedicine.medicineId}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, medicineId: e.target.value}))}
                    >
                      <option value="">Chọn thuốc</option>
                      {filteredMedicines.map(med => (
                        <option key={med.id} value={med.id}>
                          {med.name} {med.strength ? `- ${med.strength}` : ''} - {(med.price || 0).toLocaleString('vi-VN')}₫
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng *</Form.Label>
                    <Form.Control 
                      type="number" 
                      placeholder="Số lượng" 
                      min="1"
                      value={currentMedicine.quantity}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Liều dùng *</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="VD: 2 viên x 3 lần/ngày"
                      value={currentMedicine.dosage}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, dosage: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hướng dẫn sử dụng</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="VD: Uống sau ăn"
                      value={currentMedicine.instructions}
                      onChange={(e) => setCurrentMedicine(prev => ({...prev, instructions: e.target.value}))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button 
                variant="primary" 
                onClick={handleAddMedicine}
                disabled={!currentMedicine.medicineId || !currentMedicine.quantity || !currentMedicine.dosage}
              >
                <Plus size={16} className="me-2" />
                Thêm vào đơn
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          {/* Medicine Search */}
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <h6 className="mb-0">Tìm kiếm thuốc</h6>
            </Card.Header>
            <Card.Body>
              <div className="position-relative mb-3">
                <Search className="position-absolute" size={18} style={{left: "12px", top: "12px", color: "#6c757d"}} />
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên thuốc, mã thuốc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{paddingLeft: "45px"}}
                />
              </div>

              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div style={{maxHeight: "300px", overflowY: "auto"}}>
                  {filteredMedicines.map(medicine => (
                    <div key={medicine.id} className="border rounded p-2 mb-2 cursor-pointer" 
                         onClick={() => setCurrentMedicine(prev => ({...prev, medicineId: medicine.id.toString()}))}>
                      <div className="d-flex justify-content-between">
                        <div>
                          <strong>{medicine.name}</strong>
                          <br />
                          <small className="text-muted">
                            {medicine.medicineId} • {medicine.category} • {medicine.strength}
                          </small>
                        </div>
                        <div className="text-end">
                          <strong className="text-success">
                            {(medicine.price || 0).toLocaleString('vi-VN')} ₫
                          </strong>
                          <br />
                          <small className="text-muted">/{medicine.unit}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Current Prescription */}
          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">
                <Calendar className="me-2" size={18} />
                Đơn thuốc hiện tại ({formData.medicines.length} thuốc)
              </h6>
            </Card.Header>
            <Card.Body>
              {formData.medicines.length === 0 ? (
                <Alert variant="info" className="text-center mb-0">
                  <Pill size={32} className="mb-2 text-muted" />
                  <p className="mb-0">Chưa có thuốc nào trong đơn</p>
                </Alert>
              ) : (
                <>
                  <div style={{maxHeight: "400px", overflowY: "auto"}}>
                    {formData.medicines.map((medicine, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <strong>{medicine.medicineName}</strong>
                            <br />
                            <small>Liều: {medicine.dosage}</small>
                            <br />
                            <small>SL: {medicine.quantity} {medicine.unit}</small>
                            {medicine.duration && (
                              <>
                                <br />
                                <small>Thời gian: {medicine.duration}</small>
                              </>
                            )}
                          </div>
                          <div className="text-end">
                            <strong className="text-success">
                              {(medicine.price || 0).toLocaleString('vi-VN')} ₫
                            </strong>
                            <br />
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleRemoveMedicine(index)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Tổng cộng:</strong>
                    <h5 className="text-success mb-0">
                      {calculateTotal().toLocaleString('vi-VN')} ₫
                    </h5>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrescriptionForm;