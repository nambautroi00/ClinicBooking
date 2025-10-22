import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import userApi from "../../../api/userApi";

const AdminHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const loadUserData = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    // Load initial data
    loadUserData();

    // Listen for changes in localStorage
    const handleStorageChange = () => {
      loadUserData();
    };

    // Listen for custom events when user data is updated
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  // Function to refresh user data from API
  const refreshUserData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        const response = await userApi.getUserById(currentUser.id);
        if (response.data) {
          setUser(response.data);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(response.data));
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('userChanged'));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleLogout = () => {
    // Xóa token và user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Chuyển về trang login
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Refresh user data before showing modal
    refreshUserData();
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  return (
    <>
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-0 fixed-top py-0" style={{height: '70px', zIndex: 1030}}>
      <div className="container-fluid px-4 h-100 d-flex align-items-center">
        <Link to="/admin" className="navbar-brand d-flex align-items-center">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
            <i className="bi bi-hospital text-white fs-4" />
          </div>
          <div>
            <span className="fw-bold text-dark fs-4">Clinic Admin</span>
            <br />
            <small className="text-muted fs-6">Hệ thống quản trị</small>
          </div>
        </Link>

        <div className="d-flex align-items-center gap-2 ms-auto">
          <button 
            className="btn btn-outline-primary d-flex align-items-center px-3"
            style={{ minWidth: '160px' }}
            onClick={handleProfileClick}
            title="Xem hồ sơ"
          >
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
              <i className="bi bi-person text-white" style={{fontSize: '0.9rem'}} />
            </div>
            <span className="fw-semibold text-truncate d-none d-lg-inline" style={{maxWidth: '100px'}}>
              {user ? user.firstName + ' ' + user.lastName : 'Admin'}
            </span>
          </button>

          <button 
            className="btn btn-outline-danger d-flex align-items-center px-3"
            style={{ minWidth: '140px' }}
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <i className="bi bi-box-arrow-right" />
            <span className="fw-semibold d-none d-lg-inline ms-2">Đăng xuất</span>
          </button>
        </div>
      </div>
    </nav>

    {/* Profile Modal */}
    {showProfileModal && (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Thông tin cá nhân</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={closeProfileModal}
              ></button>
            </div>
            <div className="modal-body">
              {user ? (
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px'}}>
                      <i className="bi bi-person text-white fs-2" />
                    </div>
                    <h6 className="fw-bold">{user.firstName} {user.lastName}</h6>
                    <span className="badge bg-primary">{user.role?.name || 'Admin'}</span>
                  </div>
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email</label>
                      <div className="form-control-plaintext">{user.email}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Họ và tên</label>
                      <div className="form-control-plaintext">{user.firstName} {user.lastName}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Số điện thoại</label>
                      <div className="form-control-plaintext">{user.phone || 'Chưa cập nhật'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Địa chỉ</label>
                      <div className="form-control-plaintext">{user.address || 'Chưa cập nhật'}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Trạng thái</label>
                      <div>
                        <span className={`badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                          {user.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-person-circle text-muted" style={{fontSize: '3rem'}}></i>
                  <p className="text-muted mt-2">Không có thông tin người dùng</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeProfileModal}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  closeProfileModal();
                  navigate('/admin/profile');
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AdminHeader;



