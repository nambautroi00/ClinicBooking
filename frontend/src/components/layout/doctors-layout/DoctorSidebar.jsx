import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import doctorApi from "../../../api/doctorApi";

const DoctorSidebar = () => {
  const location = useLocation();
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Đang tải...",
    department: "",
    avatar: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        setLoading(true);
        setError("");
        // Lấy userId từ cookie
        const userId = Cookies.get("userId");
        console.log("userId from cookie:", userId);
        if (!userId) {
          setError("Không tìm thấy userId trong cookie");
          setLoading(false);
          return;
        }

        // Lấy doctorId từ userId (theo logic DoctorScheduleManagement.jsx)
        const doctorRes = await doctorApi.getDoctorByUserId(userId);
        let doctorData = doctorRes.data || doctorRes;
        if (Array.isArray(doctorData)) doctorData = doctorData[0];
        const doctorId = doctorData?.doctorId || doctorData?.id;
        console.log("doctorId:", doctorId);
        if (!doctorId) {
          setError("Không tìm thấy doctorId từ userId");
          setLoading(false);
          return;
        }

        // doctorData đã chứa đầy đủ thông tin bác sĩ
        setDoctorInfo({
          name:
            `${doctorData.user?.firstName || ""} ${
              doctorData.user?.lastName || ""
            }`.trim() || "Không xác định",
          department: doctorData.department?.departmentName || "Chưa phân công",
          avatar: doctorData.user?.avatarUrl || null,
        });
        setLoading(false);
      } catch (err) {
        setError("Lỗi khi lấy thông tin bác sĩ");
        setDoctorInfo({
          name: "Không xác định",
          department: "Chưa phân công",
          avatar: null,
        });
        setLoading(false);
      }
    };
    fetchDoctorInfo();
  }, []);

  const menuItems = [
    {
      path: "/doctor/dashboard",
      icon: "bi-speedometer2",
      label: "Dashboard",
      description: "Tổng quan hoạt động",
    },
    {
      path: "/doctor/schedule",
      icon: "bi-calendar3",
      label: "Quản lý lịch trình",
      description: "Lịch làm việc cá nhân",
    },
    {
      path: "/doctor/available-slots",
      icon: "bi-clock",
      label: "Quản lý lịch hẹn khả dụng",
      description: "Khung giờ cho bệnh nhân đặt",
    },
    {
      path: "/doctor/appointments",
      icon: "bi-calendar-check",
      label: "Lịch hẹn bệnh nhân",
      description: "Danh sách lịch hẹn",
    },
    {
      path: "/doctor/medical-records",
      icon: "bi-file-text",
      label: "Hồ sơ bệnh án",
      description: "Quản lý bệnh án",
    },
    {
      path: "/doctor/prescriptions",
      icon: "bi-capsule",
      label: "Kê đơn thuốc",
      description: "Tạo đơn thuốc mới",
    },
    {
      path: "/doctor/profile",
      icon: "bi-person",
      label: "Hồ sơ cá nhân",
      description: "Thông tin cá nhân",
    },
  ];

  return (
    <nav
      className="bg-light doctor-sidebar"
      style={{
        position: "fixed",
        top: "20px",
        left: 0,
        height: "100vh",
        width: "280px",
        overflowY: "auto",
        borderRight: "1px solid #eee",
        zIndex: 1040,
      }}
    >
      <div>
        {/* Doctor Info */}
        <div className="doctor-info mb-1">
          <div className="text-center">
            <div className="doctor-avatar mb-2">
              {doctorInfo.avatar ? (
                <img
                  src={doctorInfo.avatar}
                  alt="avatar"
                  className="rounded-circle"
                  style={{ width: 90, height: 90 }}
                />
              ) : (
                <i
                  className="bi bi-person-circle text-primary"
                  style={{ fontSize: "3rem" }}
                ></i>
              )}
            </div>
            {loading ? (
              <>
                <h6 className="mb-1">Đang tải...</h6>
                <small className="text-muted">Bác sĩ</small>
              </>
            ) : error ? (
              <>
                <h6 className="mb-1 text-danger">{error}</h6>
                <small className="text-muted">Bác sĩ</small>
              </>
            ) : (
              <>
                <h6 className="mb-1">{doctorInfo.name}</h6>

                <small className="text-muted">{doctorInfo.department}</small>
              </>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item mb-2">
              <Link
                className={`nav-link doctor-menu-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                to={item.path}
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${item.icon} me-3`}></i>
                  <div>
                    <div className="fw-semibold">{item.label}</div>
                    <small className="text-muted">{item.description}</small>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default DoctorSidebar;
