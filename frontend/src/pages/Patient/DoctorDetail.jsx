import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorApi from '../../api/doctorApi';
import doctorScheduleApi from '../../api/doctorScheduleApi';
import appointmentApi from '../../api/appointmentApi';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuickBooking, setShowQuickBooking] = useState(true);

  useEffect(() => {
    loadDoctor();
    loadAvailableDates();
  }, [id]);

  const loadDoctor = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getDoctorById(id);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      // Mock data for available dates
      const dates = [
        { date: '2024-10-28', day: 'Th 2', display: '28-10', slots: 8 },
        { date: '2024-10-29', day: 'Th 3', display: '29-10', slots: 12 },
        { date: '2024-10-30', day: 'Th 4', display: '30-10', slots: 6 },
        { date: '2024-10-31', day: 'Th 5', display: '31-10', slots: 10 },
        { date: '2024-11-01', day: 'Th 6', display: '01-11', slots: 15 },
        { date: '2024-11-02', day: 'Th 7', display: '02-11', slots: 4 },
        { date: '2024-11-03', day: 'CN', display: '03-11', slots: 0 }
      ];
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading dates:', error);
    }
  };

  const loadTimeSlots = async (date) => {
    try {
      // Mock data for time slots
      const slots = [
        { time: '08:00-08:15', available: true },
        { time: '08:15-08:30', available: true },
        { time: '08:30-08:45', available: false },
        { time: '08:45-09:00', available: true },
        { time: '09:00-09:15', available: true },
        { time: '09:15-09:30', available: false },
        { time: '09:30-09:45', available: true },
        { time: '09:45-10:00', available: true },
        { time: '10:00-10:15', available: true },
        { time: '10:15-10:30', available: false },
        { time: '10:30-10:45', available: true },
        { time: '10:45-11:00', available: true },
        { time: '11:00-11:15', available: true },
        { time: '11:15-11:30', available: true },
        { time: '11:30-11:45', available: false },
        { time: '11:45-12:00', available: true }
      ];
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    loadTimeSlots(date);
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleBookAppointment = () => {
    if (selectedDate && selectedTimeSlot) {
      // Navigate to booking confirmation or process booking
      navigate(`/booking/confirm?doctorId=${id}&date=${selectedDate}&time=${selectedTimeSlot}`);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Đang tải thông tin bác sĩ...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-person-x" style={{ fontSize: '48px', color: '#ccc' }}></i>
        <p className="text-muted mt-3">Không tìm thấy thông tin bác sĩ</p>
      </div>
    );
  }

  return (
    <div className="doctor-detail-page">
      {/* Doctor Profile Header */}
      <div className="doctor-profile-header bg-white py-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center">
                {/* Doctor Avatar */}
                <div className="doctor-avatar me-4">
                  {(doctor.avatarUrl || doctor.user?.avatarUrl) ? (
                    <img
                      src={doctor.avatarUrl || doctor.user?.avatarUrl}
                      alt={doctor.name || doctor.user?.firstName + ' ' + doctor.user?.lastName}
                      className="rounded-circle"
                      style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        color: '#1976d2',
                        fontSize: '48px'
                      }}
                    >
                      <i className="bi bi-person-fill"></i>
                    </div>
                  )}
                </div>

                {/* Doctor Info */}
                <div className="doctor-info">
                  <h1 className="fw-bold mb-2" style={{ fontSize: '28px' }}>
                    {doctor.name || doctor.user?.firstName + ' ' + doctor.user?.lastName || 'Bác sĩ'}
                  </h1>
                  
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    <span className="text-muted">Bác sĩ 31 năm kinh nghiệm</span>
                  </div>

                  <div className="mb-2">
                    <span className="badge bg-primary me-2">
                      {doctor.specialty || doctor.department?.departmentName || 'Chuyên khoa'}
                    </span>
                    <span className="badge bg-primary">
                      Ngoại tiết niệu
                    </span>
                  </div>

                  <div className="text-muted small">
                    <div><strong>Chức vụ:</strong> Phó Giám Đốc Bệnh Viện Chợ Rẫy</div>
                    <div><strong>Nơi công tác:</strong> Bệnh viện Chợ Rẫy</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4 text-end">
              <button 
                className={`btn ${isFavorite ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={toggleFavorite}
              >
                <i className="bi bi-heart-fill me-2"></i>
                Yêu thích
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Section */}
      <div className="notice-section bg-warning bg-opacity-10 py-3">
        <div className="container">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill text-warning me-3 mt-1"></i>
            <div>
              <strong>Lưu ý:</strong> PK BS Lâm Việt Trung nghỉ ngày 20/10 đến 26/10; 27/10 làm lại bình thường.
              <br />
              <small className="text-muted">
                * Nếu bệnh nhân bận việc không đến khám được vui lòng hủy lịch khám đã đặt và đặt lại ngày khác. Xin cảm ơn!
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Booking Section */}
      <div className="quick-booking-section bg-white py-4">
        <div className="container">
          <div 
            className="booking-header d-flex justify-content-between align-items-center mb-4"
            onClick={() => setShowQuickBooking(!showQuickBooking)}
            style={{ cursor: 'pointer' }}
          >
            <h3 className="fw-bold mb-0">Đặt khám nhanh</h3>
            <i className={`bi bi-chevron-${showQuickBooking ? 'up' : 'down'}`}></i>
          </div>

          {showQuickBooking && (
            <>
              {/* Date Selection */}
              <div className="date-selection mb-4">
                <h5 className="mb-3">Chọn ngày</h5>
                <div className="date-scroll-container">
                  <div className="date-scroll-wrapper">
                    {availableDates.map((date, index) => (
                      <div
                        key={index}
                        className={`date-card ${selectedDate === date.date ? 'selected' : ''}`}
                        onClick={() => handleDateSelect(date.date)}
                      >
                        <div className="date-day">{date.day}</div>
                        <div className="date-display">{date.display}</div>
                        <div className="date-slots">{date.slots} khung giờ</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="time-slot-selection">
                  <h5 className="mb-3">
                    <i className="bi bi-sun me-2"></i>
                    Buổi chiều
                  </h5>
                  <div className="time-slots-grid">
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        className={`time-slot-btn ${selectedTimeSlot === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                        onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Introduction Section */}
      <div className="introduction-section bg-white py-4">
        <div className="container">
          <h3 className="fw-bold mb-3">Giới thiệu</h3>
          <p className="text-muted">
            Phó Giáo sư, Tiến sĩ, Bác sĩ Lâm Việt Trung đã có hơn 20 năm kinh nghiệm trong lĩnh vực Tiêu hóa.
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed-bottom-bar bg-white border-top py-3">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="support-info">
                <span className="text-muted">Hỗ trợ đặt khám:</span>
                <a href="tel:1900-2805" className="text-primary ms-2 fw-bold">1900-2805</a>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <button 
                className="btn btn-primary btn-lg px-5"
                onClick={handleBookAppointment}
                disabled={!selectedDate || !selectedTimeSlot}
              >
                ĐẶT KHÁM NGAY
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .doctor-detail-page {
          padding-bottom: 100px; /* Space for fixed bottom bar */
        }
        
        .doctor-profile-header {
          border-bottom: 1px solid #e0e0e0;
        }
        
        .notice-section {
          border-bottom: 1px solid #e0e0e0;
        }
        
        .date-scroll-container {
          overflow-x: auto;
          padding: 10px 0;
        }
        
        .date-scroll-wrapper {
          display: flex;
          gap: 15px;
          min-width: max-content;
        }
        
        .date-card {
          min-width: 120px;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }
        
        .date-card:hover {
          border-color: #2196F3;
          transform: translateY(-2px);
        }
        
        .date-card.selected {
          border-color: #2196F3;
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .date-card.selected::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: #2196F3;
        }
        
        .date-day {
          font-weight: bold;
          font-size: 14px;
        }
        
        .date-display {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
        }
        
        .date-slots {
          font-size: 12px;
          color: #666;
        }
        
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
        }
        
        .time-slot-btn {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          color: #333;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        
        .time-slot-btn:hover:not(.disabled) {
          border-color: #2196F3;
          background: #e3f2fd;
        }
        
        .time-slot-btn.selected {
          border-color: #2196F3;
          background: #2196F3;
          color: white;
        }
        
        .time-slot-btn.disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }
        
        .fixed-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        }
        
        .support-info {
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .doctor-profile-header .row {
            text-align: center;
          }
          
          .doctor-profile-header .col-md-4 {
            margin-top: 20px;
          }
          
          .time-slots-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
          
          .fixed-bottom-bar .row {
            text-align: center;
          }
          
          .fixed-bottom-bar .col-md-6:first-child {
            margin-bottom: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default DoctorDetail;
