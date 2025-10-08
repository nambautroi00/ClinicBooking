import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-hospital"></i> ClinicBooking
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="bi bi-house"></i> Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/doctor/dashboard">
                <i className="bi bi-person-badge"></i> Bác sĩ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/patient/book-appointment">
                <i className="bi bi-calendar-plus"></i> Đặt lịch
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
