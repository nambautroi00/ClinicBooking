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
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // calendar, month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    // Sử dụng local timezone để tránh lỗi ngày
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Modal hiển thị tất cả slots trong một ngày (tháng)
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState(""); // YYYY-MM-DD

  // State cho form tạo slots
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);

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
      
      // Hiển thị thông báo thành công
      setError(null);
      let message = `Đã tạo thành công ${createPromises.length} khung giờ mới`;
      if (existingSlots > 0) {
        message += ` (Bỏ qua ${existingSlots} khung giờ đã tồn tại)`;
      }
      setSuccessMessage(message);
      
      // Tự động ẩn thông báo sau 5 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
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


  // Không lọc theo ngày — hiển thị tất cả slots
  const filteredSlots = slots;
  
  console.log("🔍 Filtered slots count:", filteredSlots.length, "Total slots:", slots.length);
  console.log("🔍 Selected date:", selectedDate);

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

  // Calendar month helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getSlotsForDate = (date) => {
    // Sử dụng local timezone thay vì UTC để tránh lỗi ngày
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log(`🔍 getSlotsForDate: ${dateStr}`, {
      originalDate: date,
      year, month, day,
      slotsFound: slots.filter(slot => slot.startTime.split('T')[0] === dateStr).length
    });
    
    return slots.filter(slot => slot.startTime.split('T')[0] === dateStr);
  };

  // Lấy tất cả slot theo chuỗi ngày YYYY-MM-DD
  const getSlotsForDateStr = (dateStr) => {
    return slots
      .filter(slot => slot.startTime.split('T')[0] === dateStr)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
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

  const groupedSlots = groupSlotsByDate(filteredSlots);

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
                  {/* Đã loại bỏ lọc theo ngày và nút Xem tất cả theo yêu cầu */}
                  <div className="d-flex gap-2">
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
                          viewMode === "month"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setViewMode("month")}
                        style={{ 
                          borderRadius: "0 0.5rem 0.5rem 0",
                          borderLeft: "none"
                        }}
                      >
                        <i className="bi bi-calendar-month"></i> Tháng
                      </button>
                    </div>
                  </div>
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

              {successMessage && (
                <div className="alert alert-success alert-dismissible fade show">
                  <i className="bi bi-check-circle me-2"></i>
                  {successMessage}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSuccessMessage(null)}
                  ></button>
                </div>
              )}

              {/* Calendar View */}
              {viewMode === "calendar" && (
                <div>
                  <style jsx>{`
                    .calendar-container {
                      max-width: 100%;
                    }
                    
                    .calendar-day-card {
                      background: #fff;
                      border-radius: 12px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                      border: 1px solid #e9ecef;
                      overflow: hidden;
                    }
                    
                    .calendar-day-header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 16px 20px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    }
                    
                    .calendar-day-title {
                      margin: 0;
                      font-size: 1.1rem;
                      font-weight: 600;
                    }
                    
                    .calendar-day-count {
                      background: rgba(255,255,255,0.2);
                      padding: 4px 12px;
                      border-radius: 20px;
                      font-size: 0.9rem;
                      font-weight: 500;
                    }
                    
                    .calendar-slots-grid {
                      display: grid;
                      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                      gap: 12px;
                      padding: 20px;
                    }
                    
                    .calendar-slot {
                      background: #f8f9fa;
                      border: 2px solid #e9ecef;
                      border-radius: 8px;
                      padding: 12px;
                      position: relative;
                      transition: all 0.2s ease;
                      min-height: 100px;
                    }
                    
                    .calendar-slot:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    
                    .calendar-slot.available {
                      border-color: #28a745;
                      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                    }
                    
                    .calendar-slot.booked {
                      border-color: #17a2b8;
                      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
                    }
                    
                    .slot-time {
                      font-weight: 600;
                      color: #495057;
                      margin-bottom: 8px;
                      font-size: 0.95rem;
                    }
                    
                    .slot-price {
                      color: #28a745;
                      font-weight: 600;
                      margin-bottom: 8px;
                      font-size: 0.9rem;
                    }
                    
                    .slot-status {
                      margin-bottom: 8px;
                    }
                    
                    .slot-patient {
                      color: #17a2b8;
                      font-size: 0.85rem;
                      font-weight: 500;
                    }
                    
                    .slot-delete-btn {
                      position: absolute;
                      top: 8px;
                      right: 8px;
                      background: #dc3545;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      width: 24px;
                      height: 24px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 0.8rem;
                      transition: all 0.2s ease;
                    }
                    
                    .slot-delete-btn:hover {
                      background: #c82333;
                      transform: scale(1.1);
                    }
                    
                    @media (max-width: 768px) {
                      .calendar-slots-grid {
                        grid-template-columns: 1fr;
                        padding: 16px;
                      }
                      
                      .calendar-day-header {
                        padding: 12px 16px;
                        flex-direction: column;
                        gap: 8px;
                        text-align: center;
                      }
                      
                      .calendar-day-title {
                        font-size: 1rem;
                      }
                    }
                  `}</style>

                  {filteredSlots.length === 0 ? (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-calendar-x text-muted"
                        style={{ fontSize: "4rem" }}
                      ></i>
                      <p className="text-muted mt-3 fs-5">Chưa có khung giờ nào</p>
                      <p className="text-info">
                        Tổng tất cả: {allAppointments.length} appointments | 
                        Available slots: {slots.length}
                      </p>
                      <button
                        className="btn btn-primary btn-lg mt-2 px-4"
                        onClick={() => setShowBulkCreateForm(true)}
                      >
                        <i className="bi bi-calendar-plus"></i> Tạo khung giờ
                      </button>
                    </div>
                  ) : (
                    <div className="calendar-container">
                      {Object.entries(groupedSlots).map(([date, daySlots]) => (
                        <div key={date} className="calendar-day-card mb-4">
                          <div className="calendar-day-header">
                            <h5 className="calendar-day-title">
                              <i className="bi bi-calendar-day me-2"></i>
                              {formatDate(date + "T00:00:00")}
                            </h5>
                            <span className="calendar-day-count">
                              {daySlots.length} khung giờ
                            </span>
                          </div>
                          <div className="calendar-slots-grid">
                            {daySlots.map((slot) => {
                        const booked = isSlotBooked(slot);
  return (
                                <div
                                  key={slot.appointmentId}
                                  className={`calendar-slot ${booked ? 'booked' : 'available'}`}
                                >
                                  <div className="slot-time">
                                    <i className="bi bi-clock me-1"></i>
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </div>
                                  <div className="slot-price">
                                    <i className="bi bi-cash me-1"></i>
                                    {formatCurrency(slot.fee)}
                                  </div>
                                  <div className="slot-status">
                                    <span className={`badge ${booked ? 'bg-info' : 'bg-success'}`}>
                                    {booked ? "Đã đặt" : "Còn trống"}
                                  </span>
                                </div>
                                {booked && slot.patientName && (
                                    <div className="slot-patient">
                                    <i className="bi bi-person me-1"></i>
                                      {slot.patientName}
                                    </div>
                                )}
                                {!booked && (
                                  <button
                                      className="slot-delete-btn"
                                      onClick={() => handleDeleteSlot(slot.appointmentId)}
                                      title="Xóa khung giờ"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Month Calendar View */}
              {viewMode === "month" && (
                <div>
                  <style jsx>{`
                    .month-calendar {
                      background: white;
                      border-radius: 12px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                      overflow: hidden;
                    }
                    
                    .month-header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 20px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    }
                    
                    .month-title {
                      font-size: 1.5rem;
                      font-weight: 600;
                      margin: 0;
                    }
                    
                    .month-nav {
                      display: flex;
                      align-items: center;
                      gap: 15px;
                    }
                    
                    .nav-btn {
                      background: rgba(255,255,255,0.2);
                      border: none;
                      color: white;
                      width: 40px;
                      height: 40px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    }
                    
                    .nav-btn:hover {
                      background: rgba(255,255,255,0.3);
                      transform: scale(1.1);
                    }
                    
                    .today-btn {
                      background: rgba(255,255,255,0.2);
                      border: none;
                      color: white;
                      padding: 8px 16px;
                      border-radius: 20px;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      font-size: 0.9rem;
                    }
                    
                    .today-btn:hover {
                      background: rgba(255,255,255,0.3);
                    }
                    
                    .weekdays {
                      display: grid;
                      grid-template-columns: repeat(7, 1fr);
                      background: #f8f9fa;
                      border-bottom: 1px solid #dee2e6;
                    }
                    
                    .weekday {
                      padding: 15px 10px;
                      text-align: center;
                      font-weight: 600;
                      color: #495057;
                      font-size: 0.9rem;
                    }
                    
                    .calendar-grid {
                      display: grid;
                      grid-template-columns: repeat(7, 1fr);
                      gap: 1px;
                      background: #dee2e6;
                    }
                    
                    .calendar-day {
                      background: white;
                      min-height: 80px;
                      padding: 6px;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      position: relative;
                    }
                    
                    .calendar-day:hover {
                      background: #f8f9fa;
                    }
                    
                    .calendar-day.other-month {
                      background: #f8f9fa;
                      color: #adb5bd;
                    }
                    
                    .calendar-day.today {
                      background: #e3f2fd;
                      border: 2px solid #2196f3;
                    }
                    
                    .day-number {
                      font-weight: 600;
                      font-size: 0.8rem;
                      margin-bottom: 2px;
                    }
                    
                    .day-slots {
                      display: flex;
                      flex-direction: column;
                      gap: 1px;
                    }
                    
                    .slot-indicator {
                      background: #28a745;
                      color: white;
                      padding: 1px 4px;
                      border-radius: 8px;
                      font-size: 0.6rem;
                      text-align: center;
                      font-weight: 500;
                    }
                    
                    .slot-indicator.booked {
                      background: #17a2b8;
                    }
                    
                    .slot-indicator.available {
                      background: #28a745;
                    }
                    
                    @media (max-width: 768px) {
                      .month-header {
                        padding: 15px;
                        flex-direction: column;
                        gap: 15px;
                      }
                      
                      .month-title {
                        font-size: 1.2rem;
                      }
                      
                      .calendar-day {
                        min-height: 60px;
                        padding: 3px;
                      }
                      
                      .weekday {
                        padding: 8px 4px;
                        font-size: 0.7rem;
                      }
                      
                      .day-number {
                        font-size: 0.7rem;
                      }
                      
                      .slot-indicator {
                        font-size: 0.5rem;
                        padding: 1px 3px;
                      }
                    }
                  `}</style>

                  <div className="month-calendar">
                    <div className="month-header">
                      <h2 className="month-title">
                        tháng {currentMonth.getMonth() + 1} năm {currentMonth.getFullYear()}
                      </h2>
                      <div className="month-nav">
                        <button 
                          className="nav-btn"
                          onClick={() => navigateMonth('prev')}
                        >
                          <i className="bi bi-chevron-left"></i>
                                  </button>
                        <button 
                          className="today-btn"
                          onClick={goToToday}
                        >
                          <i className="bi bi-calendar-day me-1"></i>
                          Hôm nay
                        </button>
                        <button 
                          className="nav-btn"
                          onClick={() => navigateMonth('next')}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div className="weekdays">
                      <div className="weekday">CN</div>
                      <div className="weekday">T2</div>
                      <div className="weekday">T3</div>
                      <div className="weekday">T4</div>
                      <div className="weekday">T5</div>
                      <div className="weekday">T6</div>
                      <div className="weekday">T7</div>
                    </div>
                    
                    <div className="calendar-grid">
                      {getDaysInMonth(currentMonth).map((day, index) => {
                        const isToday = day.date.toDateString() === new Date().toDateString();
                        const daySlots = getSlotsForDate(day.date);
                        const availableSlots = daySlots.filter(slot => !isSlotBooked(slot));
                        const bookedSlots = daySlots.filter(slot => isSlotBooked(slot));
                        
                        return (
                          <div
                            key={index}
                            className={`calendar-day ${
                              !day.isCurrentMonth ? 'other-month' : ''
                            } ${isToday ? 'today' : ''}`}
                            onClick={() => {
                              if (!day.isCurrentMonth) return;
                              const year = day.date.getFullYear();
                              const month = String(day.date.getMonth() + 1).padStart(2, '0');
                              const dayNum = String(day.date.getDate()).padStart(2, '0');
                              const dateStr = `${year}-${month}-${dayNum}`;
                              setModalDateStr(dateStr);
                              setShowSlotsModal(true);
                            }}
                          >
                            <div className="day-number">
                              {day.date.getDate()}
                            </div>
                            <div className="day-slots">
                              {availableSlots.length > 0 && (
                                <div className="slot-indicator available">
                                  {availableSlots.length} trống
                                </div>
                              )}
                              {bookedSlots.length > 0 && (
                                <div className="slot-indicator booked">
                                  {bookedSlots.length} đã đặt
                              </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Modal: Tất cả khung giờ trong ngày (từ lịch tháng) */}
      {showSlotsModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-day me-2"></i>
                  {modalDateStr ? formatDate(modalDateStr + "T00:00:00") : "Danh sách khung giờ"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSlotsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const daySlots = modalDateStr ? getSlotsForDateStr(modalDateStr) : [];
                  if (daySlots.length === 0) {
                    return (
                      <div className="text-center py-4 text-muted">
                        Không có khung giờ nào
                      </div>
                    );
                  }
                  return (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{width: '35%'}}>Giờ</th>
                            <th style={{width: '20%'}}>Giá</th>
                            <th style={{width: '20%'}}>Trạng thái</th>
                            <th style={{width: '25%'}} className="text-end">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySlots.map((slot) => {
                            const booked = isSlotBooked(slot);
                            return (
                              <tr key={slot.appointmentId}>
                                <td>
                                  <i className="bi bi-clock me-1"></i>
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </td>
                                <td className="text-success fw-semibold">
                                  {formatCurrency(slot.fee)}
                                </td>
                                <td>
                                  <span className={`badge ${booked ? 'bg-info' : 'bg-success'}`}
                                    style={{ fontSize: '0.75rem' }}>
                                    {booked ? 'Đã đặt' : 'Còn trống'}
                                  </span>
                                  {booked && slot.patientName && (
                                    <small className="text-info ms-2">
                                      <i className="bi bi-person me-1"></i>
                                      {slot.patientName}
                                    </small>
                                  )}
                                </td>
                                <td className="text-end">
                                  {!booked && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteSlot(slot.appointmentId)}
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
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSlotsModal(false)}
                >
                  Đóng
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
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0">
                          Chọn lịch trình <span className="text-danger">*</span>
                        </label>
                        <div className="d-flex gap-2">
                <button
                  type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              const allIds = doctorSchedules.map(s => s.scheduleId);
                              setBulkCreateData({
                                ...bulkCreateData,
                                selectedScheduleIds: allIds,
                              });
                            }}
                          >
                            <i className="bi bi-check-all me-1"></i>
                            Chọn tất cả
                </button>
                <button
                  type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                              setBulkCreateData({
                                ...bulkCreateData,
                                selectedScheduleIds: [],
                              });
                            }}
                          >
                            <i className="bi bi-x-square me-1"></i>
                            Bỏ chọn tất cả
                </button>
              </div>
            </div>
                      

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
