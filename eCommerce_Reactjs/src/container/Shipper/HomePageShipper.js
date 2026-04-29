import React, { useState, useCallback } from 'react';
import { Route, Routes, NavLink } from 'react-router-dom';
import ShipperHeader from './ShipperHeader';
import ShipperSideBar from './ShipperSideBar';
import ShipperDashboard from './ShipperDashboard';
import ShipperStats from './ShipperStats';
import OrdersAvailable from './OrdersAvailable';
import OrdersActive from './OrdersActive';
import ShipperMap from '../Map/ShipperMap';
import '../../css/shipper.css';

const BOTTOM_NAV = [
  { to: '/shipper', end: true,             icon: '🏠', label: 'Trang chủ' },
  { to: '/shipper/orders-available',       icon: '📋', label: 'Nhận đơn' },
  { to: '/shipper/my-orders',              icon: '📦', label: 'Đơn của tôi' },
  { to: '/shipper/stats',                  icon: '📊', label: 'Thống kê' },
  { to: '/shipper/map',                    icon: '🗺️', label: 'Bản đồ' },
];

const HomePageShipper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const open  = useCallback(() => setSidebarOpen(true),  []);
  const close = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="shipper-portal">
      <div className={`sp-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={close} aria-hidden="true" />
      <div className={`sp-sidebar-drawer${sidebarOpen ? ' open' : ''}`}>
        <button className="sp-sidebar-close" onClick={close} aria-label="Đóng menu">✕</button>
        <ShipperSideBar onLinkClick={close} />
      </div>

      <div className="sp-layout">
        <div className="sp-header"><ShipperHeader onToggleSidebar={open} /></div>
        <div className="sp-sidebar"><ShipperSideBar /></div>
        <main className="sp-main">
          <Routes>
            <Route path="/"                 element={<ShipperDashboard />} />
            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders"        element={<OrdersActive />} />
            <Route path="/stats"            element={<ShipperStats />} />
            <Route path="/map"              element={<ShipperMap />} />
          </Routes>
        </main>
      </div>

      <nav className="sp-bottom-nav" aria-label="Điều hướng chính">
        <div className="sp-bottom-nav-inner">
          {BOTTOM_NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `sp-bottom-nav-item${isActive ? ' active' : ''}`}>
              <span className="sp-bottom-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="sp-bottom-nav-dot" />
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HomePageShipper;
