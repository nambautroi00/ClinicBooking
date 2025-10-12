import React, { useState, useEffect, useCallback } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import DoctorScheduleForm from "./DoctorScheduleForm";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";

const DoctorScheduleManagement = () => {
  // State filter, custom range
  const [dateFilter, setDateFilter] = useState("All");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

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
  const getStatusBadge = (status) =>
    ({
      Available: "badge bg-success",
      Busy: "badge bg-warning",
      Unavailable: "badge bg-danger",
    }[status] || "badge bg-secondary");
  const filterSchedulesByDate = (schedules) => {
    const todayStr = toDateString(new Date());
    switch (dateFilter) {
      case "Today":
        return schedules.filter((s) => toDateString(s.workDate) === todayStr);
      case "Yesterday": {
        const yestStr = toDateString(new Date(Date.now() - 86400000));
        return schedules.filter((s) => toDateString(s.workDate) === yestStr);
      }
      case "Last7Days": {
        const fromStr = toDateString(new Date(Date.now() - 6 * 86400000));
        return schedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
      }
      case "Last30Days": {
        const fromStr = toDateString(new Date(Date.now() - 29 * 86400000));
        return schedules.filter((s) => {
          const dStr = toDateString(s.workDate);
          return dStr >= fromStr && dStr <= todayStr;
        });
      }
      case "ThisMonth": {
        const now = new Date();
        return schedules.filter((s) => {
          const d = new Date(s.workDate);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
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

  // CRUD schedule
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
  const [viewMode, setViewMode] = useState("table");
  const [doctorId, setDoctorId] = useState(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await doctorScheduleApi.getSchedulesByDoctor(doctorId);
      setSchedules(response.data);
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
    <div className=" w-full mx-0 px-0">
      <div className="row justify-content-center" style={{ margin: 0 }}>
        <div className="col-lg-12">
          <div className="card shadow rounded-4 border w-100">
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
