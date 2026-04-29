import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ShipperHeader = () => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
  }, []);

  // Close dropdown on outside click
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
      {/* Logo */}
      <Link className="sp-logo" to="/shipper">
        <div className="sp-logo-icon">🚚</div>
        <span className="sp-logo-text">ShipperHub</span>
      </Link>

      {/* Right controls */}
      <div className="sp-header-right">
        {/* User button */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            className="sp-user-btn"
            onClick={() => setOpen((v) => !v)}
            style={{ border: 'none' }}
          >
            <div className="sp-avatar">{initials}</div>
            <span className="sp-user-name">{fullName}</span>
            <div className="sp-online-dot" />
          </button>

          {open && (
            <div className="sp-dropdown">
              <div className="sp-dropdown-item" style={{ cursor: 'default', opacity: 0.7, fontSize: 12 }}>
                <span>👤</span>
                <span>{fullName}</span>
              </div>
              <div className="sp-dropdown-divider" />
              <div
                className="sp-dropdown-item"
                onClick={handleLogout}
                style={{ color: '#fca5a5' }}
              >
                <span>🚪</span>
                <span>Đăng xuất</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ShipperHeader;
