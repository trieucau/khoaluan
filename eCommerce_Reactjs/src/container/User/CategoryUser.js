import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../css/dashboard.css';

const navItems = [
  { path: 'detail', icon: 'fa-solid fa-user', label: 'Thông tin cá nhân', withId: true },
  { path: 'order', icon: 'fa-solid fa-bag-shopping', label: 'Đơn hàng của tôi', withId: true },
  { path: 'address', icon: 'fa-solid fa-location-dot', label: 'Địa chỉ giao hàng', withId: true },
  { path: 'store-voucher', icon: 'fa-solid fa-ticket', label: 'Kho Voucher', withId: true },
  { path: 'messenger', icon: 'fa-brands fa-facebook-messenger', label: 'Tin nhắn', withId: false },
  { path: 'changepassword', icon: 'fa-solid fa-lock', label: 'Đổi mật khẩu', withId: true },
];

function CategoryUser({ id }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'Khách hàng';

  return (
    <aside className="user-sidebar">
      {/* Avatar */}
      <div className="user-sidebar__avatar">
        <div className="user-sidebar__avatar-img">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <i className="fa-solid fa-user" style={{ fontSize: '28px' }} />
          )}
        </div>
        <p className="user-sidebar__name">{displayName}</p>
        <p className="user-sidebar__email">{user?.email || ''}</p>
      </div>

      {/* Navigation */}
      <ul className="user-sidebar__nav">
        {navItems.map((item) => {
          const to = item.withId
            ? `/user/${item.path}/${id || ''}`
            : `/user/${item.path}`;
          return (
            <li key={item.path} className="user-sidebar__nav-item">
              <NavLink
                to={to}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <i className={item.icon} />
                {item.label}
              </NavLink>
            </li>
          );
        })}

        {/* Logout */}
        <li className="user-sidebar__nav-item user-sidebar__nav-item--logout">
          <span onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            Đăng xuất
          </span>
        </li>
      </ul>
    </aside>
  );
}

export default CategoryUser;
