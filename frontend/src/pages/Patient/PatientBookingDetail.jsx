import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  AlertTriangle,
  FileText,
  UserCheck,
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import doctorApi from "../../api/doctorApi";
import appointmentApi from "../../api/appointmentApi";
import patientApi from "../../api/patientApi";
import paymentApi from "../../api/paymentApi";
import PaymentModal from "../../components/payment/PaymentModal";

export default function PatientBookingDetail() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [error, setError] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Select date/time, 2: Confirm booking, 3: Payment
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientNote, setPatientNote] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [payOSLink, setPayOSLink] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try { setCurrentUser(JSON.parse(raw)); } catch(_) { setCurrentUser(null); }
    }
    const onUserChanged = () => {
      const v = localStorage.getItem('user');
      if (v) { try { setCurrentUser(JSON.parse(v)); } catch(_) { setCurrentUser(null); } }
      else setCurrentUser(null);
    };
    window.addEventListener('userChanged', onUserChanged);
    window.addEventListener('storage', onUserChanged);
    return () => {
      window.removeEventListener('userChanged', onUserChanged);
      window.removeEventListener('storage', onUserChanged);
    };
  }, []);

  // Lấy Patient theo UserID từ cookie
  useEffect(() => {
    const loadPatientByUserId = async () => {
      try {
        // Ưu tiên lấy từ cookie trước
        const userId = getUserIdFromCookie();
        if (userId) {
          console.log('🔍 Getting patient by userId from cookie:', userId);
          const response = await patientApi.getPatientByUserId(userId);
          if (response.data && response.data.patientId) {
            setPatientId(response.data.patientId);
            console.log('✅ Found patient by userId:', response.data.patientId);
            return;
          }
        }

        // Fallback: Thử lấy từ localStorage
        const patientIdFromUser = getPatientIdFromUser(currentUser);
        if (patientIdFromUser) {
          setPatientId(patientIdFromUser);
          console.log('✅ Found patient from localStorage:', patientIdFromUser);
          return;
        }

        console.log('❌ No patient found in cookie or localStorage');
      } catch (error) {
        console.error('❌ Error loading patient by userId:', error);
      }
    };

    // Chạy ngay lập tức, không cần đợi currentUser
    loadPatientByUserId();
  }, [currentUser]);

  const getUserIdFromCookie = () => {
    // Lấy UserID từ cookie
    const cookies = document.cookie.split(';');
    console.log('🍪 All cookies:', document.cookie);
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      console.log('🍪 Cookie:', name, '=', value);
      if (name === 'userId' || name === 'user_id') {
        const userId = parseInt(value);
        console.log('✅ Found userId in cookie:', userId);
        return userId;
      }
    }
    console.log('❌ No userId cookie found');
    return null;
  };

  const getPatientIdFromUser = (user) => {
    if (!user) return null;
    // Common shapes: user.patient.patientId or user.patientId
    if (user.patient && user.patient.patientId) return user.patient.patientId;
    if (user.patientId) return user.patientId;
    // Fallbacks if backend stored differently
    if (user.id && typeof user.id === 'number') return user.id; // last resort
    if (user.userId && typeof user.userId === 'number') return user.userId; // last resort
    return null;
  };

  // Generate week dates with real appointment counts
  const generateWeekDates = (weekOffset = 0, appointments = []) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Start from Monday
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[date.getDay()];
      const dayMonth = `${date.getDate()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Count real available slots for this date
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments.filter(apt => {
        if (!apt.startTime) return false;
        try {
          const aptDate = new Date(apt.startTime);
          if (isNaN(aptDate.getTime())) return false;
          return apt.startTime.split('T')[0] === dateStr;
        } catch (error) {
          return false;
        }
      });
      
      // Count available slots (not booked and not schedule)
      const availableSlots = dayAppointments.filter(apt => 
        apt.patientId == null && apt.status !== "Schedule"
      ).length;
      
      const isFullyBooked = availableSlots === 0;
      
      console.log(`📊 Date ${dateStr}:`, {
        totalAppointments: dayAppointments.length,
        availableSlots,
        appointments: dayAppointments.map(apt => ({
          id: apt.appointmentId,
          patientId: apt.patientId,
          status: apt.status,
          startTime: apt.startTime
        }))
      });
      
      weekDates.push({
        date: dateStr,
        dayName,
        dayMonth,
        availableSlots,
        isFullyBooked,
        isSelected: i === 1 // Default select Tuesday
      });
    }
    
    return weekDates;
  };

  // Process appointments to create time slots - Based on DoctorAvailableSlotManagement logic
  const processAppointmentsToTimeSlots = (appointments, selectedDate) => {
    console.log('🔍 processAppointmentsToTimeSlots called with:', {
      appointments: appointments?.length || 0,
      selectedDate,
      appointmentsData: appointments
    });
    
    if (!appointments || !selectedDate) {
      console.log('❌ Missing appointments or selectedDate');
      return [];
    }
    
    // Filter appointments for the selected date - Using same logic as DoctorAvailableSlotManagement
    const filteredAppointments = appointments.filter((appointment) => {
      if (!appointment.startTime) {
        console.log('❌ Appointment missing startTime:', appointment);
        return false;
      }
      
      try {
        // Use startTime instead of appointmentDate (like in DoctorAvailableSlotManagement)
        const slotDate = new Date(appointment.startTime);
        if (isNaN(slotDate.getTime())) {
          console.log('❌ Invalid startTime:', appointment.startTime);
          return false;
        }
        
        const slotDateStr = appointment.startTime.split("T")[0];
        const isMatch = slotDateStr === selectedDate;
        
        console.log('📅 Date comparison:', {
          slotDateStr,
          selectedDate,
          isMatch,
          originalStartTime: appointment.startTime
        });
        
        return isMatch;
      } catch (error) {
        console.warn('❌ Invalid appointment startTime:', appointment.startTime, error);
        return false;
      }
    });
    
    console.log('📋 Filtered appointments for date:', filteredAppointments);
    
    // Convert appointments to time slots format
    const timeSlots = filteredAppointments.map(appointment => {
      try {
        const startTime = new Date(appointment.startTime);
        const endTime = new Date(appointment.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.log('❌ Invalid time in appointment:', appointment);
          return null;
        }
        
        const startTimeStr = startTime.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const endTimeStr = endTime.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const timeSlot = {
          id: appointment.appointmentId,
          time: `${startTimeStr}-${endTimeStr}`,
          available: appointment.patientId == null && appointment.status !== "Schedule", // Available if no patient assigned and not Schedule status
          appointmentId: appointment.appointmentId,
          fee: appointment.fee,
          status: appointment.status
        };
        
        console.log('⏱️ Time slot created from appointment:', {
          ...timeSlot,
          originalStatus: appointment.status,
          originalPatientId: appointment.patientId,
          isAvailable: timeSlot.available
        });
        return timeSlot;
      } catch (error) {
        console.warn('❌ Error processing appointment:', appointment, error);
        return null;
      }
    }).filter(slot => slot !== null);
    
    console.log('✅ Final time slots from appointments:', timeSlots);
    return timeSlots;
  };

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch doctor details
        const doctorResponse = await doctorApi.getDoctorById(doctorId);
        if (doctorResponse.data) {
          const doctorData = doctorResponse.data;
          const transformedDoctor = {
            id: doctorData.doctorId || doctorData.id,
            name: `${doctorData.user?.firstName || ''} ${doctorData.user?.lastName || ''}`.trim(),
            specialty: doctorData.specialty || 'Chưa cập nhật',
            experience: `${doctorData.experience || 'Nhiều'} năm kinh nghiệm`,
            avatar: doctorData.user?.avatarUrl || '/api/placeholder/200/200',
            rating: 4.5, // Default rating
            reviewCount: 0, // Default review count
            bio: doctorData.bio || 'Bác sĩ chuyên khoa với nhiều năm kinh nghiệm.',
            price: doctorData.price || 'Liên hệ để biết giá',

          };
          setDoctor(transformedDoctor);
        }
        
        // Fetch doctor's appointments
        console.log('🔍 Fetching appointments for doctor:', doctorId);
        const appointmentsResponse = await appointmentApi.getAppointmentsByDoctor(doctorId);
        console.log('📋 Appointments API response:', appointmentsResponse);
        
        if (appointmentsResponse.data) {
          console.log('✅ Setting appointments:', appointmentsResponse.data);
          setAppointments(appointmentsResponse.data);
        } else {
          console.log('❌ No appointments data received');
          setAppointments([]);
        }
        
        // Set default selected date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
        
      } catch (error) {
        console.error("Error loading doctor:", error);
        setError("Không thể tải thông tin bác sĩ. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      loadDoctor();
    }
  }, [doctorId]);

  const weekDates = generateWeekDates(currentWeek, appointments);

  // Update available slots when appointments or selected date changes
  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      selectedDate,
      appointmentsLength: appointments?.length || 0,
      appointments: appointments
    });
    
    if (selectedDate) {
      if (appointments.length > 0) {
        console.log('📅 Processing appointments for date:', selectedDate);
        const timeSlots = processAppointmentsToTimeSlots(appointments, selectedDate);
        console.log('🎯 Setting available slots:', timeSlots);
        setAvailableSlots(timeSlots);
      } else {
        console.log('📅 No appointments for this date');
        // Không tạo default slots nếu không có appointments
        setAvailableSlots([]);
      }
    }
  }, [appointments, selectedDate]);

  const handleDateSelect = (date) => {
    console.log('📅 Date selected:', date);
    setSelectedDate(date);
    setSelectedTimeSlot(""); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    
    // Find the selected appointment details
    const appointment = availableSlots.find(slot => slot.time === timeSlot);
    if (appointment) {
      setSelectedAppointment(appointment);
      setBookingStep(2); // Move to confirmation step
    }
  };

  const handleBackToStep1 = () => {
    setBookingStep(1);
    setSelectedAppointment(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedAppointment) {
      alert("Không tìm thấy thông tin lịch hẹn");
      return;
    }


    console.log('🎯 Confirming booking:', {
      selectedAppointment,
      patientNote,
      selectedDate,
      selectedTimeSlot,
      patientId,
      currentUser,
      cookieUserId: getUserIdFromCookie()
    });

    try {
      // Kiểm tra patientId trước
      if (!patientId) {
        alert('Không xác định được ID bệnh nhân. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Chuẩn bị dữ liệu thanh toán
      const amount = Number(selectedAppointment.fee || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        alert('Bác sĩ chưa cấu hình phí khám hợp lệ, không thể tạo thanh toán.');
        return;
      }

      // Tạo payment và lấy PayOS link TRƯỚC KHI đặt lịch
      try {
        const paymentData = {
          appointmentId: selectedAppointment.appointmentId,
          // Không gửi amount, backend sẽ lấy từ appointment.fee
          description: `Phí khám #${selectedAppointment.appointmentId}`,
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        };
        
        console.log('🔍 Sending payment data:', paymentData);
        console.log('🔍 Selected appointment:', selectedAppointment);
        
        const paymentResponse = await paymentApi.createPayment(paymentData);

        if (paymentResponse.data && paymentResponse.data.payOSLink) {
          setPayOSLink(paymentResponse.data.payOSLink);
          setPaymentStatus('PENDING');
          
          // Tự động mở PayOS link
          console.log('🚀 Auto-opening PayOS link:', paymentResponse.data.payOSLink);
          window.open(paymentResponse.data.payOSLink, '_blank');
          
          // Chuyển đến bước thanh toán
          setBookingStep(3);
          
          // Bắt đầu polling để kiểm tra trạng thái thanh toán
          startPaymentStatusPolling(paymentResponse.data.paymentId);
        } else {
          throw new Error('Không nhận được PayOS link');
        }
      } catch (paymentError) {
        console.error('❌ Error creating payment:', paymentError);
        console.error('❌ Error response:', paymentError.response?.data);
        console.error('❌ Error status:', paymentError.response?.status);
        
        // Xử lý error response từ backend
        let errorMessage = 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.';
        
        if (paymentError.response?.data) {
          const errorData = paymentError.response.data;
          if (errorData.description) {
            errorMessage = errorData.description;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `Lỗi từ server: ${JSON.stringify(errorData)}`;
          }
        } else if (paymentError.message) {
          errorMessage = paymentError.message;
        }
        
        alert(`Lỗi tạo thanh toán: ${errorMessage}`);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      const serverMsg = error?.response?.data?.error || error?.response?.data?.message;
      alert(serverMsg || 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.');
    }
  };

  const handlePaymentSuccess = (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    
    // Chuyển đến trang xác nhận
    const params = new URLSearchParams({
      doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: selectedDate,
      time: selectedTimeSlot,
      fee: selectedAppointment.fee || 0,
      note: patientNote,
      appointmentId: selectedAppointment.appointmentId,
      paymentId: payment.paymentId
    });
    navigate(`/patient/booking-confirmation/${doctorId}?${params.toString()}`);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
  };

  const startPaymentStatusPolling = (paymentId) => {
    console.log('🔄 Starting payment status polling for payment ID:', paymentId);
    let pollCount = 0;
    const maxPolls = 24; // 24 * 5 seconds = 2 minutes timeout
    
    const interval = setInterval(async () => {
      pollCount++;
      console.log(`🔍 Polling attempt ${pollCount}/${maxPolls} for payment ID:`, paymentId);
      
      // Timeout sau 2 phút
      if (pollCount >= maxPolls) {
        console.log('⏰ Payment polling timeout after 2 minutes');
        clearInterval(interval);
        setPaymentStatus('FAILED');
        return;
      }
      try {
        console.log('🔍 Polling payment status for ID:', paymentId);
        const response = await paymentApi.checkPaymentStatus(paymentId);
        console.log('📊 Payment status response:', response.data);
        
        // Debug response data
        console.log('📊 Full response data:', response);
        console.log('📊 Response status:', response.data?.status);
        console.log('📊 Response data type:', typeof response.data);
        
        if (response.data && response.data.status) {
          const status = response.data.status.toUpperCase();
          console.log('📊 Normalized status:', status);
          
          if (status === 'PAID') {
            clearInterval(interval);
            setPaymentStatus('PAID');
            console.log('✅ Payment completed successfully');
            
            // THANH TOÁN THÀNH CÔNG → MỚI ĐẶT LỊCH
            try {
              console.log('🎯 Booking appointment after successful payment...');
              const appointmentResponse = await appointmentApi.bookAppointment(
                selectedAppointment.appointmentId, 
                patientId, 
                patientNote
              );
              
              console.log('✅ Appointment booked successfully after payment:', appointmentResponse);
              
              // Chuyển đến trang payment success với paymentId
              const params = new URLSearchParams({
                paymentId: paymentId
              });
              navigate(`/payment/success?${params.toString()}`);
              
            } catch (bookingError) {
              console.error('❌ Error booking appointment after payment:', bookingError);
              alert('Thanh toán thành công nhưng có lỗi khi đặt lịch. Vui lòng liên hệ hỗ trợ.');
              setPaymentStatus('FAILED');
            }
            
          } else if (status === 'FAILED' || status === 'CANCELLED') {
            clearInterval(interval);
            setPaymentStatus(status);
            console.log('❌ Payment failed or cancelled:', status);
          } else {
            console.log('⏳ Payment still pending, status:', status);
          }
        } else {
          console.log('❌ No valid response data or status');
          console.log('📊 Response:', response);
          console.log('📊 Response.data:', response.data);
        }
      } catch (err) {
        console.error('❌ Error polling payment status:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        clearInterval(interval);
        setPaymentStatus('FAILED');
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bác sĩ</h2>
          <button 
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </button>
            <div className="text-sm text-gray-500">
              Trang chủ / Bác sĩ
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Doctor Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden relative bg-gray-200">
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const fallbackSpan = e.target.nextElementSibling;
                      if (fallbackSpan) {
                        fallbackSpan.style.display = 'flex';
                      }
                    }}
                  />
                  <span
                    className="text-2xl absolute"
                    style={{ display: doctor.avatar && doctor.avatar !== '/api/placeholder/150/150' ? 'none' : 'flex' }}
                  >
                    👨‍⚕️
                  </span>
                </div>
                <button className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full p-1 hover:bg-red-50 hover:border-red-300 transition-colors">
                  <Heart className="h-3 w-3 text-gray-600" />
                </button>
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-2">{doctor.name}</h1>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-gray-600">{doctor.experience}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium">{doctor.rating}</span>
                    <span className="text-xs text-gray-500">({doctor.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-600">{doctor.price}</span>
                  </div>
                </div>
                <p className="text-blue-600 font-medium text-sm mb-2">{doctor.specialty}</p>
                
              </div>
            </div>
          </div>


          {/* Quick Booking */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Đặt khám nhanh</h2>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${bookingStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    bookingStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <span className="text-xs font-medium">Chọn ngày giờ</span>
                </div>
                <div className="w-4 h-0.5 bg-gray-200"></div>
                <div className={`flex items-center gap-1 ${bookingStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    bookingStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <span className="text-xs font-medium">Xác nhận</span>
                </div>
                <div className="w-4 h-0.5 bg-gray-200"></div>
                <div className={`flex items-center gap-1 ${bookingStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    bookingStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                  <span className="text-xs font-medium">Thanh toán</span>
                </div>
              </div>
            </div>
            
            {/* Date Selection - Only show in step 1 */}
            {bookingStep === 1 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-gray-900">Chọn ngày</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentWeek(currentWeek - 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentWeek(currentWeek + 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {weekDates.map((dateInfo) => (
                    <button
                      key={dateInfo.date}
                      onClick={() => handleDateSelect(dateInfo.date)}
                      disabled={dateInfo.availableSlots === 0}
                      className={`flex-shrink-0 w-20 p-2 rounded-lg border text-center transition-colors ${
                        selectedDate === dateInfo.date
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : dateInfo.availableSlots === 0
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-xs font-medium">{dateInfo.dayName}</div>
                      <div className="text-xs text-gray-500">{dateInfo.dayMonth}</div>
                      <div className="text-xs mt-1">
                        {dateInfo.availableSlots === 0 ? "Chưa lên lịch" : `${dateInfo.availableSlots} khung`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slots - Only show in step 1 */}
            {bookingStep === 1 && (
              <div>
                {/* Kiểm tra xem ngày được chọn có "Chưa lên lịch" không */}
                {(() => {
                  const selectedDateInfo = weekDates.find(date => date.date === selectedDate);
                  const isNotScheduled = selectedDateInfo?.isFullyBooked || selectedDateInfo?.availableSlots === 0;
                  
                  if (isNotScheduled) {
                    return (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Bác sĩ chưa lên lịch cho ngày này</p>
                        <p className="text-sm">Vui lòng chọn ngày khác</p>
                      </div>
                    );
                  }
                  
                  // Phân chia slots thành buổi sáng và buổi chiều
                  const morningSlots = availableSlots.filter(slot => {
                    const startHour = parseInt(slot.time.split('-')[0].split(':')[0]);
                    return startHour >= 7 && startHour < 12;
                  });
                  
                  const afternoonSlots = availableSlots.filter(slot => {
                    const startHour = parseInt(slot.time.split('-')[0].split(':')[0]);
                    return startHour >= 12 && startHour < 19;
                  });
                  
                  return (
                    <div className="space-y-4">
                      {/* Buổi sáng */}
                      {morningSlots.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="h-4 w-4 text-orange-500" />
                            <h3 className="text-base font-medium text-gray-900">Buổi sáng</h3>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {morningSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => handleTimeSlotSelect(slot.time)}
                                disabled={!slot.available}
                                className={`p-2 rounded-lg border text-xs transition-colors ${
                                  selectedTimeSlot === slot.time
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : slot.available
                                    ? "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium text-xs">{slot.time}</div>
                                  {slot.fee && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        minimumFractionDigits: 0
                                      }).format(slot.fee)}
                                    </div>
                                  )}
                                  {!slot.available && slot.status !== "Schedule" && (
                                    <div className="text-xs text-red-500 mt-0.5">
                                      Đã đặt
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Buổi chiều */}
                      {afternoonSlots.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            <h3 className="text-base font-medium text-gray-900">Buổi chiều</h3>
                          </div>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {afternoonSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => handleTimeSlotSelect(slot.time)}
                                disabled={!slot.available}
                                className={`p-2 rounded-lg border text-xs transition-colors ${
                                  selectedTimeSlot === slot.time
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : slot.available
                                    ? "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-medium text-xs">{slot.time}</div>
                                  {slot.fee && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                        minimumFractionDigits: 0
                                      }).format(slot.fee)}
                                    </div>
                                  )}
                                  {!slot.available && slot.status !== "Schedule" && (
                                    <div className="text-xs text-red-500 mt-0.5">
                                      Đã đặt
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Nếu không có slots nào */}
                      {morningSlots.length === 0 && afternoonSlots.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Không có khung giờ khả dụng cho ngày này</p>
                          <p className="text-sm">Vui lòng chọn ngày khác</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 2: Confirmation */}
            {bookingStep === 2 && selectedAppointment && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">✓</div>
                  Xác nhận thông tin lịch hẹn
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Doctor Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Thông tin bác sĩ</h4>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          <img
                            src={doctor.avatar}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-xl" style={{display: 'none'}}>
                            👨‍⚕️
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{doctor.name}</h5>
                          <p className="text-sm text-blue-600">{doctor.specialty}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{doctor.experience}</span>
                        </div>
                        
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Chi tiết lịch hẹn</h4>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Ngày khám:</span>
                          <span className="font-medium">{new Date(selectedDate).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Giờ khám:</span>
                          <span className="font-medium text-blue-600">{selectedTimeSlot}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Phí khám:</span>
                          <span className="font-medium text-green-600">
                            {selectedAppointment.fee ? 
                              new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                              }).format(selectedAppointment.fee) : 
                              'Liên hệ để biết giá'
                            } 
                          </span>
                        </div>

                        {selectedAppointment.patientId && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Bệnh nhân ID:</span>
                            <span className="font-medium text-blue-600">#{selectedAppointment.patientId}</span>
                          </div>
                        )}
                       
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Note Section */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Ghi chú cho bác sĩ
                  </h4>
                  <div className="bg-white p-4 rounded-lg border">
                    <textarea
                      value={patientNote}
                      onChange={(e) => setPatientNote(e.target.value)}
                      placeholder="Mô tả triệu chứng, tình trạng sức khỏe hiện tại, hoặc thông tin cần thiết khác..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                    />
                    <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                      <UserCheck className="h-4 w-4 mt-0.5 text-blue-500" />
                      <span>
                        Ghi chú này sẽ được gửi đến bác sĩ trước buổi khám để bác sĩ có thể chuẩn bị tốt hơn.
                      </span>
                    </div>

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleBackToStep1}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Tiến hành thanh toán
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {bookingStep === 3 && (
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">💳</div>
                  Thanh toán
                </h3>
                
                {paymentStatus === 'PENDING' && (
                  <div className="text-center py-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <ExternalLink className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Thanh toán qua PayOS</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        Hệ thống đã tự động mở trang thanh toán PayOS. Vui lòng kiểm tra tab mới.
                      </p>
                      <div className="flex items-center justify-center mt-4 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span>Đang chờ thanh toán...</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin thanh toán</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mã lịch hẹn:</span>
                          <span className="font-medium">#{selectedAppointment.appointmentId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số tiền:</span>
                          <span className="font-medium text-green-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(selectedAppointment.fee)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trạng thái:</span>
                          <span className="text-yellow-600 font-medium">Đang chờ thanh toán</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStatus === 'PAID' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h4>
                    <p className="text-gray-600 mb-4">Đang xác nhận lịch hẹn...</p>
                    <div className="flex items-center justify-center mt-4 text-green-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      <span>Đang đặt lịch hẹn</span>
                    </div>
                  </div>
                )}

                {(paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h4>
                    <p className="text-gray-600 mb-4">Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Thử lại
                      </button>
                      <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Quay lại
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor Introduction */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Giới thiệu</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{doctor.bio}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Đặt lịch khám với {doctor.name}</strong>
              </p>
              <p className="text-sm text-blue-700">
                Khuyến khích bệnh nhân đặt lịch trước qua "ứng dụng YouMed" để lấy số thứ tự sớm, hạn chế thời gian chờ đợi và giúp phòng khám phục vụ tốt hơn.
              </p>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Tải ứng dụng YouMed tại đây
              </a>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chuyên khám</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {doctor.specialty}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Hô hấp
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Miễn dịch - Dị ứng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        appointmentData={paymentData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
}

