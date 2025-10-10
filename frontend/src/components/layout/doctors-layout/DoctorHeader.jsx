import React from "react";
import { Link } from "react-router-dom";

const DoctorHeader = ({ doctorInfo }) => {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-primary doctor-header shadow-sm"
      style={{ position: "sticky", top: 0, zIndex: 1050 }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <Link
            className="navbar-brand d-flex align-items-center"
            to="/doctor/dashboard"
          >
            <i className="bi bi-hospital me-2 fs-3"></i>
            <span className="fw-bold fs-5">Bác sĩ</span>
          </Link>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link className="nav-link text-white d-none d-md-block" to="/">
            <i className="bi bi-house fs-5"></i>
            <span className="ms-1">Trang chủ</span>
          </Link>
          <div className="dropdown">
            <button
              className="btn btn-link dropdown-toggle text-white d-flex align-items-center"
              type="button"
              id="doctorMenu"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ textDecoration: "none" }}
            >
              <i className="bi bi-person-circle me-2 fs-4"></i>
              <span className="fw-semibold">{doctorInfo?.name || 'Tài khoản'}</span>
            </button>
            <ul
              className="dropdown-menu dropdown-menu-end"
              aria-labelledby="doctorMenu"
            >
              <li>
                <Link className="dropdown-item" to="/doctor/profile">
                  <i className="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" to="/doctor/settings">
                  <i className="bi bi-gear me-2"></i> Cài đặt
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    /* TODO: handle logout */
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorHeader;
