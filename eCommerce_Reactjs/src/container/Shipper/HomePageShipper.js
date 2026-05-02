import React, { useState, useCallback, useEffect } from 'react';
import { Route, Routes, NavLink } from 'react-router-dom';
import { getOrdersAvailableForShipper, getAllOrdersByShipper } from '../../services/userService';
import ShipperHeader from './ShipperHeader';
import ShipperSideBar from './ShipperSideBar';
import ShipperDashboard from './ShipperDashboard';
import ShipperStats from './ShipperStats';
import ShipperProfile from './ShipperProfile';
import ShipperChangePassword from './ShipperChangePassword';
import OrdersAvailable from './OrdersAvailable';
import OrdersActive from './OrdersActive';
import ShipperMap from '../Map/ShipperMap';
import '../../css/shipper.css';

const BOTTOM_NAV = [
  { to: '/shipper',                  end: true, icon: '🏠', label: 'Trang chủ' },
  { to: '/shipper/orders-available',            icon: '📋', label: 'Nhận đơn'  },
  { to: '/shipper/my-orders',                   icon: '📦', label: 'Đơn của tôi' },
  { to: '/shipper/stats',                       icon: '📊', label: 'Thống kê'  },
  { to: '/shipper/map',                         icon: '🗺️', label: 'Bản đồ'    },
];

const HomePageShipper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const open  = useCallback(() => setSidebarOpen(true),  []);
  const close = useCallback(() => setSidebarOpen(false), []);

  const [availableCount, setAvailableCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const shipperId = JSON.parse(localStorage.getItem('userData') || '{}')?.id;
        if (!shipperId) return;

        const [resAvail, resAll] = await Promise.all([
          getOrdersAvailableForShipper(),
          getAllOrdersByShipper({ shipperId })
        ]);

        if (resAvail?.errCode === 0) setAvailableCount(resAvail.data?.length || 0);
        if (resAll?.errCode === 0) {
          const active = (resAll.data || []).filter(o => o.statusId === 'S4' || o.statusId === 'S5');
          setActiveCount(active.length);
        }
      } catch (e) { /* ignore */ }
    };
    fetchCounts();
    const timer = setInterval(fetchCounts, 10000); // 10s polling
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="shipper-portal">
      <div className={`sp-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={close} aria-hidden="true" />
      <div className={`sp-sidebar-drawer${sidebarOpen ? ' open' : ''}`}>
        <button className="sp-sidebar-close" onClick={close} aria-label="Đóng menu">✕</button>
        <ShipperSideBar onLinkClick={close} availableCount={availableCount} activeCount={activeCount} />
      </div>

      <div className="sp-layout">
        <div className="sp-header"><ShipperHeader onToggleSidebar={open} availableCount={availableCount} /></div>
        <div className="sp-sidebar"><ShipperSideBar availableCount={availableCount} activeCount={activeCount} /></div>
        <main className="sp-main">
          <Routes>
            <Route path="/"                 element={<ShipperDashboard />} />
            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders"        element={<OrdersActive />} />
            <Route path="/stats"            element={<ShipperStats />} />
            <Route path="/profile"          element={<ShipperProfile />} />
            <Route path="/change-password"  element={<ShipperChangePassword />} />
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
