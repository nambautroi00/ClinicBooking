import React from "react";
import { Link, useLocation } from "react-router-dom";

const DoctorSidebar = ({ doctorInfo }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: "/doctor/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      description: "Tổng quan hoạt động",
    },
    {
      path: "/doctor/schedule",
      icon: "bi-calendar3",
      label: "Quản lý lịch trình",
      description: "Lịch làm việc cá nhân",
    },
    {
      path: "/doctor/appointments",
      icon: "bi-calendar-check",
      label: "Lịch hẹn bệnh nhân",
      description: "Danh sách lịch hẹn",
    },
    {
      path: "/doctor/profile",
      icon: "bi-person",
      label: "Hồ sơ cá nhân",
      description: "Thông tin cá nhân",
    },
  ];

  return (
    <nav className="col-md-3 col-lg-2 d-md-block bg-light doctor-sidebar">
      <div className="position-sticky ">
        {/* Doctor Info */}
        <div className="doctor-info mb-1">
          <div className="text-center">
            <div className="doctor-avatar mb-2">
              {doctorInfo.avatar ? (
                <img
                  src={doctorInfo.avatar}
                  alt="avatar"
                  className="rounded-circle"
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <i
                  className="bi bi-person-circle text-primary"
                  style={{ fontSize: "3rem" }}
                ></i>
              )}
            </div>
            <h6 className="mb-1">{doctorInfo.name}</h6>
            <small className="text-muted">Bác sĩ</small>
            <br />
            <small className="text-muted">{doctorInfo.department}</small>
          </div>
        </div>

        {/* Menu Items */}
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item mb-2">
              <Link
                className={`nav-link doctor-menu-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                to={item.path}
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${item.icon} me-3`}></i>
                  <div>
                    <div className="fw-semibold">{item.label}</div>
                    <small className="text-muted">{item.description}</small>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default DoctorSidebar;
