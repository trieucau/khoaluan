import React, { useEffect, useState, useMemo } from 'react';
import { getAllOrdersByShipper, getOrdersAvailableForShipper } from '../../services/userService';
import moment from 'moment';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import socketIOClient from 'socket.io-client';
import { truckIcon } from '../Map/mapIcons';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { getDistance } from '../../utils/MapUtils';
import OrderPanel from './OrderPanel';
import { shipperTakeOrder } from '../../services/userService';
import { toast } from 'react-toastify';

// MODULAR COMPONENTS
import WeatherWidget from './components/WeatherWidget';
import RankWidget from './components/RankWidget';
import ActiveOrderWidget from './components/ActiveOrderWidget';
import ShipperStatusBar from './components/ShipperStatusBar';
import OrderQuickAcceptModal from './components/OrderQuickAcceptModal';




const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

// --- HELPERS & CONSTANTS ---
const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.invalidateSize();
      if (center) map.setView(center);
    }
  }, [center, map]);
  return null;
};

const FitMap = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions?.length > 1 && map) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

const IconBox = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;

const createNumberIcon = (number) =>
  L.divIcon({
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:linear-gradient(135deg,#3b82f6,#06b6d4);
      color:#fff;text-align:center;line-height:24px;
      font-weight:800;font-size:11px;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
      border:2px solid rgba(255,255,255,0.4);
    ">${number}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const ShipperDashboard = ({ gpsData, onToggleGps, showNotifications, setShowNotifications, skippedOrders, setSkippedOrders }) => {
  const socketRef = React.useRef(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [osrmDurations] = useState({});
  const [ignoredOrders, setIgnoredOrders] = useState(new Set());
  const [showOrderItems, setShowOrderItems] = useState(false);


  const [isMinimized, setIsMinimized] = useState(false);
  const [isHubExpanded, setIsHubExpanded] = useState(false);

  const isMobile = window.innerWidth <= 1024;

  // DRAG & DROP STATE
  const [sidePos, setSidePos] = useState({ right: 20, y: 80 });
  const [hubPos, setHubPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [dragging, setDragging] = useState(null); // 'side' | 'hub'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e, type) => {
    const handle = e.target.closest('.sp-drag-handle') || e.target.closest('.sp-mobile-hub-btn');
    if (!handle) return;
    
    setDragging(type);
    if (type === 'side') {
      setDragStart({
        x: e.clientX + sidePos.right,
        y: e.clientY - sidePos.y
      });
    } else {
      setDragStart({
        x: e.clientX - hubPos.x,
        y: e.clientY - hubPos.y
      });
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;
      
      if (dragging === 'side') {
        const newRight = dragStart.x - e.clientX;
        const newY = e.clientY - dragStart.y;
        setSidePos({ right: newRight, y: newY });
      } else if (dragging === 'hub') {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setHubPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => setDragging(null);

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStart]);
  
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;
  const firstName = userData?.firstName || 'Shipper';
  
  const { isOnline, gpsStartTime, gpsTotalMs } = gpsData || { isOnline: false, gpsStartTime: null, gpsTotalMs: 0 };
  const [sessionTimeMs, setSessionTimeMs] = useState(gpsTotalMs);
  const [shipperPos, setShipperPos] = useState([10.7626, 106.6601]);

  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setShipperPos([lat, lng]);
          socketRef.current?.emit('shipper:location', { 
            shipperId, lat, lng, 
            orderIds: activeOrders.map(o => o.id) 
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, activeOrders, shipperId]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await shipperTakeOrder(orderId);
      if (res?.errCode === 0) {
        toast.success('Chấp nhận đơn hàng thành công!');
        window.location.reload(); 
      } else {
        toast.error(res?.errMessage || 'Lỗi khi nhận đơn');
      }
    } catch (e) { toast.error('Lỗi kết nối server'); }
  };

  const handleIgnoreOrder = (orderId) => {
    setIgnoredOrders(prev => new Set(prev).add(orderId));
  };

  const handleSkipOrder = (orderId) => {
    setSkippedOrders(prev => new Set(prev).add(orderId));
  };


  const visibleAvailable = useMemo(() => {

    return availableOrders.filter(o => !ignoredOrders.has(o.id));
  }, [availableOrders, ignoredOrders]);

  useEffect(() => {
    let timer;
    if (isOnline) {
      const now = Date.now();
      setSessionTimeMs(gpsTotalMs + (now - (gpsStartTime || now)));
      timer = setInterval(() => {
        const currentNow = Date.now();
        setSessionTimeMs(gpsTotalMs + (currentNow - (gpsStartTime || currentNow)));
      }, 1000);
    } else {
      setSessionTimeMs(gpsTotalMs);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isOnline, gpsStartTime, gpsTotalMs]);

  const formatMs = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!shipperId) return;
      try {
        const [resActive, resAvail] = await Promise.all([
          getAllOrdersByShipper({ shipperId, status: 'working' }),
          getOrdersAvailableForShipper()
        ]);
        if (resActive?.errCode === 0) setActiveOrders(resActive.data || []);
        if (resAvail?.errCode === 0) setAvailableOrders(resAvail.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [shipperId]);

  const heroOrder = useMemo(() => {
    if (!activeOrders || activeOrders.length === 0) return null;
    return [...activeOrders].sort((a, b) => b.id - a.id)[0];
  }, [activeOrders]);

  const [dailyStats, setDailyStats] = useState({ count: 0, income: 0 });
  const [reliabilityScore, setReliabilityScore] = useState(0);

  useEffect(() => {
    if (!shipperId) return;
    const today = moment().format('YYYY-MM-DD');
    getAllOrdersByShipper({ shipperId })
      .then(res => {
        if (res?.errCode === 0) {
          const allOrders = res.data || [];
          // Daily Stats
          const todayDone = allOrders.filter(o => o.statusId === 'S6' && moment(o.updatedAt).format('YYYY-MM-DD') === today);
          setDailyStats({ count: todayDone.length, income: todayDone.length * 20000 });

          // Reliability Score Logic
          const total = allOrders.length;
          if (total > 0) {
            const completed = allOrders.filter(o => o.statusId === 'S6').length;
            const failed = allOrders.filter(o => o.statusId === 'S8').length;
            const completionRate = Math.round((completed / total) * 100);
            const successRate = (completed + failed) > 0 ? Math.round((completed / (completed + failed)) * 100) : 0;
            const score = Math.max(0, Math.min(100, Math.round(completionRate * 0.7 + successRate * 0.3)));
            setReliabilityScore(score);
          }
        }
      });
  }, [shipperId]);

  const sortedDestinations = useMemo(() => {
    if (!shipperPos) return [];
    return activeOrders
      .filter(o => o.addressUser?.lat && o.addressUser?.lng)
      .map(o => ({ lat: parseFloat(o.addressUser.lat), lng: parseFloat(o.addressUser.lng), id: o.id }))
      .sort((a, b) => 
        getDistance(shipperPos[0], shipperPos[1], a.lat, a.lng) - 
        getDistance(shipperPos[0], shipperPos[1], b.lat, b.lng)
      );
  }, [activeOrders, shipperPos]);

  const waypoints = useMemo(() => {
    if (!shipperPos) return [];
    return [{ lat: shipperPos[0], lng: shipperPos[1] }, ...sortedDestinations];
  }, [shipperPos, sortedDestinations]);

  const { routeCoords } = useOSRMRoute(waypoints);

  const mapData = useMemo(() => {
    const markers = [];
    markers.push({ pos: shipperPos, icon: truckIcon, label: 'Bạn' });
    sortedDestinations.forEach((dest, idx) => {
      markers.push({ pos: [dest.lat, dest.lng], icon: createNumberIcon(idx + 1), label: `Đơn #${dest.id}` });
    });
    return { markers, route: routeCoords };
  }, [shipperPos, sortedDestinations, routeCoords]);

  if (loading) return <div className="sp-page"><div className="sp-skeleton" style={{ height: '80vh' }} /></div>;

  return (
    <div className="sp-command-center">
      
      {/* KHU VỰC 5 — BẢN ĐỒ THÔNG MINH */}
      <div className="sp-full-map-bg" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MapContainer 
          center={shipperPos} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={true}
          dragging={true}
        >
          <TileLayer 
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
          />
          {mapData.markers.map((m, i) => (
            <Marker key={i} position={m.pos} icon={m.icon} />
          ))}
          {mapData.route.length > 1 && (
            <Polyline positions={mapData.route} pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8 }} />
          )}
          <MapController center={shipperPos} />
          <FitMap positions={mapData.route} />
        </MapContainer>
      </div>

      {/* TOP PRIORITY COMPONENTS */}
      <OrderPanel orders={activeOrders} shipperLoc={{ lat: shipperPos[0], lng: shipperPos[1] }} osrmDurations={{}} />

      <div className="sp-overlay-container" style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <ShipperStatusBar 
            isOnline={isOnline} 
            sessionTimeMs={sessionTimeMs} 
            formatMs={formatMs} 
            firstName={firstName} 
            dailyStats={dailyStats} 
            formatMoney={formatMoney} 
          />
        </div>

        <div className="sp-float-middle">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              position: 'absolute', top: 80, right: isMinimized ? 20 : -100, zIndex: 100,
              width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.9)', color: '#fff',
              border: 'none', cursor: 'pointer', display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'right 0.4s ease', pointerEvents: 'auto'
            }}
          >
            {isMinimized ? <IconBox /> : '✕'}
          </button>

          <section 
            className={`sp-float-side ${isHubExpanded ? 'hub-expanded' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, 'side')}
            style={{
              position: 'absolute',
              top: isMobile ? 'auto' : sidePos.y,
              right: isMobile ? (isHubExpanded ? 12 : -1000) : sidePos.right,
              bottom: isMobile ? (isHubExpanded ? 80 : -1000) : 'auto',
              width: isMobile ? 'calc(100% - 24px)' : 'clamp(230px, 16vw, 300px)',
              display: (isMobile && !isHubExpanded) ? 'none' : 'flex',
              flexDirection: 'column', gap: '1vw',
              zIndex: 2000,
              pointerEvents: (isMobile && !isHubExpanded) ? 'none' : 'auto',
              transition: dragging === 'side' ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <WeatherWidget dragHandleClass="sp-drag-handle" pos={shipperPos} />
            <RankWidget dragHandleClass="sp-drag-handle" score={reliabilityScore} />
            <ActiveOrderWidget 
              order={heroOrder} 
              isMinimized={isMinimized} 
              toggleMinimize={() => setIsMinimized(!isMinimized)}
              onShowItems={() => setShowOrderItems(true)}
              onComplete={handleAcceptOrder}
              formatMoney={formatMoney}
            />
          </section>

          {isMobile && (
            <div 
              className={`sp-mobile-hub-btn ${isHubExpanded ? 'active' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, 'hub')}
              onClick={() => { if (!dragging) setIsHubExpanded(!isHubExpanded); }}
              style={{
                position: 'fixed', left: Math.min(hubPos.x, window.innerWidth - 70), top: Math.min(hubPos.y, window.innerHeight - 150),
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 24, cursor: 'grab', zIndex: 2500,
                transition: dragging === 'hub' ? 'none' : 'transform 0.3s ease',
                transform: isHubExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                pointerEvents: 'auto'
              }}
            >
              {isHubExpanded ? '✕' : '⚙️'}
            </div>
          )}

          {showOrderItems && heroOrder && (
            <div className="sp-modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)',
              zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'auto'
            }} onClick={() => setShowOrderItems(false)}>
              <div className="sp-glass-panel" style={{
                width: '100%', maxWidth: 450, maxHeight: '80vh',
                display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
                borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.95)'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Chi tiết đơn #{heroOrder.id}</h3>
                  <button onClick={() => setShowOrderItems(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: 24, overflowY: 'auto' }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 10, letterSpacing: 1 }}>DANH SÁCH MÓN HÀNG</div>
                    {(() => {
                      const rawDetails = heroOrder.orderDetail || heroOrder.orderDetails || [];
                      const details = Array.isArray(rawDetails) ? rawDetails : rawDetails ? [rawDetails] : [];
                      return details.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.productDetailData?.productData?.name || 'Sản phẩm'} x{item.quantity}</div>
                          <div style={{ fontSize: 13, color: '#cbd5e1' }}>{formatMoney(item.realPrice)}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

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

      </div>
    </div>
  );
};

export default ShipperDashboard;
