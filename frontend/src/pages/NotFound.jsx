import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="error-template">
            <h1 className="display-1 text-muted">404</h1>
            <h2 className="mb-4">Không tìm thấy trang</h2>
            <div className="error-details mb-4">
              <p className="text-muted">
                Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
              </p>
            </div>
            <div className="error-actions">
              <Link to="/" className="btn btn-primary btn-lg">
                <i className="bi bi-house"></i> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
