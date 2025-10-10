import React, { useState, useEffect, useCallback } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import DoctorScheduleForm from "./DoctorScheduleForm";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";

const DoctorScheduleManagement = () => {
  // State cho filter ngày tháng
  const [dateFilter, setDateFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  // Hàm lọc lịch trình theo khoảng thời gian
  // Helper: chuyển date về yyyy-MM-dd
  const toDateString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  };

  const filterSchedulesByDate = (schedules) => {
    const todayStr = toDateString(new Date());
    switch (dateFilter) {
      case "Today":
        return schedules.filter((s) => toDateString(s.workDate) === todayStr);
      case "Yesterday": {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = toDateString(yest);
        return schedules.filter((s) => toDateString(s.workDate) === yestStr);
      }
      case "Last7Days": {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        const fromStr = toDateString(from);
        return schedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
      }
      case "Last30Days": {
        const from = new Date();
        from.setDate(from.getDate() - 29);
        const fromStr = toDateString(from);
        return schedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
      }
      case "ThisMonth": {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return schedules.filter((s) => {
          const d = new Date(s.workDate);
          return d.getMonth() === month && d.getFullYear() === year;
        });
      }
      case "LastMonth": {
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year =
          lastMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();
        return schedules.filter((s) => {
          const d = new Date(s.workDate);
          return d.getMonth() === lastMonth && d.getFullYear() === year;
        });
      }
      case "CustomRange": {
        if (!customRange.from || !customRange.to) return schedules;
        const fromStr = toDateString(customRange.from);
        const toStr = toDateString(customRange.to);
        return schedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= toStr;
        });
      }
      default:
        return schedules;
    }
  };
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
    if (!doctorId) return;

    try {
      await doctorScheduleApi.createSchedule({
        ...scheduleData,
        doctorId: doctorId,
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
  const [doctorId, setDoctorId] = useState(null);

  // Định nghĩa loadSchedules trước
  const loadSchedules = useCallback(async () => {
    if (!doctorId) {
      console.log("No doctorId available");
      return;
    }

    console.log("Loading schedules for doctorId:", doctorId);
    try {
      setLoading(true);
      setError(null);
      const response = await doctorScheduleApi.getSchedulesByDoctor(doctorId);
      console.log("Schedules response:", response);
      setSchedules(response.data);
    } catch (err) {
      console.error("Error loading schedules:", err);
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
    console.log("UserId from cookie:", userId);
    if (userId) {
      doctorApi
        .getDoctorByUserId(userId)
        .then((res) => {
          console.log("Doctor API response:", res);
          // Lấy data từ response
          const data = res.data || res;
          console.log("Doctor data:", data);
          setDoctorId(data.doctorId);
        })
        .catch((error) => {
          console.error("Error fetching doctor info:", error);
        });
    }
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadSchedules();
    }
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
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowForm(true)}
                >
                  <i className="bi bi-plus-circle"></i> Thêm lịch trình
                </button>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-primary btn-sm dropdown-toggle"
                    type="button"
                    id="dateRangeDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
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
                  <ul
                    className="dropdown-menu"
                    aria-labelledby="dateRangeDropdown"
                  >
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("Today")}
                      >
                        Today
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("Yesterday")}
                      >
                        Yesterday
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("Last7Days")}
                      >
                        Last 7 Days
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("Last30Days")}
                      >
                        Last 30 Days
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("ThisMonth")}
                      >
                        This Month
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("LastMonth")}
                      >
                        Last Month
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => setDateFilter("CustomRange")}
                      >
                        Custom Range
                      </button>
                    </li>
                  </ul>
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
                filterSchedulesByDate(schedules).length === 0 ? (
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
                        {filterSchedulesByDate(schedules).map((schedule) => (
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
