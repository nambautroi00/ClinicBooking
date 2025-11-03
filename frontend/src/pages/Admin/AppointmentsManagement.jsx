import React, { useEffect, useMemo, useState } from "react";
import doctorApi from "../../api/doctorApi";
import appointmentApi from "../../api/appointmentApi";

const AppointmentsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const getStatusBadge = (status) => {
    const statusMap = {
      'SCHEDULED': { class: 'bg-info text-white', text: 'Đã đặt', color: '#17a2b8' },
      'CONFIRMED': { class: 'bg-primary text-white', text: 'Đã xác nhận', color: '#0d6efd' },
      'COMPLETED': { class: 'bg-success text-white', text: 'Hoàn thành', color: '#28a745' },
      'CANCELLED': { class: 'bg-danger text-white', text: 'Đã hủy', color: '#dc3545' },
      'Schedule': { class: 'bg-secondary text-white', text: 'Lịch trình', color: '#6c757d' },
    };
    const config = statusMap[status] || { class: 'bg-secondary text-white', text: status || 'Không xác định', color: '#6c757d' };
    return config;
  };

  useEffect(() => {
    doctorApi.getAllDoctors().then(res => setDoctors(Array.isArray(res.data) ? res.data : (res.data?.content ?? []))).catch(() => {});
  }, []);

  const fetchAppointments = async () => {
    if (!doctorId) { setAppointments([]); return; }
    setLoading(true);
    setError("");
    try {
      const data = await appointmentApi.getAppointmentsByDoctor(Number(doctorId)).then(r => r.data ?? r);
      const appointmentsList = Array.isArray(data) ? data : [];
      setAppointments(appointmentsList.sort((a, b) => a.id - b.id));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể tải lịch hẹn");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, currentMonth]);

  const daysInMonth = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const startWeekday = (start.getDay() + 6) % 7;
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    appointments.forEach(a => {
      const dateStr = a.startTime ? new Date(a.startTime).toDateString() : null;
      if (!dateStr) return;
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(a);
    });
    return map;
  }, [appointments]);

  const changeMonth = (delta) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const title = `${currentMonth.toLocaleString('vi-VN', { month: 'long' })} ${currentMonth.getFullYear()}`;
  const today = new Date();
  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="container-fluid py-4">
      <style>{`
        .appointment-card {
          background: white;
          border-radius: 6px;
          padding: 6px 8px;
          margin-bottom: 4px;
          border-left: 3px solid;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .appointment-card:hover {
          transform: translateX(2px);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .calendar-day {
          min-height: 100px;
          padding: 6px !important;
          border: 1px solid #e9ecef !important;
          vertical-align: top;
        }
        .calendar-day:hover:not(.calendar-today):not(.calendar-other-month) {
          background-color: #f8f9fa !important;
        }
        .calendar-today {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white;
        }
        .calendar-other-month {
          background: #f8f9fa;
          opacity: 0.5;
        }
        .calendar-header th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white;
          font-weight: 600;
          padding: 12px 8px;
          border: none !important;
        }
        .day-number {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .appointment-count-badge {
          background: #667eea;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 600;
        }
        .calendar-today .appointment-count-badge {
          background: white;
          color: #667eea;
        }
      `}</style>

      <div className="row">
        <div className="col-12">
          <div className="mb-4">
            <h2 className="mb-0 fw-bold">
              <i className="bi bi-calendar-check-fill text-primary me-2"></i>
              Lịch hẹn theo bác sĩ
            </h2>
            <p className="text-muted mb-0 small mt-1">Xem và quản lý lịch hẹn theo dạng lịch</p>
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body py-3">
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small mb-1" htmlFor="doctor">
                    Chọn bác sĩ
                  </label>
                  <select 
                    id="doctor" 
                    className="form-select form-select-sm" 
                    value={doctorId} 
                    onChange={(e) => setDoctorId(e.target.value)}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(d => (
                      <option key={d.doctorId || d.id} value={d.doctorId || d.id}>
                        {d.user?.firstName ? `${d.user.firstName} ${d.user.lastName || ''}` : (d.fullName || d.name || `Bác sĩ #${d.doctorId || d.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8 d-flex justify-content-end align-items-end gap-2">
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => changeMonth(-1)}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <div className="fw-bold px-4" style={{ minWidth: '180px', textAlign: 'center' }}>
                    {title}
                  </div>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => changeMonth(1)}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={fetchAppointments} 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="bi bi-arrow-clockwise"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="text-muted mb-0">Đang tải lịch hẹn...</p>
                </div>
              ) : !doctorId ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '4rem' }}></i>
                  <p className="text-muted mt-3 mb-0">Vui lòng chọn bác sĩ để xem lịch hẹn</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr className="calendar-header">
                        <th>Thứ 2</th>
                        <th>Thứ 3</th>
                        <th>Thứ 4</th>
                        <th>Thứ 5</th>
                        <th>Thứ 6</th>
                        <th>Thứ 7</th>
                        <th>Chủ nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth.length / 7 }).map((_, weekIdx) => (
                        <tr key={weekIdx}>
                          {daysInMonth.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                            const key = date ? date.toDateString() : `empty-${weekIdx}-${idx}`;
                            const events = date ? (eventsByDay.get(date.toDateString()) || []) : [];
                            const isTodayDate = isToday(date);
                            const isPastMonth = date && date.getMonth() !== currentMonth.getMonth();
                            
                            return (
                              <td 
                                key={key} 
                                className={`calendar-day ${isTodayDate ? 'calendar-today' : ''} ${isPastMonth ? 'calendar-other-month' : ''}`}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className={`day-number ${isTodayDate ? 'text-white' : ''}`}>
                                    {date ? date.getDate() : ""}
                                  </span>
                                  {events.length > 0 && (
                                    <span className="appointment-count-badge">
                                      {events.length}
                                    </span>
                                  )}
                                </div>
                                <div className="d-grid gap-1">
                                  {events.slice(0, 2).map(ev => {
                                    const statusConfig = getStatusBadge(ev.status);
                                    return (
                                      <div
                                        key={ev.appointmentId} 
                                        className="appointment-card"
                                        onClick={() => setSelected(ev)}
                                        style={{ borderLeftColor: statusConfig.color }}
                                      >
                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                          <span className="fw-semibold">#{ev.appointmentId}</span>
                                          <span className={`badge ${statusConfig.class}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                                            {statusConfig.text}
                                          </span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                          <i className="bi bi-clock me-1"></i>
                                          {ev.startTime ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          {ev.endTime ? ` - ${new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {events.length > 2 && (
                                    <button 
                                      className="btn btn-sm btn-link text-primary p-0 mt-1"
                                      style={{ fontSize: '0.7rem' }}
                                      onClick={() => {
                                        const firstExtraEvent = events[2];
                                        setSelected(firstExtraEvent);
                                      }}
                                    >
                                      +{events.length - 2} lịch hẹn khác
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Detail modal */}
          {selected && (
            <div 
              className="modal d-block" 
              tabIndex="-1" 
              role="dialog" 
              onClick={() => setSelected(null)}
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg">
                  <div className="modal-header border-0 pb-2" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <h5 className="modal-title text-white">
                      <i className="bi bi-calendar-event-fill me-2"></i>
                      Chi tiết lịch hẹn #{selected.appointmentId}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelected(null)}></button>
                  </div>
                  <div className="modal-body pt-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                            <i className="bi bi-person-fill text-primary fs-5"></i>
                          </div>
                          <div>
                            <small className="text-muted d-block">Bệnh nhân</small>
                            <strong className="d-block">{selected.patientName || 'Chưa có tên'}</strong>
                            {selected.patientId && (
                              <small className="text-muted">ID: {selected.patientId}</small>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                            <i className="bi bi-person-badge-fill text-info fs-5"></i>
                          </div>
                          <div>
                            <small className="text-muted d-block">Bác sĩ</small>
                            <strong className="d-block">{selected.doctorName || 'Chưa có tên'}</strong>
                            {selected.doctorId && (
                              <small className="text-muted">ID: {selected.doctorId}</small>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                            <i className="bi bi-clock-fill text-success fs-5"></i>
                          </div>
                          <div>
                            <small className="text-muted d-block">Thời gian</small>
                            <strong className="d-block">
                              {selected.startTime ? new Date(selected.startTime).toLocaleString('vi-VN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Chưa xác định'}
                            </strong>
                            {selected.endTime && (
                              <small className="text-muted">
                                Đến: {new Date(selected.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                            <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                          </div>
                          <div>
                            <small className="text-muted d-block">Trạng thái</small>
                            <span className={`badge ${getStatusBadge(selected.status).class} fs-6 px-3 py-2`}>
                              {getStatusBadge(selected.status).text}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selected.fee && (
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                              <i className="bi bi-cash-coin text-success fs-5"></i>
                            </div>
                            <div>
                              <small className="text-muted d-block">Phí khám</small>
                              <strong className="text-success fs-4">
                                {Number(selected.fee).toLocaleString('vi-VN')} đ
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}
                      {selected.notes && (
                        <div className="col-12 mt-2">
                          <div className="border-top pt-3">
                            <small className="text-muted d-block mb-2">
                              <i className="bi bi-sticky-fill me-1"></i>
                              Ghi chú
                            </small>
                            <p className="mb-0">{selected.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                      <i className="bi bi-x-circle me-1"></i>
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsManagement;