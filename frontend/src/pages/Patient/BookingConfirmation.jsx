import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    doctorId: searchParams.get('doctorId'),
    date: searchParams.get('date'),
    time: searchParams.get('time')
  });

  useEffect(() => {
    loadDoctor();
  }, [bookingData.doctorId]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getDoctorById(bookingData.doctorId);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      // Process booking logic here
      console.log('Booking confirmed:', bookingData);
      navigate('/patient/appointments');
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Đang xử lý đặt lịch...</p>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  Xác nhận đặt lịch khám
                </h3>
              </div>
              
              <div className="card-body p-4">
                {/* Doctor Info */}
                <div className="doctor-summary mb-4">
                  <div className="d-flex align-items-center">
                    <div className="doctor-avatar me-3">
                      {(doctor?.avatarUrl || doctor?.user?.avatarUrl) ? (
                        <img
                          src={doctor.avatarUrl || doctor.user?.avatarUrl}
                          alt={doctor.name || doctor.user?.firstName + ' ' + doctor.user?.lastName}
                          className="rounded-circle"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                            color: '#1976d2',
                            fontSize: '32px'
                          }}
                        >
                          <i className="bi bi-person-fill"></i>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="fw-bold mb-1">
                        {doctor?.name || doctor?.user?.firstName + ' ' + doctor?.user?.lastName || 'Bác sĩ'}
                      </h4>
                      <p className="text-muted mb-0">
                        {doctor?.specialty || doctor?.department?.departmentName || 'Chuyên khoa'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="booking-details">
                  <h5 className="fw-bold mb-3">Chi tiết đặt lịch</h5>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="detail-item mb-3">
                        <label className="text-muted small">Ngày khám:</label>
                        <div className="fw-semibold">{bookingData.date}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-item mb-3">
                        <label className="text-muted small">Khung giờ:</label>
                        <div className="fw-semibold">{bookingData.time}</div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-item mb-3">
                    <label className="text-muted small">Bệnh viện:</label>
                    <div className="fw-semibold">{doctor?.hospital || 'Bệnh viện Chợ Rẫy'}</div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="terms-section mb-4">
                  <h6 className="fw-bold mb-3">Điều khoản và điều kiện</h6>
                  <div className="terms-content">
                    <ul className="list-unstyled small text-muted">
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Bệnh nhân cần có mặt trước giờ hẹn 15 phút
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Mang theo CMND/CCCD và thẻ BHYT (nếu có)
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Hủy lịch trước 24h nếu không thể đến khám
                      </li>
                      <li className="mb-2">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Thanh toán phí khám tại bệnh viện
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-3">
                  <button 
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => navigate(-1)}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                  </button>
                  <button 
                    className="btn btn-primary flex-fill"
                    onClick={handleConfirmBooking}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Xác nhận đặt lịch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
