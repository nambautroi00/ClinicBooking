import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DoctorSidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/doctor/dashboard',
      icon: 'bi-speedometer2',
      label: 'Dashboard',
      description: 'Tổng quan hoạt động'
    },
    {
      path: '/doctor/schedule',
      icon: 'bi-calendar3',
      label: 'Quản lý lịch trình',
      description: 'Lịch làm việc cá nhân'
    },
    {
      path: '/doctor/appointments',
      icon: 'bi-calendar-check',
      label: 'Lịch hẹn bệnh nhân',
      description: 'Danh sách lịch hẹn'
    },
    {
      path: '/doctor/profile',
      icon: 'bi-person',
      label: 'Hồ sơ cá nhân',
      description: 'Thông tin cá nhân'
    }
  ];

  return (
    <nav className="col-md-3 col-lg-2 d-md-block bg-light doctor-sidebar collapse">
      <div className="position-sticky pt-3">
        {/* Doctor Info */}
        <div className="doctor-info mb-4">
          <div className="text-center">
            <div className="doctor-avatar mb-2">
              <i className="bi bi-person-circle text-primary" style={{ fontSize: '3rem' }}></i>
            </div>
            <h6 className="mb-1">Dr. Test User</h6>
            <small className="text-muted">Bác sĩ</small>
            <br />
            <small className="text-muted">Khoa Nội</small>
          </div>
        </div>

        {/* Menu Items */}
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item mb-2">
              <Link
                className={`nav-link doctor-menu-item ${location.pathname === item.path ? 'active' : ''}`}
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

        {/* Quick Stats */}
        <div className="mt-4">
          <div className="card border-0 bg-light">
            <div className="card-body p-3">
              <h6 className="card-title text-center mb-3">
                <i className="bi bi-graph-up text-success"></i> Thống kê nhanh
              </h6>
              <div className="row text-center">
                <div className="col-6">
                  <div className="border-end">
                    <h6 className="text-primary mb-1">0</h6>
                    <small className="text-muted">Hôm nay</small>
                  </div>
                </div>
                <div className="col-6">
                  <h6 className="text-success mb-1">0</h6>
                  <small className="text-muted">Tuần này</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorSidebar;
