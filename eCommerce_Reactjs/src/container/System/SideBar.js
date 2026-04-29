import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ---- SVG ICONS ----
const Icon = ({ d, viewBox = '0 0 24 24' }) => (
  <svg className="ap-nav-icon" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const Icons = {
  dashboard: <Icon d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} />,
  users: <Icon d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>} />,
  category: <Icon d={<><path d="M4 6h16M4 12h16M4 18h16"/></>} />,
  brand: <Icon d={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>} />,
  product: <Icon d={<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>} />,
  banner: <Icon d={<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>} />,
  blog: <Icon d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />,
  subject: <Icon d={<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>} />,
  ship: <Icon d={<><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>} />,
  voucher: <Icon d={<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>} />,
  supplier: <Icon d={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />,
  receipt: <Icon d={<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>} />,
  order: <Icon d={<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>} />,
  map: <Icon d={<><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>} />,
  chat: <Icon d={<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>} />,
  chart: <Icon d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
};

// ---- NAV GROUP (collapsible) ----
const NavGroup = ({ icon, label, children, defaultOpen = false, location }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ap-nav-group">
      <button className={`ap-nav-group-header${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        {icon}
        <span>{label}</span>
        <span className={`ap-nav-arrow${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && <div className="ap-nav-children">{children}</div>}
    </div>
  );
};

const NavChild = ({ to, label, location }) => {
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link to={to} className={`ap-nav-child${active ? ' active' : ''}`}>
      <span className="ap-nav-child-dot" />
      {label}
    </Link>
  );
};

const SideBar = () => {
  const [user, setUser] = useState({});
  const location = useLocation();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData || {});
  }, []);

  const isAdmin = user.roleId === 'R1';

  return (
    <nav className="ap-sidebar-nav">
      <div className="ap-nav-section">
        <div className="ap-nav-label">Tổng quan</div>
        <Link to="/admin" className={`ap-nav-link${location.pathname === '/admin' ? ' active' : ''}`}>
          {Icons.dashboard}<span>Trang quản trị</span>
        </Link>
      </div>

      {isAdmin && (
        <div className="ap-nav-section">
          <div className="ap-nav-label">Nội dung</div>
          <NavGroup icon={Icons.users} label="Người dùng" location={location} defaultOpen={location.pathname.includes('/user')}>
            <NavChild to="/admin/list-user" label="Danh sách" location={location} />
            <NavChild to="/admin/add-user" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.category} label="Danh mục" location={location} defaultOpen={location.pathname.includes('/category')}>
            <NavChild to="/admin/list-category" label="Danh sách" location={location} />
            <NavChild to="/admin/add-category" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.brand} label="Nhãn hàng" location={location} defaultOpen={location.pathname.includes('/brand')}>
            <NavChild to="/admin/list-brand" label="Danh sách" location={location} />
            <NavChild to="/admin/add-brand" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.product} label="Sản phẩm" location={location} defaultOpen={location.pathname.includes('/product')}>
            <NavChild to="/admin/list-product" label="Danh sách" location={location} />
            <NavChild to="/admin/add-product" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.banner} label="Banner" location={location} defaultOpen={location.pathname.includes('/banner')}>
            <NavChild to="/admin/list-banner" label="Danh sách" location={location} />
            <NavChild to="/admin/add-banner" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.subject} label="Chủ đề" location={location} defaultOpen={location.pathname.includes('/subject')}>
            <NavChild to="/admin/list-subject" label="Danh sách" location={location} />
            <NavChild to="/admin/add-subject" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.blog} label="Bài đăng" location={location} defaultOpen={location.pathname.includes('/blog')}>
            <NavChild to="/admin/list-blog" label="Danh sách" location={location} />
            <NavChild to="/admin/add-blog" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.ship} label="Loại ship" location={location} defaultOpen={location.pathname.includes('/typeship')}>
            <NavChild to="/admin/list-typeship" label="Danh sách" location={location} />
            <NavChild to="/admin/add-typeship" label="Thêm mới" location={location} />
          </NavGroup>
          <NavGroup icon={Icons.voucher} label="Voucher" location={location} defaultOpen={location.pathname.includes('/voucher')}>
            <NavChild to="/admin/list-typevoucher" label="Loại khuyến mãi" location={location} />
            <NavChild to="/admin/list-voucher" label="Mã khuyến mãi" location={location} />
            <NavChild to="/admin/add-typevoucher" label="Thêm loại KM" location={location} />
            <NavChild to="/admin/add-voucher" label="Thêm mã KM" location={location} />
          </NavGroup>
        </div>
      )}

      <div className="ap-nav-section">
        <div className="ap-nav-label">Vận hành</div>
        <NavGroup icon={Icons.supplier} label="Nhà cung cấp" location={location} defaultOpen={location.pathname.includes('/supplier')}>
          <NavChild to="/admin/list-supplier" label="Danh sách" location={location} />
          <NavChild to="/admin/add-supplier" label="Thêm mới" location={location} />
        </NavGroup>
        <NavGroup icon={Icons.receipt} label="Nhập hàng" location={location} defaultOpen={location.pathname.includes('/receipt')}>
          <NavChild to="/admin/list-receipt" label="Danh sách" location={location} />
          <NavChild to="/admin/add-receipt" label="Tạo phiếu nhập" location={location} />
        </NavGroup>
        <NavGroup icon={Icons.order} label="Đơn hàng" location={location} defaultOpen={location.pathname.includes('/order')}>
          <NavChild to="/admin/list-order" label="Danh sách đơn" location={location} />
          <NavChild to="/admin/shipper-map" label="Bản đồ shipper" location={location} />
        </NavGroup>
        <Link to="/admin/chat" className={`ap-nav-link${location.pathname === '/admin/chat' ? ' active' : ''}`}>
          {Icons.chat}<span>Tin nhắn</span>
        </Link>
      </div>

      {isAdmin && (
        <div className="ap-nav-section">
          <div className="ap-nav-label">Báo cáo</div>
          <NavGroup icon={Icons.chart} label="Thống kê" location={location} defaultOpen={location.pathname.includes('/turnover') || location.pathname.includes('/profit') || location.pathname.includes('/stock')}>
            <NavChild to="/admin/turnover" label="Doanh thu" location={location} />
            <NavChild to="/admin/profit" label="Lợi nhuận" location={location} />
            <NavChild to="/admin/stock-product" label="Tồn kho" location={location} />
          </NavGroup>
        </div>
      )}

      <div className="ap-sidebar-footer">AdminHub v1.0</div>
    </nav>
  );
};

export default SideBar;
