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
      className="navbar navbar-expand-lg navbar-dark doctor-header shadow-sm"
      style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 1050,
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
      }}
    >
      <div className="container-fluid px-3 py-2">
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center gap-2">
            {/* Toggle Sidebar Button */}
            <button
              className="btn btn-link text-white d-lg-none p-2"
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Ẩn menu" : "Hiện menu"}
              style={{ textDecoration: "none" }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link
              className="navbar-brand d-flex align-items-center text-white text-decoration-none"
              to="/doctor/dashboard"
            >
              <i className="bi bi-hospital-fill me-2" style={{ fontSize: "1.5rem" }}></i>
              <span className="fw-bold" style={{ fontSize: "1.1rem" }}>Bác sĩ</span>
            </Link>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            {/* Nút đăng xuất */}
            <button
              className="btn btn-outline-light d-flex align-items-center px-3 py-2"
              onClick={handleLogout}
              title="Đăng xuất"
              style={{ 
                fontSize: "0.9rem",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="d-none d-sm-inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorHeader;
