import React, { useState, useEffect } from "react";
import appointmentApi from "../../api/appointmentApi";

const statusBadge = {
  Pending: "badge bg-warning",
  Confirmed: "badge bg-success",
  Cancelled: "badge bg-danger",
};

const DoctorAppointmentList = () => {
  // Giả sử doctorId lấy từ localStorage, context, hoặc prop
  const doctorId = localStorage.getItem("doctorId") || 1; // chỉnh lại cho phù hợp
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    appointmentApi
      .getAppointmentsByDoctor(doctorId)
      .then((res) => {
        setAppointments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || err.message || "Lỗi khi lấy dữ liệu"
        );
        setLoading(false);
      });
  }, [doctorId]);

  // Xác nhận/hủy: gọi API cập nhật trạng thái
  const handleConfirm = async (id) => {
    try {
      setLoading(true);
      const res = await appointmentApi.updateAppointment(id, {
        status: "Confirmed",
      });
      setAppointments((prev) =>
        prev.map((item) => (item.appointmentId === id ? res.data : item))
      );
      setLoading(false);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Lỗi xác nhận lịch hẹn"
      );
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      setLoading(true);
      const res = await appointmentApi.cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((item) => (item.appointmentId === id ? res.data : item))
      );
      setLoading(false);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Lỗi hủy lịch hẹn"
      );
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Danh sách lịch hẹn bệnh nhân</h1>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  ></div>
                  <div className="mt-2">Đang tải dữ liệu...</div>
                </div>
              ) : error ? (
                <div className="text-center text-danger py-5">
                  <i
                    className="bi bi-exclamation-triangle"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <div className="mt-2">{error}</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-primary">
                      <tr>
                        <th>Tên bệnh nhân</th>
                        <th>Ngày hẹn</th>
                        <th>Giờ hẹn</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5">
                            <i
                              className="bi bi-calendar-x text-muted"
                              style={{ fontSize: "2rem" }}
                            ></i>
                            <div className="mt-2 text-muted">
                              Không có lịch hẹn nào
                            </div>
                          </td>
                        </tr>
                      ) : (
                        appointments.map((item) => (
                          <tr key={item.appointmentId}>
                            <td>{item.patientName}</td>
                            <td>{item.date}</td>
                            <td>{item.time}</td>
                            <td>
                              <span
                                className={
                                  statusBadge[item.status] ||
                                  "badge bg-secondary"
                                }
                              >
                                {item.status}
                              </span>
                            </td>
                            <td>{item.notes}</td>
                            <td className="text-center">
                              {item.status === "Pending" && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success me-2"
                                    onClick={() =>
                                      handleConfirm(item.appointmentId)
                                    }
                                  >
                                    <i className="bi bi-check2"></i> Xác nhận
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleCancel(item.appointmentId)
                                    }
                                  >
                                    <i className="bi bi-x"></i> Hủy
                                  </button>
                                </>
                              )}
                              {item.status === "Confirmed" && (
                                <span className="text-success fw-bold">
                                  Đã xác nhận
                                </span>
                              )}
                              {item.status === "Cancelled" && (
                                <span className="text-danger fw-bold">
                                  Đã hủy
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentList;
