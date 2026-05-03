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
];

const HomePageShipper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  const [availableCount, setAvailableCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // --- GPS Tracking Logic ---
  const [gpsData, setGpsData] = useState({ isOnline: false, gpsStartTime: null, gpsTotalMs: 0 });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const savedDate = localStorage.getItem('gpsDate');
    const todayStr = new Date().toDateString();
    
    let isOnline = localStorage.getItem('shipperGPS') === 'true';
    let totalMs = parseInt(localStorage.getItem('gpsTotalMs') || '0', 10);
    let startTime = parseInt(localStorage.getItem('gpsStartTime') || '0', 10);
    
    if (savedDate !== todayStr) {
      totalMs = 0;
      if (isOnline) {
        startTime = Date.now();
        localStorage.setItem('gpsStartTime', startTime);
      } else {
        startTime = null;
        localStorage.removeItem('gpsStartTime');
      }
      localStorage.setItem('gpsDate', todayStr);
      localStorage.setItem('gpsTotalMs', '0');
    } else {
      if (isOnline && !startTime) {
        startTime = Date.now();
        localStorage.setItem('gpsStartTime', startTime);
      }
    }
    setGpsData({ isOnline, gpsStartTime: startTime || null, gpsTotalMs: totalMs });
  }, []);

  const toggleGps = useCallback(() => {
    setGpsData(prev => {
      const isOnline = !prev.isOnline;
      let totalMs = prev.gpsTotalMs;
      let startTime = prev.gpsStartTime;
      const now = Date.now();
      
      localStorage.setItem('shipperGPS', String(isOnline));
      localStorage.setItem('gpsDate', new Date().toDateString());
      
      if (isOnline) {
        startTime = now;
        localStorage.setItem('gpsStartTime', startTime);
      } else {
        if (startTime) totalMs += (now - startTime);
        startTime = null;
        localStorage.removeItem('gpsStartTime');
        localStorage.setItem('gpsTotalMs', totalMs);
      }
      return { isOnline, gpsStartTime: startTime, gpsTotalMs: totalMs };
    });
  }, []);
  // --- End GPS Logic ---

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
      <div className={`sp-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar} aria-hidden="true" />
      <div className={`sp-sidebar-drawer${sidebarOpen ? ' open' : ''}`}>
        <button className="sp-sidebar-close" onClick={closeSidebar} aria-label="Đóng menu">✕</button>
        <ShipperSideBar onLinkClick={closeSidebar} availableCount={availableCount} activeCount={activeCount} />
      </div>

      <div className="sp-layout">
        <div className="sp-header"><ShipperHeader onToggleSidebar={toggleSidebar} availableCount={availableCount} isOnline={gpsData.isOnline} onToggleGps={toggleGps} onToggleNotifications={() => setShowNotifications(!showNotifications)} /></div>
        <div className="sp-sidebar"><ShipperSideBar availableCount={availableCount} activeCount={activeCount} /></div>
        <main className="sp-main">
          <Routes>
            <Route path="/"                 element={<ShipperDashboard gpsData={gpsData} onToggleGps={toggleGps} showNotifications={showNotifications} setShowNotifications={setShowNotifications} />} />
            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders"        element={<OrdersActive />} />
            <Route path="/stats"            element={<ShipperStats />} />
            <Route path="/profile"          element={<ShipperProfile />} />
            <Route path="/change-password"  element={<ShipperChangePassword />} />
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
