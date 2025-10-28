import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import reviewApi from "../../api/reviewApi";
import appointmentApi from "../../api/appointmentApi";
import patientApi from "../../api/patientApi";
import doctorApi from "../../api/doctorApi";
import toast from "../../utils/toast";

// Rating Stars Component
const RatingStars = ({ value, onChange, readonly }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= value 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function PatientAppointmentHistory() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [doctors, setDoctors] = useState({});
  
  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState({}); // Lưu thông tin đánh giá theo appointmentId
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [doctorRatings, setDoctorRatings] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Cancel appointment
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Expand notes
  const [expandedNotes, setExpandedNotes] = useState({});

  // Load user info
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch (_) {
        setCurrentUser(null);
      }
    }

    const onUserChanged = () => {
      const v = localStorage.getItem('user');
      if (v) {
        try {
          setCurrentUser(JSON.parse(v));
        } catch (_) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('userChanged', onUserChanged);
    window.addEventListener('storage', onUserChanged);

    return () => {
      window.removeEventListener('userChanged', onUserChanged);
      window.removeEventListener('storage', onUserChanged);
    };
  }, []);

  // Load patient ID
  useEffect(() => {
    const loadPatientByUserId = async () => {
      try {
        const userId = getUserIdFromCookie();
        if (userId) {
          const response = await patientApi.getPatientByUserId(userId);
          if (response.data && response.data.patientId) {
            setPatientId(response.data.patientId);
            return;
          }
        }

        const patientIdFromUser = getPatientIdFromUser(currentUser);
        if (patientIdFromUser) {
          setPatientId(patientIdFromUser);
          return;
        }
      } catch (error) {
        console.error('❌ Error loading patient by userId:', error);
      }
    };

    loadPatientByUserId();
  }, [currentUser]);

  const getUserIdFromCookie = () => {
    const cookies = document.cookie.split(';'); 
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'userId' || name === 'user_id') {
        return parseInt(value);
      }
    }
    return null;
  };

  const getPatientIdFromUser = (user) => {
    if (!user) return null;
    if (user.patient && user.patient.patientId) return user.patient.patientId;
    if (user.patientId) return user.patientId;
    if (user.id && typeof user.id === 'number') return user.id;
    if (user.userId && typeof user.userId === 'number') return user.userId;
    return null;
  };

  // Load thông tin bác sĩ và đánh giá
  const loadDoctorInfo = async (doctorId) => {
    if (!doctorId) return;

    try {
      // Load doctor info if not already loaded
      if (!doctors[doctorId]) {
        const response = await doctorApi.getDoctorById(doctorId);
        if (response.data) {
          setDoctors(prev => ({
            ...prev,
            [doctorId]: response.data
          }));
        }
      }

      // Load average rating
      if (!doctorRatings[doctorId]) {
        const avgRating = await reviewApi.getAverageRatingByDoctor(doctorId);
        const reviewCount = await reviewApi.getReviewCountByDoctor(doctorId);
        
        setDoctorRatings(prev => ({
          ...prev,
          [doctorId]: {
            average: avgRating || 0,
            count: reviewCount || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error loading doctor info:', error);
    }
  };

  // Load reviews for completed appointments
  useEffect(() => {
    const loadReviews = async () => {
      try {
        for (const appointment of appointments) {
          if (appointment.status === 'Completed' || appointment.status === 'COMPLETED') {
            try {
              console.log('Loading review for appointment:', appointment.appointmentId);
              const response = await reviewApi.getReviewByAppointment(appointment.appointmentId);
              if (response && response.reviewId) {
                console.log('Found review:', response);
                setReviews(prev => ({
                  ...prev,
                  [appointment.appointmentId]: {
                    ...response,
                    id: response.reviewId,  // Ensure we have both id and reviewId
                    reviewId: response.reviewId
                  }
                }));
              }
            } catch (error) {
              console.error('Error loading review for appointment:', appointment.appointmentId, error);
            }
          }
        }
      } catch (error) {
        console.error('Error in loadReviews:', error);
      }
    };

    if (appointments.length > 0) {
      loadReviews();
    }
  }, [appointments]);

  // Open edit review modal (prefill with existing review)
  const openEditReview = (appointment, review) => {
    console.log('Opening edit review:', review);
    const reviewId = review?.reviewId || review?.id;
    if (!reviewId) {
      console.error('No review ID found:', review);
      toast.error('Không thể chỉnh sửa đánh giá này');
      return;
    }
    setAppointmentToReview(appointment);
    setIsEditingReview(true);
    setEditingReviewId(reviewId);
    setRating(review?.rating || 0);
    setReviewComment(review?.comment || '');
    setShowReviewModal(true);
    console.log('Edit review state set:', {
      appointmentId: appointment.appointmentId,
      reviewId: reviewId,
      rating: review?.rating,
      comment: review?.comment
    });
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!appointmentToReview || rating === 0) {
      console.log('Invalid review data:', { appointmentToReview, rating });
      toast.warning('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setSubmittingReview(true);

      if (isEditingReview && editingReviewId) {
        console.log('Current review state:', {
          isEditingReview,
          editingReviewId,
          rating,
          comment: reviewComment
        });

        // Prepare update data according to ReviewDTO.Update format
        const updateData = {
          rating: rating,
          comment: reviewComment
        };
        
        console.log('Sending update request:', { 
          url: `/reviews/${editingReviewId}`,
          data: updateData 
        });
        
        const resp = await reviewApi.update(editingReviewId, updateData);
        console.log('Review update response:', resp);
        
        if (!resp) {
          throw new Error('Không nhận được phản hồi từ server');
        }

        // Update reviews state with the response data
        setReviews(prev => ({
          ...prev,
          [appointmentToReview.appointmentId]: {
            ...resp,
            id: resp.id || editingReviewId,
            reviewId: resp.id || editingReviewId,
            rating: resp.rating || rating,
            comment: resp.comment || reviewComment,
            updatedAt: resp.updatedAt || new Date().toISOString()
          }
        }));

        // Reset states after successful update
        setShowReviewModal(false);
        setAppointmentToReview(null);
        setIsEditingReview(false);
        setEditingReviewId(null);
        setRating(0);
        setReviewComment('');
        toast.success('Cập nhật đánh giá thành công!');
      } else {
        console.log('Creating review:', {
          appointmentId: appointmentToReview.appointmentId,
          doctorId: appointmentToReview.doctorId,
          patientId: patientId,
          rating,
          comment: reviewComment
        });

        const response = await reviewApi.createReview({
          appointmentId: appointmentToReview.appointmentId,
          doctorId: appointmentToReview.doctorId,
          patientId: patientId,
          rating,
          comment: reviewComment
        });

        console.log('Review submission response:', response);

        // Update reviews state
        setReviews(prev => {
          const newReviews = {
            ...prev,
            [appointmentToReview.appointmentId]: {
              id: response.id,
              reviewId: response.id,  // Thêm reviewId để đồng nhất
              rating,
              comment: reviewComment,
              createdAt: new Date().toISOString()
            }
          };
          console.log('Updated reviews state:', newReviews);
          return newReviews;
        });

        setShowReviewModal(false);
        setAppointmentToReview(null);
        setRating(0);
        setReviewComment('');
        toast.success('Đánh giá của bạn đã được ghi nhận!');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Không thể gửi đánh giá: ${error.response.data.message || 'Vui lòng thử lại sau'}`);
      } else {
        toast.error('Không thể gửi đánh giá. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Load appointments
  useEffect(() => {
    const loadAppointments = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await appointmentApi.getAppointmentsByPatient(patientId);
        if (response.data) {
          setAppointments(response.data);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
          
          // Load thông tin bác sĩ cho mỗi appointment
          response.data.forEach(appointment => {
            if (appointment.doctorId) {
              loadDoctorInfo(appointment.doctorId);
            }
          });
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setError('Không thể tải lịch sử đặt lịch');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [patientId]);

  // Load reviews for completed appointments
  useEffect(() => {
    const loadReviews = async () => {
      for (const appointment of appointments) {
        if (appointment.status === 'Completed') {
          try {
            const response = await reviewApi.getReviewByAppointment(appointment.appointmentId);
            if (response.data) {
              setReviews(prev => ({
                ...prev,
                [appointment.appointmentId]: response.data
              }));
            }
          } catch (error) {
            console.error('Error loading review:', error);
          }
        }
      }
    };

    if (appointments.length > 0) {
      loadReviews();
    }
  }, [appointments]);

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    // Status filter
    if (statusFilter !== "All" && appointment.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== "All") {
      const appointmentDate = new Date(appointment.startTime);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);

      switch (dateFilter) {
        case "Today":
          return appointmentDate.toDateString() === today.toDateString();
        case "Yesterday":
          return appointmentDate.toDateString() === yesterday.toDateString();
        case "LastWeek":
          return appointmentDate >= lastWeek;
        case "LastMonth":
          return appointmentDate >= lastMonth;
        default:
          return true;
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const doctorName = appointment.doctor?.name?.toLowerCase() || '';
      const specialty = appointment.doctor?.specialty?.toLowerCase() || '';
      const notes = appointment.notes?.toLowerCase() || '';

      return doctorName.includes(searchLower) ||
        specialty.includes(searchLower) ||
        notes.includes(searchLower);
    }

    return true;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Scheduled": {
        class: "bg-blue-100 text-blue-800",
        text: "Đã đặt lịch",
        icon: CheckCircle
      },
      "Completed": {
        class: "bg-green-100 text-green-800",
        text: "Hoàn thành",
        icon: CheckCircle
      },
      "Cancelled": {
        class: "bg-red-100 text-red-800",
        text: "Đã hủy",
        icon: XCircle
      },
      "NoShow": {
        class: "bg-orange-100 text-orange-800",
        text: "Không đến",
        icon: AlertCircle
      }
    };

    const config = statusConfig[status] || {
      class: "bg-gray-100 text-gray-800",
      text: status || "Không xác định",
      icon: AlertCircle
    };

    return config;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Cancel appointment function
  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancellingId(appointmentId);
      await appointmentApi.cancelAppointment(appointmentId);

      // Reload appointments
      const response = await appointmentApi.getAppointmentsByPatient(patientId);
      if (response.data) {
        setAppointments(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      }

      alert('Đã hủy lịch hẹn thành công');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setCancellingId(null);
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    }
  };

  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (appointmentToCancel) {
      handleCancelAppointment(appointmentToCancel.appointmentId);
    }
  };

  // Toggle expand notes
  const toggleNotes = (appointmentId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [appointmentId]: !prev[appointmentId]
    }));
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
            className="text-blue-600 hover:text-blue-700"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser || !patientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cần đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem lịch sử đặt lịch</p>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            onClick={() => navigate('/login')}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-8"> 
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
              <button
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={statusFilter}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">Tất cả trạng thái</option>
                    <option value="Scheduled">Đã đặt lịch</option>
                    <option value="Completed">Hoàn thành</option>
                    <option value="Cancelled">Đã hủy</option>
                    <option value="NoShow">Không đến</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
                  <select
                    value={dateFilter}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="All">Tất cả thời gian</option>
                    <option value="Today">Hôm nay</option>
                    <option value="Yesterday">Hôm qua</option>
                    <option value="LastWeek">Tuần qua</option>
                    <option value="LastMonth">Tháng qua</option>
                  </select>
                </div>
              </div>
            )}
        </div>

          {/* Appointments List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Lịch hẹn ({filteredAppointments.length})
              </h2>
            </div>

            {paginatedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn nào</h3>
                <p className="text-gray-600 mb-4">
                  {filteredAppointments.length === 0 && appointments.length > 0
                    ? "Không tìm thấy lịch hẹn phù hợp với bộ lọc"
                    : "Bạn chưa có lịch hẹn nào"}
                </p>
                {appointments.length === 0 && (
                  <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    onClick={() => navigate('/doctors')}
                  >
                    Đặt lịch ngay
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paginatedAppointments.map((appointment) => {
                  const statusConfig = getStatusBadge(appointment.status);
                  const StatusIcon = statusConfig.icon;
                  const doctor = doctors[appointment.doctorId] || {};

                  return (
                    <React.Fragment key={appointment.appointmentId}>
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Header: doctor + quick info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                  <img
                                    alt={doctor.name || appointment.doctorName || 'Bác sĩ'}
                                    className="w-full h-full object-cover"
                                    src={doctor.user?.avatarUrl || doctor.avatarUrl || appointment.doctor?.avatarUrl || ''}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900">
                                    {doctor.user ? `${doctor.user.firstName} ${doctor.user.lastName}` : doctor.name || appointment.doctorName || 'Bác sĩ'}
                                  </h3>

                                  <div className="flex flex-col gap-1 mt-1">
                                    {doctorRatings[appointment.doctorId] && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>
                                          {doctorRatings[appointment.doctorId].average.toFixed(1)} ({doctorRatings[appointment.doctorId].count} đánh giá)
                                        </span>
                                      </div>
                                    )}

                                    {appointment.status === 'Completed' && (
                                      <div className="flex items-center gap-2">
                                        {reviews[appointment.appointmentId] ? (
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-500">Đánh giá của bạn:</span>
                                              <div className="flex items-center gap-1">
                                                <RatingStars value={reviews[appointment.appointmentId].rating} readonly={true} />
                                                <span className="text-xs text-gray-500">({reviews[appointment.appointmentId].comment || 'Chưa có nhận xét'})</span>
                                              </div>
                                            </div>
                                            <button onClick={() => openEditReview(appointment, reviews[appointment.appointmentId])} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                              Chỉnh sửa
                                            </button>
                                          </div>
                                        ) : (
                                          <button onClick={() => { setAppointmentToReview(appointment); setShowReviewModal(true); }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                            <Star className="h-3 w-3" /> Thêm đánh giá của bạn
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                      <span className="font-medium">Mã lịch hẹn:</span>
                                      <span className="font-mono">#{appointment.appointmentId}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.class}`}>
                                  <StatusIcon className="h-4 w-4" />
                                  {statusConfig.text}
                                </span>

                                <div className="flex items-center gap-2">
                                  {appointment.status === 'Scheduled' && (
                                    <button className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50" disabled={cancellingId === appointment.appointmentId} onClick={() => openCancelModal(appointment)}>
                                      {cancellingId === appointment.appointmentId ? 'Đang hủy...' : 'Hủy lịch'}
                                    </button>
                                  )}

                                  {appointment.status === 'Completed' && (
                                    <div className="flex items-center gap-2">
                                      {reviews[appointment.appointmentId] && <RatingStars value={reviews[appointment.appointmentId].rating} readonly={true} />}
                                      <button className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium" onClick={() => { if (reviews[appointment.appointmentId]) openEditReview(appointment, reviews[appointment.appointmentId]); else { setAppointmentToReview(appointment); setShowReviewModal(true); } }}>
                                        {reviews[appointment.appointmentId] ? 'Chỉnh sửa đánh giá' : 'Đánh giá'}
                                      </button>
                                      {reviews[appointment.appointmentId] && (
                                        <span className="text-sm text-gray-500">{new Date(reviews[appointment.appointmentId].createdAt || reviews[appointment.appointmentId].updatedAt).toLocaleDateString('vi-VN')}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                              <div className="md:col-span-4 flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm whitespace-nowrap">{formatDate(appointment.startTime)}</span>
                              </div>
                              <div className="md:col-span-3 flex items-center gap-2 text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{formatTime(appointment.startTime)}{appointment.endTime ? ` - ${formatTime(appointment.endTime)}` : ''}</span>
                              </div>
                              {appointment.fee && (
                                <div className="md:col-span-2 flex items-center gap-2 text-gray-600">
                                  <span className="font-medium text-green-600 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.fee)}</span>
                                </div>
                              )}
                              {appointment.notes && (
                                <div className="md:col-span-3 flex items-start gap-2 text-gray-500">
                                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm">{expandedNotes[appointment.appointmentId] ? appointment.notes : (appointment.notes.length > 50 ? `${appointment.notes.substring(0,50)}...` : appointment.notes)}</span>
                                    {appointment.notes.length > 50 && <button onClick={() => toggleNotes(appointment.appointmentId)} className="ml-2 text-blue-600 hover:text-blue-700 text-xs font-medium">{expandedNotes[appointment.appointmentId] ? 'Thu gọn' : 'Xem thêm'}</button>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredAppointments.length)} trong {filteredAppointments.length} lịch hẹn
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Trước
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận hủy lịch hẹn</h3>
              </div>

              {appointmentToCancel && (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Bạn có chắc chắn muốn hủy lịch hẹn với bác sĩ <strong>{appointmentToCancel.doctorName}</strong>?
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Ngày khám:</span>
                        <p className="text-gray-900">{formatDate(appointmentToCancel.startTime)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Giờ khám:</span>
                        <p className="text-gray-900">{formatTime(appointmentToCancel.startTime)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Lưu ý: Hành động này không thể hoàn tác. Bạn sẽ cần đặt lịch mới nếu muốn khám lại.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowCancelModal(false);
                    setAppointmentToCancel(null);
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={cancellingId}
                  onClick={confirmCancel}
                >
                  {cancellingId ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
        </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditingReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá bác sĩ'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá của bạn
                  </label>
                  <RatingStars value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhận xét
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    setShowReviewModal(false);
                    setAppointmentToReview(null);
                    setRating(0);
                    setReviewComment('');
                    setIsEditingReview(false);
                    setEditingReviewId(null);
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={rating === 0 || submittingReview}
                  onClick={handleSubmitReview}
                >
                  {submittingReview ? (isEditingReview ? 'Đang cập nhật...' : 'Đang gửi...') : (isEditingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Đánh giá bác sĩ
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá của bạn
                  </label>
                  <RatingStars value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhận xét
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    setShowReviewModal(false);
                    setAppointmentToReview(null);
                    setRating(0);
                    setReviewComment('');
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={rating === 0 || submittingReview}
                  onClick={handleSubmitReview}
                >
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}