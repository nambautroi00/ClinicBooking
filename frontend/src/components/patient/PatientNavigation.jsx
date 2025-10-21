import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, FileText, UserCircle } from 'lucide-react';

const PatientNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Đặt lịch khám',
      path: '/patient/book-appointment',
      icon: Home
    },
    {
      title: 'Lịch khám của tôi',
      path: '/patient/appointments',
      icon: CalendarCheck
    },
    {
      title: 'Hồ sơ bệnh án',
      path: '/patient/medical-records',
      icon: FileText
    },
    {
      title: 'Hồ sơ cá nhân',
      path: '/patient/profile',
      icon: UserCircle
    }
  ];

  return (
    <Nav variant="pills" className="bg-light p-3 rounded">
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Nav.Item key={item.path}>
            <Nav.Link 
              as={Link} 
              to={item.path} 
              active={isActive}
              className="d-flex align-items-center"
            >
              <IconComponent size={16} className="me-2" />
              {item.title}
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
};

export default PatientNavigation;