import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Common pages
import Home from "../pages/Home/Home";
import Articles from "../pages/Articles";
import NotFound from "../pages/NotFound";
import SpecialtyDoctors from "../pages/SpecialtyDoctors";

// Auth
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import VerifyOtp from "../pages/Auth/VerifyOtp";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

// Components / Guards
//import RoleProtectedRoute from "../components/auth/RoleProtectedRoute";

// Doctor pages
import DoctorLayout from "../components/layout/doctors-layout/DoctorLayout";
import DoctorDashboard from "../pages/Doctor/DoctorDashboard";
import DoctorScheduleManagement from "../pages/Doctor/DoctorScheduleManagement";
import DoctorAppointmentList from "../pages/Doctor/DoctorAppointmentList";
import DoctorPatientManagement from "../pages/Doctor/DoctorPatientManagement";
import DoctorMessages from "../pages/Doctor/DoctorMessages";
import DoctorProfile from "../pages/Doctor/DoctorProfile";
import DoctorAvailableSlotManagement from "../pages/Doctor/DoctorAvailableSlotManagement";
import DoctorPrescriptions from "../pages/Doctor/DoctorPrescriptions";
import PrescriptionForm from "../pages/Doctor/PrescriptionForm";
import MedicalRecords from "../pages/Doctor/MedicalRecords";

// Patient pages
import PatientAppointmentBooking from "../pages/Patient/PatientAppointmentBooking";
import PatientBookingDetail from "../pages/Patient/PatientBookingDetail";
import PatientAppointmentHistory from "../pages/Patient/PatientAppointmentHistory";
import PatientProfile from "../pages/Patient/PatientProfile";
import PatientMedicalRecords from "../pages/Patient/PatientMedicalRecords";
import PatientMessages from "../pages/Patient/PatientMessages";
import Booking from "../pages/Booking";
import DoctorDetail from "../pages/DoctorDetail";
import TestAuth from "../pages/TestAuth";

// Admin pages
import AdminLayout from "../components/layout/admin-layout/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import UsersManagement from "../pages/Admin/UsersManagement";
import DepartmentsManagement from "../pages/Admin/DepartmentsManagement";
import MedicinesManagement from "../pages/Admin/MedicinesManagement";
import PrescriptionsManagement from "../pages/Admin/PrescriptionsManagement";
import AppointmentsManagement from "../pages/Admin/AppointmentsManagement";
import ReviewsManagement from "../pages/Admin/ReviewsManagement";
import PaymentsManagement from "../pages/Admin/PaymentsManagement";
import ArticleManagement from "../pages/Admin/ArticleManagement";
import ArticleDetail from "../components/article/ArticleDetail";
import PaymentSuccess from "../pages/Payment/PaymentSuccess";
import PaymentCancel from "../pages/Payment/PaymentCancel";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/articles" element={<Articles />} />
      <Route path="/articles/:id" element={<ArticleDetail />} />
      <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
      <Route path="/specialty/:departmentId" element={<SpecialtyDoctors />} />
      <Route path="/test-auth" element={<TestAuth />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Patient */}
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
      <Route path="/patient/medical-records" element={<PatientMedicalRecords />} />
      <Route path="/patient/messages" element={<PatientMessages />} />
      <Route path="/patient/booking/:doctorId" element={<PatientBookingDetail />} />

      {/* Doctor (protected) */}
      <Route
        path="/doctor"
        element={
          //   <RoleProtectedRoute allowed={["doctor", "admin"]}>
          <DoctorLayout />
          //   </RoleProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="schedule" element={<DoctorScheduleManagement />} />
        <Route
          path="available-slots"
          element={<DoctorAvailableSlotManagement />}
        />
        <Route path="appointments" element={<DoctorAppointmentList />} />
        <Route path="patients" element={<DoctorPatientManagement />} />
        <Route path="messages" element={<DoctorMessages />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="prescriptions/new" element={<PrescriptionForm />} />
        <Route path="medical-records" element={<MedicalRecords />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin (protected) */}
      <Route
        path="/admin"
        element={
          //   <RoleProtectedRoute allowed={["admin"]}>
          <AdminLayout />
          //   </RoleProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="users/:id" element={<UsersManagement />} />
        <Route path="departments" element={<DepartmentsManagement />} />
        <Route path="medicines" element={<MedicinesManagement />} />
        <Route path="prescriptions" element={<PrescriptionsManagement />} />
        <Route path="appointments" element={<AppointmentsManagement />} />
        <Route path="articles" element={<ArticleManagement />} />
        <Route path="articles/:id" element={<ArticleDetail />} />
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
