import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import doctorApi from '../api/doctorApi';

const DoctorDetail = () => {
    const { doctorId } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDoctorDetail = async () => {
            try {
                setLoading(true);
                console.log('Fetching doctor detail for ID:', doctorId);
                const response = await doctorApi.getDoctorById(doctorId);
                console.log('Doctor detail response:', response);
                setDoctor(response.data);
            } catch (err) {
                console.error('Error fetching doctor detail:', err);
                setError(err.response?.data?.message || 'Lỗi khi tải thông tin bác sĩ');
            } finally {
                setLoading(false);
            }
        };

        if (doctorId) {
            fetchDoctorDetail();
        }
    }, [doctorId]);

    if (loading) {
        return (
            <div className="container-fluid px-4">
                <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 fs-5">Đang tải thông tin bác sĩ...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid px-4">
                <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                        <div>
                            <h4 className="alert-heading">Lỗi!</h4>
                            <p>{error}</p>
                            <hr />
                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn-outline-danger" 
                                    onClick={() => window.location.reload()}
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Thử lại
                                </button>
                                <Link to="/doctors" className="btn btn-primary">
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Quay lại danh sách
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="container-fluid px-4">
                <div className="alert alert-warning" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-3 fs-4"></i>
                        <div>
                            <h4 className="alert-heading">Không tìm thấy</h4>
                            <p>Không tìm thấy thông tin bác sĩ với ID: {doctorId}</p>
                            <hr />
                            <Link to="/doctors" className="btn btn-primary">
                                <i className="bi bi-arrow-left me-2"></i>
                                Quay lại danh sách
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'ACTIVE': { color: 'success', text: 'Hoạt động' },
            'INACTIVE': { color: 'warning', text: 'Không hoạt động' },
            'SUSPENDED': { color: 'secondary', text: 'Tạm khóa' }
        };

        const config = statusConfig[status] || { color: 'secondary', text: 'Không xác định' };
        
        return (
            <span className={`badge bg-${config.color} fs-6`}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="container-fluid px-4">
            {/* Header */}
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom">
                <div className="d-flex align-items-center">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{width: '60px', height: '60px'}}>
                        <i className="bi bi-person-badge fs-3"></i>
                    </div>
                    <div>
                        <h1 className="h2 text-primary mb-1">Hồ sơ bác sĩ</h1>
                        <p className="text-muted mb-0">
                            Thông tin chi tiết về bác sĩ {doctor.user?.firstName} {doctor.user?.lastName}
                        </p>
                    </div>
                </div>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <div className="btn-group me-2">
                        <Link to="/doctors" className="btn btn-outline-secondary">
                            <i className="bi bi-arrow-left me-2"></i>
                            Quay lại danh sách
                        </Link>
                        <Link to="/" className="btn btn-outline-primary">
                            <i className="bi bi-house me-2"></i>
                            Về trang chủ
                        </Link>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Thông tin cá nhân */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-primary text-white">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-person-circle me-2"></i>
                                Thông tin cá nhân
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-person me-2"></i>
                                            Họ và tên
                                        </label>
                                        <p className="form-control-plaintext fs-5">
                                            {doctor.user?.firstName} {doctor.user?.lastName}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-envelope me-2"></i>
                                            Email
                                        </label>
                                        <p className="form-control-plaintext">
                                            {doctor.user?.email}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-telephone me-2"></i>
                                            Số điện thoại
                                        </label>
                                        <p className="form-control-plaintext">
                                            {doctor.user?.phone || 'Chưa cập nhật'}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-gender-ambiguous me-2"></i>
                                            Giới tính
                                        </label>
                                        <p className="form-control-plaintext">
                                            {doctor.user?.gender === 'MALE' ? 'Nam' : 
                                             doctor.user?.gender === 'FEMALE' ? 'Nữ' : 
                                             doctor.user?.gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-calendar me-2"></i>
                                            Ngày sinh
                                        </label>
                                        <p className="form-control-plaintext">
                                            {formatDate(doctor.user?.dateOfBirth)}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            Địa chỉ
                                        </label>
                                        <p className="form-control-plaintext">
                                            {doctor.user?.address || 'Chưa cập nhật'}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-clock me-2"></i>
                                            Ngày tạo tài khoản
                                        </label>
                                        <p className="form-control-plaintext">
                                            {formatDate(doctor.user?.createdAt)}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-primary">
                                            <i className="bi bi-shield-check me-2"></i>
                                            Trạng thái tài khoản
                                        </label>
                                        <div className="mt-1">
                                            {getStatusBadge(doctor.user?.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin chuyên môn */}
                    <div className="card shadow-sm border-0 mt-4">
                        <div className="card-header bg-success text-white">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-award me-2"></i>
                                Thông tin chuyên môn
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-success">
                                            <i className="bi bi-bookmark me-2"></i>
                                            Chuyên khoa
                                        </label>
                                        <p className="form-control-plaintext fs-5">
                                            {doctor.specialty || 'Chưa cập nhật'}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-success">
                                            <i className="bi bi-building me-2"></i>
                                            Khoa
                                        </label>
                                        <p className="form-control-plaintext fs-5">
                                            {doctor.department?.departmentName || 'Chưa phân khoa'}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-success">
                                            <i className="bi bi-shield-check me-2"></i>
                                            Trạng thái hồ sơ
                                        </label>
                                        <div className="mt-1">
                                            {getStatusBadge(doctor.status)}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold text-success">
                                            <i className="bi bi-clock me-2"></i>
                                            Ngày tạo hồ sơ
                                        </label>
                                        <p className="form-control-plaintext">
                                            {formatDate(doctor.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {doctor.bio && (
                                <div className="mt-4">
                                    <label className="form-label fw-semibold text-success">
                                        <i className="bi bi-file-text me-2"></i>
                                        Tiểu sử
                                    </label>
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-0" style={{whiteSpace: 'pre-wrap'}}>
                                            {doctor.bio}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    {/* Thông tin tóm tắt */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-info text-white">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-info-circle me-2"></i>
                                Thông tin tóm tắt
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                        <span className="fw-semibold">ID Bác sĩ:</span>
                                        <span className="badge bg-primary fs-6">#{doctor.doctorId}</span>
                                    </div>
                                </div>
                                
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                        <span className="fw-semibold">ID User:</span>
                                        <span className="badge bg-secondary fs-6">#{doctor.user?.id}</span>
                                    </div>
                                </div>
                                
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                        <span className="fw-semibold">Khoa:</span>
                                        <span className="fw-bold text-primary">{doctor.department?.departmentName || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                                        <span className="fw-semibold">Trạng thái:</span>
                                        {getStatusBadge(doctor.status)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thống kê */}
                    <div className="card shadow-sm border-0 mt-4">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-graph-up me-2"></i>
                                Thống kê
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3 text-center">
                                <div className="col-4">
                                    <div className="bg-primary text-white rounded p-3">
                                        <div className="fw-bold fs-4">{doctor.appointments?.length || 0}</div>
                                        <small>Lịch hẹn</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="bg-success text-white rounded p-3">
                                        <div className="fw-bold fs-4">{doctor.schedules?.length || 0}</div>
                                        <small>Lịch làm việc</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="bg-info text-white rounded p-3">
                                        <div className="fw-bold fs-4">{doctor.reviews?.length || 0}</div>
                                        <small>Đánh giá</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card shadow-sm border-0 mt-4">
                        <div className="card-header bg-dark text-white">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-gear me-2"></i>
                                Thao tác
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link
                                    to={`/patient/book-appointment?doctorId=${doctor.doctorId}`}
                                    className="btn btn-success"
                                >
                                    <i className="bi bi-calendar-plus me-2"></i>
                                    Đặt lịch hẹn
                                </Link>
                                
                                <Link
                                    to={`/doctor/${doctor.doctorId}/edit`}
                                    className="btn btn-primary"
                                >
                                    <i className="bi bi-pencil me-2"></i>
                                    Chỉnh sửa thông tin
                                </Link>
                                
                                <button className="btn btn-info">
                                    <i className="bi bi-calendar3 me-2"></i>
                                    Xem lịch làm việc
                                </button>
                                
                                <button className="btn btn-warning">
                                    <i className="bi bi-list-check me-2"></i>
                                    Xem lịch hẹn
                                </button>
                                
                                {doctor.status === 'ACTIVE' && (
                                    <button className="btn btn-outline-warning">
                                        <i className="bi bi-pause-circle me-2"></i>
                                        Tạm khóa
                                    </button>
                                )}
                                
                                {doctor.status === 'INACTIVE' && (
                                    <button className="btn btn-outline-success">
                                        <i className="bi bi-play-circle me-2"></i>
                                        Kích hoạt
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetail;

