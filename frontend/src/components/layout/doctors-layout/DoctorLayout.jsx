import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import DoctorSidebar from "./DoctorSidebar";
import DoctorHeader from "./DoctorHeader";

// Để tối ưu, truyền thông tin bác sĩ qua props hoặc context
const doctorInfo = {
  name: "Dr. Test User",
  department: "Khoa Nội",
  avatar: null, // Có thể là url hoặc null
};

const DoctorLayout = () => {
  return (
    <div className="doctor-layout">
      {/* Doctor Header */}
      <DoctorHeader doctorInfo={doctorInfo} />

      <div className="container-fluid">
        <div className="row">
          {/* Doctor Sidebar */}
          <DoctorSidebar doctorInfo={doctorInfo} />

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
