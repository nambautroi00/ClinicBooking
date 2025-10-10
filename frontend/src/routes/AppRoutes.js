import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Common pages
import Home from "../pages/Home/Home";
import NotFound from "../pages/NotFound";

// Auth
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import VerifyOtp from "../pages/Auth/VerifyOtp";

// Components / Guards
//import RoleProtectedRoute from "../components/auth/RoleProtectedRoute";

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

// Admin pages
import AdminLayout from "../components/layout/admin-layout/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import UsersManagement from "../pages/Admin/UsersManagement";
import DoctorsManagement from "../pages/Admin/DoctorsManagement";
import DepartmentsManagement from "../pages/Admin/DepartmentsManagement";
import AppointmentsManagement from "../pages/Admin/AppointmentsManagement";
import ReviewsManagement from "../pages/Admin/ReviewsManagement";
import PaymentsManagement from "../pages/Admin/PaymentsManagement";
import ArticleManagement from "../pages/Admin/ArticleManagement";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />

      {/* Patient */}
      <Route path="/patient" element={<Navigate to="/patient/book-appointment" replace />} />
      <Route path="/patient/book-appointment" element={<PatientAppointmentBooking />} />
      <Route path="/patient/appointments" element={<PatientAppointmentHistory />} />
      <Route path="/patient/profile" element={<PatientProfile />} />

      {/* Doctor (protected) */}
      <Route
        path="/doctor"
        // element={
        //   <RoleProtectedRoute allowed={["doctor", "admin"]}>
        //     <DoctorLayout />
        //   </RoleProtectedRoute>
        // }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorScheduleManagement />} />
        <Route path="appointments" element={<DoctorAppointmentList />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin (protected) */}
      <Route
        path="/admin"
        // element={
        //   <RoleProtectedRoute allowed={["admin"]}>
        //     <AdminLayout />
        //   </RoleProtectedRoute>
        // }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="doctors" element={<DoctorsManagement />} />
        <Route path="departments" element={<DepartmentsManagement />} />
        <Route path="appointments" element={<AppointmentsManagement />} />
        <Route path="articles" element={<ArticleManagement />} />
        <Route path="reviews" element={<ReviewsManagement />} />
        <Route path="payments" element={<PaymentsManagement />} />
      </Route>

      {/* 404 */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
