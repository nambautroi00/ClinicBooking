import React, { useState, useEffect, useCallback } from "react";
import doctorScheduleApi from "../../api/doctorScheduleApi";
import DoctorScheduleForm from "./DoctorScheduleForm";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";

const DoctorScheduleManagement = () => {
  // (Removed) time range filter state per request

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
  // (Removed) filterSchedulesByDate per request

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
  const handleUpdateSchedule = async (scheduleId, scheduleData) => {
    try {
      await doctorScheduleApi.updateSchedule(scheduleId, scheduleData);
      setEditingSchedule(null);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Validate date
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        console.error('Invalid date for getDaysInMonth:', date);
        return [];
      }
      
      // Get first day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      
      // Calculate the starting date (Sunday of the week containing the first day)
      const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startDate = new Date(year, month, 1 - dayOfWeek);
      
      const days = [];
      
      // Generate 42 days (6 weeks × 7 days) - Create new Date objects each time
      for (let i = 0; i < 42; i++) {
        const dayDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        days.push(dayDate);
      }
      
      return days;
    } catch (error) {
      console.error('Error in getDaysInMonth:', error);
      return [];
    }
  };

  const getSchedulesForDate = (date) => {
    // Use local timezone to avoid UTC day-shift issues (which hid Mondays)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return schedules.filter((schedule) => schedule.workDate === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      try {
        // Navigate to the first day of the target month
        const targetMonth = prev.getMonth() + direction;
        const targetYear = prev.getFullYear();
        
        // Create new date for the target month
        const newMonthDate = new Date(targetYear, targetMonth, 1);
        
        // Validate the new date
        if (isNaN(newMonthDate.getTime())) {
          console.error('Invalid date created during navigation:', { targetYear, targetMonth });
          return prev; // Return previous date if invalid
        }
        
        return newMonthDate;
      } catch (error) {
        console.error('Error in navigateMonth:', error);
        return prev; // Return previous date if error
      }
    });
  };

  // Bulk create schedules for a week
  const handleBulkCreateSchedules = async (bulkData) => {
    if (!doctorId) return;
    
    try {
      const { startDate, endDate, startTime, endTime, notes, daysOfWeek, shifts } = bulkData;
      const schedules = [];
      
      // Generate schedules for each selected day of the week (use local time parsing)
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
      
      console.log(`Start date: ${start.toISOString()}, End date: ${end.toISOString()}`);
      console.log(`Selected days of week: [${daysOfWeek.join(',')}]`);
      console.log(`Selected shifts: [${shifts ? shifts.join(',') : 'none'}]`);
      
      // Normalize selected days to numbers (defensive against string values)
      const selectedDays = (daysOfWeek || []).map(Number);

      // Create a new date object for each iteration to avoid mutation
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        // Use local timezone to avoid UTC shifting a day backward
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log(`Checking date: ${dateStr}, dayOfWeek: ${dayOfWeek}, selected days: [${selectedDays.join(',')}], includes: ${selectedDays.includes(dayOfWeek)}`);
        
        // Check if this day is selected
        if (selectedDays.includes(dayOfWeek)) {
          // If shifts are selected, create schedule for each shift
          if (shifts && shifts.length > 0) {
            shifts.forEach(shiftValue => {
              const shift = shiftOptions.find(s => s.value === shiftValue);
              if (shift) {
                // Use custom time if available, otherwise use default
                const customStartTime = bulkData[`${shiftValue}StartTime`] || shift.startTime;
                const customEndTime = bulkData[`${shiftValue}EndTime`] || shift.endTime;
                
                const scheduleData = {
                  doctorId,
                  workDate: dateStr,
                  startTime: customStartTime,
                  endTime: customEndTime,
                  notes: `${notes} (${shift.label})`,
                  status: 'Available'
                };
                
                console.log(`Creating schedule for: ${dateStr} - ${shift.label} (${customStartTime}-${customEndTime})`);
                schedules.push(scheduleData);
              }
            });
          } else {
            // Fallback to original time if no shifts selected
            const scheduleData = {
              doctorId,
              workDate: dateStr,
              startTime,
              endTime,
              notes,
              status: 'Available'
            };
            
            console.log(`Creating schedule for: ${dateStr}`);
            schedules.push(scheduleData);
          }
        }
        
        // Move to next day by creating a new Date object
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
      
      // Create all schedules
      console.log(`Total schedules to create: ${schedules.length}`);
      for (const schedule of schedules) {
        console.log(`Creating schedule for: ${schedule.workDate}`);
        try {
          await doctorScheduleApi.createSchedule(schedule);
          console.log(`✅ Successfully created schedule for: ${schedule.workDate}`);
        } catch (error) {
          console.error(`❌ Failed to create schedule for: ${schedule.workDate}`, error);
        }
      }
      
      setShowBulkForm(false);
      loadSchedules();
      
      // Show success message
      if (window.toast) {
        window.toast.success(`Đã tạo ${schedules.length} lịch trình thành công!`);
      }
      
    } catch (err) {
      setError("Không thể tạo lịch trình hàng loạt: " + (err.response?.data?.message || err.message));
    }
  };

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  // (Removed) date dropdown state per request
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);

  // Shift options for bulk creation
  const shiftOptions = [
    { value: 'morning', label: 'Ca sáng', startTime: '08:00', endTime: '12:00', icon: 'bi bi-sunrise' },
    { value: 'afternoon', label: 'Ca chiều', startTime: '13:00', endTime: '17:00', icon: 'bi bi-sunset' }
  ];

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

  // Reset selectedDate when currentDate changes
  useEffect(() => {
    setSelectedDate(null);
    setCalendarKey(prev => prev + 1); // Force calendar re-render
  }, [currentDate]);

  // Force calendar re-render when needed
  const forceCalendarRefresh = () => {
    setCalendarKey(prev => prev + 1);
    setSelectedDate(null);
  };

  // Safe modal close function
  const closeAllModals = () => {
    setTimeout(() => {
      setShowBulkForm(false);
      setEditingSchedule(null);
      setShowScheduleModal(false);
      setSelectedDate(null);
    }, 0);
  };

  // Safe modal close with re-render
  const closeModalSafely = (modalType) => {
    setTimeout(() => {
      switch (modalType) {
        case 'bulk':
          setShowBulkForm(false);
          break;
        case 'edit':
          setEditingSchedule(null);
          break;
        case 'schedule':
          setShowScheduleModal(false);
          setSelectedDate(null);
          break;
        default:
          closeAllModals();
      }
      setCalendarKey(prev => prev + 1);
    }, 0);
  };


  // Close all modals when component unmounts
  useEffect(() => {
    return () => {
      closeAllModals();
    };
  }, []);

  // Force re-render when modal states change
  useEffect(() => {
    if (showBulkForm || editingSchedule || showScheduleModal) {
      setCalendarKey(prev => prev + 1);
    }
  }, [showBulkForm, editingSchedule, showScheduleModal]);

  // Force re-render when schedules change
  useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [schedules]);

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
                  className="btn btn-success btn-sm"
                  onClick={() => setShowBulkForm(true)}
                  title="Tạo lịch trình cho cả tuần"
                >
                  <i className="bi bi-calendar-week"></i> Tạo lịch làm việc
                </button>
                
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    forceCalendarRefresh();
                    setCurrentDate(new Date());
                  }}
                  title="Làm mới dữ liệu"
                >
                  <i className="bi bi-arrow-clockwise"></i> Làm mới
                </button>
                {/* Đã loại bỏ chọn khoảng thời gian theo yêu cầu */}
                {/* Trạng thái đã được loại bỏ theo yêu cầu */}
              </div>
            </div>
            
            
            <div className="card-body px-4 py-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
              </div>
              )}
              
              {/* Calendar View Only */}
              <CalendarView 
                key={calendarKey}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                schedules={schedules}
                navigateMonth={navigateMonth}
                getDaysInMonth={getDaysInMonth}
                getSchedulesForDate={getSchedulesForDate}
                isToday={isToday}
                isSelected={isSelected}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusBadge={getStatusBadge}
                handleDeleteSchedule={handleDeleteSchedule}
                setEditingSchedule={setEditingSchedule}
                setShowScheduleModal={setShowScheduleModal}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Schedule Details Modal */}
      {showScheduleModal && selectedDate && (
        <div 
          key={`schedule-modal-container-${selectedDate.toISOString()}`}
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-calendar3 me-2"></i>
                  {formatDate(selectedDate.toISOString())}
                </h5>
                        <button
                          type="button"
                  className="btn-close btn-close-white"
                          onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedDate(null);
                  }}
                ></button>
              </div>
              
              <div className="modal-body">
                {getSchedulesForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: "3rem" }}></i>
                    <h5 className="mt-3 text-muted">Không có lịch trình nào</h5>
                    <p className="text-muted">Ngày này chưa có lịch trình được đặt</p>
                        <button
                      className="btn btn-primary"
                          onClick={() => {
                        setShowScheduleModal(false);
                        setShowBulkForm(true);
                          }}
                        >
                      <i className="bi bi-calendar-week me-1"></i>
                      Tạo cho cả tuần
                        </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {getSchedulesForDate(selectedDate).map((schedule) => {
                      const statusConfig = getStatusBadge(schedule.status);
                      return (
                        <div key={schedule.scheduleId} className="col-12">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-3">
                                  <i className="bi bi-clock text-primary"></i>
                                  <span className="fw-bold">
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={statusConfig.class} style={{ fontSize: "12px" }}>
                                    <i className={`${statusConfig.icon} me-1`}></i>
                                    {statusConfig.text}
                                  </span>
                                  <div className="btn-group btn-group-sm">
                        <button
                                      className="btn btn-outline-primary"
                          onClick={() => {
                                        setShowScheduleModal(false);
                                        setEditingSchedule(schedule);
                          }}
                                      title="Chỉnh sửa"
                        >
                                      <i className="bi bi-pencil"></i>
                        </button>
                        <button
                                      className="btn btn-outline-danger"
                          onClick={() => {
                                        handleDeleteSchedule(schedule.scheduleId);
                                        setShowScheduleModal(false);
                          }}
                                      title="Xóa"
                        >
                                      <i className="bi bi-trash"></i>
                        </button>
                </div>
              </div>
            </div>
            
                              <div className="row g-3 text-sm">
                                <div className="col-md-6">
                                  <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-calendar-check text-primary"></i>
                                    <span className="text-muted">Appointments:</span>
                                    <span className="fw-bold text-primary">
                                      {schedule.appointmentCount || 0}
                                    </span>
                                  </div>
                                </div>
                                {schedule.notes && (
                                  <div className="col-12">
                                    <div className="d-flex align-items-start gap-2">
                                      <i className="bi bi-sticky text-muted"></i>
                                      <div>
                                        <small className="text-muted">Ghi chú:</small>
                                        <p className="mb-0 small">{schedule.notes}</p>
                                      </div>
                                    </div>
                </div>
              )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                        <button
                          type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModalSafely('schedule')}
                >
                  Đóng
                        </button>
                        <button
                          type="button"
                  className="btn btn-primary"
                          onClick={() => {
                    setShowScheduleModal(false);
                    setShowBulkForm(true);
                          }}
                        >
                  <i className="bi bi-calendar-week me-1"></i>
                  Tạo cho cả tuần
                        </button>
                  </div>
                                </div>
                              </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkForm && (
        <div key="bulk-modal-container">
          <BulkScheduleForm
            key="bulk-form"
            onSubmit={handleBulkCreateSchedules}
            onClose={() => closeModalSafely('bulk')}
            shiftOptions={shiftOptions}
          />
                </div>
      )}


      {/* Modal cho form sửa lịch trình */}
      {editingSchedule && (
        <div key={`edit-modal-container-${editingSchedule.scheduleId}`}>
          <DoctorScheduleForm
            key={`edit-${editingSchedule.scheduleId}`}
            schedule={editingSchedule}
            onSubmit={(data) => handleUpdateSchedule(editingSchedule.scheduleId, data)}
            onClose={() => closeModalSafely('edit')}
                    />
                  </div>
                )}
              </div>
  );
};

// Calendar View Component
const CalendarView = ({
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  schedules,
  navigateMonth,
  getDaysInMonth,
  getSchedulesForDate,
  isToday,
  isSelected,
  formatDate,
  formatTime,
  getStatusBadge,
  handleDeleteSchedule,
  setEditingSchedule,
  setShowScheduleModal
}) => {
  // Add error handling for currentDate
  if (!currentDate || isNaN(currentDate.getTime())) {
    console.error('Invalid currentDate in CalendarView:', currentDate);
                                  return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Lỗi hiển thị lịch. Vui lòng làm mới trang.
            </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Debug: Log current state (remove in production)
  // console.log('CalendarView render:', { 
  //   currentDate: currentDate.toISOString(), 
  //   daysCount: days.length,
  //   firstDay: days[0]?.toISOString(),
  //   lastDay: days[days.length - 1]?.toISOString()
  // });
  
  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
                  <button
              className="btn btn-outline-primary btn-sm rounded-circle"
              onClick={() => navigateMonth(-1)}
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-chevron-left"></i>
                  </button>
            <h4 className="mb-0 fw-bold text-dark">
              {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </h4>
                    <button
              className="btn btn-outline-primary btn-sm rounded-circle"
              onClick={() => navigateMonth(1)}
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
                
                  <button 
            className="btn btn-primary btn-sm px-3"
            onClick={() => setCurrentDate(new Date())}
          >
            <i className="bi bi-calendar-day me-2"></i>
            Hôm nay
                  </button>
              </div>
            </div>
            
      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Week day headers */}
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="calendar-weekday">
              <span className="fw-semibold text-muted">{day}</span>
                </div>
          ))}
                  </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {days && days.length > 0 ? days.map((day, index) => {
            if (!day || isNaN(day.getTime())) {
              return <div key={`empty-${index}`} className="calendar-day-empty"></div>;
            }

            const daySchedules = getSchedulesForDate(day);
            const isCurrentDay = isToday(day);
            const isSelectedDay = isSelected(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    
                    return (
              <div
                key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${index}`}
                className={`calendar-day ${
                  isCurrentDay ? 'calendar-day-today' : ''
                } ${isSelectedDay ? 'calendar-day-selected' : ''} ${
                  !isCurrentMonth ? 'calendar-day-other-month' : ''
                }`}
                onClick={() => {
                  setSelectedDate(day);
                  setShowScheduleModal(true);
                }}
              >
                <div className="calendar-day-content">
                  {/* Day number */}
                  <div className="calendar-day-header">
                    <span className={`calendar-day-number ${
                      isCurrentDay ? 'text-white' : 
                      isSelectedDay ? 'text-primary' : 
                      !isCurrentMonth ? 'text-muted' :
                      'text-dark'
                    }`}>
                      {day.getDate()}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="calendar-day-badge">
                        {daySchedules.length}
                      </span>
                    )}
                              </div>
                              
                  {/* Schedule indicators */}
                  <div className="calendar-day-schedules">
                    {daySchedules.slice(0, 2).map((schedule) => {
                                  const statusConfig = getStatusBadge(schedule.status);
                                  return (
                        <div
                          key={schedule.scheduleId}
                          className={`calendar-schedule-item ${
                            schedule.status === 'Available' 
                              ? 'schedule-available' 
                              : 'schedule-completed'
                          }`}
                          title={`${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`}
                        >
                                  {formatTime(schedule.startTime)}
                                </div>
                      );
                    })}
                    {daySchedules.length > 2 && (
                      <div className="calendar-schedule-more">
                        +{daySchedules.length - 2} khác
                              </div>
                    )}
                                </div>
                                </div>
              </div>
            );
          }) : (
            <div className="alert alert-warning text-center py-4">
              <i className="bi bi-calendar-x me-2"></i>
              Không thể tải dữ liệu lịch. Vui lòng thử lại.
            </div>
          )}
                              </div>
                            </div>

      <style jsx>{`
        .calendar-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

        .calendar-header {
          padding: 24px 24px 0 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .calendar-grid {
          padding: 0;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }

        .calendar-weekday {
          padding: 16px 8px;
          text-align: center;
          font-weight: 600;
          color: #6c757d;
          border-right: 1px solid #e9ecef;
        }

        .calendar-weekday:last-child {
          border-right: none;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, 1fr);
          min-height: 300px;
        }

        .calendar-day {
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-height: 45px;
        }

        .calendar-day:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .calendar-day-today {
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          color: white;
        }

        .calendar-day-today:hover {
          background: linear-gradient(135deg, #0b5ed7 0%, #0a58ca 100%);
        }

        .calendar-day-selected {
          background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%);
          color: white;
        }

        .calendar-day-other-month {
          background: #f8f9fa;
          opacity: 0.6;
        }

        .calendar-day-empty {
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
          min-height: 45px;
        }

        .calendar-day-content {
          padding: 2px 1px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .calendar-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1px;
        }

        .calendar-day-number {
          font-weight: 600;
          font-size: 11px;
        }

        .calendar-day-badge {
          background: rgba(255, 255, 255, 0.9);
          color: #0d6efd;
          border-radius: 4px;
          padding: 0px 3px;
          font-size: 8px;
          font-weight: 600;
          min-width: 12px;
          text-align: center;
        }

        .calendar-day-today .calendar-day-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .calendar-day-schedules {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0px;
        }

        .calendar-schedule-item {
          padding: 0px 1px;
          border-radius: 2px;
          font-size: 7px;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .schedule-available {
          background: #d1edff;
          color: #0d6efd;
          border: 1px solid #b3d7ff;
        }

        .schedule-completed {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .calendar-day-today .schedule-available {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .calendar-day-today .schedule-completed {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .calendar-schedule-more {
          font-size: 6px;
          color: #6c757d;
          text-align: center;
          font-style: italic;
        }

        .calendar-day-today .calendar-schedule-more {
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: 35px;
          }
          
          .calendar-day-content {
            padding: 1px 0px;
          }
          
          .calendar-day-number {
            font-size: 9px;
          }
          
          .calendar-schedule-item {
            font-size: 6px;
            padding: 0px 0px;
          }
        }
      `}</style>
                            </div>
  );
};

// Bulk Schedule Form Component
const BulkScheduleForm = ({ onSubmit, onClose, shiftOptions }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    daysOfWeek: [],
    shifts: [] // Thêm ca làm việc
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDays = [
    { value: 0, label: 'Chủ nhật', short: 'CN' },
    { value: 1, label: 'Thứ 2', short: 'T2' },
    { value: 2, label: 'Thứ 3', short: 'T3' },
    { value: 3, label: 'Thứ 4', short: 'T4' },
    { value: 4, label: 'Thứ 5', short: 'T5' },
    { value: 5, label: 'Thứ 6', short: 'T6' },
    { value: 6, label: 'Thứ 7', short: 'T7' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.daysOfWeek.length === 0) {
      alert('Vui lòng chọn ít nhất một ngày trong tuần');
      return;
    }

    if (formData.shifts.length === 0) {
      alert('Vui lòng chọn ít nhất một ca làm việc');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('Ngày bắt đầu không được sau ngày kết thúc');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating bulk schedules:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDayOfWeek = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }));
  };

  const toggleShift = (shiftValue) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.includes(shiftValue)
        ? prev.shifts.filter(s => s !== shiftValue)
        : [...prev.shifts, shiftValue]
    }));
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-calendar-week me-2"></i>
              Tạo lịch làm việc 
            </h5>
                                  <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
                            </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* Date Range */}
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-calendar-date me-1"></i>
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    <i className="bi bi-calendar-date me-1"></i>
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                              </div>


                {/* Days of Week */}
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-calendar-week me-1"></i>
                    Ngày trong tuần *
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`btn ${

                          formData.daysOfWeek.includes(day.value)
                            ? 'btn-success'
                            : 'btn-outline-success'
                        }`}
                        style={{ minWidth: '80px' }}
                      >
                        <div className="fw-bold">{day.label}</div>
                                  </button>
                    ))}
                  </div>
                  
                            </div>

                {/* Ca làm việc */}
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-clock-history me-1"></i>
                    Ca làm việc *
                  </label>
                  <div className="row g-2">
                    {shiftOptions.map((shift) => (
                      <div key={shift.value} className="col-md-6">
                                  <button
                          type="button"
                          onClick={() => toggleShift(shift.value)}
                          className={`btn w-100 ${
                            formData.shifts.includes(shift.value)
                              ? 'btn-primary'
                              : 'btn-outline-primary'
                          }`}
                        >
                          <div className="d-flex align-items-center">
                            <i className={`${shift.icon} me-2`}></i>
                            <div className="text-start">
                              <div className="fw-bold">{shift.label}</div>
                              <small className="text-muted">{shift.startTime} - {shift.endTime}</small>
                                </div>
                              </div>
                        </button>
                      </div>
                    ))}
                            </div>
                          </div>

                {/* Thời gian tùy chỉnh cho ca */}
                {formData.shifts.length > 0 && (
                  <div className="col-12">
                    <div className="row g-3">
                      {formData.shifts.map((shiftValue) => {
                        const shift = shiftOptions.find(s => s.value === shiftValue);
                        return (
                          <div key={shiftValue} className="col-md-6">
                            <div className="card border-0 shadow-sm">
                              <div className="card-header bg-light border-0 py-3">
                                <div className="d-flex align-items-center">
                                  <i className={`${shift.icon} me-2 text-primary`}></i>
                                  <span className="fw-bold text-dark">{shift.label}</span>
                                  <span className="badge bg-primary ms-auto">
                                    {formData[`${shiftValue}StartTime`] || shift.startTime} - {formData[`${shiftValue}EndTime`] || shift.endTime}
                              </span>
                                </div>
                                </div>
                              <div className="card-body py-3">
                                <div className="row g-2">
                                  <div className="col-6">
                                    <label className="form-label small text-muted">Giờ bắt đầu</label>
                                    <input
                                      type="time"
                                      className="form-control form-control-sm border-primary"
                                      value={formData[`${shiftValue}StartTime`] || shift.startTime}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [`${shiftValue}StartTime`]: e.target.value
                                      }))}
                                    />
                              </div>
                              <div className="col-6">
                                    <label className="form-label small text-muted">Giờ kết thúc</label>
                                    <input
                                      type="time"
                                      className="form-control form-control-sm border-primary"
                                      value={formData[`${shiftValue}EndTime`] || shift.endTime}
                                      onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        [`${shiftValue}EndTime`]: e.target.value
                                      }))}
                                    />
                                </div>
                                </div>
                              </div>
                            </div>
                            </div>
                        );
                      })}
                            </div>
                  </div>
                )}

                            {/* Notes */}
                <div className="col-12">
                  <label className="form-label">
                    <i className="bi bi-sticky me-1"></i>
                    Ghi chú
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ghi chú cho tất cả lịch trình..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                                </div>

                {/* Preview */}
                {formData.startDate && formData.endDate && formData.daysOfWeek.length > 0 && formData.shifts.length > 0 && (
                  <div className="col-12">
                    <div className="card border-success">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">
                          <i className="bi bi-eye me-2"></i>
                          Xem trước lịch trình
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-calendar-range text-success me-2"></i>
                              <strong>Khoảng thời gian:</strong>
                            </div>
                            <p className="ms-4 mb-0 text-muted">
                              {formData.startDate} đến {formData.endDate}
                                </p>
                              </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-calendar-week text-success me-2"></i>
                              <strong>Ngày trong tuần:</strong>
                          </div>                     
                            <p className="ms-4 mb-0 text-muted">
                              {formData.daysOfWeek.map(day => 
                                weekDays.find(d => d.value === day)?.label
                              ).join(', ')}
                            </p>
                        </div>
                          <div className="col-12">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-clock-history text-success me-2"></i>
                              <strong>Ca làm việc:</strong>
                            </div>
                            <div className="ms-4">
                              {formData.shifts.map(shiftValue => {
                                const shift = shiftOptions.find(s => s.value === shiftValue);
                                const customStartTime = formData[`${shiftValue}StartTime`] || shift.startTime;
                                const customEndTime = formData[`${shiftValue}EndTime`] || shift.endTime;
                                return (
                                  <div key={shiftValue} className="d-flex align-items-center mb-1">
                                    <i className={`${shift.icon} me-2 text-primary`}></i>
                                    <span className="me-2">{shift.label}:</span>
                                    <span className="badge bg-primary">
                                      {customStartTime} - {customEndTime}
                                    </span>
                  </div>
                    );
                  })}
                </div>
            </div>
                          <div className="col-12">
                            <div className="alert alert-success mb-0">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-calculator me-2"></i>
                                <strong>Tổng số lịch trình sẽ tạo:</strong>
                                <span className="badge bg-success ms-2 fs-6">
                                  {formData.daysOfWeek.length * formData.shifts.length} lịch
                                </span>
          </div>
        </div>
      </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                <i className="bi bi-x-circle me-1"></i>
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={isSubmitting || formData.daysOfWeek.length === 0 || formData.shifts.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>
                    Tạo lịch trình
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default DoctorScheduleManagement;
