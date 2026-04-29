import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ROUTE_LABELS = {
  '/admin': 'Trang chủ',
  '/admin/list-user': 'Danh sách người dùng',
  '/admin/add-user': 'Thêm người dùng',
  '/admin/list-order': 'Danh sách đơn hàng',
  '/admin/list-product': 'Danh sách sản phẩm',
  '/admin/add-product': 'Thêm sản phẩm',
  '/admin/list-category': 'Danh sách danh mục',
  '/admin/list-brand': 'Danh sách nhãn hàng',
  '/admin/list-banner': 'Danh sách banner',
  '/admin/list-blog': 'Danh sách bài đăng',
  '/admin/list-supplier': 'Nhà cung cấp',
  '/admin/list-receipt': 'Nhập hàng',
  '/admin/list-typeship': 'Loại giao hàng',
  '/admin/list-voucher': 'Mã khuyến mãi',
  '/admin/turnover': 'Doanh thu',
  '/admin/profit': 'Lợi nhuận',
  '/admin/stock-product': 'Tồn kho',
  '/admin/chat': 'Tin nhắn',
  '/admin/shipper-map': 'Bản đồ Shipper',
};

const Header = () => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData || {});
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
      <Link className="ap-logo" to="/admin">
        <div className="ap-logo-icon">⚙️</div>
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
            <div className="ap-avatar">{initials}</div>
            <span className="ap-user-name">{fullName}</span>
            <div className="ap-online-dot" />
          </div>

          {open && (
            <div className="ap-dropdown">
              <div className="ap-dropdown-item" style={{ cursor: 'default', fontSize: 11, opacity: 0.6 }}>
                <span>👤</span><span>{user.roleId === 'R1' ? 'Super Admin' : 'Nhân viên'}</span>
              </div>
              <div className="ap-dropdown-divider" />
              <Link to={`/admin/infor/${user.id}`} className="ap-dropdown-item" onClick={() => setOpen(false)}>
                <span>📋</span><span>Thông tin cá nhân</span>
              </Link>
              <Link to={`/admin/change-password/${user.id}`} className="ap-dropdown-item" onClick={() => setOpen(false)}>
                <span>🔑</span><span>Đổi mật khẩu</span>
              </Link>
              <div className="ap-dropdown-divider" />
              <div className="ap-dropdown-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
                <span>🚪</span><span>Đăng xuất</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
