import React, { useState, useCallback, useEffect } from 'react';
import { Route, Routes, NavLink } from 'react-router-dom';
import { getOrdersAvailableForShipper, getAllOrdersByShipper } from '../../services/userService';
import ShipperHeader from './ShipperHeader';
import ShipperSideBar from './ShipperSideBar';
import ShipperDashboard from './ShipperDashboard';
import ShipperProfile from './ShipperProfile';
import ShipperChangePassword from './ShipperChangePassword';
import OrdersAvailable from './OrdersAvailable';
import OrdersActive from './OrdersActive';
import '../../css/shipper.css';


const BOTTOM_NAV = [
  { to: '/shipper', end: true, icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>), label: 'Trang chủ' },
  { to: '/shipper/orders-available', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>), label: 'Nhận đơn' },
  { to: '/shipper/my-orders', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>), label: 'Đơn của tôi' },
  { to: '/shipper/profile', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>), label: 'Cá nhân' },
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
  const [skippedOrders, setSkippedOrders] = useState(new Set());


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
        <div className="sp-header"><ShipperHeader onToggleSidebar={toggleSidebar} availableCount={Math.max(0, availableCount - skippedOrders.size)} isOnline={gpsData.isOnline} onToggleGps={toggleGps} onToggleNotifications={() => setShowNotifications(!showNotifications)} /></div>
        <div className="sp-sidebar"><ShipperSideBar availableCount={Math.max(0, availableCount - skippedOrders.size)} activeCount={activeCount} /></div>
        <main className="sp-main">
          <Routes>
            <Route path="/"                 element={<ShipperDashboard gpsData={gpsData} onToggleGps={toggleGps} showNotifications={showNotifications} setShowNotifications={setShowNotifications} skippedOrders={skippedOrders} setSkippedOrders={setSkippedOrders} />} />

            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders"        element={<OrdersActive />} />
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
