import React, { useState, useEffect, useMemo, useCallback } from "react";
import Cookies from "js-cookie";
import doctorApi from "../../api/doctorApi";
import reviewApi from "../../api/reviewApi";
import appointmentApi from "../../api/appointmentApi";

const DoctorReviews = () => {
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [stats, setStats] = useState({
    avgRating: 0,
    reviewCount: 0,
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const fetchDoctorId = useCallback(async () => {
    const userId = Cookies.get("userId") || currentUser?.id;
    if (!userId) {
      setError(
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await doctorApi.getDoctorByUserId(userId);
      const data = res?.data || res;
      setDoctorId(data.doctorId);
    } catch (err) {
      console.error("Failed to load doctor data:", err);
      setError("Không lấy được thông tin bác sĩ. Vui lòng thử lại.");
      setLoading(false);
    }
  }, [currentUser]);

  const loadReviews = useCallback(async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      const [list, avg, count] = await Promise.all([
        reviewApi.getActiveByDoctor(doctorId),
        reviewApi.getAverageRatingByDoctor(doctorId),
        reviewApi.getReviewCountByDoctor(doctorId),
      ]);

      const normalized = Array.isArray(list) ? list : [];
      setReviews(normalized);
      setStats({
        avgRating: Number(avg) || 0,
        reviewCount: Number(count) || 0,
      });

      const uniqueAppointmentIds = Array.from(
        new Set(
          normalized
            .map((review) => review?.appointmentId)
            .filter((id) => id != null)
        )
      );

      if (uniqueAppointmentIds.length === 0) {
        setAppointments({});
      } else {
        const appointmentEntries = await Promise.all(
          uniqueAppointmentIds.map(async (id) => {
            try {
              const response = await appointmentApi.getAppointmentById(id);
              const data = response?.data || response;
              return [id, data];
            } catch (appointmentError) {
              console.error("Failed to load appointment", id, appointmentError);
              return [id, null];
            }
          })
        );

        const map = appointmentEntries.reduce((acc, [id, data]) => {
          if (data) {
            acc[id] = data;
          }
          return acc;
        }, {});

        setAppointments(map);
      }

      setError("");
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Không thể tải đánh giá. Vui lòng thử lại sau.");
      setAppointments({});
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctorId();
  }, [fetchDoctorId]);

  useEffect(() => {
    if (doctorId) {
      loadReviews();
    }
  }, [doctorId, loadReviews]);

  const renderStars = (value) => {
    const ratingValue = Math.round(value || 0);
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`bi ${
          index < ratingValue ? "bi-star-fill text-warning" : "bi-star text-muted"
        }`}
      ></i>
    ));
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) {
      return "Chưa cập nhật";
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) {
      return "Chưa cập nhật";
    }
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAppointmentRange = (start, end) => {
    const startDate = new Date(start);
    if (!start || Number.isNaN(startDate.getTime())) {
      return "Chưa cập nhật";
    }

    if (!end) {
      return formatDateTime(startDate);
    }

    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) {
      return formatDateTime(startDate);
    }

    const sameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (sameDay) {
      const startTime = startDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = endDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${startDate.toLocaleDateString(
        "vi-VN"
      )} - ${startTime} ~ ${endTime}`;
    }

    return `${formatDateTime(startDate)} → ${formatDateTime(endDate)}`;
  };

  const sortedReviews = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    return [...reviews].sort((a, b) => {
      const aDate = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [reviews]);

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-1">Đánh giá từ bệnh nhân</h4>
          <p className="text-muted mb-0">
            Xem toàn bộ nhận xét, điểm đánh giá và lịch hẹn liên quan.
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          disabled={loading}
          onClick={loadReviews}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Tải lại
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-left-warning h-100">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">
                Điểm đánh giá trung bình
              </h6>
              <div className="d-flex align-items-center">
                <div className="display-6 fw-bold me-3">
                  {stats.avgRating ? stats.avgRating.toFixed(1) : "0.0"}
                </div>
                <div>{renderStars(stats.avgRating)}</div>
              </div>
              <small className="text-muted">
                Dựa trên {stats.reviewCount} đánh giá hoạt động.
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-left-success h-100">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">
                Tổng số đánh giá
              </h6>
              <div className="display-6 fw-bold">{stats.reviewCount}</div>
              <small className="text-muted">
                Chỉ tính các đánh giá đang hoạt động.
              </small>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-left-info h-100">
            <div className="card-body">
              <h6 className="text-uppercase text-muted mb-2">
                Trạng thái tải dữ liệu
              </h6>
              <div className="d-flex align-items-center">
                {loading ? (
                  <>
                    <div
                      className="spinner-border text-info me-3"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Đang tải đánh giá...</span>
                  </>
                ) : error ? (
                  <>
                    <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                    <span className="text-danger">
                      Có lỗi khi tải đánh giá
                    </span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle text-success me-2"></i>
                    <span>Đã cập nhật đánh giá</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Danh sách đánh giá</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : sortedReviews.length === 0 ? (
            <p className="text-muted mb-0 text-center">
              Chưa có đánh giá nào từ bệnh nhân.
            </p>
          ) : (
            <div className="list-group list-group-flush">
              {sortedReviews.map((review) => {
                const appointmentInfo =
                  review.appointmentId != null
                    ? appointments[review.appointmentId]
                    : null;

                return (
                  <div key={review.reviewId} className="list-group-item py-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">
                          {review.patientName || "Bệnh nhân ẩn danh"}
                        </h6>
                        <div className="d-flex align-items-center mb-2">
                          {renderStars(review.rating)}
                          <span className="ms-2 text-muted">
                            {review.rating ? `${review.rating}/5` : "0/5"}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mb-2 text-secondary">{review.comment}</p>
                        )}
                        {review.status && (
                          <span className="badge bg-light text-uppercase text-secondary">
                            {review.status}
                          </span>
                        )}

                        {review.appointmentId && (
                          <div className="mt-3">
                            <div className="small text-uppercase text-muted fw-semibold mb-1">
                              Lịch hẹn liên quan
                            </div>
                            {appointmentInfo ? (
                              <div className="border rounded px-3 py-2 bg-light">
                                <div className="small text-secondary mb-1">
                                  Mã lịch: #{appointmentInfo.appointmentId}
                                </div>
                                <div className="small text-secondary">
                                  Thời gian:{" "}
                                  {formatAppointmentRange(
                                    appointmentInfo.startTime,
                                    appointmentInfo.endTime
                                  )}
                                </div>
                                <div className="small text-secondary">
                                  Trạng thái:{" "}
                                  {appointmentInfo.status || "Chưa cập nhật"}
                                </div>
                                {appointmentInfo.notes && (
                                  <div className="small text-muted mt-1 fst-italic">
                                    Ghi chú: {appointmentInfo.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="small text-muted fst-italic">
                                Không thể tải thông tin lịch hẹn #
                                {review.appointmentId}.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <small className="text-muted">
                        {formatDate(review.createdAt)}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReviews;
