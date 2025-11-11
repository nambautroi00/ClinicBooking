import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFullAvatarUrl } from '../../../utils/avatarUtils';

export default function AdminHeader({ onToggleSidebar, sidebarCollapsed }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  // --- Scroll states ---
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setCompact(y > 80);
      // Ẩn khi cuộn xuống (scroll down) vượt 160px, hiện lại khi cuộn lên
      if (y > 160 && y > lastY + 5) setHidden(true);
      else if (y < lastY - 5) setHidden(false);

      // Cập nhật biến CSS cho layout (để main có đúng padding-top)
      const currentHeight = y > 80 ? 56 : 80; // 80 expanded, 56 compact
      document.documentElement.style.setProperty('--current-header-height', currentHeight + 'px');
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Khởi tạo biến lúc load
    document.documentElement.style.setProperty('--current-header-height', '80px');
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  // Đồng bộ user
  useEffect(() => {
    const syncUser = () => {
      try { setUser(JSON.parse(localStorage.getItem('user')) || null); } catch { setUser(null); }
    };
    window.addEventListener('storage', syncUser);
    window.addEventListener('userChanged', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userChanged', syncUser);
    };
  }, []);

  const refreshUserData = async () => {
    if (!user?.id) return;
    try {
      setLoadingRefresh(true);
      // Gọi API nếu có
    } catch (e) {
      console.error('Refresh user error', e);
    } finally {
      setLoadingRefresh(false);
    }
  };

  const handleOpenProfile = async () => {
    await refreshUserData();
    setShowProfileModal(true);
  };

  const handleLogout = async () => {
    try { /* await userApi?.logout?.(); */ } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/login');
  };

  const avatar = getFullAvatarUrl(user?.avatarUrl);
  const displayName = user
    ? (user.firstName || '') + ' ' + (user.lastName || '')
    : 'Admin';

  return (
    <>
      <header
        className={
          'admin-header d-flex align-items-center justify-content-between px-0' +
          (compact ? ' compact' : '') +
          (hidden ? ' hidden' : '') +
          (scrolled ? ' scrolled' : '')
        }
      >
        <div className="admin-header__brand">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="toggle-side-btn"
            aria-label="Toggle sidebar"
          >
            <i className={"bi " + (sidebarCollapsed ? "bi-list" : "bi-arrow-bar-left")}></i>
          </button>
          <Link to="/admin" className="admin-header__logo" title="Trang quản trị">
            <span className="admin-header__logo-icon">🏥</span>
            <span className="admin-header__logo-text">
              <strong>Clinic Admin</strong>
              <em>Quản trị</em>
            </span>
          </Link>
        </div>

        <div className="admin-header__actions">
          <button
            type="button"
            onClick={handleOpenProfile}
            className="ah-btn ah-btn-light ah-avatar-btn"
            title="Xem hồ sơ"
          >
            <span className="ah-avatar">
              <img
                src={avatar}
                alt="avatar"
                onError={(e) => { e.currentTarget.src = '/images/default-doctor.png'; }}
              />
            </span>
            <span className="ah-text" title={displayName.trim() || 'Tài khoản'}>
              {displayName.trim() || 'Tài khoản'}
            </span>
            {loadingRefresh && <span className="ah-loading">…</span>}
          </button>

          <Link
            to="/admin/profile"
            className="ah-btn ah-btn-outline"
            title="Chỉnh sửa thông tin"
            onClick={() => setShowProfileModal(false)}
          >
            Chỉnh sửa
          </Link>

          <button
            onClick={handleLogout}
            className="ah-btn ah-btn-danger"
            title="Đăng xuất"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h5 className="font-semibold text-sm">Thông tin cá nhân</h5>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowProfileModal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mb-3">
                      <img
                        src={avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/images/default-doctor.png'; }}
                      />
                    </div>
                    <div className="font-semibold text-base">{displayName || '—'}</div>
                    <div className="text-xs text-gray-500">{user.email || 'Chưa có email'}</div>
                    <span className="mt-2 inline-block rounded bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-medium">
                      {user.role?.name || 'Admin'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Số điện thoại" value={user.phone} />
                    <Info
                      label="Trạng thái"
                      value={
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      }
                    />
                    <Info label="Địa chỉ" value={user.address} className="col-span-2" />
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  Không có thông tin người dùng
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
                onClick={() => setShowProfileModal(false)}
              >
                Đóng
              </button>
              <Link
                to="/admin/profile"
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => setShowProfileModal(false)}
              >
                Chỉnh sửa
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800 text-sm break-words">
        {value || <span className="text-gray-400">Chưa cập nhật</span>}
      </span>
    </div>
  );
}