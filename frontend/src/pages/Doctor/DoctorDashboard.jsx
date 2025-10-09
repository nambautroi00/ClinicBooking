import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import doctorScheduleApi from "../../api/doctorScheduleApi";

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalSchedules: 0,
    todaySchedules: 0,
    availableSlots: 0,
    busySlots: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user for testing - using real doctorId from database
    const mockUser = {
      doctorId: 8,
      fullName: "Hồng Nguyễn",
      specialization: "Nội khoa",
      department: { departmentName: "Khoa Nội" },
    };

    if (mockUser?.doctorId) {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock user for testing - using real doctorId from database
      const mockUser = {
        doctorId: 8,
        fullName: "Hồng Nguyễn",
        specialization: "Nội khoa",
        department: { departmentName: "Khoa Nội" },
      };

      const response = await doctorScheduleApi.getSchedulesByDoctor(
        mockUser.doctorId
      );
      const schedules = response.data;

      const today = new Date().toISOString().split("T")[0];
      const todaySchedules = schedules.filter((s) => s.workDate === today);

      setStats({
        totalSchedules: schedules.length,
        todaySchedules: todaySchedules.length,
        availableSlots: schedules.filter((s) => s.status === "Available")
          .length,
        busySlots: schedules.filter((s) => s.status === "Busy").length,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Tổng lịch trình
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.totalSchedules}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="bi bi-calendar3 text-primary"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Lịch hôm nay
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.todaySchedules}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="bi bi-calendar-day text-success"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Có sẵn
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.availableSlots}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="bi bi-check-circle text-info"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Đã bận
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.busySlots}
                  </div>
                </div>
                <div className="col-auto">
                  <i
                    className="bi bi-clock text-warning"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Thao tác nhanh
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Link
                    to="/doctor/schedule"
                    className="btn btn-primary btn-block"
                  >
                    <i className="bi bi-calendar-plus"></i> Thêm lịch trình
                  </Link>
                </div>
                <div className="col-md-6 mb-3">
                  <Link
                    to="/doctor/appointments"
                    className="btn btn-success btn-block"
                  >
                    <i className="bi bi-calendar-check"></i> Xem lịch hẹn
                  </Link>
                </div>
                <div className="col-md-6 mb-3">
                  <Link to="/doctor/profile" className="btn btn-info btn-block">
                    <i className="bi bi-person"></i> Hồ sơ cá nhân
                  </Link>
                </div>
                <div className="col-md-6 mb-3">
                  <button className="btn btn-warning btn-block">
                    <i className="bi bi-bell"></i> Thông báo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">
                Lịch trình gần đây
              </h6>
            </div>
            <div className="card-body">
              {stats.todaySchedules > 0 ? (
                <div className="text-center">
                  <i
                    className="bi bi-calendar-day text-success"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="mt-3">
                    Bạn có {stats.todaySchedules} lịch trình hôm nay
                  </p>
                  <Link to="/doctor/appointments" className="btn btn-primary">
                    Xem chi tiết
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <i
                    className="bi bi-calendar-x text-muted"
                    style={{ fontSize: "3rem" }}
                  ></i>
                  <p className="mt-3 text-muted">Không có lịch trình hôm nay</p>
                  <Link to="/doctor/schedule" className="btn btn-primary">
                    Thêm lịch trình
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
