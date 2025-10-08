import React from 'react';

const DoctorProfile = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Hồ sơ cá nhân</h1>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-person text-primary" style={{ fontSize: '4rem' }}></i>
              <h4 className="mt-3">Hồ sơ cá nhân</h4>
              <p className="text-muted">Tính năng đang được phát triển...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
