import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getDetailUserById } from '../../services/userService';

const NAV_ITEMS = [
  { to: '/shipper', end: true, icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>), label: 'Tổng quan' },
  { to: '/shipper/orders-available', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>), label: 'Việc mới' },
  { to: '/shipper/my-orders', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>), label: 'Đang làm' },
  { to: '/shipper/returns', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>), label: 'Hoàn trả' },
  { to: '/shipper/activity-rate', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>), label: 'Hiệu suất' },
  { to: '/shipper/rewards', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>), label: 'Phần thưởng' },
  { to: '/shipper/reviews', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>), label: 'Đánh giá' },
  { to: '/shipper/history', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>), label: 'Lịch sử' },
  { to: '/shipper/handbook', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>), label: 'Cẩm nang' },
  { to: '/shipper/support', icon: (<svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>), label: 'Hỗ trợ' },
];

const ShipperSideBar = ({ onLinkClick, availableCount = 0, activeCount = 0 }) => {
  const lc = onLinkClick || (() => {});
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [avatar, setAvatar] = useState(null);


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
    if (userData.id) {
      getDetailUserById(userData.id).then(res => {
        if (res?.errCode === 0 && res.data?.image) {
          setAvatar(res.data.image);
        }
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'S';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Shipper';

  return (
    <nav className="sp-sidebar-nav">
      {/* User Profile Section */}
      <div className="sp-sidebar-user" style={{ padding: '20px 16px', borderBottom: '1px solid var(--sp-border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
        {avatar ? (
          <img src={avatar} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--sp-primary)' }} />
        ) : (
          <div className="sp-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sp-user-name" style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
          <div style={{ fontSize: 11, color: 'var(--sp-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email || 'shipper@email.com'}</div>
        </div>
      </div>

      <div className="sp-nav-section">
        <div className="sp-nav-label">Menu chính</div>
        {NAV_ITEMS.map((item) => {

          let badge = null;
          if (item.to === '/shipper/orders-available' && availableCount > 0) {
            badge = <span className="sp-badge sp-badge-blue" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 10 }}>{availableCount}</span>;
          } else if (item.to === '/shipper/my-orders' && activeCount > 0) {
            badge = <span className="sp-badge sp-badge-amber" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 10 }}>{activeCount}</span>;
          }
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `sp-nav-link${isActive ? ' active' : ''}`}
              onClick={lc}>
              {item.icon}
              <span>{item.label}</span>
              {badge}
            </NavLink>
          );
        })}
      </div>

      <div className="sp-nav-section" style={{ paddingTop: 0 }}>
        <div className="sp-nav-label">Tài khoản</div>
        <NavLink to="/shipper/profile" className={({ isActive }) => `sp-nav-link${isActive ? ' active' : ''}`} onClick={lc}>
          <svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>Thông tin cá nhân</span>
        </NavLink>
        <NavLink to="/shipper/change-password" className={({ isActive }) => `sp-nav-link${isActive ? ' active' : ''}`} onClick={lc}>
          <svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Đổi mật khẩu</span>
        </NavLink>
        <div className="sp-nav-link" onClick={handleLogout} style={{ color: '#fca5a5', cursor: 'pointer', marginTop: 8 }}>
          <svg className="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Đăng xuất</span>
        </div>
      </div>
      <div className="sp-sidebar-footer" style={{ borderTop: 'none', paddingTop: 0, paddingBottom: 24 }}>
        <div className="sp-version">ShipperHub v1.0</div>
      </div>
    </nav>
  );
};

export default ShipperSideBar;
