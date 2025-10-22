import React, { useState, useEffect } from 'react';
import { Table, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import { Calendar, Clock, User, MapPin, Eye } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import patientApi from '../../api/patientApi';

const PatientAppointmentHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState(null);

  // Lấy patientId từ localStorage
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

  // Lấy danh sách lịch hẹn
  useEffect(() => {
    if (patientId) {
      loadAppointments();
    }
  }, [patientId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appointmentApi.getAppointmentsByPatient(patientId);
      const appointmentsData = Array.isArray(response.data) ? response.data : [];
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { variant: "primary", text: "Đã đặt" },
      CONFIRMED: { variant: "success", text: "Đã xác nhận" },
      COMPLETED: { variant: "info", text: "Hoàn thành" },
      CANCELLED: { variant: "danger", text: "Đã hủy" },
      NO_SHOW: { variant: "warning", text: "Không đến" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '--';
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Lịch sử lịch hẹn</h1>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <Calendar className="me-2" size={20} />
                Danh sách lịch hẹn của tôi
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Đang tải danh sách lịch hẹn...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="text-center">
                  <Calendar size={48} className="mb-3 text-danger" />
                  <h5>Lỗi tải dữ liệu</h5>
                  <p>{error}</p>
                  <button 
                    className="btn btn-outline-danger btn-sm" 
                    onClick={loadAppointments}
                  >
                    Thử lại
                  </button>
                </Alert>
              ) : appointments.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <Calendar size={48} className="mb-3 text-muted" />
                  <h5>Chưa có lịch hẹn nào</h5>
                  <p>Bạn chưa có lịch hẹn nào trong hệ thống.</p>
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead className="table-light">
                    <tr>
                      <th>Mã lịch hẹn</th>
                      <th>Bác sĩ</th>
                      <th>Ngày giờ</th>
                      <th>Địa điểm</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="fw-bold text-primary">
                          #{appointment.id}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <User size={16} className="me-2 text-muted" />
                            <div>
                              <strong>{appointment.doctor?.user?.fullName || appointment.doctorName || 'Chưa cập nhật'}</strong>
                              <br />
                              <small className="text-muted">
                                {appointment.doctor?.specialty || appointment.specialty || 'Chuyên khoa'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Clock size={16} className="me-2 text-muted" />
                            <div>
                              <div>{formatDateTime(appointment.appointmentDate)}</div>
                              <small className="text-muted">
                                {appointment.appointmentTime || '--'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <MapPin size={16} className="me-2 text-muted" />
                            <span>{appointment.location || appointment.clinic?.name || 'Phòng khám'}</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>
                          <span className="text-muted">
                            {appointment.notes || appointment.reason || '--'}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentHistory;
