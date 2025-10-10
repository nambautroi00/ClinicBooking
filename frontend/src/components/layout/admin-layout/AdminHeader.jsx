import React from "react";
import { Link } from "react-router-dom";

const AdminHeader = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-0">
      <div className="container-fluid px-4">
        <Link to="/admin" className="navbar-brand d-flex align-items-center">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
            <i className="bi bi-hospital text-white fs-5" />
          </div>
          <div>
            <span className="fw-bold text-dark fs-5">Clinic Admin</span>
            <br />
            <small className="text-muted">Hệ thống quản trị</small>
          </div>
        </Link>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="input-group d-none d-md-flex shadow-sm" style={{ maxWidth: 350 }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted" />
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 shadow-none" 
              placeholder="Tìm kiếm..." 
              style={{borderRadius: '0 0.375rem 0.375rem 0'}}
            />
          </div>

          <button className="btn btn-outline-primary position-relative">
            <i className="bi bi-bell" />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>
              3
            </span>
          </button>

          <div className="dropdown">
            <button 
              className="btn btn-outline-primary dropdown-toggle d-flex align-items-center" 
              data-bs-toggle="dropdown"
              type="button"
            >
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: '32px', height: '32px'}}>
                <i className="bi bi-person text-white" />
              </div>
              <span className="fw-semibold">Admin</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{borderRadius: '12px', padding: '8px'}}>
              <li>
                <Link className="dropdown-item d-flex align-items-center py-2" to="/admin/profile" style={{borderRadius: '8px'}}>
                  <i className="bi bi-person me-3 text-primary" />
                  <div>
                    <div className="fw-semibold">Thông tin cá nhân</div>
                    <small className="text-muted">Xem và chỉnh sửa</small>
                  </div>
                </Link>
              </li>
              <li>
                <Link className="dropdown-item d-flex align-items-center py-2" to="/admin/settings" style={{borderRadius: '8px'}}>
                  <i className="bi bi-gear me-3 text-primary" />
                  <div>
                    <div className="fw-semibold">Cài đặt</div>
                    <small className="text-muted">Tùy chỉnh hệ thống</small>
                  </div>
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2 text-danger" style={{borderRadius: '8px'}}>
                  <i className="bi bi-box-arrow-right me-3" />
                  <div>
                    <div className="fw-semibold">Đăng xuất</div>
                    <small className="text-muted">Thoát khỏi hệ thống</small>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;



