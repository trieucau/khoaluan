import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDetailUserById } from '../../services/userService';

const ROUTE_LABELS = {
  '/admin': 'Trang chủ',
  '/admin/list-user': 'Người dùng',
  '/admin/add-user': 'Thêm người dùng',
  '/admin/list-order': 'Đơn hàng',
  '/admin/list-product': 'Sản phẩm',
  '/admin/add-product': 'Thêm sản phẩm',
  '/admin/list-category': 'Danh mục',
  '/admin/list-brand': 'Nhãn hàng',
  '/admin/list-banner': 'Banner',
  '/admin/list-blog': 'Blog',
  '/admin/list-supplier': 'Nhà cung cấp',
  '/admin/list-receipt': 'Nhập hàng',
  '/admin/list-typeship': 'Loại ship',
  '/admin/list-voucher': 'Voucher',
  '/admin/turnover': 'Doanh thu',
  '/admin/profit': 'Lợi nhuận',
  '/admin/stock-product': 'Tồn kho',
  '/admin/chat': 'Tin nhắn',
  '/admin/shipper-map': 'Bản đồ',
};

const Header = ({ onToggleSidebar }) => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData || {});

    if (userData.id) {
      getDetailUserById(userData.id)
        .then((res) => {
          if (res?.errCode === 0 && res.data?.image) {
            setUser((prev) => ({ ...prev, image: res.data.image }));
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Admin';
  const pageLabel = ROUTE_LABELS[location.pathname] || 'Quản trị';

  return (
    <nav className="ap-header-bar">
      {/* Hamburger — mobile only */}
      <button className="ap-hamburger" onClick={onToggleSidebar} aria-label="Mở menu">
        <i className="fa-solid fa-bars"></i>
      </button>

      <Link className="ap-logo" to="/admin" style={{ marginLeft: 8 }}>
        <div
          className="ap-logo-icon"
          style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}
        >
          <img
            src="/favicon.ico"
            alt="AdminHub"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
          />
        </div>
        <span className="ap-logo-text">AdminHub</span>
      </Link>

      <div className="ap-header-center">
        <div className="ap-breadcrumb">
          <Link to="/admin">Trang chủ</Link>
          {location.pathname !== '/admin' && (
            <>
              <span className="ap-breadcrumb-sep">›</span>
              <span className="ap-breadcrumb-cur">{pageLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="ap-header-right">
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div className="ap-user-btn" onClick={() => setOpen((v) => !v)}>
            <div className="ap-avatar" style={{ overflow: 'hidden' }}>
              {user.image ? (
                <img
                  src={user.image}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <span className="ap-user-name">{fullName}</span>
            <div className="ap-online-dot" />
          </div>
          {open && (
            <div className="ap-dropdown">
              <div
                className="ap-dropdown-item"
                style={{ cursor: 'default', fontSize: 11, opacity: 0.6 }}
              >
                <span>
                  <i className="fa-solid fa-user" style={{ marginRight: 8 }}></i>
                </span>
                <span>{user.roleId === 'R1' ? 'Super Admin' : 'Nhân viên'}</span>
              </div>
              <div className="ap-dropdown-divider" />
              <Link
                to={`/admin/infor/${user.id}`}
                className="ap-dropdown-item"
                onClick={() => setOpen(false)}
              >
                <span>
                  <i className="fa-solid fa-list-check" style={{ marginRight: 8 }}></i>
                </span>
                <span>Thông tin cá nhân</span>
              </Link>
              <Link
                to={`/admin/change-password/${user.id}`}
                className="ap-dropdown-item"
                onClick={() => setOpen(false)}
              >
                <span>
                  <i className="fa-solid fa-key" style={{ marginRight: 8, color: '#fbbf24' }}></i>
                </span>
                <span>Đổi mật khẩu</span>
              </Link>
              <div className="ap-dropdown-divider" />
              <div className="ap-dropdown-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
                <span>
                  <i
                    className="fa-solid fa-right-from-bracket"
                    style={{ marginRight: 8, color: '#fca5a5' }}
                  ></i>
                </span>
                <span>Đăng xuất</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
