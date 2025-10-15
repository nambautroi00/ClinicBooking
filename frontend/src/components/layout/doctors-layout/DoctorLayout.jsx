import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Outlet } from "react-router-dom";
import DoctorSidebar from "./DoctorSidebar";
import DoctorHeader from "./DoctorHeader";
import doctorApi from "../../../api/doctorApi";
import userApi from "../../../api/userApi";
import { getFullAvatarUrl } from "../../../utils/avatarUtils";

// Constants
const CONTENT_STYLES = {
  marginLeft: "260px",
};

const MAIN_STYLES = {
  marginTop: -90,
  minHeight: "calc(100vh - 50px)",
  overflowY: "auto",
};

const DoctorLayout = () => {
  // Get current user from localStorage (memoized)
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  // Initialize with real user data from localStorage
  const [doctorInfo, setDoctorInfo] = useState(() => {
    if (currentUser) {
      return {
        name: currentUser.firstName && currentUser.lastName
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : currentUser.username || "Bác sĩ",
        department: "Đang tải...",
        avatar: currentUser.avatarUrl 
          ? getFullAvatarUrl(currentUser.avatarUrl) 
          : null,
      };
    }
    return {
      name: "Bác sĩ",
      department: "Đang tải...",
      avatar: null,
    };
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch doctor info with useCallback to avoid re-creating function
  const fetchDoctorInfo = useCallback(async () => {
    if (!currentUser) {
      console.error("No user found in localStorage");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch doctor and user info in parallel (faster!)
      const [doctorResponse, userResponse] = await Promise.all([
        doctorApi.getDoctorByUserId(currentUser.id),
        userApi.getUserById(currentUser.id),
      ]);

      const doctorData = doctorResponse.data;
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
      
      // Fallback to user info from localStorage
      setDoctorInfo({
        name:
          currentUser?.firstName && currentUser?.lastName
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : currentUser?.username || "Bác sĩ",
        department: "Không xác định",
        avatar: currentUser?.avatarUrl 
          ? getFullAvatarUrl(currentUser.avatarUrl) 
          : null,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load doctor info on mount and listen for updates
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
  }, [fetchDoctorInfo]);

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
      <DoctorSidebar doctorInfo={doctorInfo} loading={loading} />
      <div style={CONTENT_STYLES}>
        {/* Main Content: chỉ hiện thanh cuộn khi nội dung vượt quá khung hình */}
        <main className="px-md-6" style={MAIN_STYLES}>
          <div className="doctor-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
