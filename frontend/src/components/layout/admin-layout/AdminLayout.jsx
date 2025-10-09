import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";

const AdminLayout = () => {
  return (
    <div className="container-fluid">
      <AdminHeader />
      <div className="row">
        <nav className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
          <div className="position-sticky pt-3">
            <ul className="nav flex-column">
              <li className="nav-item">
                <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-speedometer2 me-2" /> Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-people me-2" /> Users
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/doctors" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-person-badge me-2" /> Doctors
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/departments" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-diagram-3 me-2" /> Departments
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/appointments" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-calendar-check me-2" /> Appointments
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/articles" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-file-earmark-text me-2" /> Articles
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/reviews" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-chat-dots me-2" /> Reviews
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/payments" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <i className="bi bi-credit-card me-2" /> Payments
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;


