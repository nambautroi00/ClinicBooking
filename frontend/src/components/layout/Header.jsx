import React, { useState, useEffect } from "react";
import { Menu, X, Search, Phone, Globe, Facebook, Twitter, Instagram, Heart, MessageCircle, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import notificationApi from "../../api/notificationApi";
import userApi from "../../api/userApi";
import config from "../../config/config";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Function to navigate to messages based on user role
  const handleMessagesClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Always navigate to patient messages page
    navigate('/patient/messages');
  };

  // Function to handle notifications click
  const handleNotificationsClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setShowNotifications(!showNotifications);
    setShowUserDropdown(false); // Close user dropdown if open
  };

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!user || !user.id) return;
    
    try {
      console.log('🔔 Fetching notifications for user:', user.id);
      const response = await notificationApi.getNotifications(user.id);
      console.log('🔔 Notifications response:', response.data);
      
      const list = Array.isArray(response.data?.content) ? response.data.content : [];
      const unread = typeof response.data?.unreadCount === 'number' ? response.data.unreadCount : (list.filter(n => !n.isRead).length);
      setNotifications(list);
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      // Fallback to empty array if API fails
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Update UI immediately for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Call API to mark as read
      await notificationApi.markAsRead(notificationId);
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Revert UI changes if API call fails
      fetchNotifications();
    }
  };

  // Function to mark all as read
  const markAllAsRead = async () => {
    if (!user || !user.id) return;
    
    try {
      // Update UI immediately for better UX
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      // Call API to mark all as read
      await notificationApi.markAllAsRead(user.id);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      // Revert UI changes if API call fails
      fetchNotifications();
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserDropdown]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user from localStorage first
        const raw = localStorage.getItem('user');
        if (raw) {
          const userData = JSON.parse(raw);
          console.log('🔍 Header - Loading user from localStorage:', userData);
          console.log('🔍 Header - User firstName:', userData?.firstName);
          console.log('🔍 Header - User lastName:', userData?.lastName);
          console.log('🔍 Header - User avatar:', userData?.avatar);
          console.log('🔍 Header - User avatarUrl:', userData?.avatarUrl);
          
          // Check for encoding issues
          if (userData?.firstName?.includes('Ă') || userData?.lastName?.includes('Ă')) {
            console.log('⚠️ Header - Detected encoding issues, forcing page reload');
            window.location.reload();
            return;
          }
          
          // If avatar fields are missing, try to fetch from backend
          if (!userData?.avatar && !userData?.avatarUrl) {
            console.log('🔄 Header - Avatar fields missing, fetching from backend...');
            try {
              const response = await userApi.getCurrentUser();
              console.log('✅ Header - Fetched user from backend:', response.data);
              
              // Update localStorage with fresh data
              const updatedUser = { ...userData, ...response.data };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              return;
            } catch (apiError) {
              console.warn('⚠️ Header - Failed to fetch user from backend:', apiError);
            }
          }
          
          setUser(userData);
        } else {
          console.log('❌ Header - No user data found');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setUser(null);
      }
    };

    loadUserData();


    const onUserChanged = () => {
      console.log('🔄 Header received userChanged event');
      const val = localStorage.getItem('user');
      if (val) {
        const parsedUser = JSON.parse(val);
        console.log('👤 Updated user in header:', parsedUser);
        console.log('🔍 Header - User firstName:', parsedUser?.firstName);
        console.log('🔍 Header - User lastName:', parsedUser?.lastName);
        console.log('🔍 Header - User avatar:', parsedUser?.avatar);
        console.log('🔍 Header - User avatarUrl:', parsedUser?.avatarUrl);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('userChanged', onUserChanged);
    return () => {
      window.removeEventListener('userChanged', onUserChanged);
    };
  }, []);



  const menuItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Chuyên khoa", href: "/#specialties" },
    { label: "Bài viết", href: "/articles" },
    { label: "Đặt lịch", href: "/patient/book-appointment" },
  ];

  const userDropdownItems = [
    { label: "Lịch khám", href: "/patient/profile?tab=appointments", icon: "📅" },
    { label: "Lịch sử thanh toán", href: "/patient/profile?tab=payments", icon: "💳" },
    { label: "Tài khoản", href: "/patient/profile?tab=profile", icon: "👤" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top thin info bar */}
      <div className="bg-[#e9f6ff] border-b">
        <div className="w-full px-2">
          <div className="max-w-full mx-auto flex h-9 items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-[#034ea2]">
              <a href="tel:19002115" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Hotline: 1900 2115</span>
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button className="flex items-center gap-1 text-[#6b7280] hover:text-[#034ea2]">
                <Globe className="h-4 w-4" />
                <span>VN</span>
              </button>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="w-full px-4">
        <div className="max-w-full mx-auto flex items-center gap-8 py-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl overflow-hidden bg-white p-1">
              <img 
                src="/images/logo.png" 
                alt="ClinicBooking Logo" 
                className="h-full w-full object-cover rounded-lg"
                onError={(e) => {
                  // Fallback to original design if logo fails to load
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-[#0d6efd] text-white">
                      <svg class="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-[#0d6efd]">ClinicBooking</div>
              <div className="text-sm text-gray-500">Tìm bác sĩ, đặt lịch nhanh chóng</div>
            </div>
            <div className="sm:hidden">
              <div className="text-base font-bold text-[#0d6efd]">CB</div>
            </div>
          </Link>

          {/* Center search - shorter with larger text */}
          <div className="flex-1 hidden sm:block">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Tìm bác sĩ, chuyên khoa..."
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-10 pr-4 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cfe9ff]"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-6">
              {menuItems.map((item) => {
                const handleClick = (e) => {
                  if (item.href.includes('#')) {
                    e.preventDefault();
                    const [path, anchor] = item.href.split('#');
                    navigate(path);
                    setTimeout(() => {
                      const element = document.getElementById(anchor);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }
                };

                return (
                  <Link 
                    key={item.label} 
                    to={item.href} 
                    className="text-base font-medium text-gray-700 hover:text-[#0d6efd]"
                    onClick={handleClick}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {/* Messages Button */}
            <button
              onClick={handleMessagesClick}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-[#0d6efd] hover:text-white text-gray-600 transition-all duration-200 group"
              title="Nhắn tin"
            >
              <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Notifications Button */}
            <div className="relative notifications-dropdown">
              <button
                onClick={handleNotificationsClick}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-[#0d6efd] hover:text-white text-gray-600 transition-all duration-200 group"
                title="Thông báo"
              >
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-[#0d6efd] hover:underline"
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.isRead ? 'bg-gray-300' : 'bg-[#0d6efd]'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200 text-center">
                      <button
                        className="text-sm text-[#0d6efd] hover:underline"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                      >
                        Xem tất cả thông báo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* If user is logged in show name + logout, otherwise show login button */}
            {user ? (
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <div className="relative user-dropdown">
                    <button
                      className="text-base font-medium hover:underline flex items-center gap-1"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      {user ? (
                        user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.firstName || user.email || 'User'
                      ) : 'Đăng nhập'}
                    </button>
                    
                    {/* User Dropdown Menu */}
                    {showUserDropdown && (
                      <div 
                        className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                        onMouseEnter={() => setShowUserDropdown(true)}
                        onMouseLeave={() => setShowUserDropdown(false)}
                      >
                        {userDropdownItems.map((item, index) => (
                          <Link
                            key={index}
                            to={item.href}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
                <button
                  className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-2 text-base text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await axiosClient.post('/auth/logout', { token: localStorage.getItem('token') });
                    } catch (e) {
                      // ignore
                    }
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('userChanged'));
                    navigate('/');
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:inline-block rounded-md bg-[#0d6efd] px-4 py-2 text-base text-white">Đăng nhập</Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-1" 
              onClick={() => {
                setShowMobileHeader(!showMobileHeader);
                setMobileMenuOpen(!mobileMenuOpen);
              }} 
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showMobileHeader && (
          <div className="md:hidden pb-3 animate-slideDown">
            <div className="max-w-full mx-auto px-2 relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="search" placeholder="Tìm bác sĩ, chuyên khoa..." className="pl-10 bg-gray-100 w-full rounded-md py-2 text-lg" />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {showMobileHeader && (
          <nav className="md:hidden border-t py-4 space-y-3 max-w-full mx-auto px-2 animate-slideDown">
            {menuItems.map((item) => {
              const handleClick = (e) => {
                setMobileMenuOpen(false);
                setShowMobileHeader(false);
                if (item.href.includes('#')) {
                  e.preventDefault();
                  const [path, anchor] = item.href.split('#');
                  navigate(path);
                  setTimeout(() => {
                    const element = document.getElementById(anchor);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }
              };

              return (
                <Link 
                  key={item.label} 
                  to={item.href} 
                  className="block text-base font-medium text-gray-700 hover:text-[#0d6efd]"
                  onClick={handleClick}
                >
                  {item.label}
                </Link>
              );
            })}
            
            {/* Mobile Messages Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowMobileHeader(false);
                handleMessagesClick();
              }}
              className="flex items-center gap-3 w-full text-base font-medium text-gray-700 hover:text-[#0d6efd] py-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Nhắn tin</span>
            </button>
            
            {user ? (
              <div className="space-y-2">
                <div className="text-base font-medium text-gray-700 mb-2">
                  {user.firstName || user.email}
                </div>
                {userDropdownItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-base text-gray-700 hover:text-[#0d6efd] hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowMobileHeader(false);
                    }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  className="w-full inline-block rounded-md border border-red-200 bg-white px-3 py-1 text-base text-red-600 text-center hover:bg-red-50 mt-2"
                  onClick={async () => {
                    try {
                      await axiosClient.post('/auth/logout', { token: localStorage.getItem('token') });
                    } catch (e) {
                      // ignore
                    }
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.dispatchEvent(new Event('userChanged'));
                    navigate('/');
                    setMobileMenuOpen(false);
                    setShowMobileHeader(false);
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link to="/login" className="w-full inline-block rounded-md bg-[#0d6efd] px-3 py-1 text-base text-white text-center">Đăng nhập</Link>
            )}
          </nav>
        )}
      </div>

    </header>
  );
}
