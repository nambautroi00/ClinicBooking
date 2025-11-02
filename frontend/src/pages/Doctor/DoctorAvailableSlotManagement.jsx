import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal hiển thị tất cả slots trong một ngày (tháng)
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState(""); // YYYY-MM-DD

  // State cho form tạo slots
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [createProgress, setCreateProgress] = useState({ current: 0, total: 0 });
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState("");
  const [showFullSchedules, setShowFullSchedules] = useState(false); // Hiển thị lịch trình đã đầy

  // Load allAppointments và schedules khi mở modal để đảm bảo dữ liệu mới nhất
  useEffect(() => {
    if (showBulkCreateForm && doctorId) {
      Promise.all([
        appointmentApi.getAppointmentsByDoctor(doctorId),
        doctorScheduleApi.getSchedulesByDoctor(doctorId)
      ])
        .then(([appointmentsResponse, schedulesResponse]) => {
          setAllAppointments(appointmentsResponse.data || []);
          // Load tất cả Available schedules, không filter theo tháng
          const allSchedules = schedulesResponse.data || [];
          const availableSchedules = allSchedules.filter(
            (s) => s.status === "Available"
          );
          setDoctorSchedules(availableSchedules);
        })
        .catch(err => {
          console.error("Error loading data for modal:", err);
        });
    }
  }, [showBulkCreateForm, doctorId]);

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

  // Load slots và schedules - chỉ load cho tháng hiện tại để tăng tốc
  const loadSlots = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Tính toán range tháng hiện tại
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      // Format dates cho API (ISO string với time)
      const startDateTime = startDate.toISOString().slice(0, 19); // Remove 'Z' và milliseconds
      const endDateTime = endDate.toISOString().slice(0, 19);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Load song song - backend sẽ filter theo date range (tối ưu hơn)
      const [availableResponse, schedulesResponse] = await Promise.all([
        appointmentApi.getAvailableSlots(doctorId, startDateTime, endDateTime),
        doctorScheduleApi.getSchedulesByDoctor(doctorId),
      ]);
      
      // Backend đã filter slots theo tháng, chỉ cần set
      setSlots(availableResponse.data || []);
      
      // Filter schedules ở frontend - lấy tất cả Available schedules (không filter theo tháng trong modal)
      // Vì user có thể muốn tạo khung giờ cho tháng khác
      const allSchedules = schedulesResponse.data || [];
      const availableSchedules = allSchedules.filter(
        (s) => s.status === "Available"
      );
      setDoctorSchedules(availableSchedules);
      
      // Không cần load allAppointments ngay - chỉ load khi mở form tạo hàng loạt
    } catch (err) {
      console.error("❌ ERROR loading slots:", err);
      setError(
        "Không thể tải khung giờ: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentMonth]);

  useEffect(() => {
    if (doctorId) loadSlots();
  }, [doctorId, currentMonth, loadSlots]);


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


  // Xử lý tạo hàng loạt slots cho nhiều schedules (sử dụng bulk endpoint)
  const handleBulkCreate = async () => {
    if (!doctorId || bulkCreateData.selectedScheduleIds.length === 0) {
      alert("Vui lòng chọn ít nhất một lịch trình");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Chuẩn bị danh sách appointments để gửi
      const appointmentsToCreate = [];
      let existingSlots = 0;
      
      // Load allAppointments nếu chưa có (để check exists trong generateTimeSlotsFromSchedule)
      if (allAppointments.length === 0) {
        const allResponse = await appointmentApi.getAppointmentsByDoctor(doctorId);
        setAllAppointments(allResponse.data || []);
      }
      
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
        existingSlots += (timeSlots.length - newSlots.length);
        
        newSlots.forEach((slot) => {
          const startDateTime = `${slot.date}T${slot.startTime}:00`;
          const endDateTime = `${slot.date}T${slot.endTime}:00`;
          
          appointmentsToCreate.push({
            doctorId,
            scheduleId: slot.scheduleId,
            patientId: null,
            startTime: startDateTime,
            endTime: endDateTime,
            status: "Available",
            fee: bulkCreateData.fee,
            notes: null,
          });
        });
      });

      if (appointmentsToCreate.length === 0) {
        alert("Tất cả các khung giờ đã được tạo trước đó rồi!");
        setLoading(false);
        setShowBulkCreateForm(false);
        setBulkCreateData({
          selectedScheduleIds: [],
          slotDuration: 30,
          fee: 200000,
        });
        return;
      }
      
      if (existingSlots > 0) {
        const confirmMsg = `Có ${existingSlots} khung giờ đã tồn tại.\nChỉ tạo ${appointmentsToCreate.length} khung giờ mới?`;
        if (!window.confirm(confirmMsg)) {
          setLoading(false);
          return;
        }
      }

      // Hiển thị progress
      setCreateProgress({ current: 0, total: appointmentsToCreate.length });

      // Gọi bulk endpoint để tạo tất cả cùng lúc
      const response = await appointmentApi.bulkCreateAppointments(doctorId, appointmentsToCreate);
      
      // Cập nhật progress
      setCreateProgress({ 
        current: response.data.successCount || appointmentsToCreate.length, 
        total: appointmentsToCreate.length 
      });
      
      // Reload slots và appointments TRƯỚC KHI đóng modal để cập nhật trạng thái
      await loadSlots();
      
      // Reload allAppointments để cập nhật tính toán "có thể tạo"
      const allResponse = await appointmentApi.getAppointmentsByDoctor(doctorId);
      setAllAppointments(allResponse.data || []);
      
      // Đóng modal và reset sau khi đã reload xong
      setShowBulkCreateForm(false);
      setCreateProgress({ current: 0, total: 0 });
      setBulkCreateData({
        selectedScheduleIds: [],
        slotDuration: 30,
        fee: 200000,
      });
      
      // Hiển thị thông báo thành công với chi tiết
      const bulkResponse = response.data;
      let message = `Đã tạo thành công ${bulkResponse.successCount || 0} khung giờ mới`;
      if (bulkResponse.failedCount > 0) {
        message += ` (${bulkResponse.failedCount} khung giờ không thể tạo)`;
      }
      if (existingSlots > 0) {
        message += ` (Bỏ qua ${existingSlots} khung giờ đã tồn tại)`;
      }
      
      // Hiển thị lỗi nếu có
      if (bulkResponse.errors && bulkResponse.errors.length > 0 && bulkResponse.errors.length <= 5) {
        console.warn("Các lỗi khi tạo:", bulkResponse.errors);
      }
      
      setSuccessMessage(message);
      
      // Tự động ẩn thông báo sau 5 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Lỗi khi tạo bulk appointments:", err);
      setError(
        "Không thể tạo khung giờ: " +
          (err.response?.data?.message || err.message || "Đã xảy ra lỗi không xác định")
      );
      setCreateProgress({ current: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Xóa slot
  const handleDeleteSlot = async (appointmentId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) {
      try {
        await appointmentApi.deleteAppointment(appointmentId);
        await loadSlots();
        // Reload allAppointments để cập nhật tính toán
        if (doctorId) {
          const allResponse = await appointmentApi.getAppointmentsByDoctor(doctorId);
          setAllAppointments(allResponse.data || []);
        }
      } catch (err) {
        setError(
          "Không thể xóa khung giờ: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };


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
    // Reload slots khi đổi tháng
    if (doctorId) {
      loadSlots();
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Helper: Format Date object thành YYYY-MM-DD string
  const formatDateToStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Lấy slots cho một ngày cụ thể
  const getSlotsForDate = (date) => {
    const dateStr = formatDateToStr(date);
    return slots.filter(slot => slot.startTime.split('T')[0] === dateStr);
  };

  // Lấy tất cả slot theo chuỗi ngày YYYY-MM-DD (cho modal)
  const getSlotsForDateStr = (dateStr) => {
    return slots
      .filter(slot => slot.startTime.split('T')[0] === dateStr)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  // Tính số slot có thể tạo cho mỗi schedule
  const getScheduleSlotInfo = useCallback((schedule, slotDuration) => {
    if (!schedule) return { canCreate: 0, totalPossible: 0, isFull: true };
    
    const allSlots = generateTimeSlotsFromSchedule(schedule, slotDuration);
    const newSlots = allSlots.filter(s => !s.exists);
    
    return {
      canCreate: newSlots.length,
      totalPossible: allSlots.length,
      existing: allSlots.length - newSlots.length,
      isFull: newSlots.length === 0 && allSlots.length > 0
    };
  }, [allAppointments]);

  // Filter schedules theo search term và trạng thái đầy
  const filteredSchedules = useMemo(() => {
    let filtered = doctorSchedules;
    
    // Filter theo search term
    if (scheduleSearchTerm.trim()) {
      const searchLower = scheduleSearchTerm.toLowerCase();
      filtered = filtered.filter(schedule => {
        const dateStr = formatDate(schedule.workDate + "T00:00:00").toLowerCase();
        const timeStr = `${schedule.startTime}-${schedule.endTime}`.toLowerCase();
        const notesStr = (schedule.notes || "").toLowerCase();
        return dateStr.includes(searchLower) || 
               timeStr.includes(searchLower) || 
               notesStr.includes(searchLower);
      });
    }
    
    // Filter theo trạng thái đầy (ẩn các schedule đã đầy nếu không bật showFullSchedules)
    if (!showFullSchedules) {
      filtered = filtered.filter(schedule => {
        const slotInfo = getScheduleSlotInfo(schedule, bulkCreateData.slotDuration);
        return !slotInfo.isFull;
      });
    }
    
    return filtered;
  }, [doctorSchedules, scheduleSearchTerm, showFullSchedules, bulkCreateData.slotDuration, getScheduleSlotInfo]);

  if (loading && !slots.length) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

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
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
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
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowBulkCreateForm(true)}
                    style={{ borderRadius: "0.5rem" }}
                  >
                    <i className="bi bi-calendar-plus"></i> Tạo hàng loạt
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

              {/* Month Calendar View - Chỉ hiển thị dạng tháng */}
              <div>
                  <style jsx>{`
                    .month-calendar {
                      background: white;
                      border-radius: 12px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                      overflow: hidden;
                    }
                    
                    .month-header {
                      background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
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
                      background: #edf2f7;
                      border: 2px solid #4299e1;
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
                      background: #718096;
                      color: white;
                      padding: 1px 4px;
                      border-radius: 8px;
                      font-size: 0.6rem;
                      text-align: center;
                      font-weight: 500;
                    }
                    
                    .slot-indicator.booked {
                      background: #4299e1;
                    }
                    
                    .slot-indicator.available {
                      background: #48bb78;
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
                              setModalDateStr(formatDateToStr(day.date));
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

              {/* Empty state */}
              {!loading && slots.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: "4rem" }}></i>
                  <p className="text-muted mt-3 fs-5">Chưa có khung giờ nào</p>
                  <button
                    className="btn btn-primary btn-lg mt-2 px-4"
                    onClick={() => setShowBulkCreateForm(true)}
                  >
                    <i className="bi bi-calendar-plus"></i> Tạo khung giờ
                  </button>
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
                                <td className="text-primary fw-semibold">
                                  {formatCurrency(slot.fee)}
                                </td>
                                <td>
                                  <span className={`badge ${booked ? 'bg-primary' : 'bg-secondary'}`}
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
                  onClick={() => {
                    setShowBulkCreateForm(false);
                    setScheduleSearchTerm("");
                    setShowFullSchedules(false);
                    setBulkCreateData({
                      selectedScheduleIds: [],
                      slotDuration: 30,
                      fee: 200000,
                    });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {loading && createProgress.total > 0 && (
                  <div className="alert alert-info">
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="mb-1">Đang tạo khung giờ...</div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            role="progressbar"
                            style={{ width: `${(createProgress.current / createProgress.total) * 100}%` }}
                            aria-valuenow={createProgress.current}
                            aria-valuemin="0"
                            aria-valuemax={createProgress.total}
                          >
                          </div>
                        </div>
                        <small className="text-muted">
                          {createProgress.current} / {createProgress.total} khung giờ đã tạo
                        </small>
                      </div>
                    </div>
                  </div>
                )}
                {!loading && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Chọn nhiều lịch trình và tạo khung giờ khám cho tất cả
                  </div>
                )}

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
                        <div className="d-flex gap-2 align-items-center">
                          {/* Toggle hiển thị lịch trình đã đầy */}
                          <div className="form-check form-switch me-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="showFullSchedules"
                              checked={showFullSchedules}
                              onChange={(e) => setShowFullSchedules(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="showFullSchedules">
                              Hiển thị đã đầy
                            </label>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              const allIds = filteredSchedules
                                .filter(s => {
                                  const slotInfo = getScheduleSlotInfo(s, bulkCreateData.slotDuration);
                                  return !slotInfo.isFull;
                                })
                                .map(s => s.scheduleId);
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
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                      

                      {(() => {
                        const fullCount = doctorSchedules.filter(s => {
                          const slotInfo = getScheduleSlotInfo(s, bulkCreateData.slotDuration);
                          return slotInfo.isFull;
                        }).length;
                        const availableCount = doctorSchedules.length - fullCount;
                        
                        return (
                          <div className="mb-2">
                            <small className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              Hiển thị {filteredSchedules.length} / {doctorSchedules.length} lịch trình
                              {!showFullSchedules && fullCount > 0 && (
                                <span className="text-success ms-2">
                                  (Ẩn {fullCount} lịch trình đã đầy)
                                </span>
                              )}
                            </small>
                          </div>
                        );
                      })()}

                      <div className="border rounded p-3" style={{ maxHeight: 450, overflowY: "auto", backgroundColor: 'white' }}>
                        {filteredSchedules.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            <i className="bi bi-calendar-x" style={{ fontSize: "2rem" }}></i>
                            <p className="mt-2 mb-0">
                              {scheduleSearchTerm ? "Không tìm thấy lịch trình" : "Tất cả lịch trình đã đầy"}
                            </p>
                          </div>
                        ) : (
                          filteredSchedules.map((schedule) => {
                            const slotInfo = getScheduleSlotInfo(schedule, bulkCreateData.slotDuration);
                            const isSelected = bulkCreateData.selectedScheduleIds.includes(schedule.scheduleId);
                            
                            return (
                              <div 
                                key={schedule.scheduleId}
                                className={`border rounded p-3 mb-2 ${isSelected ? 'border-primary bg-light' : 'border-secondary'} ${slotInfo.isFull ? 'opacity-50' : ''}`}
                                style={{ 
                                  cursor: slotInfo.isFull ? 'not-allowed' : 'pointer',
                                  backgroundColor: isSelected ? '#f8f9fa' : 'white'
                                }}
                                onClick={() => {
                                  if (slotInfo.isFull) return;
                                  const isCurrentlySelected = bulkCreateData.selectedScheduleIds.includes(schedule.scheduleId);
                                  const newIds = !isCurrentlySelected
                                    ? [...bulkCreateData.selectedScheduleIds, schedule.scheduleId]
                                    : bulkCreateData.selectedScheduleIds.filter(id => id !== schedule.scheduleId);
                                  setBulkCreateData({
                                    ...bulkCreateData,
                                    selectedScheduleIds: newIds,
                                  });
                                }}
                              >
                                <div className="d-flex align-items-start gap-3">
                                  <input
                                    className="form-check-input mt-1"
                                    type="checkbox"
                                    id={`schedule-${schedule.scheduleId}`}
                                    checked={isSelected}
                                    disabled={slotInfo.isFull}
                                    onChange={() => {}}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <div className="fw-semibold mb-1">
                                          {formatDate(schedule.workDate + "T00:00:00")}
                                        </div>
                                        <div className="text-muted small">
                                          {schedule.startTime} - {schedule.endTime}
                                        </div>
                                        {schedule.notes && (
                                          <div className="text-muted small mt-1">
                                            {schedule.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-end">
                                        {slotInfo.isFull ? (
                                          <span className="badge bg-secondary">
                                            Đã đầy
                                          </span>
                                        ) : (
                                          <span className="badge bg-success">
                                            Có thể tạo {slotInfo.canCreate} khung
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <small className="text-muted d-block mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Đã chọn: <strong>{bulkCreateData.selectedScheduleIds.length}</strong> lịch trình
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
                  onClick={() => {
                    setShowBulkCreateForm(false);
                    setScheduleSearchTerm("");
                    setShowFullSchedules(false);
                    setBulkCreateData({
                      selectedScheduleIds: [],
                      slotDuration: 30,
                      fee: 200000,
                    });
                  }}
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
                      Đang tạo... ({createProgress.current}/{createProgress.total})
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
