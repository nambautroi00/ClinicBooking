import React, { useState, useEffect, useMemo } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import doctorApi from "../../api/doctorApi";
import Cookies from "js-cookie";
import { Plus, Calendar, Clock, Search } from "lucide-react";

const DoctorAvailableSlotManagement = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // Đã loại bỏ editingSlot, setEditingSlot
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("upcoming");

  // Load doctor ID from cookie
  useEffect(() => {
    const userId = Cookies.get("userId");
    if (userId) {
      doctorApi
        .getDoctorByUserId(userId)
        .then((res) => {
          const data = res.data || res;
          setDoctorId(data.doctorId);
        })
        .catch((error) => {
          console.error("Error getting doctor:", error);
        });
    }
  }, []);
  // Load schedules when doctor ID is available
  useEffect(() => {
    if (doctorId) {
      loadSchedules();
    }
  }, [doctorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await doctorScheduleApi.getSchedulesByDoctor(doctorId);
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };
  // Filter and search schedules
  const filteredSchedules = useMemo(() => {
    let filtered = [...schedules];
    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (dateFilter) {
      case "upcoming":
        filtered = filtered.filter(
          (schedule) => new Date(schedule.workDate) >= today
        );
        break;
      case "past":
        filtered = filtered.filter(
          (schedule) => new Date(schedule.workDate) < today
        );
        break;
      case "today":
        const todayStr = today.toISOString().split("T")[0];
        filtered = filtered.filter(
          (schedule) => schedule.workDate === todayStr
        );
        break;
      default:
        break;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (schedule) =>
          schedule.workDate.includes(query) ||
          schedule.startTime.includes(query) ||
          schedule.endTime.includes(query) ||
          schedule.notes?.toLowerCase().includes(query)
      );
    }
    // Sort by date and time
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.workDate}T${a.startTime}`);
      const dateB = new Date(`${b.workDate}T${b.startTime}`);
      return dateA - dateB;
    });
  }, [schedules, dateFilter, searchQuery]);

  // Đã loại bỏ các hàm handleEdit, handleDelete, resetForm

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "success";
      case "Busy":
        return "warning";
      case "Unavailable":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Available":
        return "Có thể đặt";
      case "Busy":
        return "Bận";
      case "Unavailable":
        return "Không khả dụng";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="bg-white rounded-4 shadow-sm border">
        {/* Header */}
        <div className="p-4 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1 fw-bold text-primary">
                <Calendar className="me-2" size={28} />
                Quản lý Lịch Hẹn Khả Dụng
              </h2>
              <p className="text-muted mb-0">
                Tạo và quản lý các khung giờ có thể đặt lịch cho bệnh nhân
              </p>
            </div>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => setShowForm(true)}
            >
              <Plus size={20} />
              Thêm Lịch Mới
            </button>
          </div>

          {/* Filters */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="position-relative">
                <Search
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  size={16}
                />
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Tìm kiếm theo ngày, giờ, ghi chú..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="upcoming">Sắp tới</option>
                <option value="today">Hôm nay</option>
                <option value="past">Đã qua</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Form */}
        {showForm && (
          <div className="p-4 border-bottom bg-light">
            {/* Chỉ hiển thị form tạo/sửa khung giờ, không có phần đặt lịch cho bệnh nhân */}
            {/* ...existing code cho form quản lý khung giờ... */}
          </div>
        )}

        {/* Schedule List */}
        <div className="p-4">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={64} className="text-muted mb-3" />
              <h5 className="text-muted">Chưa có lịch trình nào</h5>
              <p className="text-muted">
                {searchQuery || dateFilter !== "all"
                  ? "Không tìm thấy lịch trình phù hợp với bộ lọc"
                  : "Hãy thêm lịch trình đầu tiên của bạn"}
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredSchedules.map((schedule) => (
                <div key={schedule.scheduleId} className="col-lg-6 col-xl-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span
                          className={`badge bg-${getStatusColor(
                            schedule.status
                          )}`}
                        >
                          {getStatusText(schedule.status)}
                        </span>
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            Thao tác
                          </button>
                          <ul className="dropdown-menu">
                            <li>{/* Chức năng chỉnh sửa đã bị loại bỏ */}</li>
                            <li>{/* Chức năng xóa đã bị loại bỏ */}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mb-2">
                        <Calendar size={16} className="text-primary me-2" />
                        <strong>{formatDate(schedule.workDate)}</strong>
                      </div>

                      <div className="mb-2">
                        <Clock size={16} className="text-primary me-2" />
                        {formatTime(schedule.startTime)} -{" "}
                        {formatTime(schedule.endTime)}
                      </div>

                      <div className="mb-2">
                        <span className="text-muted">
                          Số bệnh nhân tối đa:{" "}
                        </span>
                        <strong>{schedule.maxPatients || 1}</strong>
                      </div>

                      {schedule.notes && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <em>"{schedule.notes}"</em>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailableSlotManagement;
