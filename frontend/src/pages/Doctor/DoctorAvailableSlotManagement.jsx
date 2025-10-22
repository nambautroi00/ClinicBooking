import React, { useState, useEffect, useCallback } from "react";
import appointmentApi from "../../api/appointmentApi";
import doctorApi from "../../api/doctorApi";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import Cookies from "js-cookie";

const DoctorAvailableSlotManagement = () => {
  // State quản lý
  const [doctorId, setDoctorId] = useState(null);
  const [slots, setSlots] = useState([]); // Appointments with patient = null
  const [allAppointments, setAllAppointments] = useState([]); // All appointments
  const [doctorSchedules, setDoctorSchedules] = useState([]); // Lịch trình làm việc
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // calendar, list
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState("All");

  // State cho form tạo slots
  const [showQuickCreateForm, setShowQuickCreateForm] = useState(false);
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null); // Lịch trình được chọn
  const [quickCreateData, setQuickCreateData] = useState({
    scheduleId: null, // ID lịch trình
    slotDuration: 30, // phút
    fee: 200000, // giá mặc định 200k
  });

  const [bulkCreateData, setBulkCreateData] = useState({
    selectedScheduleIds: [], // Danh sách ID lịch trình được chọn
    slotDuration: 30,
    fee: 200000,
  });

  // Lấy doctorId từ cookie
  useEffect(() => {
    const userId = Cookies.get("userId");
    if (userId) {
      doctorApi
        .getDoctorByUserId(userId)
        .then((res) => {
          const data = res.data || res;
          setDoctorId(data.doctorId);
        })
        .catch((err) => {
          setError("Không thể lấy thông tin bác sĩ");
        });
    }
  }, []);

  // Load slots và schedules
  const loadSlots = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      
      const [availableResponse, allResponse, schedulesResponse] = await Promise.all([
        appointmentApi.getAvailableSlots(doctorId),
        appointmentApi.getAppointmentsByDoctor(doctorId),
        doctorScheduleApi.getSchedulesByDoctor(doctorId),
      ]);
      
      console.log("🔍 DEBUG - Available slots:", availableResponse.data);
      console.log("🔍 DEBUG - All appointments:", allResponse.data);
      console.log("🔍 DEBUG - Doctor ID:", doctorId);
      console.log("🔍 DEBUG - Selected Date:", selectedDate);
      
      setSlots(availableResponse.data || []);
      setAllAppointments(allResponse.data || []);
      
      // Lọc chỉ lấy schedules Available
      const availableSchedules = (schedulesResponse.data || []).filter(
        (s) => s.status === "Available" 
      );
      setDoctorSchedules(availableSchedules);
    } catch (err) {
      console.error("❌ ERROR loading slots:", err);
      setError(
        "Không thể tải khung giờ: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) loadSlots();
  }, [doctorId, loadSlots]);

  // Tạo các time slots từ DoctorSchedule
  const generateTimeSlotsFromSchedule = (schedule, duration) => {
    if (!schedule) return [];
    
    const slots = [];
    const startTime = schedule.startTime;
    const endTime = schedule.endTime;
    const workDate = schedule.workDate;
    
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    while (currentTime + duration <= endTimeMinutes) {
      const slotStart = `${String(Math.floor(currentTime / 60)).padStart(
        2,
        "0"
      )}:${String(currentTime % 60).padStart(2, "0")}`;
      currentTime += duration;
      const slotEnd = `${String(Math.floor(currentTime / 60)).padStart(
        2,
        "0"
      )}:${String(currentTime % 60).padStart(2, "0")}`;

      const startDateTime = `${workDate}T${slotStart}:00`;
      const endDateTime = `${workDate}T${slotEnd}:00`;
      
      // Kiểm tra xem slot này đã tồn tại chưa
      const exists = allAppointments.some(apt => {
        return apt.startTime === startDateTime && apt.endTime === endDateTime;
      });

      slots.push({ 
        startTime: slotStart, 
        endTime: slotEnd,
        date: workDate,
        scheduleId: schedule.scheduleId,
        exists: exists // Đánh dấu slot đã tồn tại
      });
    }

    return slots;
  };

  // Xử lý tạo nhanh slots dựa vào schedule
  const handleQuickCreate = async () => {
    if (!doctorId || !selectedSchedule) {
      alert("Vui lòng chọn lịch trình làm việc");
      return;
    }
    
    try {
      setLoading(true);
      const timeSlots = generateTimeSlotsFromSchedule(
        selectedSchedule,
        quickCreateData.slotDuration
      );
      
      // Lọc ra chỉ những slots chưa tồn tại
      const newSlots = timeSlots.filter(slot => !slot.exists);
      const existingCount = timeSlots.length - newSlots.length;
      
      if (newSlots.length === 0) {
        alert("Tất cả các khung giờ đã được tạo trước đó rồi!");
        setShowQuickCreateForm(false);
        setSelectedSchedule(null);
        return;
      }
      
      if (existingCount > 0) {
        const confirmMsg = `Có ${existingCount} khung giờ đã tồn tại.\nChỉ tạo ${newSlots.length} khung giờ mới?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
      
      // Tạo chỉ các appointment slots mới
      const createPromises = newSlots.map((slot) => {
        const startDateTime = `${slot.date}T${slot.startTime}:00`;
        const endDateTime = `${slot.date}T${slot.endTime}:00`;
        
        return appointmentApi.createAppointment({
          doctorId,
          scheduleId: slot.scheduleId, // BẮT BUỘC
          patientId: null,
          startTime: startDateTime,
          endTime: endDateTime,
          status: "Available",
          fee: quickCreateData.fee,
          notes: null,
        });
      });

      await Promise.all(createPromises);
      setShowQuickCreateForm(false);
      setSelectedSchedule(null);
      loadSlots();
      
      let message = `Đã tạo thành công ${newSlots.length} khung giờ mới`;
      if (existingCount > 0) {
        message += `\n(Bỏ qua ${existingCount} khung giờ đã tồn tại)`;
      }
      alert(message);
    } catch (err) {
      setError(
        "Không thể tạo khung giờ: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tạo hàng loạt slots cho nhiều schedules
  const handleBulkCreate = async () => {
    if (!doctorId || bulkCreateData.selectedScheduleIds.length === 0) {
      alert("Vui lòng chọn ít nhất một lịch trình");
      return;
    }

    try {
      setLoading(true);
      const createPromises = [];
      let totalSlots = 0;
      let existingSlots = 0;
      
      // Với mỗi schedule được chọn
      bulkCreateData.selectedScheduleIds.forEach((scheduleId) => {
        const schedule = doctorSchedules.find(s => s.scheduleId === scheduleId);
        if (!schedule) return;
        
        const timeSlots = generateTimeSlotsFromSchedule(
          schedule,
          bulkCreateData.slotDuration
        );
        
        // Lọc ra chỉ những slots chưa tồn tại
        const newSlots = timeSlots.filter(slot => !slot.exists);
        totalSlots += timeSlots.length;
        existingSlots += (timeSlots.length - newSlots.length);
        
        newSlots.forEach((slot) => {
          const startDateTime = `${slot.date}T${slot.startTime}:00`;
          const endDateTime = `${slot.date}T${slot.endTime}:00`;
          
          createPromises.push(
            appointmentApi.createAppointment({
              doctorId,
              scheduleId: slot.scheduleId,
              patientId: null,
              startTime: startDateTime,
              endTime: endDateTime,
              status: "Available",
              fee: bulkCreateData.fee,
              notes: null,
            })
          );
        });
      });

      if (createPromises.length === 0) {
        alert("Tất cả các khung giờ đã được tạo trước đó rồi!");
        setShowBulkCreateForm(false);
        setBulkCreateData({
          selectedScheduleIds: [],
          slotDuration: 30,
          fee: 200000,
        });
        return;
      }
      
      if (existingSlots > 0) {
        const confirmMsg = `Có ${existingSlots} khung giờ đã tồn tại.\nChỉ tạo ${createPromises.length} khung giờ mới?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }

      await Promise.all(createPromises);
      setShowBulkCreateForm(false);
      setBulkCreateData({
        selectedScheduleIds: [],
        slotDuration: 30,
        fee: 200000,
      });
      loadSlots();
      
      let message = `Đã tạo thành công ${createPromises.length} khung giờ mới`;
      if (existingSlots > 0) {
        message += `\n(Bỏ qua ${existingSlots} khung giờ đã tồn tại)`;
      }
      alert(message);
    } catch (err) {
      setError(
        "Không thể tạo khung giờ: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Xóa slot
  const handleDeleteSlot = async (appointmentId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) {
      try {
        await appointmentApi.deleteAppointment(appointmentId);
        loadSlots();
      } catch (err) {
        setError(
          "Không thể xóa khung giờ: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  // Lọc slots theo ngày được chọn và ngày trong tuần
  const filteredSlots = slots.filter((slot) => {
    const slotDate = new Date(slot.startTime);
    const dayOfWeek = slotDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayMapping = {
      "Monday": 1,
      "Tuesday": 2, 
      "Wednesday": 3,
      "Thursday": 4,
      "Friday": 5,
      "Saturday": 6,
      "Sunday": 0
    };
    
    // Filter by selected date
    if (selectedDate) {
      const slotDateStr = slot.startTime.split("T")[0];
      const match = slotDateStr === selectedDate;
      if (!match) {
        console.log(`⚠️ Date mismatch: slot=${slotDateStr}, selected=${selectedDate}`);
        return false;
      }
    }
    
    // Filter by day of week
    if (dayOfWeekFilter !== "All") {
      const dayMatch = dayOfWeek === dayMapping[dayOfWeekFilter];
      console.log(`🔍 Day filter: slotDay=${dayOfWeek}, filterDay=${dayMapping[dayOfWeekFilter]}, match=${dayMatch}`);
      return dayMatch;
    }
    
    return true;
  });
  
  console.log("🔍 Filtered slots count:", filteredSlots.length, "Total slots:", slots.length);
  console.log("🔍 Day of week filter:", dayOfWeekFilter);
  console.log("🔍 Selected date:", selectedDate);
  console.log("🔍 Sample slots:", slots.slice(0, 3).map(s => ({
    startTime: s.startTime,
    dayOfWeek: new Date(s.startTime).getDay(),
    date: s.startTime.split("T")[0]
  })));

  // Kiểm tra slot đã được đặt chưa
  const isSlotBooked = (slot) => {
    return slot.patientId != null;
  };

  // Format helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const weekdays = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return `${weekdays[date.getDay()]}, ${date.toLocaleDateString("vi-VN")}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const time = new Date(timeString);
    return time.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Helper function to format date for display (MM/DD/YYYY)
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');
    return `${formattedMonth}/${formattedDay}/${year}`;
  };

  // Nhóm slots theo ngày
  const groupSlotsByDate = (slotsToGroup) => {
    const grouped = {};
    slotsToGroup.forEach((slot) => {
      const date = slot.startTime.split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    
    // Sắp xếp slots theo thời gian trong mỗi ngày
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );
    });
    
    return grouped;
  };

  // Thống kê
  const bookedCount = allAppointments.filter(
    (apt) => apt.patientId != null && apt.status !== "Từ chối lịch hẹn"
  ).length;
  const availableCount = slots.length;

  if (loading && !slots.length) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(viewMode === "calendar" ? filteredSlots : slots);
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="w-full mx-0 px-0">
      <div className="row justify-content-center" style={{ margin: 0 }}>
        <div className="col-lg-12">
          <div className="card shadow rounded-4 border w-100">
            {/* Header */}
            <div className="card-header bg-white rounded-top-4 border-bottom py-4 px-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <span
                    className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 48, height: 48 }}
                  >
                    <i className="bi bi-clock" style={{ fontSize: "1.5rem" }}></i>
                  </span>
                  <div>
                    <h3 className="mb-1 fw-bold">Quản lý khung giờ khám</h3>
                    <p className="mb-0 text-muted" style={{ fontSize: "1rem" }}>
                      Tạo và quản lý các khung giờ cho bệnh nhân đặt lịch
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 flex-wrap align-items-center">
                  <div className="d-flex gap-2 align-items-center">
                    <div>                      
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control"
                          style={{ 
                            maxWidth: 200, 
                            paddingRight: "40px",
                            borderRadius: "0.5rem"
                          }}
                          value={formatDisplayDate(selectedDate)}
                          readOnly
                          placeholder="MM/DD/YYYY"
                        />
                        <i 
                          className="bi bi-calendar position-absolute" 
                          style={{ 
                            right: "12px", 
                            top: "50%", 
                            transform: "translateY(-50%)",
                            color: "#6c757d",
                            pointerEvents: "none"
                          }}
                        ></i>
                        <input
                          type="date"
                          className="position-absolute"
                          style={{ 
                            opacity: 0, 
                            width: "100%", 
                            height: "100%", 
                            cursor: "pointer",
                            top: 0,
                            left: 0
                          }}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setDayOfWeekFilter("All"); // Clear day of week filter when selecting specific date
                        }}
                        />
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedDate("")}
                      style={{ borderRadius: "0.5rem" }}
                    >
                      <i className="bi bi-calendar-x me-1"></i>
                      Xem tất cả
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success"
                      onClick={() => setShowQuickCreateForm(true)}
                      style={{ borderRadius: "0.5rem" }}
                    >
                      <i className="bi bi-lightning-charge"></i> Tạo nhanh
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowBulkCreateForm(true)}
                      style={{ borderRadius: "0.5rem" }}
                    >
                      <i className="bi bi-calendar-plus"></i> Tạo hàng loạt
                    </button>
                    <div className="btn-group" role="group">
                      <button
                        className={`btn ${
                          viewMode === "calendar"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setViewMode("calendar")}
                        style={{ 
                          borderRadius: "0.5rem 0 0 0.5rem",
                          borderRight: "none"
                        }}
                      >
                        <i className="bi bi-calendar3"></i> Lịch
                      </button>
                      <button
                        className={`btn ${
                          viewMode === "list" ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => setViewMode("list")}
                        style={{ 
                          borderRadius: "0 0.5rem 0.5rem 0",
                          borderLeft: "none"
                        }}
                      >
                        <i className="bi bi-list-ul"></i> Danh sách
                      </button>
                    </div>
                  </div>
                </div>
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
                    onClick={() => {
                      setDayOfWeekFilter("All");
                      setSelectedDate(""); // Clear selected date when choosing "All"
                    }}
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
                      onClick={() => {
                        setDayOfWeekFilter(day.key);
                        setSelectedDate(""); // Clear selected date when choosing day of week
                      }}
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
                    onClick={() => {
                      setDayOfWeekFilter("All");
                      setSelectedDate(""); // Clear selected date when resetting
                    }}
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

            {/* Body */}
            <div className="card-body px-4 py-4">

              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              {/* Calendar View */}
              {viewMode === "calendar" && (
                <div>

                  {filteredSlots.length === 0 ? (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-calendar-x text-muted"
                        style={{ fontSize: "4rem" }}
                      ></i>
                      <p className="text-muted mt-3 fs-5">
                        {(() => {
                          if (selectedDate && dayOfWeekFilter !== "All") {
                            const selectedDayName = dayOfWeekFilter === "Monday" ? "Thứ 2" :
                                                   dayOfWeekFilter === "Tuesday" ? "Thứ 3" :
                                                   dayOfWeekFilter === "Wednesday" ? "Thứ 4" :
                                                   dayOfWeekFilter === "Thursday" ? "Thứ 5" :
                                                   dayOfWeekFilter === "Friday" ? "Thứ 6" :
                                                   dayOfWeekFilter === "Saturday" ? "Thứ 7" :
                                                   dayOfWeekFilter === "Sunday" ? "Chủ nhật" : dayOfWeekFilter;
                            return `Chưa có khung giờ nào cho ${selectedDayName}`;
                          } else if (selectedDate) {
                            return `Chưa có khung giờ nào cho ngày ${formatDate(selectedDate + "T00:00:00")}`;
                          } else if (dayOfWeekFilter !== "All") {
                            const dayName = dayOfWeekFilter === "Monday" ? "Thứ 2" :
                                           dayOfWeekFilter === "Tuesday" ? "Thứ 3" :
                                           dayOfWeekFilter === "Wednesday" ? "Thứ 4" :
                                           dayOfWeekFilter === "Thursday" ? "Thứ 5" :
                                           dayOfWeekFilter === "Friday" ? "Thứ 6" :
                                           dayOfWeekFilter === "Saturday" ? "Thứ 7" :
                                           dayOfWeekFilter === "Sunday" ? "Chủ nhật" : dayOfWeekFilter;
                            return `Chưa có khung giờ nào cho ${dayName}`;
                          } else {
                            return "Chưa có khung giờ nào";
                          }
                        })()}
                      </p>
                      <p className="text-info">
                        Tổng tất cả: {allAppointments.length} appointments | 
                        Available slots: {slots.length}
                      </p>
                      <button
                        className="btn btn-success btn-lg mt-2 px-4"
                        onClick={() => setShowQuickCreateForm(true)}
                      >
                        <i className="bi bi-lightning-charge"></i> Tạo khung giờ
                      </button>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {filteredSlots.map((slot) => {
                        const booked = isSlotBooked(slot);
  return (
                          <div key={slot.appointmentId} className="col-md-6 col-lg-2">
                            <div
                              className={`card ${
                                booked
                                  ? "border-info bg-light"
                                  : "border-success"
                              }`}
                            >
                              <div className="card-body p-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>
                                    <i className="bi bi-clock text-primary me-1" style={{ fontSize: '0.85rem' }}></i>
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </h6>
                                  <span
                                    className={`badge ${
                                      booked ? "bg-info" : "bg-success"
                                    }`}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {booked ? "Đã đặt" : "Còn trống"}
                                  </span>
                                </div>
                                <p className="mb-0 fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                  <i className="bi bi-cash me-1" style={{ fontSize: '0.75rem' }}></i>
                                  {formatCurrency(slot.fee)}
                                </p>
                                {slot.notes && (
                                  <p className="card-text text-muted mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-sticky me-1"></i>
                                    {slot.notes}
                                  </p>
                                )}
                                {booked && slot.patientName && (
                                  <p className="card-text text-info mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-person me-1"></i>
                                    BN: {slot.patientName}
                                  </p>
                                )}
                                {!booked && (
                                  <button
                                    className="btn btn-sm btn-outline-danger mt-1 py-0 px-2"
                                    onClick={() =>
                                      handleDeleteSlot(slot.appointmentId)
                                    }
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    <i className="bi bi-trash" style={{ fontSize: '0.7rem' }}></i> Xóa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
    <div>
                  {sortedDates.length === 0 ? (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-calendar-x text-muted"
                        style={{ fontSize: "4rem" }}
                      ></i>
                      <p className="text-muted mt-3 fs-5">
                        Chưa có khung giờ nào
                      </p>
                      <button
                        className="btn btn-success btn-lg mt-2 px-4"
                        onClick={() => setShowQuickCreateForm(true)}
                      >
                        <i className="bi bi-lightning-charge"></i> Tạo khung giờ
                        đầu tiên
                      </button>
                    </div>
                  ) : (
                    sortedDates.map((date) => (
                      <div key={date} className="mb-4">
                        <h5 className="mb-3 fw-bold text-primary">
                          <i className="bi bi-calendar-day me-2"></i>
                          {formatDate(date + "T00:00:00")}
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Giờ bắt đầu</th>
                                <th>Giờ kết thúc</th>
                                <th>Giá khám</th>
                                <th>Trạng thái</th>
                                <th>Bệnh nhân</th>
                                <th className="text-center">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedSlots[date].map((slot) => {
                                const booked = isSlotBooked(slot);
                                return (
                                  <tr key={slot.appointmentId}>
                                    <td className="fw-semibold">
                                      {formatTime(slot.startTime)}
                                    </td>
                                    <td className="fw-semibold">
                                      {formatTime(slot.endTime)}
                                    </td>
                                    <td className="text-primary fw-bold">
                                      {formatCurrency(slot.fee)}
                                    </td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          booked ? "bg-info" : "bg-success"
                                        }`}
                                      >
                                        {booked ? "Đã đặt" : "Còn trống"}
                                      </span>
                                    </td>
                                    <td>{slot.patientName || "-"}</td>
                                    <td className="text-center">
                                      {!booked && (
                                        <button
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() =>
                                            handleDeleteSlot(slot.appointmentId)
                                          }
                                          title="Xóa"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tạo nhanh */}
      {showQuickCreateForm && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-lightning-charge me-2"></i>
                  Tạo nhanh khung giờ khám
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowQuickCreateForm(false);
                    setSelectedSchedule(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Bước 1:</strong> Chọn lịch trình làm việc<br/>
                  <strong>Bước 2:</strong> Chia thành các khung giờ nhỏ
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Chọn lịch trình làm việc <span className="text-danger">*</span>
                  </label>
                  {doctorSchedules.length === 0 ? (
                    <div className="alert alert-warning">
                      Chưa có lịch trình nào. Vui lòng tạo lịch trình ở <a href="/doctor/schedule">Quản lý lịch trình</a>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedSchedule?.scheduleId || ""}
                      onChange={(e) => {
                        const schedule = doctorSchedules.find(
                          s => s.scheduleId === parseInt(e.target.value)
                        );
                        setSelectedSchedule(schedule);
                      }}
                    >
                      <option value="">-- Chọn lịch trình --</option>
                      {doctorSchedules.map((schedule) => (
                        <option key={schedule.scheduleId} value={schedule.scheduleId}>
                          {formatDate(schedule.workDate + "T00:00:00")} ({schedule.startTime} - {schedule.endTime})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedSchedule && (
                  <>
                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <h6 className="card-title">Thông tin lịch trình</h6>
                        <p className="mb-1"><strong>Ngày:</strong> {formatDate(selectedSchedule.workDate + "T00:00:00")}</p>
                        <p className="mb-1"><strong>Giờ làm việc:</strong> {selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                        {selectedSchedule.notes && <p className="mb-0"><strong>Ghi chú:</strong> {selectedSchedule.notes}</p>}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Thời lượng mỗi khung (phút)</label>
                        <select
                          className="form-select"
                          value={quickCreateData.slotDuration}
                          onChange={(e) =>
                            setQuickCreateData({
                              ...quickCreateData,
                              slotDuration: parseInt(e.target.value),
                            })
                          }
                        >
                          <option value="15">15 phút</option>
                          <option value="30">30 phút</option>
                          <option value="45">45 phút</option>
                          <option value="60">60 phút</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">
                          Giá khám (VNĐ) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={quickCreateData.fee}
                          onChange={(e) =>
                            setQuickCreateData({
                              ...quickCreateData,
                              fee: parseInt(e.target.value),
                            })
                          }
                          min="0"
                          step="10000"
                        />
                      </div>
                    </div>

                    <div className="alert alert-success">
                      {(() => {
                        const allSlots = generateTimeSlotsFromSchedule(selectedSchedule, quickCreateData.slotDuration);
                        const newSlots = allSlots.filter(s => !s.exists);
                        const existingCount = allSlots.length - newSlots.length;
                        
                        return (
                          <>
                            <strong>Sẽ tạo:</strong>{" "}
                            {newSlots.length} khung giờ mới với giá {formatCurrency(quickCreateData.fee)}/khung
                            {existingCount > 0 && (
                              <div className="mt-2 text-warning">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                <strong>Chú ý:</strong> Có {existingCount} khung giờ đã tồn tại (sẽ bỏ qua)
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuickCreateForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleQuickCreate}
                  disabled={loading || !selectedSchedule}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Tạo ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo hàng loạt */}
      {showBulkCreateForm && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Tạo hàng loạt khung giờ khám
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBulkCreateForm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Chọn nhiều lịch trình và tạo khung giờ khám cho tất cả
                </div>

                {doctorSchedules.length === 0 ? (
                  <div className="alert alert-warning">
                    Chưa có lịch trình nào. Vui lòng tạo lịch trình ở <a href="/doctor/schedule">Quản lý lịch trình</a>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">
                        Chọn lịch trình <span className="text-danger">*</span>
                      </label>
                      <div className="border rounded p-3" style={{ maxHeight: 300, overflowY: "auto" }}>
                        {doctorSchedules.map((schedule) => (
                          <div key={schedule.scheduleId} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`schedule-${schedule.scheduleId}`}
                              checked={bulkCreateData.selectedScheduleIds.includes(schedule.scheduleId)}
                              onChange={(e) => {
                                const newIds = e.target.checked
                                  ? [...bulkCreateData.selectedScheduleIds, schedule.scheduleId]
                                  : bulkCreateData.selectedScheduleIds.filter(id => id !== schedule.scheduleId);
                                setBulkCreateData({
                                  ...bulkCreateData,
                                  selectedScheduleIds: newIds,
                                });
                              }}
                            />
                            <label className="form-check-label" htmlFor={`schedule-${schedule.scheduleId}`}>
                              <strong>{formatDate(schedule.workDate + "T00:00:00")}</strong> - {schedule.startTime} đến {schedule.endTime}
                              {schedule.notes && <small className="text-muted d-block">{schedule.notes}</small>}
                            </label>
                          </div>
                        ))}
                      </div>
                      <small className="text-muted">
                        Đã chọn: {bulkCreateData.selectedScheduleIds.length} lịch trình
                      </small>
                    </div>

                    {bulkCreateData.selectedScheduleIds.length > 0 && (
                      <>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Thời lượng mỗi khung (phút)</label>
                            <select
                              className="form-select"
                              value={bulkCreateData.slotDuration}
                              onChange={(e) =>
                                setBulkCreateData({
                                  ...bulkCreateData,
                                  slotDuration: parseInt(e.target.value),
                                })
                              }
                            >
                              <option value="15">15 phút</option>
                              <option value="30">30 phút</option>
                              <option value="45">45 phút</option>
                              <option value="60">60 phút</option>
                            </select>
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              Giá khám (VNĐ) <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={bulkCreateData.fee}
                              onChange={(e) =>
                                setBulkCreateData({
                                  ...bulkCreateData,
                                  fee: parseInt(e.target.value),
                                })
                              }
                              min="0"
                              step="10000"
                            />
                          </div>
                        </div>

                        <div className="alert alert-success">
                          {(() => {
                            let totalNew = 0;
                            let totalExisting = 0;
                            
                            bulkCreateData.selectedScheduleIds.forEach((scheduleId) => {
                              const schedule = doctorSchedules.find(s => s.scheduleId === scheduleId);
                              if (schedule) {
                                const allSlots = generateTimeSlotsFromSchedule(schedule, bulkCreateData.slotDuration);
                                const newSlots = allSlots.filter(s => !s.exists);
                                totalNew += newSlots.length;
                                totalExisting += (allSlots.length - newSlots.length);
                              }
                            });
                            
                            return (
                              <>
                                <strong>Sẽ tạo {totalNew} khung giờ mới</strong> cho {bulkCreateData.selectedScheduleIds.length} lịch trình<br/>
                                Giá: {formatCurrency(bulkCreateData.fee)}/khung
                                {totalExisting > 0 && (
                                  <div className="mt-2 text-warning">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    <strong>Chú ý:</strong> Có {totalExisting} khung giờ đã tồn tại (sẽ bỏ qua)
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBulkCreateForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBulkCreate}
                  disabled={loading || bulkCreateData.selectedScheduleIds.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Tạo hàng loạt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailableSlotManagement;
