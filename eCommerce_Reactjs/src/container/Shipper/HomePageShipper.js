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
import OrdersReturn from './OrdersReturn';
import ActivityRate from './ActivityRate';
import ShipperRewards from './ShipperRewards';
import ShipperHistory from './ShipperHistory';
import ShipperHandbook from './ShipperHandbook';
import ShipperSupport from './ShipperSupport';
import OrderQuickAcceptModal from './components/OrderQuickAcceptModal';
import { toast } from 'react-toastify';
import socketIOClient from 'socket.io-client';
import { shipperTakeOrder } from '../../services/userService';
import '../../css/shipper.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const BOTTOM_NAV = [
  {
    to: '/shipper',
    end: true,
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    label: 'Tổng quan',
  },
  {
    to: '/shipper/orders-available',
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    label: 'Việc mới',
  },
  {
    to: '/shipper/my-orders',
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    label: 'Đang làm',
  },
  {
    to: '/shipper/profile',
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Cá nhân',
  },
];

const HomePageShipper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const [availableCount, setAvailableCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // --- GLOBAL STATE & LOGIC ---
  const [gpsData, setGpsData] = useState({ isOnline: false, gpsStartTime: null, gpsTotalMs: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [skippedOrders, setSkippedOrders] = useState(new Set());
  const [shipperPos, setShipperPos] = useState([10.7626, 106.6601]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const socketRef = React.useRef(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  // Initialize Socket
  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    return () => socketRef.current?.disconnect();
  }, []);

  // Location Tracking
  useEffect(() => {
    if (gpsData.isOnline && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setShipperPos([lat, lng]);
          socketRef.current?.emit('shipper:location', {
            shipperId,
            lat,
            lng,
            orderIds: activeOrders.map((o) => o.id),
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [gpsData.isOnline, activeOrders, shipperId]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await shipperTakeOrder(orderId);
      if (res?.errCode === 0) {
        toast.success('Chấp nhận đơn hàng thành công!');
        window.location.reload();
      } else {
        toast.error(res?.errMessage || 'Lỗi khi nhận đơn');
      }
    } catch (e) {
      toast.error('Lỗi kết nối server');
    }
  };

  const handleSkipOrder = (orderId) => {
    setSkippedOrders((prev) => new Set(prev).add(orderId));
  };

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
    setGpsData((prev) => {
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
        if (startTime) totalMs += now - startTime;
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
        if (!shipperId) return;

        const [resAvail, resAll] = await Promise.all([
          getOrdersAvailableForShipper(),
          getAllOrdersByShipper({ shipperId, status: 'working' }),
        ]);

        if (resAvail?.errCode === 0) {
          setAvailableOrders(resAvail.data || []);
          setAvailableCount(resAvail.data?.length || 0);
        }
        if (resAll?.errCode === 0) {
          setActiveOrders(resAll.data || []);
          const active = (resAll.data || []).filter(
            (o) => o.statusId === 'S4' || o.statusId === 'S5'
          );
          setActiveCount(active.length);
        }
      } catch (e) {
        /* ignore */
      }
    };
    fetchCounts();
    const timer = setInterval(fetchCounts, 15000);
    return () => clearInterval(timer);
  }, [shipperId]);

  return (
    <div className="shipper-portal">
      <div
        className={`sp-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <div className={`sp-sidebar-drawer${sidebarOpen ? ' open' : ''}`}>
        <button className="sp-sidebar-close" onClick={closeSidebar} aria-label="Đóng menu">
          ✕
        </button>
        <ShipperSideBar
          onLinkClick={closeSidebar}
          availableCount={availableCount}
          activeCount={activeCount}
        />
      </div>

      <div className="sp-layout">
        <div className="sp-header">
          <ShipperHeader
            onToggleSidebar={toggleSidebar}
            availableCount={Math.max(0, availableCount - skippedOrders.size)}
            isOnline={gpsData.isOnline}
            onToggleGps={toggleGps}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
          />
        </div>
        <div className="sp-sidebar">
          <ShipperSideBar
            availableCount={Math.max(0, availableCount - skippedOrders.size)}
            activeCount={activeCount}
          />
        </div>
        <main className="sp-main">
          <Routes>
            <Route
              path="/"
              element={
                <ShipperDashboard
                  gpsData={gpsData}
                  onToggleGps={toggleGps}
                  showNotifications={showNotifications}
                  setShowNotifications={setShowNotifications}
                  skippedOrders={skippedOrders}
                  setSkippedOrders={setSkippedOrders}
                  availableOrders={availableOrders}
                  shipperPos={shipperPos}
                  activeOrders={activeOrders}
                />
              }
            />

            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders" element={<OrdersActive />} />
            <Route path="/returns" element={<OrdersReturn />} />
            <Route path="/activity-rate" element={<ActivityRate />} />
            <Route path="/rewards" element={<ShipperRewards />} />
            <Route path="/history" element={<ShipperHistory />} />
            <Route path="/handbook" element={<ShipperHandbook />} />
            <Route path="/support" element={<ShipperSupport />} />
            <Route path="/profile" element={<ShipperProfile />} />
            <Route path="/change-password" element={<ShipperChangePassword />} />
          </Routes>
        </main>
      </div>

      <nav className="sp-bottom-nav" aria-label="Điều hướng chính">
        <div className="sp-bottom-nav-inner">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sp-bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="sp-bottom-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="sp-bottom-nav-dot" />
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Global Notifications Modal */}
      {showNotifications && (
        <OrderQuickAcceptModal
          orders={availableOrders}
          shipperPos={shipperPos}
          skippedIds={skippedOrders}
          onAccept={handleAcceptOrder}
          onSkip={handleSkipOrder}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default HomePageShipper;
