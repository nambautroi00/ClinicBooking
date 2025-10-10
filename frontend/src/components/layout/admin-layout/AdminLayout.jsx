import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="container-fluid">
      <AdminHeader />
      <div style={{height: '70px'}}></div>
      <div className="row">
        {/* Sidebar Navigation */}
        <nav className="bg-primary sidebar" style={{position: 'fixed', top: '0px', left: 0, height: 'calc(100vh - 70px)', width: '260px', zIndex: 1029}}>
          <div className="pt-4" style={{height: '100%', overflowY: 'auto'}}>
            
            <ul className="nav flex-column px-3">
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin" 
                  end 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-speedometer2 me-3 fs-5" /> 
                  <span className="fw-semibold">Dashboard</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-people me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý người dùng</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/doctors" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-person-badge me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý bác sĩ</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/departments" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-diagram-3 me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý khoa</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/appointments" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-calendar-check me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý lịch hẹn</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/articles" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-file-earmark-text me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý bài viết</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/reviews" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-chat-dots me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý đánh giá</span>
                </NavLink>
              </li>
              
              <li className="nav-item mb-2">
                <NavLink 
                  to="/admin/payments" 
                  className={({ isActive }) => `nav-link text-white d-flex align-items-center py-3 px-3 rounded ${isActive ? "active" : "hover-bg-light"}`}
                  style={{transition: 'all 0.3s ease', textDecoration: 'none'}}
                >
                  <i className="bi bi-credit-card me-3 fs-5" /> 
                  <span className="fw-semibold">Quản lý thanh toán</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        <main className="admin-main col-md-9 ms-sm-auto col-lg-10">
          <div className="content-card p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


