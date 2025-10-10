import React from 'react';

const MedicinesManagement = () => {
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Thuốc</h2>
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Thêm thuốc
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="mb-0 text-muted">Tính năng quản lý thuốc sẽ được bổ sung tại đây.</p>
        </div>
      </div>
    </div>
  );
};

export default MedicinesManagement;


