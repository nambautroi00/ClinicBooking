import React, { useState, useEffect, useCallback } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import DoctorScheduleForm from "./DoctorScheduleForm";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";

const DoctorScheduleManagement = () => {
  // State filter, custom range
  const [dateFilter, setDateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState("All");

  // Helper & filter
  const toDateString = (date) =>
    date ? new Date(date).toISOString().slice(0, 10) : "";
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = [
      "Chủ nhật",
      "Th 2",
      "Th 3",
      "Th 4",
      "Th 5",
      "Th 6",
      "Th 7",
    ];
    const weekday = weekdays[date.getDay()];
    return `${weekday}, ${date.toLocaleDateString("vi-VN")}`;
  };
  const formatTime = (timeString) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const getStatusBadge = (status) => {
    const statusConfig = {
      Available: { 
        class: "badge bg-success text-white rounded-pill px-3 py-2", 
        text: "Có sẵn", 
        icon: "bi bi-check-circle-fill" 
      },
      Completed: { 
        class: "badge bg-primary text-white rounded-pill px-3 py-2", 
        text: "Hoàn thành", 
        icon: "bi bi-check2-all" 
      }
    };
    
    const config = statusConfig[status] || { 
      class: "badge bg-secondary text-white rounded-pill px-3 py-2", 
      text: status || "Không xác định", 
      icon: "bi bi-question-circle-fill" 
    };
    
    return config;
  };
  const filterSchedulesByDate = (schedules) => {
    const todayStr = toDateString(new Date());
    let filteredSchedules = schedules;
    
    // Filter by date
    switch (dateFilter) {
      case "Today":
        filteredSchedules = filteredSchedules.filter((s) => toDateString(s.workDate) === todayStr);
        break;
      case "Yesterday": {
        const yestStr = toDateString(new Date(Date.now() - 86400000));
        filteredSchedules = filteredSchedules.filter((s) => toDateString(s.workDate) === yestStr);
        break;
      }
      case "Last7Days": {
        const fromStr = toDateString(new Date(Date.now() - 6 * 86400000));
        filteredSchedules = filteredSchedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
        break;
      }
      case "Last30Days": {
        const fromStr = toDateString(new Date(Date.now() - 29 * 86400000));
        filteredSchedules = filteredSchedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
        break;
      }
      case "ThisMonth": {
        const now = new Date();
        filteredSchedules = filteredSchedules.filter((s) => {
          const d = new Date(s.workDate);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        });
        break;
      }
      case "LastMonth": {
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year =
          lastMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();
        filteredSchedules = filteredSchedules.filter((s) => {
          const d = new Date(s.workDate);
          return d.getMonth() === lastMonth && d.getFullYear() === year;
        });
        break;
      }
      case "CustomRange": {
        if (!customRange.from || !customRange.to) break;
        const fromStr = toDateString(customRange.from);
        const toStr = toDateString(customRange.to);
        filteredSchedules = filteredSchedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= toStr;
        });
        break;
      }
      default:
        break;
    }
    
    // Filter by status
    if (statusFilter !== "All") {
      filteredSchedules = filteredSchedules.filter((s) => s.status === statusFilter);
    }
    
    // Filter by day of week
    if (dayOfWeekFilter !== "All") {
      filteredSchedules = filteredSchedules.filter((s) => {
        const date = new Date(s.workDate);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayMapping = {
          "Monday": 1,
          "Tuesday": 2, 
          "Wednesday": 3,
          "Thursday": 4,
          "Friday": 5,
          "Saturday": 6,
          "Sunday": 0
        };
        return dayOfWeek === dayMapping[dayOfWeekFilter];
      });
    }
    
    return filteredSchedules;
  };

  // CRUD schedule
  const handleDeleteSchedule = async (scheduleId) => {
    // Tìm schedule để kiểm tra có appointments không
    const schedule = schedules.find(s => s.scheduleId === scheduleId);
    const hasAppointments = schedule?.status === "Available" && (schedule?.appointmentCount > 0);
    
    const confirmMessage = hasAppointments 
      ? "Bạn có chắc chắn muốn xóa lịch trình này?\n\n⚠️ CẢNH BÁO: Tất cả appointments liên quan sẽ bị hủy!"
      : "Bạn có chắc chắn muốn xóa lịch trình này?";
    
    if (window.confirm(confirmMessage)) {
      try {
        await doctorScheduleApi.deleteSchedule(scheduleId);
        
        if (hasAppointments) {
          window.toast && window.toast.warning("Đã xóa lịch trình và hủy tất cả appointments liên quan");
        } else {
          window.toast && window.toast.success("Đã xóa lịch trình thành công");
        }
        
        loadSchedules();
      } catch (err) {
        setError(
          "Không thể xóa lịch trình: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  // Status management actions
  const handleUpdateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      // Tìm schedule hiện tại để kiểm tra status cũ
      const currentSchedule = schedules.find(s => s.scheduleId === scheduleId);
      const oldStatus = currentSchedule?.status;
      const hasAppointments = currentSchedule?.appointmentCount > 0;
      
      // Cập nhật schedule status
      await doctorScheduleApi.updateSchedule(scheduleId, { status: newStatus });
      
      // Tích hợp với Appointment System
      if (newStatus === "Completed" && oldStatus === "Available") {
        if (hasAppointments) {
          // Completed schedule - appointments vẫn giữ nguyên status
          window.toast && window.toast.success(
            `Đã hoàn thành lịch trình với ${currentSchedule.appointmentCount} appointments`
          );
        } else {
          window.toast && window.toast.success("Đã hoàn thành lịch trình");
        }
      } else {
        window.toast && window.toast.success(`Đã cập nhật trạng thái thành ${getStatusBadge(newStatus).text}`);
      }
      
      loadSchedules();
    } catch (err) {
      setError(
        "Không thể cập nhật trạng thái: " +
          (err.response?.data?.message || err.message)
      );
    }
  };
  const handleCreateSchedule = async (scheduleData) => {
    if (!doctorId) return;
    try {
      await doctorScheduleApi.createSchedule({ ...scheduleData, doctorId });
      setShowForm(false);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };
  const handleUpdateSchedule = async (scheduleId, scheduleData) => {
    try {
      await doctorScheduleApi.updateSchedule(scheduleId, scheduleData);
      setEditingSchedule(null);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await doctorScheduleApi.getSchedulesByDoctor(doctorId);
      const schedulesData = response.data;
      
      // Load appointment counts for each schedule
      const schedulesWithCounts = await Promise.all(
        schedulesData.map(async (schedule) => {
          try {
            // Import appointmentApi dynamically to avoid circular dependency
            const { default: appointmentApi } = await import("../../api/appointmentApi");
            const appointmentsRes = await appointmentApi.getAppointmentsByDoctor(doctorId);
            
            // Count appointments for this schedule
            const appointmentCount = appointmentsRes.data.filter(
              appointment => appointment.scheduleId === schedule.scheduleId
            ).length;
            
            return {
              ...schedule,
              appointmentCount
            };
          } catch (err) {
            console.warn(`Could not load appointment count for schedule ${schedule.scheduleId}:`, err);
            return {
              ...schedule,
              appointmentCount: 0
            };
          }
        })
      );
      
      setSchedules(schedulesWithCounts);
    } catch (err) {
      setError(
        "Không thể tải lịch trình: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Lấy doctorId từ cookie và API
  useEffect(() => {
    const userId = Cookies.get("userId");
    if (userId) {
      doctorApi
        .getDoctorByUserId(userId)
        .then((res) => {
          const data = res.data || res;
          setDoctorId(data.doctorId);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (doctorId) loadSchedules();
  }, [doctorId, loadSchedules]);

  // ...existing code...

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100" style={{ minHeight: "100vh" }}>
      <div className="row justify-content-center" style={{ margin: 0 }}>
        <div className="col-lg-12">
          <div className="card shadow rounded-4 border w-100" style={{ marginBottom: "2rem" }}>
            <div className="card-header bg-white rounded-top-4 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 py-4 px-4">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48 }}
                >
                  <i
                    className="bi bi-calendar3"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </span>
                <div>
                  <h3 className="mb-1 fw-bold">Lịch làm việc</h3>
                  <p className="mb-0 text-muted" style={{ fontSize: "1rem" }}>
                    Quản lý lịch trình cá nhân của bạn
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle"></i> Thêm lịch trình
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => window.location.reload()}
                  title="Làm mới dữ liệu"
                >
                  <i className="bi bi-arrow-clockwise"></i> Làm mới
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    className="btn btn-outline-primary btn-sm dropdown-toggle"
                    type="button"
                    onClick={() => setShowDateDropdown((v) => !v)}
                  >
                    <i className="bi bi-calendar-range"></i>{" "}
                    {(() => {
                      switch (dateFilter) {
                        case "All":
                          return "Chọn khoảng thời gian";
                        case "Today":
                          return "Hôm nay";
                        case "Yesterday":
                          return "Hôm qua";
                        case "Last7Days":
                          return "7 ngày gần nhất";
                        case "Last30Days":
                          return "30 ngày gần nhất";
                        case "ThisMonth":
                          return "Tháng này";
                        case "LastMonth":
                          return "Tháng trước";
                        case "CustomRange":
                          return "Tùy chọn";
                        default:
                          return dateFilter;
                      }
                    })()}
                  </button>
                  {showDateDropdown && (
                    <ul
                      className="dropdown-menu show"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        zIndex: 999,
                        minWidth: "190px",
                      }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("Today");
                            setShowDateDropdown(false);
                          }}
                        >
                          Hôm nay
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("Yesterday");
                            setShowDateDropdown(false);
                          }}
                        >
                          Hôm qua
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("Last7Days");
                            setShowDateDropdown(false);
                          }}
                        >
                          7 ngày gần nhất
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("Last30Days");
                            setShowDateDropdown(false);
                          }}
                        >
                          30 ngày gần nhất
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("ThisMonth");
                            setShowDateDropdown(false);
                          }}
                        >
                          Tháng này
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("LastMonth");
                            setShowDateDropdown(false);
                          }}
                        >
                          Tháng trước
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          type="button"
                          onClick={() => {
                            setDateFilter("CustomRange");
                            setShowDateDropdown(false);
                          }}
                        >
                          Tùy chọn
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
                {dateFilter === "CustomRange" && (
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="date"
                      className="form-control form-control-sm border-primary"
                      style={{ maxWidth: 130 }}
                      value={customRange.from}
                      onChange={(e) =>
                        setCustomRange((r) => ({ ...r, from: e.target.value }))
                      }
                    />
                    <span>-</span>
                    <input
                      type="date"
                      className="form-control form-control-sm border-primary"
                      style={{ maxWidth: 130 }}
                      value={customRange.to}
                      onChange={(e) =>
                        setCustomRange((r) => ({ ...r, to: e.target.value }))
                      }
                    />
                  </div>
                )}
                <select
                  className="form-select form-select-sm border-primary"
                  style={{ maxWidth: 140 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Available">Có sẵn</option>
                  <option value="Completed">Hoàn thành</option>
                </select>
              </div>
            </div>
            
            {/* Day of Week Filter Buttons */}
            <div className="px-4 py-3 border-top bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0 fw-semibold text-muted">
                  <i className="bi bi-calendar-week me-2"></i>
                  Lọc theo ngày trong tuần
                </h6>
                
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      dayOfWeekFilter === "All" 
                        ? "btn-primary" 
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setDayOfWeekFilter("All")}
                    style={{ 
                      fontSize: "13px", 
                      padding: "8px 16px",
                      fontWeight: "600",
                      borderRadius: "20px",
                      transition: "all 0.2s ease",
                      border: "1px solid #dee2e6"
                    }}
                  >
                    <i className="bi bi-grid-3x3-gap me-1"></i>
                    Tất cả
                  </button>
                  {[
                    { key: "Monday", label: "Thứ 2", icon: "bi-calendar-day" },
                    { key: "Tuesday", label: "Thứ 3", icon: "bi-calendar-day" },
                    { key: "Wednesday", label: "Thứ 4", icon: "bi-calendar-check" },
                    { key: "Thursday", label: "Thứ 5", icon: "bi-calendar-day" },
                    { key: "Friday", label: "Thứ 6", icon: "bi-calendar-day" },
                    { key: "Saturday", label: "Thứ 7", icon: "bi-calendar-day" },
                    { key: "Sunday", label: "Chủ nhật", icon: "bi-calendar-day" }
                  ].map((day) => (
                    <button
                      type="button"
                      key={day.key}
                      className={`btn btn-sm ${
                        dayOfWeekFilter === day.key 
                          ? "btn-primary" 
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setDayOfWeekFilter(day.key)}
                      style={{ 
                        fontSize: "13px", 
                        padding: "8px 16px",
                        fontWeight: "600",
                        borderRadius: "20px",
                        transition: "all 0.2s ease",
                        border: "1px solid #dee2e6"
                      }}
                    >
                      <i className={`bi ${day.icon} me-1`}></i>
                      {day.label}
                    </button>
                  ))}
                </div>
                
                {/* Quick Stats */}
                <div className="ms-auto d-flex align-items-center gap-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {dayOfWeekFilter !== "All" ? 
                      `Đang xem: ${dayOfWeekFilter === "Monday" ? "Thứ 2" :
                       dayOfWeekFilter === "Tuesday" ? "Thứ 3" :
                       dayOfWeekFilter === "Wednesday" ? "Thứ 4" :
                       dayOfWeekFilter === "Thursday" ? "Thứ 5" :
                       dayOfWeekFilter === "Friday" ? "Thứ 6" :
                       dayOfWeekFilter === "Saturday" ? "Thứ 7" :
                       dayOfWeekFilter === "Sunday" ? "Chủ nhật" : dayOfWeekFilter}` : 
                      "Tất cả ngày trong tuần"}
                  </small>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setDayOfWeekFilter("All")}
                    title="Xóa bộ lọc ngày"
                    style={{ 
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "12px"
                    }}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Reset
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card-body px-4 py-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {filterSchedulesByDate(schedules).length === 0 ? (
                  <div className="text-center py-5">
                    <i
                      className="bi bi-calendar-x text-muted"
                      style={{ fontSize: "4rem" }}
                    ></i>
                    <p className="text-muted mt-3 fs-5">
                      Chưa có lịch trình nào
                    </p>
                    <button
                      className="btn btn-primary btn-lg mt-2 px-4"
                      onClick={() => setShowForm(true)}
                    >
                    <i className="bi bi-plus-circle"></i> Thêm lịch trình đầu tiên
                    </button>
                  </div>
                ) : (
                <div className="row g-4">
                  {filterSchedulesByDate(schedules).map((schedule) => {
                    const isToday = toDateString(schedule.workDate) === toDateString(new Date());
                    const isPast = new Date(schedule.workDate) < new Date();
                    const isUpcoming = new Date(schedule.workDate) > new Date();
                    
                    return (
                      <div key={schedule.scheduleId} className="col-lg-6 col-xl-4">
                        <div className={`card h-100 shadow-sm border-0 ${
                          isToday ? 'border-warning' : 
                          isPast ? 'border-secondary' : 
                          'border-primary'
                        }`} style={{ 
                          borderRadius: "16px",
                          transition: "all 0.3s ease",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                        }}>
                          {/* Card Header */}
                          <div className={`card-header border-0 ${
                            isToday ? 'bg-warning bg-opacity-10' : 
                            isPast ? 'bg-secondary bg-opacity-10' : 
                            'bg-primary bg-opacity-10'
                          }`} style={{ borderRadius: "16px 16px 0 0" }}>
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-3">
                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                                  isToday ? 'bg-warning text-dark' : 
                                  isPast ? 'bg-secondary text-white' : 
                                  'bg-primary text-white'
                                }`} style={{ width: 40, height: 40 }}>
                                  <i className="bi bi-calendar3"></i>
                                </div>
                                <div>
                                  <h6 className="mb-0 fw-bold">
                              {formatDate(schedule.workDate)}
                                  </h6>
                                  <small className={`${
                                    isToday ? 'text-warning' : 
                                    isPast ? 'text-muted' : 
                                    'text-primary'
                                  }`}>
                                    {isToday ? 'Hôm nay' : 
                                     isPast ? 'Đã qua' : 
                                     'Sắp tới'}
                                  </small>
                                </div>
                              </div>
                              
                              {/* Status Badge and Action Buttons */}
                              <div className="d-flex align-items-center gap-3">
                                {(() => {
                                  const statusConfig = getStatusBadge(schedule.status);
                                  return (
                                    <span className={statusConfig.class} style={{ fontSize: "12px", fontWeight: "600" }}>
                                      <i className={`${statusConfig.icon} me-1`}></i>
                                      {statusConfig.text}
                                    </span>
                                  );
                                })()}
                                <div className="d-flex gap-1">
                                  <button
                                    className="btn btn-sm btn-outline-primary rounded-circle"
                                    onClick={() => setEditingSchedule(schedule)}
                                    title="Chỉnh sửa lịch trình"
                                    style={{ 
                                      width: 32, 
                                      height: 32,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.1)";
                                      e.target.style.backgroundColor = "#0d6efd";
                                      e.target.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)";
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.color = "#0d6efd";
                                    }}
                                  >
                                    <i className="bi bi-pencil" style={{ fontSize: "12px" }}></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-circle"
                                    onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                                    title="Xóa lịch trình"
                                    style={{ 
                                      width: 32, 
                                      height: 32,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = "scale(1.1)";
                                      e.target.style.backgroundColor = "#dc3545";
                                      e.target.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = "scale(1)";
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.color = "#dc3545";
                                    }}
                                  >
                                    <i className="bi bi-trash" style={{ fontSize: "12px" }}></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="card-body p-4">
                            {/* Time Info */}
                            <div className="row mb-3">
                              <div className="col-6">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <i className="bi bi-clock text-primary"></i>
                                  <small className="text-muted">Bắt đầu</small>
                                </div>
                                <div className="fw-semibold text-primary fs-5">
                                  {formatTime(schedule.startTime)}
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <i className="bi bi-clock-fill text-success"></i>
                                  <small className="text-muted">Kết thúc</small>
                                </div>
                                <div className="fw-semibold text-success fs-5">
                                  {formatTime(schedule.endTime)}
                                </div>
                              </div>
                            </div>

                            {/* Duration Info */}
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <i className="bi bi-hourglass-split text-info"></i>
                              <small className="text-muted">Thời gian làm việc:</small>
                              <span className="fw-semibold text-info">
                                {(() => {
                                  const start = new Date(`2000-01-01T${schedule.startTime}`);
                                  const end = new Date(`2000-01-01T${schedule.endTime}`);
                                  const diffMs = end - start;
                                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                  return `${diffHours}h ${diffMinutes}m`;
                                })()}
                              </span>
                            </div>

                            {/* Appointments Info */}
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <i className="bi bi-calendar-check text-primary"></i>
                              <small className="text-muted">Appointments:</small>
                              <span className="fw-bold text-primary fs-5">
                                {schedule.appointmentCount || 0}
                              </span>
                            </div>

                            {/* Notes */}
                            {schedule.notes && (
                              <div className="mb-3">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <i className="bi bi-sticky text-muted"></i>
                                  <small className="text-muted">Ghi chú</small>
                                </div>
                                <p className="small mb-0 text-muted">
                                  {schedule.notes}
                                </p>
                              </div>
                            )}
                          </div>                     
                        </div>
                  </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal cho form tạo/sửa lịch trình */}
      {(showForm || editingSchedule) && (
        <DoctorScheduleForm
          schedule={editingSchedule}
          onSubmit={
            editingSchedule
              ? (data) => handleUpdateSchedule(editingSchedule.scheduleId, data)
              : handleCreateSchedule
          }
          onClose={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};

export default DoctorScheduleManagement;
