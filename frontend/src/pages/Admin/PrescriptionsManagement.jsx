import React from 'react';

const PrescriptionsManagement = () => {
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Đơn thuốc</h2>
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Thêm đơn thuốc
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="mb-0 text-muted">Tính năng quản lý đơn thuốc sẽ được bổ sung tại đây.</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsManagement;


