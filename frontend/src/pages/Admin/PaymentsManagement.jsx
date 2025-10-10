import React, { useEffect, useMemo, useState } from "react";
import paymentApi from "../../api/paymentApi";

const PaymentsManagement = () => {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc"); // asc | desc

  const fetchPayments = async () => {
    if (!patientId) {
      setPayments([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await paymentApi.getHistoryByPatient(Number(patientId));
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể tải lịch sử thanh toán");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const displayedPayments = useMemo(() => {
    let rows = Array.isArray(payments) ? [...payments] : [];
    if (appointmentFilter) {
      const q = appointmentFilter.toString().trim().toLowerCase();
      rows = rows.filter((p) => {
        const apptId = (p.appointmentId || p.appointment?.appointmentId || "").toString().toLowerCase();
        return apptId.includes(q);
      });
    }
    rows.sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      const getVal = (r) => {
        if (sortField === "amount") return Number(r.amount || 0);
        if (sortField === "status") return (r.status || "");
        if (sortField === "appointmentId") return Number(r.appointmentId || r.appointment?.appointmentId || 0);
        if (sortField === "id") return Number(r.id || 0);
        // Default to ID sorting
        return Number(r.id || 0);
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return rows;
  }, [payments, appointmentFilter, sortField, sortOrder]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Breadcrumb removed as requested */}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Quản lý thanh toán</h2>
              <p className="text-muted mb-0">Tra cứu lịch sử thanh toán theo bệnh nhân</p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0"><i className="bi bi-search me-2"></i>Tìm kiếm</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="patientId" className="form-label">ID Bệnh nhân</label>
                  <input
                    id="patientId"
                    type="number"
                    className="form-control"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Nhập ID bệnh nhân"
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="appointmentFilter" className="form-label">Mã lịch hẹn</label>
                  <input
                    id="appointmentFilter"
                    type="text"
                    className="form-control"
                    value={appointmentFilter}
                    onChange={(e) => setAppointmentFilter(e.target.value)}
                    placeholder="Nhập mã lịch hẹn để lọc"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Sắp xếp</label>
                  <div className="d-flex gap-2">
                    <select className="form-select" value={sortField} onChange={(e) => setSortField(e.target.value)}>
                      <option value="id">ID</option>
                      <option value="createdAt">Thời gian tạo</option>
                      <option value="amount">Số tiền</option>
                      <option value="status">Trạng thái</option>
                      <option value="appointmentId">Mã lịch hẹn</option>
                    </select>
                    <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                      <option value="desc">Giảm dần</option>
                      <option value="asc">Tăng dần</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="btn-group w-100">
                    <button className="btn btn-primary" onClick={fetchPayments} disabled={loading}>
                      <i className="bi bi-search"></i> Tìm
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => { setPatientId(""); setPayments([]); setAppointmentFilter(""); }}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-text mt-2">Nhập ID bệnh nhân để xem lịch sử thanh toán.</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0"><i className="bi bi-receipt me-2"></i>Danh sách thanh toán</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status"/>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>OrderID</th>
                        <th>AppointmentID</th>
                        <th>Số tiền</th>
                        <th>Trạng thái</th>
                        <th>Mã giao dịch</th>
                        <th>Tạo lúc</th>
                        <th>Thanh toán lúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(displayedPayments || []).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">Không có dữ liệu</td>
                        </tr>
                      ) : (
                        displayedPayments.map((p) => (
                          <tr key={p.paymentId}>
                            <td>{p.paymentId}</td>
                            <td>{p.orderId}</td>
                            <td>{p.appointmentId || p.appointment?.appointmentId}</td>
                            <td>{(p.amount || 0).toLocaleString('vi-VN')} đ</td>
                            <td>
                              <span className={`badge ${p.status === 'Paid' ? 'bg-success' : p.status === 'Failed' ? 'bg-danger' : 'bg-secondary'}`}>{p.status}</span>
                            </td>
                            <td>{p.transactionId || '-'}</td>
                            <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
                            <td>{p.paidAt ? new Date(p.paidAt).toLocaleString() : ''}</td>
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

export default PaymentsManagement;


