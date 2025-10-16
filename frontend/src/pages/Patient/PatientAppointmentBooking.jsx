import React, { useState, useEffect } from 'react';
import doctorApi from '../../api/doctorApi';
import doctorScheduleApi from '../../api/doctorScheduleApi';
import appointmentApi from '../../api/appointmentApi';
import DoctorCarousel from '../../components/DoctorCarousel';

const PatientAppointmentBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('doctor');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getAllDoctors();
      console.log('Doctors data from API:', response.data);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchTerm.toLowerCase();
    const doctorName = doctor.name || (doctor.user?.firstName + ' ' + doctor.user?.lastName) || '';
    const specialty = doctor.specialty || '';
    const department = doctor.department?.departmentName || '';
    
    const matchesSearch = doctorName.toLowerCase().includes(searchLower) ||
                         specialty.toLowerCase().includes(searchLower) ||
                         department.toLowerCase().includes(searchLower);
    
    const matchesSpecialty = !selectedSpecialty || 
                            specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
                            department.toLowerCase().includes(selectedSpecialty.toLowerCase());
    
    return matchesSearch && matchesSpecialty;
  });


  return (
    <div className="patient-booking-page">
      {/* Hero Section */}
      <div className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
        <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">Đặt khám bác sĩ</h1>
              <p className="lead mb-4">
                Đặt khám với hơn 1000 bác sĩ đã kết nối chính thức với YouMed để có số thứ tự và khung giờ khám trước
              </p>
              
              {/* Search Bar */}
              <div className="search-container position-relative">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Triệu chứng, bác sĩ, bệnh viện..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderRadius: '50px',
                    padding: '15px 50px 15px 20px',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                />
                <button 
                  className="btn btn-primary position-absolute end-0 top-50 translate-middle-y me-3"
                  style={{
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    border: 'none'
                  }}
                >
                  <i className="bi bi-search"></i>
                </button>
              </div>
                    </div>
            <div className="col-lg-4 d-none d-lg-block">
              <div className="hero-image text-center">
                <div 
                  className="family-image"
                  style={{
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <i className="bi bi-people-fill" style={{ fontSize: '120px', color: '#1976d2' }}></i>
                                </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

      {/* Main Content */}
      <div className="main-content bg-white py-5">
        <div className="container">         
          {/* Doctors List */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Đang tải danh sách bác sĩ...</p>
            </div>
          ) : (
            <DoctorCarousel 
              doctors={filteredDoctors}
              title="Đặt khám bác sĩ"
              showViewAll={true}
            />
          )}
        </div>
      </div>

      {/* Medical Specialties Section */}
      <div className="specialties-section bg-white py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Đa dạng chuyên khoa khám</h2>
            <p className="text-muted lead">
              Đặt khám dễ dàng và tiện lợi hơn với đầy đủ các chuyên khoa
            </p>
          </div>

          <div className="row g-3">
            {/* Row 1 */}
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div 
                className="specialty-card text-center p-3"
                onClick={() => setSelectedSpecialty('Nhi khoa')}
                style={{ cursor: 'pointer' }}
              >
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-heart-pulse" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Nhi khoa</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-person-heart" style={{ fontSize: '24px', color: '#e91e63' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Sản phụ khoa</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-droplet" style={{ fontSize: '24px', color: '#ff9800' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Da liễu</h6>
              </div>
                    </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div 
                className="specialty-card text-center p-3"
                onClick={() => setSelectedSpecialty('Tiêu hoá')}
                style={{ cursor: 'pointer' }}
              >
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-stomach" style={{ fontSize: '24px', color: '#2196f3' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Tiêu hoá</h6>
              </div>
            </div>
                
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-activity" style={{ fontSize: '24px', color: '#9c27b0' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Cơ xương khớp</h6>
              </div>
                    </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-shield-check" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Dị ứng - miễn dịch</h6>
                  </div>
                </div>
                
            {/* Row 2 */}
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-mask" style={{ fontSize: '24px', color: '#009688' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Gây mê hồi sức</h6>
              </div>
                    </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="specialty-icon mb-3">
                  <div className="icon-wrapper" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <i className="bi bi-ear" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                  </div>
                </div>
                <h6 className="fw-semibold">Tai - mũi - họng</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-bullseye" style={{ fontSize: '24px', color: '#f44336' }}></i>
                </div>
                <h6 className="fw-semibold">Ung bướu</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-heart-pulse" style={{ fontSize: '24px', color: '#e91e63' }}></i>
                </div>
                <h6 className="fw-semibold">Tim mạch</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-person-walking" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                </div>
                <h6 className="fw-semibold">Lão khoa</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-bandage" style={{ fontSize: '24px', color: '#ff9800' }}></i>
                </div>
                <h6 className="fw-semibold">Chấn thương chỉnh hình</h6>
              </div>
            </div>

            {/* Row 3 */}
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-hospital" style={{ fontSize: '24px', color: '#2196f3' }}></i>
                </div>
                <h6 className="fw-semibold">Hồi sức cấp cứu</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-scissors" style={{ fontSize: '24px', color: '#9c27b0' }}></i>
                </div>
                <h6 className="fw-semibold">Ngoại tổng quát</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-clipboard-check" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                </div>
                <h6 className="fw-semibold">Y học dự phòng</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-tooth" style={{ fontSize: '24px', color: '#009688' }}></i>
                </div>
                <h6 className="fw-semibold">Răng - Hàm - Mặt</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-virus" style={{ fontSize: '24px', color: '#f44336' }}></i>
                </div>
                <h6 className="fw-semibold">Truyền nhiễm</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-droplet-half" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                </div>
                <h6 className="fw-semibold">Nội thận</h6>
              </div>
            </div>

            {/* Row 4 */}
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-droplet" style={{ fontSize: '24px', color: '#2196f3' }}></i>
                </div>
                <h6 className="fw-semibold">Nội tiết</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-brain" style={{ fontSize: '24px', color: '#9c27b0' }}></i>
                </div>
                <h6 className="fw-semibold">Tâm thần</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-lungs" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                </div>
                <h6 className="fw-semibold">Hô hấp</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-microscope" style={{ fontSize: '24px', color: '#009688' }}></i>
                </div>
                <h6 className="fw-semibold">Xét nghiệm</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-search" style={{ fontSize: '24px', color: '#f44336' }}></i>
                </div>
                <h6 className="fw-semibold">Huyết học</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-chat-dots" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                </div>
                <h6 className="fw-semibold">Tâm lý</h6>
              </div>
            </div>

            {/* Row 5 */}
            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-exclamation-triangle" style={{ fontSize: '24px', color: '#2196f3' }}></i>
                </div>
                <h6 className="fw-semibold">Nội thần kinh</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-chat-square-text" style={{ fontSize: '24px', color: '#9c27b0' }}></i>
                </div>
                <h6 className="fw-semibold">Ngôn ngữ trị liệu</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-person-walking" style={{ fontSize: '24px', color: '#4caf50' }}></i>
                </div>
                <h6 className="fw-semibold">Phục hồi chức năng</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-heart" style={{ fontSize: '24px', color: '#009688' }}></i>
                </div>
                <h6 className="fw-semibold">Vô sinh hiếm muộn</h6>
            </div>
          </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-flower1" style={{ fontSize: '24px', color: '#ffc107' }}></i>
                </div>
                <h6 className="fw-semibold">Y học cổ truyền</h6>
              </div>
            </div>

            <div className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="specialty-card text-center p-3">
                <div className="icon-wrapper" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <i className="bi bi-lungs-fill" style={{ fontSize: '24px', color: '#f44336' }}></i>
                </div>
                <h6 className="fw-semibold">Lao - bệnh phổi</h6>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
          position: relative;
          overflow: hidden;
        }
        
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .hero-section .container {
          position: relative;
          z-index: 2;
        }
        
        .search-container {
          max-width: 500px;
        }
        
        .nav-tabs-container {
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .doctor-card {
          transition: all 0.3s ease;
          border-radius: 12px;
        }
        
        .doctor-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        .doctor-avatar img {
          border: 3px solid #e3f2fd;
        }
        
        .specialty-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          cursor: pointer;
        }
        
        .specialty-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .specialty-card:hover .icon-wrapper {
          transform: scale(1.1);
        }
        
        .icon-wrapper {
          transition: all 0.3s ease;
        }
        
      `}</style>
    </div>
  );
};

export default PatientAppointmentBooking;