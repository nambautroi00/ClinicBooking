import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import doctorApi from "../../api/doctorApi";
import appointmentApi from "../../api/appointmentApi";
import Cookies from "js-cookie";

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalSchedules: 0,
    todaySchedules: 0,
    availableSchedules: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  // Get doctorId from localStorage (memoized)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  // Fetch doctorId
  useEffect(() => {
    const fetchDoctorId = async () => {
      const userId = Cookies.get("userId") || currentUser?.id;
      if (userId) {
        try {
          const res = await doctorApi.getDoctorByUserId(userId);
          const data = res.data || res;
          setDoctorId(data.doctorId);
        } catch (err) {
          console.error("Error fetching doctorId:", err);
        }
      }
    };
    fetchDoctorId();
  }, [currentUser]);

  const loadDashboardData = useCallback(async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      
      // Load schedules and appointments in parallel
      const [schedulesRes, appointmentsRes] = await Promise.all([
        doctorScheduleApi.getSchedulesByDoctor(doctorId),
        appointmentApi.getAppointmentsByDoctor(doctorId),
      ]);

      const schedules = schedulesRes.data || [];
      const appointments = appointmentsRes.data || [];

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      // Filter today's schedules
      const todaySchedules = schedules.filter((s) => s.workDate === today);
      
      // Filter appointments
      const todayAppointments = appointments.filter(
        (apt) => apt.startTime?.split("T")[0] === today && apt.status !== "Cancelled"
      );

      // Filter and sort patient appointments (only appointments with patients, not empty slots)
      const upcomingAppointmentsList = appointments
        .filter((apt) => {
          // Chỉ lấy appointments có bệnh nhân đã đặt
          if (!apt.patientId || !apt.patientName) return false;
          if (!apt.startTime || apt.status === "Cancelled" || apt.status === "Completed") return false;
          const aptDate = new Date(apt.startTime);
          return aptDate > now;
        })
        .sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA - dateB;
        })
        .slice(0, 5);

      // Get unique patients
      const uniquePatients = new Set(
        appointments
          .filter((apt) => apt.patientId)
          .map((apt) => apt.patientId)
      );

      setStats({
        totalSchedules: schedules.length,
        todaySchedules: todaySchedules.length,
        availableSchedules: schedules.filter((s) => s.status === "Available").length,
        totalAppointments: appointments.filter((apt) => apt.status !== "Cancelled").length,
        todayAppointments: todayAppointments.length,
        upcomingAppointments: appointments.filter((apt) => {
          if (!apt.startTime || apt.status === "Cancelled" || apt.status === "Completed") return false;
          return new Date(apt.startTime) > now;
        }).length,
        completedAppointments: appointments.filter((apt) => apt.status === "Completed").length,
        totalPatients: uniquePatients.size,
      });

      setUpcomingAppointments(upcomingAppointmentsList);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      loadDashboardData();
    }
  }, [doctorId, loadDashboardData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Page Header */}
      <div className="mb-3">
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Dashboard
        </h2>
        <p className="text-muted mb-0 small">Tổng quan hoạt động của bạn</p>
                  </div>

      {/* Stats Cards - Minimal Design */}
      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1" style={{ fontSize: "0.75rem" }}>Tổng lịch trình</div>
                  <div className="h4 mb-1 fw-bold text-dark" style={{ fontSize: "1.5rem" }}>{stats.totalSchedules}</div>
                  <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-calendar-day me-1"></i>
                    {stats.todaySchedules} hôm nay
                  </div>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                  <i className="bi bi-calendar3 text-primary" style={{ fontSize: "1.5rem" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1" style={{ fontSize: "0.75rem" }}>Lịch hẹn hôm nay</div>
                  <div className="h4 mb-1 fw-bold text-dark" style={{ fontSize: "1.5rem" }}>{stats.todayAppointments}</div>
                  <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-clock me-1"></i>
                    {stats.upcomingAppointments} sắp tới
                  </div>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-2">
                  <i className="bi bi-calendar-check text-success" style={{ fontSize: "1.5rem" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1" style={{ fontSize: "0.75rem" }}>Tổng bệnh nhân</div>
                  <div className="h4 mb-1 fw-bold text-dark" style={{ fontSize: "1.5rem" }}>{stats.totalPatients}</div>
                  <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-person-check me-1"></i>
                    Đã điều trị
                  </div>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle p-2">
                  <i className="bi bi-people text-info" style={{ fontSize: "1.5rem" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small mb-1" style={{ fontSize: "0.75rem" }}>Hoàn thành</div>
                  <div className="h4 mb-1 fw-bold text-dark" style={{ fontSize: "1.5rem" }}>{stats.completedAppointments}</div>
                  <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-check-circle me-1"></i>
                    Tổng cộng
                  </div>
                </div>
                <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                  <i className="bi bi-check2-all text-warning" style={{ fontSize: "1.5rem" }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Appointments - Full Width */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-white border-0 py-2 px-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold" style={{ fontSize: "1rem" }}>
                <i className="bi bi-calendar-event text-success me-2"></i>
                Lịch hẹn bệnh nhân
              </h6>
              <Link to="/doctor/appointments" className="btn btn-sm btn-outline-primary">
                Xem tất cả
                <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
            <div className="card-body px-3 py-0">
              {upcomingAppointments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {upcomingAppointments.map((apt, index) => (
                    <div
                      key={apt.appointmentId}
                      className={`list-group-item border-0 px-0 py-3 ${index !== upcomingAppointments.length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                            style={{ 
                              width: "48px", 
                              height: "48px"
                            }}
                  >
                            <i className="bi bi-calendar-check text-primary" style={{ fontSize: "1.25rem" }}></i>
                </div>
                          <div>
                            <h6 className="mb-1 fw-bold" style={{ fontSize: "0.95rem" }}>
                              {apt.patientName || "Bệnh nhân"}
                            </h6>
                            <div className="text-muted small d-flex align-items-center gap-3" style={{ fontSize: "0.8rem" }}>
                              <span>
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatDate(apt.startTime)}
                              </span>
                              <span>
                                <i className="bi bi-clock me-1"></i>
                                {formatTime(apt.startTime)}
                              </span>
                              {apt.scheduleId && (
                                <span className="badge bg-info bg-opacity-10 text-info">
                                  <i className="bi bi-info-circle me-1"></i>
                                  Có lịch trình
                                </span>
                              )}
                </div>
              </div>
            </div>
                        <div className="text-end d-flex align-items-center gap-3">
                          <span
                            className={`badge px-3 py-2 ${
                              apt.status === "Pending"
                                ? "bg-warning text-dark"
                                : apt.status === "Confirmed"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {apt.status === "Pending"
                              ? "Chờ xác nhận"
                              : apt.status === "Confirmed"
                              ? "Đã xác nhận"
                              : apt.status || "Chưa xác định"}
                          </span>
                          <Link
                            to={`/doctor/appointments/${apt.appointmentId}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Chi tiết
                            <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
          </div>
        </div>
            </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0 small">Chưa có lịch hẹn bệnh nhân</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DoctorDashboard;
