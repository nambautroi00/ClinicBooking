import React from "react";
import { useNavigate } from "react-router-dom";
import scheduleImg from "../../assets/images/schedule_landing.png"; // Đổi đường dẫn nếu cần

const DoctorScheduleLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-5">
      <div className="row align-items-center">
        <div className="col-md-6 text-center mb-4 mb-md-0">
          <img
            src={scheduleImg}
            alt="Quản lý lịch trình bác sĩ"
            style={{ maxWidth: "350px", width: "100%" }}
          />
        </div>
        <div className="col-md-6">
          <h1 className="display-5 fw-bold mb-3 text-primary">
            Quản lý lịch trình bác sĩ
          </h1>
          <p className="lead mb-4">
            Dễ dàng tạo, chỉnh sửa, và theo dõi lịch làm việc của bác sĩ. Tối ưu
            hóa quản lý thời gian, nâng cao chất lượng phục vụ bệnh nhân.
          </p>
          <ul className="list-unstyled mb-4">
            <li className="mb-2">
              <i className="bi bi-calendar-check text-success me-2"></i>
              Tạo và cập nhật lịch làm việc nhanh chóng
            </li>
            <li className="mb-2">
              <i className="bi bi-bar-chart-line text-info me-2"></i>
              Thống kê lịch trình trực quan
            </li>
            <li className="mb-2">
              <i className="bi bi-shield-check text-primary me-2"></i>
              Quản lý trạng thái: Có sẵn, Bận, Nghỉ
            </li>
          </ul>
          <button
            className="btn btn-lg btn-primary px-4"
            onClick={() => navigate("/doctor/schedule-management")}
          >
            Quản lý lịch trình ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorScheduleLanding;
