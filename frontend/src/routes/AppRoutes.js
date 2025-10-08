import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Common pages
import Home from "../pages/Home/Home";
import NotFound from "../pages/NotFound";

// Doctor pages
import DoctorLayout from "../components/layout/doctors-layout/DoctorLayout";
import DoctorDashboard from "../pages/Doctor/DoctorDashboard";
import DoctorScheduleManagement from "../pages/Doctor/DoctorScheduleManagement";
import DoctorAppointmentList from "../pages/Doctor/DoctorAppointmentList";
import DoctorProfile from "../pages/Doctor/DoctorProfile";

// Patient pages
import PatientAppointmentBooking from "../pages/Patient/PatientAppointmentBooking";
import PatientAppointmentHistory from "../pages/Patient/PatientAppointmentHistory";
import PatientProfile from "../pages/Patient/PatientProfile";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />

      {/* Doctor Routes */}
      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorScheduleManagement />} />
        <Route path="appointments" element={<DoctorAppointmentList />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Patient Routes */}
      <Route
        path="/patient"
        element={<Navigate to="/patient/book-appointment" replace />}
      />
      <Route
        path="/patient/book-appointment"
        element={<PatientAppointmentBooking />}
      />
      <Route
        path="/patient/appointments"
        element={<PatientAppointmentHistory />}
      />
      <Route path="/patient/profile" element={<PatientProfile />} />

      {/* 404 Route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
