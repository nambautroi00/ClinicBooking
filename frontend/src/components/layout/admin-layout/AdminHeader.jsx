import React from "react";
import { Link } from "react-router-dom";

const AdminHeader = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="container-fluid">
        <Link to="/admin" className="navbar-brand d-flex align-items-center">
          <i className="bi bi-hospital me-2" />
          <span>Clinic Admin</span>
        </Link>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="input-group d-none d-md-flex" style={{ maxWidth: 300 }}>
            <span className="input-group-text bg-transparent"><i className="bi bi-search" /></span>
            <input type="text" className="form-control" placeholder="Search..." />
          </div>

          <button className="btn btn-outline-secondary">
            <i className="bi bi-bell" />
          </button>

          <div className="dropdown">
            <button className="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
              <i className="bi bi-person-circle me-1" /> Admin
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><Link className="dropdown-item" to="/admin/profile">Profile</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item">Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;



