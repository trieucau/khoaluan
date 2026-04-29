import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ShipperHeader = ({ onToggleSidebar }) => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
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

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'S';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Shipper';

  return (
    <nav className="sp-header-bar">
      {/* Hamburger */}
      <button className="sp-hamburger" onClick={onToggleSidebar} aria-label="Mở menu">☰</button>

      <Link className="sp-logo" to="/shipper" style={{ marginLeft: 8 }}>
        <div className="sp-logo-icon" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
          <img src="/favicon.ico" alt="ShipperHub"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
        </div>
        <span className="sp-logo-text">ShipperHub</span>
      </Link>

      <div className="sp-header-right">
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button className="sp-user-btn" onClick={() => setOpen(v => !v)} style={{ border: 'none' }}>
            <div className="sp-avatar">{initials}</div>
            <span className="sp-user-name">{fullName}</span>
            <div className="sp-online-dot" />
          </button>

          {open && (
            <div className="sp-dropdown">
              {/* User info */}
              <div className="sp-dropdown-item" style={{ cursor: 'default', fontSize: 12, opacity: 0.7 }}>
                <span>🚚</span><span>{fullName}</span>
              </div>
              <div className="sp-dropdown-divider" />

              {/* Profile */}
              <Link to="/shipper/profile" className="sp-dropdown-item" onClick={() => setOpen(false)}>
                <span>👤</span><span>Thông tin cá nhân</span>
              </Link>

              {/* Change password */}
              <Link to="/shipper/change-password" className="sp-dropdown-item" onClick={() => setOpen(false)}>
                <span>🔐</span><span>Đổi mật khẩu</span>
              </Link>

              <div className="sp-dropdown-divider" />

              {/* Logout */}
              <div className="sp-dropdown-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
                <span>🚪</span><span>Đăng xuất</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ShipperHeader;
