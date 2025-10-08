import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';
import DoctorHeader from './DoctorHeader';

const DoctorLayout = () => {
  const location = useLocation();

  return (
    <div className="doctor-layout">
      {/* Doctor Header */}
      <DoctorHeader />
      
      <div className="container-fluid">
        <div className="row">
          {/* Doctor Sidebar */}
          <DoctorSidebar />
          
          {/* Main Content */}
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <div className="doctor-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;
