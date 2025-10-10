import React, { useEffect, useState } from "react";
import articleApi from "../../api/articleApi";
import doctorApi from "../../api/doctorApi";
import patientApi from "../../api/patientApi";
import departmentApi from "../../api/departmentApi";
import paymentApi from "../../api/paymentApi";
import reviewApi from "../../api/reviewApi";
import userApi from "../../api/userApi";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalDepartments: 0,
    totalArticles: 0,
    totalRevenue: 0,
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [lowRatedDoctors, setLowRatedDoctors] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const doctorsRes = await doctorApi.getAllDoctors();
      const patientsRes = await patientApi.getAllPatients();
      const departmentsRes = await departmentApi.getAllDepartments(0, 1);
      const articlesRes = await articleApi.getAllArticles(0, 5);
      const revenueRes = await paymentApi.getTotalRevenue();
      const usersRes = await userApi.getAllUsersWithRoleInfo();

      const totalDoctors = Array.isArray(doctorsRes.data) ? doctorsRes.data.length : (doctorsRes.data?.content?.length ? doctorsRes.data.totalElements : 0);
      const totalPatients = Array.isArray(patientsRes.data) ? patientsRes.data.length : (patientsRes.data?.content?.length ? patientsRes.data.totalElements : 0);
      const totalDepartments = typeof departmentsRes.data?.totalElements === 'number' ? departmentsRes.data.totalElements : (Array.isArray(departmentsRes.data) ? departmentsRes.data.length : 0);
      const totalArticles = typeof articlesRes.data?.totalElements === 'number' ? articlesRes.data.totalElements : (Array.isArray(articlesRes.data) ? articlesRes.data.length : 0);
      const totalUsers = usersRes.data?.length || 0;

      const recent = articlesRes.data?.content ?? (Array.isArray(articlesRes.data) ? articlesRes.data.slice(0, 5) : []);

      const totalRevenue = Number(revenueRes?.totalRevenue ?? 0);

      setStats({
        totalUsers,
        totalDoctors,
        totalPatients,
        totalDepartments,
        totalArticles,
        totalRevenue,
      });
      setRecentArticles(recent);

      // Build low rated doctors list (avg rating < 3, at least 3 reviews)
      const doctorList = Array.isArray(doctorsRes.data) ? doctorsRes.data : (doctorsRes.data?.content ?? []);
      const ratingPromises = doctorList.map(async (d) => {
        const doctorId = d.doctorId || d.id || d?.userId; // attempt to find id
        if (!doctorId) return null;
        try {
          const [avg, count] = await Promise.all([
            reviewApi.getAverageRatingByDoctor(doctorId),
            reviewApi.getReviewCountByDoctor(doctorId),
          ]);
          return { doctorId, doctorName: d.user?.firstName ? `${d.user.firstName} ${d.user.lastName || ''}` : (d.fullName || d.name || `Bác sĩ #${doctorId}`), avgRating: Number(avg || 0), reviewCount: Number(count || 0) };
        } catch {
          return null;
        }
      });
      const ratings = (await Promise.all(ratingPromises)).filter(Boolean);
      const lowRated = ratings.filter(r => r.reviewCount >= 3 && r.avgRating > 0 && r.avgRating < 3).sort((a,b) => a.avgRating - b.avgRating).slice(0, 5);
      setLowRatedDoctors(lowRated);
    } catch (e) {
      console.error('❌ Admin Dashboard API Error:', e);
      console.error('Error details:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
        statusText: e.response?.statusText,
        config: {
          url: e.config?.url,
          method: e.config?.method,
          baseURL: e.config?.baseURL
        }
      });
      setError(`Lỗi API: ${e?.response?.data?.message || e?.message || "Đã xảy ra lỗi khi tải thống kê"} (Status: ${e.response?.status})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Breadcrumb removed as requested */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Bảng điều khiển</h2>
              <p className="text-muted mb-0">Tổng quan hệ thống</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary" onClick={fetchStats} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          {/* Stat cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted">Bác sĩ</div>
                      <div className="h4 mb-0">{stats.totalDoctors}</div>
                    </div>
                    <i className="bi bi-person-badge fs-2 text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted">Bệnh nhân</div>
                      <div className="h4 mb-0">{stats.totalPatients}</div>
                    </div>
                    <i className="bi bi-people fs-2 text-success"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted">Chuyên khoa</div>
                      <div className="h4 mb-0">{stats.totalDepartments}</div>
                    </div>
                    <i className="bi bi-diagram-3 fs-2 text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted">Bài viết</div>
                      <div className="h4 mb-0">{stats.totalArticles}</div>
                    </div>
                    <i className="bi bi-file-text fs-2 text-info"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="text-muted">Doanh thu</div>
                      <div className="h4 mb-0">{stats.totalRevenue?.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <i className="bi bi-cash-coin fs-2 text-danger"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent articles */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0"><i className="bi bi-newspaper me-2"></i>Bài viết gần đây</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status"/>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Tiêu đề</th>
                        <th>Trạng thái</th>
                        <th>Tạo lúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recentArticles || []).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-4">Không có bài viết</td>
                        </tr>
                      ) : (
                        recentArticles.map((a) => (
                          <tr key={a.articleId || a.id}>
                            <td>{a.title}</td>
                            <td>
                              <span className={`badge ${a.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>{a.status}</span>
                            </td>
                            <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Low-rated doctors */}
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0"><i className="bi bi-emoji-frown me-2"></i>Bác sĩ có đánh giá thấp</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status"/>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>Bác sĩ</th>
                        <th>Điểm trung bình</th>
                        <th>Số đánh giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(lowRatedDoctors || []).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-4">Không có dữ liệu</td>
                        </tr>
                      ) : (
                        lowRatedDoctors.map((d) => (
                          <tr key={d.doctorId}>
                            <td>{d.doctorName}</td>
                            <td>
                              {d.avgRating.toFixed(2)}
                            </td>
                            <td>{d.reviewCount}</td>
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

export default AdminDashboard;


