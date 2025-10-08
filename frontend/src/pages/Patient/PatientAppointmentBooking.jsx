import React, { useState, useEffect } from 'react';
import doctorApi from '../../api/doctorApi';
import doctorScheduleApi from '../../api/doctorScheduleApi';
import appointmentApi from '../../api/appointmentApi';

const PatientAppointmentBooking = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getAllDoctors();
      setDoctors(response.data);
    } catch (err) {
      setError('Không thể tải danh sách bác sĩ: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSchedules = async (doctorId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorScheduleApi.getSchedulesByDoctor(doctorId);
      // Lọc chỉ lấy những lịch trình Available và từ hôm nay trở đi
      const today = new Date().toISOString().split('T')[0];
      const available = response.data.filter(schedule => 
        schedule.status === 'Available' && schedule.workDate >= today
      );
      setAvailableSchedules(available);
    } catch (err) {
      setError('Không thể tải lịch trình: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = parseInt(e.target.value);
    const doctor = doctors.find(d => d.doctorId === doctorId);
    setSelectedDoctor(doctor);
    setSelectedSchedule(null);
    
    if (doctorId) {
      loadAvailableSchedules(doctorId);
    } else {
      setAvailableSchedules([]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSchedule) {
      setError('Vui lòng chọn lịch trình');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Mock patient data - trong thực tế sẽ lấy từ authentication
      const appointmentData = {
        patientId: 1, // Mock patient ID
        doctorId: selectedDoctor.doctorId,
        scheduleId: selectedSchedule.scheduleId,
        appointmentDate: selectedSchedule.workDate,
        appointmentTime: selectedSchedule.startTime,
        reason: 'Khám bệnh định kỳ',
        status: 'Scheduled'
      };

      // await appointmentApi.createAppointment(appointmentData);
      console.log('Booking appointment:', appointmentData);
      
      setSuccess('Đặt lịch hẹn thành công!');
      setSelectedSchedule(null);
      setAvailableSchedules([]);
    } catch (err) {
      setError('Không thể đặt lịch hẹn: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Đặt lịch hẹn</h1>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Chọn bác sĩ và lịch trình</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              {/* Step 1: Chọn bác sĩ */}
              <div className="mb-4">
                <label htmlFor="doctorSelect" className="form-label">
                  <strong>Bước 1:</strong> Chọn bác sĩ
                </label>
                <select
                  id="doctorSelect"
                  className="form-select"
                  value={selectedDoctor?.doctorId || ''}
                  onChange={handleDoctorChange}
                  disabled={loading}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.doctorId} value={doctor.doctorId}>
                      {doctor.fullName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Chọn lịch trình */}
              {selectedDoctor && (
                <div className="mb-4">
                  <label className="form-label">
                    <strong>Bước 2:</strong> Chọn lịch trình có sẵn
                  </label>
                  
                  {availableSchedules.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle"></i> Không có lịch trình nào có sẵn cho bác sĩ này
                    </div>
                  ) : (
                    <div className="row">
                      {availableSchedules.map((schedule) => (
                        <div key={schedule.scheduleId} className="col-md-6 mb-3">
                          <div 
                            className={`card schedule-card ${selectedSchedule?.scheduleId === schedule.scheduleId ? 'border-primary' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedSchedule(schedule)}
                          >
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="card-title">
                                    {formatDate(schedule.workDate)}
                                  </h6>
                                  <p className="card-text">
                                    <i className="bi bi-clock"></i> {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  </p>
                                  <span className="badge bg-success">Có sẵn</span>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="schedule"
                                    checked={selectedSchedule?.scheduleId === schedule.scheduleId}
                                    onChange={() => setSelectedSchedule(schedule)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Xác nhận đặt lịch */}
              {selectedSchedule && (
                <div className="mb-4">
                  <div className="card border-primary">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Xác nhận đặt lịch hẹn</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Bác sĩ:</strong> {selectedDoctor.fullName}</p>
                          <p><strong>Chuyên khoa:</strong> {selectedDoctor.specialization}</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Ngày:</strong> {formatDate(selectedSchedule.workDate)}</p>
                          <p><strong>Giờ:</strong> {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}</p>
                        </div>
                      </div>
                      
                      <div className="d-grid mt-3">
                        <button
                          className="btn btn-success btn-lg"
                          onClick={handleBookAppointment}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-calendar-check"></i> Xác nhận đặt lịch
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar với thông tin hướng dẫn */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Hướng dẫn đặt lịch</h6>
            </div>
            <div className="card-body">
              <div className="step-guide">
                <div className="step-item mb-3">
                  <div className="d-flex align-items-center">
                    <div className="step-number me-3">1</div>
                    <div>
                      <strong>Chọn bác sĩ</strong>
                      <p className="text-muted mb-0">Chọn bác sĩ và chuyên khoa phù hợp</p>
                    </div>
                  </div>
                </div>
                
                <div className="step-item mb-3">
                  <div className="d-flex align-items-center">
                    <div className="step-number me-3">2</div>
                    <div>
                      <strong>Chọn lịch trình</strong>
                      <p className="text-muted mb-0">Chọn ngày và giờ khám phù hợp</p>
                    </div>
                  </div>
                </div>
                
                <div className="step-item">
                  <div className="d-flex align-items-center">
                    <div className="step-number me-3">3</div>
                    <div>
                      <strong>Xác nhận</strong>
                      <p className="text-muted mb-0">Xác nhận thông tin và hoàn tất</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Lưu ý</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Vui lòng đến đúng giờ hẹn
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Mang theo CMND/CCCD
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Có thể hủy lịch trước 2 giờ
                </li>
                <li>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Liên hệ hotline nếu có thắc mắc
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .schedule-card {
          transition: all 0.2s ease-in-out;
        }
        
        .schedule-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .step-number {
          width: 30px;
          height: 30px;
          background-color: #007bff;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default PatientAppointmentBooking;