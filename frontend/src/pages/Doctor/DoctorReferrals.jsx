import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import referralApi from '../../api/referralApi';

const DoctorReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const doctorId = user.doctorId;

  useEffect(() => {
    if (doctorId) {
      loadReferrals();
    }
  }, [doctorId]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralApi.getReferralsByDoctor(doctorId);
      setReferrals(response.data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
      alert('Không thể tải danh sách chỉ định');
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter(r => 
    filter === 'ALL' ? true : r.status === filter
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'warning', icon: 'hourglass-split', text: 'Chờ thực hiện' },
      IN_PROGRESS: { bg: 'primary', icon: 'arrow-repeat', text: 'Đang thực hiện' },
      DONE: { bg: 'success', icon: 'check-circle-fill', text: 'Đã hoàn thành' },
      CANCELLED: { bg: 'danger', icon: 'x-circle-fill', text: 'Đã hủy' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`badge bg-${config.bg} text-white`}>
        <i className={`bi bi-${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDepartmentIcon = (deptName) => {
    if (!deptName) return 'bi-hospital text-secondary';
    if (deptName.includes('Xét nghiệm')) return 'bi-droplet-fill text-danger';
    if (deptName.includes('Chẩn đoán hình ảnh') || deptName.includes('X-quang')) 
      return 'bi-x-diamond-fill text-primary';
    if (deptName.includes('Siêu âm')) return 'bi-soundwave text-info';
    return 'bi-hospital text-secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            <i className="bi bi-clipboard2-pulse text-info me-2"></i>
            Quản lý Chỉ định Cận Lâm Sàng
          </h3>
          <p className="text-muted mb-0">Theo dõi kết quả xét nghiệm và chẩn đoán hình ảnh</p>
        </div>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/doctor/dashboard')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Quay lại Dashboard
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <ul className="nav nav-pills">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'DONE'].map(status => (
              <li key={status} className="nav-item">
                <button
                  className={`nav-link ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'ALL' ? 'Tất cả' : 
                   status === 'PENDING' ? 'Chờ thực hiện' :
                   status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã hoàn thành'}
                  <span className="badge bg-light text-dark ms-2">
                    {status === 'ALL' 
                      ? referrals.length 
                      : referrals.filter(r => r.status === status).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {filteredReferrals.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="text-muted mt-3">Chưa có chỉ định nào</h5>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredReferrals.map(referral => (
            <div key={referral.referralId} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                   onClick={() => referral.status === 'DONE' && navigate(`/doctor/referrals/${referral.referralId}`)}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">
                        <i className={`${getDepartmentIcon(referral.toDepartment?.departmentName)} me-2`}></i>
                        {referral.toDepartment?.departmentName || 'N/A'}
                      </h6>
                      <small className="text-muted">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatDateTime(referral.createdAt)}
                      </small>
                    </div>
                    {getStatusBadge(referral.status)}
                  </div>

                  <div className="border-start border-4 border-primary ps-3 mb-3">
                    <div className="fw-bold text-dark">
                      <i className="bi bi-person-fill me-2 text-primary"></i>
                      {referral.appointment?.patient?.user?.lastName} {referral.appointment?.patient?.user?.firstName}
                    </div>
                    <small className="text-muted">
                      {referral.appointment?.patient?.user?.email}
                    </small>
                  </div>

                  {referral.notes && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">
                        <i className="bi bi-chat-left-text me-1"></i>
                        Yêu cầu:
                      </small>
                      <p className="mb-0 small bg-light p-2 rounded">
                        {referral.notes}
                      </p>
                    </div>
                  )}

                  {referral.status === 'DONE' && (
                    <div className="border-top pt-3">
                      <small className="text-success fw-bold d-block mb-2">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Đã có kết quả
                      </small>
                      {referral.completedAt && (
                        <small className="text-muted d-block mb-2">
                          <i className="bi bi-clock me-1"></i>
                          {formatDateTime(referral.completedAt)}
                        </small>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/referrals/${referral.referralId}`);
                        }}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Xem kết quả
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorReferrals;
