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
      // Sort appointments by ID
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
    // Fill starting offset (Mon=1..Sun=7 layout) assume Sun=0
    const startWeekday = (start.getDay() + 6) % 7; // Mon=0
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= end.getDate(); d++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }
    // Pad to complete weeks
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

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Breadcrumb removed as requested */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Lịch hẹn theo bác sĩ</h2>
              <p className="text-muted mb-0">Xem theo dạng lịch, click để xem chi tiết</p>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="doctor">Chọn bác sĩ</label>
                  <select id="doctor" className="form-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {doctors.map(d => (
                      <option key={d.doctorId || d.id} value={d.doctorId || d.id}>
                        {d.user?.firstName ? `${d.user.firstName} ${d.user.lastName || ''}` : (d.fullName || d.name || `Bác sĩ #${d.doctorId || d.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8 d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => changeMonth(-1)}><i className="bi bi-chevron-left"></i></button>
                  <div className="align-self-center fw-semibold">{title}</div>
                  <button className="btn btn-outline-secondary" onClick={() => changeMonth(1)}><i className="bi bi-chevron-right"></i></button>
                  <button className="btn btn-outline-primary" onClick={fetchAppointments} disabled={loading}>
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (<div className="alert alert-danger">{error}</div>)}

          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border" role="status"/></div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered mb-0">
                    <thead>
                      <tr className="table-light text-center">
                        <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth.length / 7 }).map((_, weekIdx) => (
                        <tr key={weekIdx}>
                          {daysInMonth.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                            const key = date ? date.toDateString() : `empty-${weekIdx}-${idx}`;
                            const events = date ? (eventsByDay.get(date.toDateString()) || []) : [];
                            return (
                              <td key={key} style={{ verticalAlign: 'top', minWidth: 160 }}>
                                <div className="d-flex justify-content-between">
                                  <span className="fw-semibold">{date ? date.getDate() : ""}</span>
                                </div>
                                <div className="mt-2 d-grid gap-1">
                                  {events.map(ev => (
                                    <button key={ev.appointmentId} className="btn btn-sm btn-outline-primary text-start" onClick={() => setSelected(ev)}>
                                      <div className="small">#{ev.appointmentId} • {ev.status}</div>
                                      <div className="small text-muted">
                                        {ev.startTime ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        {ev.endTime ? ` - ${new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                                      </div>
                                    </button>
                                  ))}
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
            <div className="modal d-block" tabIndex="-1" role="dialog" onClick={() => setSelected(null)}>
              <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Chi tiết lịch hẹn #{selected.appointmentId}</h5>
                    <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2"><strong>Bệnh nhân:</strong> {selected.patientName} (ID {selected.patientId})</div>
                    <div className="mb-2"><strong>Bác sĩ:</strong> {selected.doctorName} (ID {selected.doctorId})</div>
                    <div className="mb-2"><strong>Thời gian:</strong> {selected.startTime ? new Date(selected.startTime).toLocaleString() : ''} {selected.endTime ? `- ${new Date(selected.endTime).toLocaleString()}` : ''}</div>
                    <div className="mb-2"><strong>Trạng thái:</strong> {selected.status}</div>
                    {selected.notes && (<div className="mb-2"><strong>Ghi chú:</strong> {selected.notes}</div>)}
                    {selected.fee && (<div className="mb-2"><strong>Phí:</strong> {Number(selected.fee).toLocaleString('vi-VN')} đ</div>)}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
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


