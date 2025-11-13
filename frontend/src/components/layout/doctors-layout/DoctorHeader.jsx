import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import notificationApi from "../../../api/notificationApi";
import { Menu, X } from "lucide-react";

const DoctorHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get current user - use useMemo to avoid re-parsing
  const currentUser = React.useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      console.log('🔍 Current user from localStorage:', user);
      return user;
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
      return null;
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
      console.log('⚠️ No current user or user ID, skipping notification fetch');
      return;
    }
    
    try {
      console.log('🔔 Fetching notifications for user ID:', currentUser.id);
      const response = await notificationApi.getNotifications(currentUser.id);
      console.log('📥 Notification response:', response.data);
      const list = Array.isArray(response.data?.content) ? response.data.content : [];
      const unread = typeof response.data?.unreadCount === 'number' ? response.data.unreadCount : (list.filter(n => !n.isRead).length);
      console.log('✅ Notifications loaded:', list.length, 'Unread:', unread);
      setNotifications(list);
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await notificationApi.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      fetchNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      await notificationApi.markAllAsRead(currentUser.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  };

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = async () => {
    try {
      // Gọi API logout nếu có
      await axiosClient.post('/auth/logout', { 
        token: localStorage.getItem('token') 
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Tiếp tục logout ngay cả khi API lỗi
    } finally {
      // Xóa dữ liệu local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('doctorId');
      
      // Dispatch event để các component khác biết user đã logout
      window.dispatchEvent(new Event('userChanged'));
      
      // Chuyển về trang chủ
      navigate('/');
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark doctor-header shadow-sm"
      style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 1050,
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
        overflow: "visible"
      }}
    >
      <div className="container-fluid px-3 py-2" style={{ overflow: "visible" }}>
        <div className="d-flex align-items-center justify-content-between w-100" style={{ overflow: "visible" }}>
          <div className="d-flex align-items-center gap-2">
            {/* Toggle Sidebar Button */}
            <button
              className="btn btn-link text-white d-lg-none p-2"
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Ẩn menu" : "Hiện menu"}
              style={{ textDecoration: "none" }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link
              className="navbar-brand d-flex align-items-center text-white text-decoration-none"
              to="/doctor/dashboard"
            >
              <i className="bi bi-hospital-fill me-2" style={{ fontSize: "1.5rem" }}></i>
              <span className="fw-bold" style={{ fontSize: "1.1rem" }}>Bác sĩ</span>
            </Link>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            {/* Shortcut to Messages */}
            <Link
              to="/doctor/messages"
              className="btn btn-outline-light d-none d-md-inline-flex align-items-center px-3 py-2"
              title="Tin nhắn"
              style={{ 
                fontSize: "0.9rem",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-chat-dots me-1"></i>
              <span>Tin nhắn</span>
            </Link>

            {/* Notifications Button */}
            <div className="position-relative notification-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-outline-light d-none d-md-inline-flex align-items-center px-3 py-2 position-relative"
                title="Thông báo"
                style={{ 
                  fontSize: "0.9rem",
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  transition: "all 0.2s"
                }}
              >
                <i className="bi bi-bell me-1"></i>
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div 
                  className="position-fixed bg-white rounded-3 shadow-lg border" 
                  style={{ 
                    width: "380px", 
                    maxWidth: "calc(100vw - 40px)", 
                    zIndex: 9999,
                    maxHeight: "500px",
                    overflow: "hidden",
                    top: "70px",
                    right: "20px"
                  }}
                >
                  <div className="p-3 border-bottom bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold text-dark">Thông báo</h6>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="btn btn-sm btn-link text-primary text-decoration-none p-0"
                          style={{ fontSize: "0.85rem" }}
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
                        <p className="mb-0">Không có thông báo nào</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-bottom ${
                            !notification.isRead ? 'bg-light' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                          style={{ 
                            cursor: "pointer", 
                            transition: "background-color 0.2s" 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? 'white' : '#f8f9fa'}
                        >
                          <div className="d-flex gap-2 align-items-start">
                            <div className={`mt-1 ${notification.isRead ? 'text-muted' : 'text-primary'}`}>
                              <i className={`bi ${notification.type === 'APPOINTMENT' ? 'bi-calendar-check-fill' : 'bi-info-circle-fill'} fs-5`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "0.9rem" }}>
                                {notification.title}
                              </h6>
                              <p className="mb-1 text-muted small">
                                {notification.message}
                              </p>
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(notification.createdAt).toLocaleString('vi-VN')}
                              </small>
                            </div>
                            {!notification.isRead && (
                              <div>
                                <span className="badge bg-primary rounded-circle p-1" style={{ width: "8px", height: "8px" }}></span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shortcut to Profile */}
            <Link
              to="/doctor/profile"
              className="btn btn-outline-light d-none d-md-inline-flex align-items-center px-3 py-2"
              title="Hồ sơ cá nhân"
              style={{ 
                fontSize: "0.9rem",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-person me-1"></i>
              <span>Hồ sơ</span>
            </Link>

            {/* Mobile Icons */}
            <Link
              to="/doctor/messages"
              className="btn btn-link text-white d-inline d-md-none p-2"
              title="Tin nhắn"
              style={{ textDecoration: "none" }}
            >
              <i className="bi bi-chat-dots text-white" style={{ fontSize: 18 }}></i>
            </Link>
            
            {/* Mobile Notification Button */}
            <div className="position-relative notification-container d-inline d-md-none">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-link text-white p-2 position-relative"
                title="Thông báo"
                style={{ textDecoration: "none" }}
              >
                <i className="bi bi-bell text-white" style={{ fontSize: 18 }}></i>
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.6rem", padding: "2px 5px" }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <Link
              to="/doctor/profile"
              className="btn btn-link text-white d-inline d-md-none p-2"
              title="Hồ sơ"
              style={{ textDecoration: "none" }}
            >
              <i className="bi bi-person text-white" style={{ fontSize: 18 }}></i>
            </Link>
            {/* Nút đăng xuất */}
            <button
              className="btn btn-outline-light d-flex align-items-center px-3 py-2"
              onClick={handleLogout}
              title="Đăng xuất"
              style={{ 
                fontSize: "0.9rem",
                borderColor: "rgba(255, 255, 255, 0.5)",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="d-none d-sm-inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorHeader;
