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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal hiển thị tất cả slots trong một ngày (tháng)
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [modalDateStr, setModalDateStr] = useState(""); // YYYY-MM-DD

  // Modal xác nhận xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);

  // State cho form tạo slots
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [createProgress, setCreateProgress] = useState({
    current: 0,
    total: 0,
  });

  // Helper function to add timeout to promises
  const withTimeout = useCallback((promise, timeoutMs = 8000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
      ),
    ]);
  }, []);

  // Load allAppointments và schedules khi mở modal để đảm bảo dữ liệu mới nhất
  useEffect(() => {
    if (showBulkCreateForm && doctorId) {
      Promise.allSettled([
        withTimeout(appointmentApi.getAppointmentsByDoctor(doctorId), 10000),
        withTimeout(doctorScheduleApi.getSchedulesByDoctor(doctorId), 10000),
      ])
        .then(([appointmentsResult, schedulesResult]) => {
          const appointmentsResponse =
            appointmentsResult.status === "fulfilled"
              ? appointmentsResult.value
              : { data: [] };
          const schedulesResponse =
            schedulesResult.status === "fulfilled"
              ? schedulesResult.value
              : { data: [] };

          setAllAppointments(appointmentsResponse.data || []);
          // Load tất cả Available schedules, không filter theo tháng
          const allSchedules = schedulesResponse.data || [];
          const availableSchedules = allSchedules.filter(
            (s) => s.status === "Available"
          );
          setDoctorSchedules(availableSchedules);
        })
        .catch((err) => {
          console.error("Error loading data for modal:", err);
          setAllAppointments([]);
          setDoctorSchedules([]);
        });
    }
  }, [showBulkCreateForm, doctorId, withTimeout]);

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

      // Clear slots trước khi load để tránh hiển thị dữ liệu cũ
      setSlots([]);

      // Tính toán range tháng hiện tại
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      // Load song song - lấy TẤT CẢ appointments (bao gồm cả đã đặt) với timeout
      const [appointmentsResponse, schedulesResponse] =
        await Promise.allSettled([
          withTimeout(appointmentApi.getAppointmentsByDoctor(doctorId), 10000),
          withTimeout(doctorScheduleApi.getSchedulesByDoctor(doctorId), 10000),
        ]);

      // Extract data with fallback
      const allAppointmentsData =
        appointmentsResponse.status === "fulfilled"
          ? appointmentsResponse.value?.data || appointmentsResponse.value || []
          : [];
      const schedulesData =
        schedulesResponse.status === "fulfilled"
          ? schedulesResponse.value?.data || schedulesResponse.value || []
          : [];

      // Filter appointments theo tháng hiện tại
      const monthAppointments = allAppointmentsData.filter((appt) => {
        const apptDate = new Date(appt.startTime);
        return apptDate >= startDate && apptDate <= endDate;
      });

      setSlots(monthAppointments);

      // Filter schedules ở frontend - lấy tất cả Available schedules (không filter theo tháng trong modal)
      // Vì user có thể muốn tạo khung giờ cho tháng khác
      const allSchedules = schedulesData;
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
  }, [doctorId, currentMonth, withTimeout]);

  useEffect(() => {
    if (doctorId) loadSlots();
  }, [doctorId, currentMonth, loadSlots]);

  // Tạo các time slots từ DoctorSchedule
  const generateTimeSlotsFromSchedule = useCallback(
    (schedule, duration) => {
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
        const exists = allAppointments.some((apt) => {
          return apt.startTime === startDateTime && apt.endTime === endDateTime;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          date: workDate,
          scheduleId: schedule.scheduleId,
          exists: exists, // Đánh dấu slot đã tồn tại
        });
      }

      return slots;
    },
    [allAppointments]
  );

  // Xử lý tạo hàng loạt slots cho nhiều schedules (sử dụng bulk endpoint)
  const handleBulkCreate = async (data) => {
    // Nếu được gọi từ component mới (có parameter data)
    const selectedIds =
      data?.selectedScheduleIds || bulkCreateData.selectedScheduleIds;
    const duration = data?.slotDuration || bulkCreateData.slotDuration;
    const feeAmount = data?.fee || bulkCreateData.fee;

    if (!doctorId || selectedIds.length === 0) {
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
        const allResponse = await appointmentApi.getAppointmentsByDoctor(
          doctorId
        );
        setAllAppointments(allResponse.data || []);
      }

      // Với mỗi schedule được chọn
      selectedIds.forEach((scheduleId) => {
        const schedule = doctorSchedules.find(
          (s) => s.scheduleId === scheduleId
        );
        if (!schedule) return;

        const timeSlots = generateTimeSlotsFromSchedule(schedule, duration);

        // Lọc ra chỉ những slots chưa tồn tại
        const newSlots = timeSlots.filter((slot) => !slot.exists);
        existingSlots += timeSlots.length - newSlots.length;

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
            fee: feeAmount,
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
      const response = await appointmentApi.bulkCreateAppointments(
        doctorId,
        appointmentsToCreate
      );

      // Cập nhật progress
      setCreateProgress({
        current: response.data.successCount || appointmentsToCreate.length,
        total: appointmentsToCreate.length,
      });

      // Reload slots và appointments TRƯỚC KHI đóng modal để cập nhật trạng thái
      await loadSlots();

      // Reload allAppointments để cập nhật tính toán "có thể tạo"
      const allResponse = await appointmentApi.getAppointmentsByDoctor(
        doctorId
      );
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
      let message = `Đã tạo thành công ${
        bulkResponse.successCount || 0
      } khung giờ mới`;
      if (bulkResponse.failedCount > 0) {
        message += ` (${bulkResponse.failedCount} khung giờ không thể tạo)`;
      }
      if (existingSlots > 0) {
        message += ` (Bỏ qua ${existingSlots} khung giờ đã tồn tại)`;
      }

      // Hiển thị lỗi nếu có
      if (
        bulkResponse.errors &&
        bulkResponse.errors.length > 0 &&
        bulkResponse.errors.length <= 5
      ) {
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
          (err.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi không xác định")
      );
      setCreateProgress({ current: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Xóa slot - hiển thị modal xác nhận
  const handleDeleteSlot = async (slot) => {
    setSlotToDelete(slot);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa slot
  const confirmDeleteSlot = async () => {
    if (!slotToDelete) return;

    try {
      // Kiểm tra slot đã được đặt chưa
      if (slotToDelete.patientId != null) {
        setError("Không thể xóa khung giờ đã có bệnh nhân đặt lịch!");
        setShowDeleteModal(false);
        setSlotToDelete(null);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Gọi API xóa VĨNH VIỄN (permanent delete)
      const response = await appointmentApi.permanentDeleteAppointment(
        slotToDelete.appointmentId
      );

      // Kiểm tra response có thành công không
      if (response && (response.status === 200 || response.status === 204)) {
        // Reload lại dữ liệu
        //await loadSlots();

        // Reload allAppointments để cập nhật tính toán
        if (doctorId) {
          const allResponse = await appointmentApi.getAppointmentsByDoctor(
            doctorId
          );
          setAllAppointments(allResponse.data || []);
        }

        // Đóng cả modal danh sách khung giờ
        setShowSlotsModal(false);

        setSuccessMessage("Đã xóa khung giờ thành công");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error("API không trả về kết quả thành công");
      }
    } catch (err) {
      console.error("Lỗi khi xóa khung giờ:", err);
      setError(
        "Không thể xóa khung giờ: " +
          (err.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi không xác định")
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setShowDeleteModal(false);
      setSlotToDelete(null);
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
        isCurrentMonth: false,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      // Tạo Date mới với cùng năm/tháng để đảm bảo reference thay đổi
      return new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    });
    // useEffect sẽ tự động reload slots khi currentMonth thay đổi
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Helper: Format Date object thành YYYY-MM-DD string
  const formatDateToStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Lấy slots cho một ngày cụ thể
  const getSlotsForDate = (date) => {
    const dateStr = formatDateToStr(date);
    return slots.filter((slot) => slot.startTime.split("T")[0] === dateStr);
  };

  // Lấy tất cả slot theo chuỗi ngày YYYY-MM-DD (cho modal)
  const getSlotsForDateStr = (dateStr) => {
    return slots
      .filter((slot) => slot.startTime.split("T")[0] === dateStr)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

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
                    <i
                      className="bi bi-clock"
                      style={{ fontSize: "1.5rem" }}
                    ></i>
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
                    <i className="bi bi-calendar-plus"></i> Tạo khung giờ
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
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                  }

                  .month-header {
                    background: linear-gradient(
                      135deg,
                      #4a5568 0%,
                      #2d3748 100%
                    );
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
                    background: rgba(255, 255, 255, 0.2);
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
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                  }

                  .today-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                  }

                  .today-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
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
                      tháng {currentMonth.getMonth() + 1} năm{" "}
                      {currentMonth.getFullYear()}
                    </h2>
                    <div className="month-nav">
                      <button
                        className="nav-btn"
                        onClick={() => navigateMonth("prev")}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <button className="today-btn" onClick={goToToday}>
                        <i className="bi bi-calendar-day me-1"></i>
                        Hôm nay
                      </button>
                      <button
                        className="nav-btn"
                        onClick={() => navigateMonth("next")}
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
                      const isToday =
                        day.date.toDateString() === new Date().toDateString();
                      const daySlots = getSlotsForDate(day.date);
                      const availableSlots = daySlots.filter(
                        (slot) => !isSlotBooked(slot)
                      );
                      const bookedSlots = daySlots.filter((slot) =>
                        isSlotBooked(slot)
                      );

                      return (
                        <div
                          key={index}
                          className={`calendar-day ${
                            !day.isCurrentMonth ? "other-month" : ""
                          } ${isToday ? "today" : ""}`}
                          onClick={() => {
                            if (!day.isCurrentMonth) return;
                            setModalDateStr(formatDateToStr(day.date));
                            setShowSlotsModal(true);
                          }}
                        >
                          <div className="day-number">{day.date.getDate()}</div>
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
                  {modalDateStr
                    ? formatDate(modalDateStr + "T00:00:00")
                    : "Danh sách khung giờ"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSlotsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {(() => {
                  const daySlots = modalDateStr
                    ? getSlotsForDateStr(modalDateStr)
                    : [];
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
                            <th style={{ width: "35%" }}>Giờ</th>
                            <th style={{ width: "20%" }}>Giá</th>
                            <th style={{ width: "20%" }}>Trạng thái</th>
                            <th style={{ width: "25%" }} className="text-end">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySlots.map((slot) => {
                            const booked = isSlotBooked(slot);
                            return (
                              <tr key={slot.appointmentId}>
                                <td>
                                  <i className="bi bi-clock me-1"></i>
                                  {formatTime(slot.startTime)} -{" "}
                                  {formatTime(slot.endTime)}
                                </td>
                                <td className="text-primary fw-semibold">
                                  {formatCurrency(slot.fee)}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      booked ? "bg-primary" : "bg-secondary"
                                    }`}
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {booked ? "Đã đặt" : "Còn trống"}
                                  </span>
                                  {/* {booked && slot.patientName && (
                                    <small className="text-info ms-2">
                                      <i className="bi bi-person me-1"></i>
                                      {slot.patientName}
                                    </small>
                                  )} */}
                                </td>
                                <td className="text-end">
                                  {!booked && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteSlot(slot)}
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

      {/* Modal Tạo hàng loạt - Interactive Calendar */}
      {showBulkCreateForm && (
        <InteractiveCalendarSlotCreator
          doctorSchedules={doctorSchedules}
          allAppointments={allAppointments}
          onSubmit={handleBulkCreate}
          onClose={() => {
            setShowBulkCreateForm(false);
            setBulkCreateData({
              selectedScheduleIds: [],
              slotDuration: 30,
              fee: 200000,
            });
          }}
          loading={loading}
          createProgress={createProgress}
        />
      )}

      {/* Modal xác nhận xóa khung giờ */}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
          onClick={() => {
            setShowDeleteModal(false);
            setSlotToDelete(null);
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  Xác nhận xóa
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSlotToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {slotToDelete && (
                  <div className="mb-3">
                    <div className="alert alert-light border">
                      <div className="d-flex align-items-start gap-2">
                        <i
                          className="bi bi-clock text-primary"
                          style={{ fontSize: "1.5rem" }}
                        ></i>
                        <div className="flex-grow-1">
                          <div className="mb-2">
                            <strong className="text-primary">Thời gian:</strong>
                            <div className="mt-1">
                              {formatTime(slotToDelete.startTime)} -{" "}
                              {formatTime(slotToDelete.endTime)}
                            </div>
                          </div>
                          <div>
                            <strong className="text-primary">Ngày:</strong>
                            <div className="mt-1">
                              {formatDate(slotToDelete.startTime)}
                            </div>
                          </div>
                          {slotToDelete.fee && (
                            <div className="mt-2">
                              <strong className="text-primary">
                                Phí khám:
                              </strong>
                              <div className="mt-1 text-success fw-bold">
                                {formatCurrency(slotToDelete.fee)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <p className="mb-0">Bạn có chắc chắn muốn xóa khung giờ này?</p>
                <p className="text-muted small mb-0 mt-2">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSlotToDelete(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteSlot}
                >
                  <i className="bi bi-trash me-1"></i>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Interactive Calendar Component for Slot Creation
const InteractiveCalendarSlotCreator = ({
  doctorSchedules,
  allAppointments,
  onSubmit,
  onClose,
  loading,
  createProgress,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [fee, setFee] = useState(200000);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const formatDateToStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getSchedulesForDate = (date) => {
    const dateStr = formatDateToStr(date);
    return doctorSchedules.filter((schedule) => schedule.workDate === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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

      const exists = allAppointments.some((apt) => {
        return apt.startTime === startDateTime && apt.endTime === endDateTime;
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        date: workDate,
        scheduleId: schedule.scheduleId,
        exists: exists,
      });
    }

    return slots;
  };

  const getScheduleSlotInfo = (schedule) => {
    if (!schedule) return { canCreate: 0, totalPossible: 0, isFull: true };

    const allSlots = generateTimeSlotsFromSchedule(schedule, slotDuration);
    const newSlots = allSlots.filter((s) => !s.exists);

    return {
      canCreate: newSlots.length,
      totalPossible: allSlots.length,
      existing: allSlots.length - newSlots.length,
      isFull: newSlots.length === 0 && allSlots.length > 0,
    };
  };

  const toggleScheduleSelection = (scheduleId) => {
    setSelectedScheduleIds((prev) => {
      if (prev.includes(scheduleId)) {
        return prev.filter((id) => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  // Toggle tất cả lịch trình trong một ngày
  const toggleDaySchedules = (date) => {
    const daySchedules = getSchedulesForDate(date);
    const availableSchedules = daySchedules.filter((schedule) => {
      const slotInfo = getScheduleSlotInfo(schedule);
      return !slotInfo.isFull;
    });

    if (availableSchedules.length === 0) return;

    const dayScheduleIds = availableSchedules.map((s) => s.scheduleId);
    const allSelected = dayScheduleIds.every((id) =>
      selectedScheduleIds.includes(id)
    );

    setSelectedScheduleIds((prev) => {
      if (allSelected) {
        // Nếu tất cả đã chọn -> bỏ chọn tất cả
        return prev.filter((id) => !dayScheduleIds.includes(id));
      } else {
        // Nếu chưa chọn hết -> chọn tất cả
        const newIds = [...prev];
        dayScheduleIds.forEach((id) => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedScheduleIds.length === 0) {
      alert("Vui lòng chọn ít nhất một lịch trình");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = () => {
    onSubmit({
      selectedScheduleIds,
      slotDuration,
      fee,
    });
    setShowConfirmation(false);
  };

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const days = getDaysInMonth(currentDate);

  const totalNewSlots = selectedScheduleIds.reduce((sum, scheduleId) => {
    const schedule = doctorSchedules.find((s) => s.scheduleId === scheduleId);
    if (schedule) {
      const slotInfo = getScheduleSlotInfo(schedule);
      return sum + slotInfo.canCreate;
    }
    return sum;
  }, 0);

  const totalExistingSlots = selectedScheduleIds.reduce((sum, scheduleId) => {
    const schedule = doctorSchedules.find((s) => s.scheduleId === scheduleId);
    if (schedule) {
      const slotInfo = getScheduleSlotInfo(schedule);
      return sum + slotInfo.existing;
    }
    return sum;
  }, 0);

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1050,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog modal-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div
            className="modal-header bg-gradient text-white py-2"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            }}
          >
            <div>
              <h5 className="modal-title mb-0">
                <i className="bi bi-calendar-plus me-2"></i>
                Tạo khung giờ khám
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="modal-body p-3"
              style={{ maxHeight: "calc(100vh - 150px)", overflowY: "auto" }}
            >
              {/* Calendar Navigation */}
              <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={goToPreviousMonth}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <div className="text-center">
                  <h5 className="mb-0 fw-bold text-primary">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={goToNextMonth}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid-container mb-3">
                <div
                  className="calendar-weekdays d-grid mb-2"
                  style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}
                >
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                    <div
                      key={day}
                      className="text-center fw-bold text-muted py-1"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div
                  className="calendar-days d-grid"
                  style={{
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                    minHeight: "300px",
                  }}
                >
                  {days.map((date, index) => {
                    if (!date) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="calendar-day-empty"
                        ></div>
                      );
                    }

                    const daySchedules = getSchedulesForDate(date);
                    const isCurrentDay = isToday(date);
                    const isCurrentMonth =
                      date.getMonth() === currentDate.getMonth();

                    return (
                      <div
                        key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                        className={`calendar-day-slot ${
                          isCurrentDay ? "today" : ""
                        } ${!isCurrentMonth ? "other-month" : ""}`}
                        style={{
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                          padding: "4px",
                          minHeight: "50px",
                          backgroundColor: isCurrentDay
                            ? "#e3f2fd"
                            : !isCurrentMonth
                            ? "#f8f9fa"
                            : "white",
                          opacity: !isCurrentMonth ? 0.5 : 1,
                          cursor:
                            daySchedules.length > 0 ? "pointer" : "default",
                        }}
                        onClick={() => {
                          // Click vào ô ngày sẽ toggle tất cả lịch trình trong ngày
                          if (daySchedules.length > 0) {
                            toggleDaySchedules(date);
                          }
                        }}
                      >
                        <div
                          className="day-number fw-bold mb-1"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {date.getDate()}
                        </div>
                        <div
                          className="schedules-list"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}
                        >
                          {daySchedules.map((schedule) => {
                            const slotInfo = getScheduleSlotInfo(schedule);
                            const isSelected = selectedScheduleIds.includes(
                              schedule.scheduleId
                            );
                            const isFull = slotInfo.isFull;

                            return (
                              <div
                                key={schedule.scheduleId}
                                className={`schedule-item ${
                                  isSelected ? "selected" : ""
                                } ${isFull ? "full" : ""}`}
                                style={{
                                  padding: "5px 6px",
                                  borderRadius: "5px",
                                  fontSize: "0.75rem",
                                  cursor: isFull ? "not-allowed" : "pointer",
                                  backgroundColor: isSelected
                                    ? "#2563eb"
                                    : isFull
                                    ? "#e0e0e0"
                                    : "#dbeafe",
                                  color: isSelected
                                    ? "white"
                                    : isFull
                                    ? "#757575"
                                    : "#1e40af",
                                  border: isSelected
                                    ? "2px solid #1d4ed8"
                                    : "1px solid transparent",
                                  opacity: isFull ? 0.6 : 1,
                                  transition: "all ease",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation(); // Ngăn event bubble lên ô ngày
                                  if (!isFull) {
                                    toggleScheduleSelection(
                                      schedule.scheduleId
                                    );
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (!isFull) {
                                    e.currentTarget.style.transform =
                                      "scale(1.02)";
                                    e.currentTarget.style.boxShadow =
                                      "0 2px 4px rgba(0,0,0,0.1)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                title={`${schedule.startTime}-${
                                  schedule.endTime
                                }\n${
                                  isFull
                                    ? "Đã đầy"
                                    : `Có thể tạo ${slotInfo.canCreate} khung`
                                }`}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>
                                    {schedule.startTime.substring(0, 5)}-
                                    {schedule.endTime.substring(0, 5)}
                                  </span>
                                  {!isFull && (
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: isSelected
                                          ? "rgba(255,255,255,0.3)"
                                          : "rgba(37,99,235,0.15)",
                                        color: isSelected ? "white" : "#2563eb",
                                        fontSize: "0.7rem",
                                        padding: "2px 5px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {slotInfo.canCreate}
                                    </span>
                                  )}
                                  {isFull && (
                                    <i
                                      className="bi bi-check-circle-fill"
                                      style={{ fontSize: "0.7rem" }}
                                    ></i>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Configuration */}
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-gear text-primary me-2"></i>
                    Cấu hình khung giờ
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Thời lượng mỗi khung (phút)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={slotDuration}
                        onChange={(e) =>
                          setSlotDuration(parseInt(e.target.value))
                        }
                        min="5"
                        max="120"
                        step="5"
                        placeholder="Nhập số phút (5-120)"
                      />
                      {/* <small className="text-muted">
                        Gợi ý: 15, 30, 45 hoặc 60 phút
                      </small> */}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Giá khám (VNĐ)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={fee}
                        onChange={(e) => setFee(parseInt(e.target.value))}
                        min="0"
                        step="10000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {/* {selectedScheduleIds.length > 0 && (
                <div className="alert alert-info">
                  <strong>
                    <i className="bi bi-info-circle me-2"></i>
                    Đã chọn {selectedScheduleIds.length} lịch trình
                  </strong>
                  <div className="mt-2">
                    • Sẽ tạo:{" "}
                    <strong className="text-success">
                      {totalNewSlots} khung giờ mới
                    </strong>
                    <br />• Giá: {formatCurrency(fee)}/khung
                    {totalExistingSlots > 0 && (
                      <div className="text-warning mt-1">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        {totalExistingSlots} khung giờ đã tồn tại (sẽ bỏ qua)
                      </div>
                    )}
                  </div>
                </div>
              )} */}
            </div>

            <div className="modal-footer bg-light border-top-0 py-2">
              <button
                type="button"
                className="btn btn-secondary px-3"
                onClick={onClose}
              >
                <i className="bi bi-x-circle me-1"></i>
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary px-3 shadow"
                disabled={loading || selectedScheduleIds.length === 0}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Tạo {totalNewSlots} khung giờ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 1060,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmation(false);
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content shadow-lg border-0">
              <div
                className="modal-header text-white py-3"
                style={{
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                }}
              >
                <h5 className="modal-title fw-bold mb-0">
                  <i className="bi bi-clipboard-check-fill me-2"></i>
                  Xác nhận tạo khung giờ
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div
                  className="alert alert-primary d-flex align-items-center justify-content-center mb-3 py-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                    border: "1px solid #90caf9",
                  }}
                >
                  <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className="bi bi-calendar3 text-primary"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <span
                        className="fw-bold text-primary"
                        style={{ fontSize: "2rem", lineHeight: "1" }}
                      >
                        {selectedScheduleIds.length}
                      </span>
                      <span
                        className="text-muted fw-semibold"
                        style={{ fontSize: "1rem" }}
                      >
                        lịch trình
                      </span>
                    </div>
                    <div
                      style={{
                        width: "2px",
                        height: "36px",
                        background: "#90caf9",
                      }}
                    ></div>
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className="bi bi-clock-history text-primary"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <span
                        className="fw-bold text-primary"
                        style={{ fontSize: "2rem", lineHeight: "1" }}
                      >
                        {totalNewSlots}
                      </span>
                      <span
                        className="text-muted fw-semibold"
                        style={{ fontSize: "1rem" }}
                      >
                        khung giờ
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="alert alert-warning border-warning d-flex align-items-start mb-3 py-2"
                  style={{
                    borderLeft: "3px solid #fbbf24",
                    fontSize: "0.9rem",
                  }}
                >
                  <i
                    className="bi bi-exclamation-triangle-fill text-warning me-2"
                    style={{ fontSize: "1.3rem" }}
                  ></i>
                  <div>
                    <strong>Lưu ý:</strong> Các khung giờ sẽ được tạo và bệnh
                    nhân có thể đặt lịch ngay lập tức.
                  </div>
                </div>

                <h6 className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>
                  <i className="bi bi-list-check me-1 text-primary"></i>
                  Chi tiết:
                </h6>

                <div
                  className="table-responsive"
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <table className="table table-sm table-hover mb-0">
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background:
                          "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                      }}
                    >
                      <tr>
                        <th
                          className="fw-bold"
                          style={{ fontSize: "0.85rem", padding: "10px 6px" }}
                        >
                          Ngày
                        </th>
                        <th
                          className="fw-bold"
                          style={{ fontSize: "0.85rem", padding: "10px 6px" }}
                        >
                          Giờ
                        </th>
                        <th
                          className="fw-bold text-center"
                          style={{ fontSize: "0.85rem", padding: "10px 6px" }}
                        >
                          Số khung
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedScheduleIds.map((scheduleId) => {
                        const schedule = doctorSchedules.find(
                          (s) => s.scheduleId === scheduleId
                        );
                        if (!schedule) return null;
                        const slotInfo = getScheduleSlotInfo(schedule);
                        return (
                          <tr key={scheduleId}>
                            <td
                              style={{
                                fontSize: "0.85rem",
                                padding: "8px 6px",
                              }}
                            >
                              {formatDate(schedule.workDate + "T00:00:00")}
                            </td>
                            <td
                              style={{
                                fontSize: "0.85rem",
                                padding: "8px 6px",
                              }}
                            >
                              {schedule.startTime} - {schedule.endTime}
                            </td>
                            <td
                              className="text-center"
                              style={{
                                fontSize: "0.85rem",
                                padding: "8px 6px",
                              }}
                            >
                              <span className="badge bg-success">
                                {slotInfo.canCreate}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light border-0 p-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary shadow-sm"
                  onClick={handleConfirmedSubmit}
                  disabled={loading}
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    border: "none",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Đang tạo... ({createProgress.current}/
                      {createProgress.total})
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Xác nhận tạo {totalNewSlots} khung giờ
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
