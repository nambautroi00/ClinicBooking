import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'bi-house', label: 'Trang chủ' },
    { path: '/doctor/dashboard', icon: 'bi-person-badge', label: 'Bác sĩ' },
    { path: '/patient/book-appointment', icon: 'bi-calendar-plus', label: 'Đặt lịch' }
  ];

  return (
    <nav className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
      <div className="position-sticky pt-3">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                to={item.path}
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
