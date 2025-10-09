import React, { useState, useEffect } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import DoctorScheduleForm from "./DoctorScheduleForm";

const DoctorScheduleManagement = () => {
  // Định dạng ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Định dạng giờ
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge trạng thái
  const getStatusBadge = (status) => {
    const statusClasses = {
      Available: "badge bg-success",
      Busy: "badge bg-warning",
      Unavailable: "badge bg-danger",
    };
    return statusClasses[status] || "badge bg-secondary";
  };

  // Xử lý xóa lịch trình
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch trình này?")) {
      try {
        await doctorScheduleApi.deleteSchedule(scheduleId);
        loadSchedules();
      } catch (err) {
        setError(
          "Không thể xóa lịch trình: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  // Xử lý tạo lịch trình
  const handleCreateSchedule = async (scheduleData) => {
    try {
      const mockUser = { doctorId: 3, fullName: "Hồng Nguyễn" };
      await doctorScheduleApi.createSchedule({
        ...scheduleData,
        doctorId: mockUser.doctorId,
      });
      setShowForm(false);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };

  // Xử lý cập nhật lịch trình
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
  const [viewMode, setViewMode] = useState("table"); // 'table' hoặc 'calendar'

  useEffect(() => {
    // Mock user for testing - using real doctorId from database
    const mockUser = { doctorId: 3, fullName: "Hồng Nguyễn" };

    if (mockUser?.doctorId) {
      loadSchedules();
    }
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockUser = { doctorId: 3, fullName: "Hồng Nguyễn" };
      const response = await doctorScheduleApi.getSchedulesByDoctor(
        mockUser.doctorId
      );
      setSchedules(response.data);
    } catch (err) {
      setError(
        "Không thể tải lịch trình: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

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
    <div className="py-4   w-full mx-0 px-0">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow rounded-4 border-0">
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
                  <h3 className="mb-1 fw-bold">Quản lý lịch trình bác sĩ</h3>
                  <p className="mb-0 text-muted" style={{ fontSize: "1rem" }}>
                    Quản lý, tạo mới, chỉnh sửa và theo dõi lịch làm việc chuyên
                    nghiệp.
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={loadSchedules}
                  title="Làm mới"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "calendar" : "table")
                  }
                  title={viewMode === "table" ? "Xem lịch" : "Xem bảng"}
                >
                  <i
                    className={`bi ${
                      viewMode === "table" ? "bi-calendar3" : "bi-table"
                    }`}
                  ></i>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle"></i> Thêm lịch trình
                </button>
                <input
                  type="date"
                  className="form-control form-control-sm border-primary"
                  style={{ maxWidth: 150 }}
                  placeholder="Lọc theo ngày"
                />
                <select
                  className="form-select form-select-sm border-primary"
                  style={{ maxWidth: 120 }}
                  defaultValue=""
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Available">Có sẵn</option>
                  <option value="Busy">Bận</option>
                  <option value="Unavailable">Nghỉ</option>
                </select>
              </div>
            </div>
            <div className="card-body px-4 py-4">
              <div className="mb-4 d-flex gap-3 flex-wrap">
                <span className="badge bg-primary fs-6 px-3 py-2 shadow-sm">
                  <i className="bi bi-list-check me-2"></i> Tổng:{" "}
                  {schedules.length}
                </span>
                <span className="badge bg-success fs-6 px-3 py-2 shadow-sm">
                  <i className="bi bi-calendar-day me-2"></i> Hôm nay:{" "}
                  {
                    schedules.filter(
                      (s) =>
                        s.workDate === new Date().toISOString().split("T")[0]
                    ).length
                  }
                </span>
                <span className="badge bg-info text-dark fs-6 px-3 py-2 shadow-sm">
                  <i className="bi bi-calendar-week me-2"></i> Sắp tới:{" "}
                  {
                    schedules.filter((s) => new Date(s.workDate) > new Date())
                      .length
                  }
                </span>
              </div>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {viewMode === "table" ? (
                schedules.length === 0 ? (
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
                      <i className="bi bi-plus-circle"></i> Thêm lịch trình đầu
                      tiên
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive rounded-3 shadow-sm">
                    <table className="table table-hover align-middle">
                      <thead className="table-primary">
                        <tr>
                          <th>Ngày làm việc</th>
                          <th>Thời gian bắt đầu</th>
                          <th>Thời gian kết thúc</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((schedule) => (
                          <tr
                            key={schedule.scheduleId}
                            className="table-row-hover"
                          >
                            <td className="fw-semibold">
                              {formatDate(schedule.workDate)}
                            </td>
                            <td>{formatTime(schedule.startTime)}</td>
                            <td>{formatTime(schedule.endTime)}</td>
                            <td>
                              <span className={getStatusBadge(schedule.status)}>
                                {schedule.status}
                              </span>
                            </td>
                            <td>{schedule.notes || "-"}</td>
                            <td className="text-center">
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setEditingSchedule(schedule)}
                                  title="Chỉnh sửa"
                                  style={{ minWidth: 36 }}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleDeleteSchedule(schedule.scheduleId)
                                  }
                                  title="Xóa"
                                  style={{ minWidth: 36 }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="text-center py-5">
                  <i
                    className="bi bi-calendar3 text-primary"
                    style={{ fontSize: "4rem" }}
                  ></i>
                  <p className="text-muted mt-3 fs-5">
                    Chế độ xem lịch đang được phát triển
                  </p>
                  <button
                    className="btn btn-outline-primary btn-lg mt-2 px-4"
                    onClick={() => setViewMode("table")}
                  >
                    {" "}
                    <i className="bi bi-table"></i> Chuyển về chế độ bảng{" "}
                  </button>
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
