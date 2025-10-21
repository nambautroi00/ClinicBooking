import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import { Menu, X } from "lucide-react";

const DoctorHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Gọi API logout nếu có
      await axiosClient.post('/auth/logout', { 
        token: localStorage.getItem('token') 
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Tiếp tục logout ngay cả khi API lỗi
    } finally {
      // Xóa dữ liệu local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('doctorId');
      
      // Dispatch event để các component khác biết user đã logout
      window.dispatchEvent(new Event('userChanged'));
      
      // Chuyển về trang chủ
      navigate('/');
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-primary doctor-header shadow-sm"
      style={{ position: "sticky", top: 0, zIndex: 1050 }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          {/* Toggle Sidebar Button */}
          <button
            className="btn btn-outline-light btn-sm d-lg-none me-2"
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Ẩn menu" : "Hiện menu"}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link
            className="navbar-brand d-flex align-items-center"
            to="/doctor/dashboard"
          >
            <i className="bi bi-hospital me-2 fs-3"></i>
            <span className="fw-bold fs-5">Bác sĩ</span>
          </Link>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link className="nav-link text-white d-none d-md-block" to="/">
            <i className="bi bi-house fs-5"></i>
            <span className="ms-1">Trang chủ</span>
          </Link>
          
          {/* Nút đăng xuất nổi bật */}
          <button
            className="btn btn-outline-light btn-sm d-flex align-items-center"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="d-none d-sm-inline">Đăng xuất</span>
          </button>
          
          
        </div>
      </div>
    </nav>
  );
};

export default DoctorHeader;
