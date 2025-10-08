import React from 'react';

const Footer = () => {
  return (
    <footer className="footer mt-auto py-3 bg-light">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <span className="text-muted">
              © 2024 ClinicBooking System. All rights reserved.
            </span>
          </div>
          <div className="col-md-6 text-end">
            <span className="text-muted">
              Hệ thống quản lý phòng khám
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
