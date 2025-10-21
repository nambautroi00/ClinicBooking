import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PatientNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Đặt lịch khám',
      path: '/patient/book-appointment',
      icon: 'bi-calendar-plus'
    },
    {
      title: 'Lịch khám của tôi',
      path: '/patient/appointments',
      icon: 'bi-calendar-check'
    },
    {
      title: 'Hồ sơ bệnh án',
      path: '/patient/medical-records',
      icon: 'bi-file-medical'
    },
    {
      title: 'Hồ sơ cá nhân',
      path: '/patient/profile',
      icon: 'bi-person'
    }
  ];

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-person-circle me-2"></i>
          Bệnh nhân
        </h5>
      </div>
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`list-group-item list-group-item-action d-flex align-items-center ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <i className={`${item.icon} me-3`}></i>
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientNavigation;