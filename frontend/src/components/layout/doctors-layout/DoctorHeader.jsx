import React from "react";
import { Link } from "react-router-dom";

const DoctorHeader = ({ doctorInfo }) => {
  return (
    <nav
      className="navbar navbar-dark bg-primary doctor-header shadow-sm"
      style={{ position: "sticky", top: 0, zIndex: 1050 }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <Link
          className="navbar-brand d-flex align-items-center"
          to="/doctor/dashboard"
        >
          <i className="bi bi-hospital me-2"></i>
          <span>ClinicBooking - Bác sĩ</span>
        </Link>
        <div className="d-flex align-items-center">
          <span className="me-2">
            {doctorInfo.avatar ? (
              <img
                src={doctorInfo.avatar}
                alt="avatar"
                className="rounded-circle"
                style={{ width: 32, height: 32 }}
              />
            ) : (
              <i
                className="bi bi-person-circle"
                style={{ fontSize: "2rem" }}
              ></i>
            )}
          </span>
          <span className="fw-semibold text-white">{doctorInfo.name}</span>
          <span className="ms-2 badge bg-light text-dark">
            {doctorInfo.department}
          </span>
        </div>
        <Link className="nav-link text-white" to="/">
          <i className="bi bi-house"></i> Về trang chủ
        </Link>
      </div>
    </nav>
  );
};

export default DoctorHeader;
