import React, { useEffect, useState } from "react";
import reviewApi from "../../api/reviewApi";

const ReviewsManagement = () => {
  const [filters, setFilters] = useState({ doctorId: "", patientId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      // Priority: if doctorId set -> fetch doctor reviews; else if patientId -> fetch patient reviews; else empty
      let data = [];
      if (filters.doctorId) {
        data = await reviewApi.getByDoctor(Number(filters.doctorId));
      } else if (filters.patientId) {
        data = await reviewApi.getByPatient(Number(filters.patientId));
      } else {
        data = [];
      }
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto fetch when filters change if either doctorId or patientId present
    if (filters.doctorId || filters.patientId) {
      fetchReviews();
    } else {
      setReviews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.doctorId, filters.patientId]);

  const handleDeactivate = async (id) => {
    try {
      await reviewApi.deactivate(id);
      await fetchReviews();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể vô hiệu hóa đánh giá");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await reviewApi.delete(id);
      await fetchReviews();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể xóa đánh giá");
    }
  };

  // No status filtering

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/admin">Trang quản trị</a></li>
              <li className="breadcrumb-item active" aria-current="page">Quản lý đánh giá</li>
            </ol>
          </nav>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Quản lý đánh giá</h2>
              <p className="text-muted mb-0">Tìm kiếm và quản lý đánh giá của bệnh nhân/ bác sĩ</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0"><i className="bi bi-search me-2"></i>Tìm kiếm đánh giá</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="doctorId" className="form-label">ID Bác sĩ</label>
                  <input
                    id="doctorId"
                    type="number"
                    className="form-control"
                    value={filters.doctorId}
                    onChange={(e) => setFilters((p) => ({ ...p, doctorId: e.target.value }))}
                    placeholder="Nhập ID bác sĩ"
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="patientId" className="form-label">ID Bệnh nhân</label>
                  <input
                    id="patientId"
                    type="number"
                    className="form-control"
                    value={filters.patientId}
                    onChange={(e) => setFilters((p) => ({ ...p, patientId: e.target.value }))}
                    placeholder="Nhập ID bệnh nhân"
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="btn-group w-100">
                    <button className="btn btn-primary" onClick={fetchReviews} disabled={loading}>
                      <i className="bi bi-search"></i> Tìm
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setFilters({ doctorId: "", patientId: "" })}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-text mt-2">Điền 1 trong 2: ID bác sĩ hoặc ID bệnh nhân để tìm.</div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0"><i className="bi bi-star-half me-2"></i>Danh sách đánh giá</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status"/>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Bệnh nhân</th>
                        <th>Bác sĩ</th>
                        <th>Đánh giá</th>
                        <th>Bình luận</th>
                        <th>Tạo lúc</th>
                        <th>Trạng thái</th>
                        <th className="text-end">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">Không có dữ liệu</td>
                        </tr>
                      ) : (
                        reviews.map((r) => (
                          <tr key={r.reviewId}>
                            <td>{r.reviewId}</td>
                            <td>{r.patientName} <small className="text-muted">(ID {r.patientId})</small></td>
                            <td>{r.doctorName} <small className="text-muted">(ID {r.doctorId})</small></td>
                            <td>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <i key={i} className={`bi ${i < (r.rating || 0) ? "bi-star-fill text-warning" : "bi-star"}`}></i>
                              ))}
                            </td>
                            <td style={{ maxWidth: 320 }}>
                              <span title={r.comment}>{r.comment}</span>
                            </td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                            <td>
                              <span className={`badge ${r.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>{r.status}</span>
                            </td>
                            <td className="text-end">
                              <div className="btn-group">
                                {r.status === "ACTIVE" && (
                                  <button className="btn btn-sm btn-outline-warning" onClick={() => handleDeactivate(r.reviewId)}>
                                    <i className="bi bi-slash-circle"></i>
                                  </button>
                                )}
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.reviewId)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsManagement;


