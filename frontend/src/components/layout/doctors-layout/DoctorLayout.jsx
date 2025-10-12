import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DoctorSidebar from "./DoctorSidebar";
import DoctorHeader from "./DoctorHeader";
import doctorApi from "../../../api/doctorApi";
import userApi from "../../../api/userApi";
import { getFullAvatarUrl } from "../../../utils/avatarUtils";

const DoctorLayout = () => {
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Test User",
    department: "Khoa Nội",
    avatar: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorInfo();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchDoctorInfo();
    };

    window.addEventListener("doctorProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("doctorProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const fetchDoctorInfo = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (!currentUser) {
        console.error("No user found in localStorage");
        return;
      }

      // Fetch doctor info
      const doctorResponse = await doctorApi.getDoctorByUserId(currentUser.id);
      const doctorData = doctorResponse.data;

      // Fetch user info
      const userResponse = await userApi.getUserById(currentUser.id);
      const userData = userResponse.data;

      // Set doctor info
      setDoctorInfo({
        name: `${userData.firstName} ${userData.lastName}`,
        department: doctorData.department?.departmentName || "Chưa phân công",
        avatar: userData.avatarUrl
          ? getFullAvatarUrl(userData.avatarUrl)
          : null,
      });
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      // Fallback to default info
      const currentUser = JSON.parse(localStorage.getItem("user"));
      setDoctorInfo({
        name:
          currentUser?.firstName && currentUser?.lastName
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : "Test User",
        department: "Khoa Nội",
        avatar: null,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-layout">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Đang tải thông tin...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-layout">
      {/* Doctor Header */}
      <DoctorHeader doctorInfo={doctorInfo} />

      {/* Sidebar cố định trái, main content dịch sang phải */}
      <DoctorSidebar />
      <div style={{ marginLeft: "260px" }}>
        {/* Main Content: chỉ hiện thanh cuộn khi nội dung vượt quá khung hình */}
        <main
          className="px-md-6"
          style={{
            marginTop: -90,
            minHeight: "calc(100vh - 50px)",
            overflowY: "auto",
          }}
        >
          <div className="doctor-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
