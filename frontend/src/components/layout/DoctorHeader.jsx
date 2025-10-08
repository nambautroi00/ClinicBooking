import React from 'react';
import { Link } from 'react-router-dom';

const DoctorHeader = () => {

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary doctor-header">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/doctor/dashboard">
          <i className="bi bi-hospital"></i> ClinicBooking - Bác sĩ
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#doctorNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="doctorNavbar">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/doctor/dashboard">
                <i className="bi bi-speedometer2"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/doctor/schedule">
                <i className="bi bi-calendar3"></i> Lịch trình
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/doctor/appointments">
                <i className="bi bi-calendar-check"></i> Lịch hẹn
              </Link>
            </li>
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="bi bi-house"></i> Về trang chủ
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default DoctorHeader;
