import React, { useState, useEffect } from 'react';
import doctorScheduleApi from '../../api/doctorScheduleApi';
import DoctorScheduleForm from './DoctorScheduleForm';

const DoctorScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'calendar'

  useEffect(() => {
    // Mock user for testing - using real doctorId from database
    const mockUser = { doctorId: 8, fullName: 'Hồng Nguyễn' };
    
    if (mockUser?.doctorId) {
      loadSchedules();
    }
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock user for testing - using real doctorId from database
      const mockUser = { doctorId: 8, fullName: 'Hồng Nguyễn' };
      
      console.log('Loading schedules for doctorId:', mockUser.doctorId);
      const response = await doctorScheduleApi.getSchedulesByDoctor(mockUser.doctorId);
      console.log('API Response:', response.data);
      setSchedules(response.data);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Không thể tải lịch trình: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (scheduleData) => {
    try {
      // Mock user for testing - using real doctorId from database
      const mockUser = { doctorId: 8, fullName: 'Hồng Nguyễn' };
      
      await doctorScheduleApi.createSchedule({
        ...scheduleData,
        doctorId: mockUser.doctorId
      });
      setShowForm(false);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateSchedule = async (scheduleId, scheduleData) => {
    try {
      await doctorScheduleApi.updateSchedule(scheduleId, scheduleData);
      setEditingSchedule(null);
      loadSchedules();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      try {
        await doctorScheduleApi.deleteSchedule(scheduleId);
        loadSchedules();
      } catch (err) {
        setError('Không thể xóa lịch trình: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Available': 'badge bg-success',
      'Busy': 'badge bg-warning',
      'Unavailable': 'badge bg-danger'
    };
    return statusClasses[status] || 'badge bg-secondary';
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
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Quản lý lịch trình</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              <div className="btn-group me-2">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('table')}
                >
                  <i className="bi bi-table"></i> Bảng
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setViewMode('calendar')}
                >
                  <i className="bi bi-calendar3"></i> Lịch
                </button>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => setShowForm(true)}
              >
                <i className="bi bi-plus-circle"></i> Thêm lịch trình
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
                  <h5 className="mb-0">
                    Lịch trình của bác sĩ: Hồng Nguyễn
                  </h5>
            </div>
            
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {viewMode === 'table' ? (
                // Table View
                schedules.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">Chưa có lịch trình nào</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowForm(true)}
                    >
                      <i className="bi bi-plus-circle"></i> Thêm lịch trình đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Ngày làm việc</th>
                          <th>Thời gian bắt đầu</th>
                          <th>Thời gian kết thúc</th>
                          <th>Trạng thái</th>
                          <th>Ghi chú</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((schedule) => (
                          <tr key={schedule.scheduleId}>
                            <td>{formatDate(schedule.workDate)}</td>
                            <td>{formatTime(schedule.startTime)}</td>
                            <td>{formatTime(schedule.endTime)}</td>
                            <td>
                              <span className={getStatusBadge(schedule.status)}>
                                {schedule.status}
                              </span>
                            </td>
                            <td>{schedule.notes || '-'}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setEditingSchedule(schedule)}
                                  title="Chỉnh sửa"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                                  title="Xóa"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                // Calendar View (simplified for now)
                <div className="text-center py-4">
                  <i className="bi bi-calendar3 text-primary" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">Chế độ xem lịch đang được phát triển</p>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setViewMode('table')}
                  >
                    <i className="bi bi-table"></i> Chuyển về chế độ bảng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal cho form tạo/sửa lịch trình */}
      {(showForm || editingSchedule) && (
        <DoctorScheduleForm
          schedule={editingSchedule}
          onSubmit={editingSchedule ? 
            (data) => handleUpdateSchedule(editingSchedule.scheduleId, data) :
            handleCreateSchedule
          }
          onClose={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
        />
      )}
    </div>
  );
};

export default DoctorScheduleManagement;
