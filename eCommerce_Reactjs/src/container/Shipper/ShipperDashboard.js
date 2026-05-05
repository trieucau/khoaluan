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
import CompleteModal from './components/CompleteModal';




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
  const [completeModal, setCompleteModal] = useState(null);


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
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (!shipperPos || !shipperPos[0]) return;
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${shipperPos[0]}&longitude=${shipperPos[1]}&current_weather=true`);
        const data = await res.json();
        if (data?.current_weather) {
          let city = 'Vị trí hiện tại';
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${shipperPos[0]}&lon=${shipperPos[1]}`);
            const geoData = await geoRes.json();
            city = geoData.address.city || geoData.address.town || geoData.address.suburb || 'Khu vực hiện tại';
          } catch(e) {}
          setWeatherData({ ...data.current_weather, city });
        }
      } catch (e) {}
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [shipperPos]);

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

  const handleDeliveryDone = () => {
    setCompleteModal(null);
    window.location.reload(); // Refresh to show next order
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
  const [rankProgress, setRankProgress] = useState(null);

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

            // Calculate Next Rank
            let nextGoal = 70;
            let nextRank = 'Hạng Bạc';
            if (score >= 95) { nextGoal = 100; nextRank = 'Bạch Kim (Legend)'; }
            else if (score >= 90) { nextGoal = 95; nextRank = 'Bạch Kim'; }
            else if (score >= 80) { nextGoal = 90; nextRank = 'Kim Cương'; }
            else if (score >= 70) { nextGoal = 80; nextRank = 'Hạng Vàng'; }
            
            setRankProgress({ score, nextGoal, nextRank, total });
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
            weatherData={weatherData}
            rankProgress={rankProgress}
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
              right: isMobile ? 0 : sidePos.right,
              bottom: isMobile ? (isHubExpanded ? 'var(--sp-bottom-nav-h)' : '-100%') : 'auto',
              width: isMobile ? '100%' : 'clamp(230px, 16vw, 300px)',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 0 : '1vw',
              zIndex: 2000,
              pointerEvents: (isMobile && !isHubExpanded) ? 'none' : 'auto',
              transition: dragging === 'side' ? 'none' : 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'transparent',
              borderRadius: 0,
              paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + var(--sp-bottom-nav-h) + 10px)' : 0
            }}
          >
            {isMobile && (
              <div style={{ padding: '20px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>Trung tâm điều khiển</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>SẴN SÀNG</span>
              </div>
            )}

            <div style={{ 
              display: isMobile ? 'grid' : 'flex', 
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'none',
              flexDirection: 'column',
              gap: isMobile ? 12 : '1vw',
              padding: isMobile ? '12px 20px' : 0
            }}>
              <WeatherWidget dragHandleClass={isMobile ? "" : "sp-drag-handle"} pos={shipperPos} weatherData={weatherData} isMobile={isMobile} />
              <RankWidget dragHandleClass={isMobile ? "" : "sp-drag-handle"} score={reliabilityScore} isMobile={isMobile} />
            </div>

            <div style={{ padding: isMobile ? '0 20px 20px' : 0 }}>
              <ActiveOrderWidget 
                order={heroOrder} 
                isMinimized={isMinimized} 
                toggleMinimize={() => setIsMinimized(!isMinimized)}
                onShowItems={() => setShowOrderItems(true)}
                onComplete={(id) => setCompleteModal(id)}
                formatMoney={formatMoney}
                isMobile={isMobile}
              />
            </div>
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
                  {/* Section 1: Logistics & Customer */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', letterSpacing: 1, marginBottom: 8 }}>KHÁCH HÀNG</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {heroOrder.addressUser?.firstName} {heroOrder.addressUser?.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{heroOrder.addressUser?.phoneNumber}</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#10b981', letterSpacing: 1, marginBottom: 8 }}>THANH TOÁN</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                        {heroOrder.paymentData?.value === 'Tiền mặt' ? 'Thu hộ (COD)' : 'Đã thanh toán'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Qua {heroOrder.paymentData?.value || 'Ví/Thẻ'}</div>
                    </div>
                  </div>

                  {/* Section 2: Delivery Timeline */}
                  <div style={{ marginBottom: 24, padding: '0 8px' }}>
                     <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1, marginBottom: 16 }}>TRẠNG THÁI VẬN CHUYỂN</div>
                     <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Đã lấy hàng</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>{moment(heroOrder.updatedAt).format('HH:mm - DD/MM/YYYY')}</div>

                        <div style={{ position: 'absolute', left: -7, top: 45, width: 12, height: 12, borderRadius: '50%', background: '#fbbf24', animation: 'pulse-amber 2s infinite' }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>Đang giao đến khách</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Đang trên lộ trình tối ưu</div>
                     </div>
                  </div>

                  {/* Section 3: Note */}
                  {heroOrder.note && (
                    <div style={{ marginBottom: 24, padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: 10 }}>
                      <svg style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="15 3 15 9 21 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                      <div style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 800 }}>Ghi chú: </span>
                        {heroOrder.note}
                      </div>
                    </div>
                  )}

                  {/* Section 4: Items List */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ 
                      display: 'grid', gridTemplateColumns: '1.5fr 0.5fr 1fr', 
                      fontSize: 10, fontWeight: 800, color: '#64748b', 
                      paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)',
                      letterSpacing: 1, marginBottom: 10
                    }}>
                      <div>SẢN PHẨM</div>
                      <div style={{ textAlign: 'center' }}>SL</div>
                      <div style={{ textAlign: 'right' }}>THÀNH TIỀN</div>
                    </div>
                    {(() => {
                      const rawDetails = heroOrder.orderDetail || heroOrder.orderDetails || [];
                      const details = Array.isArray(rawDetails) ? rawDetails : rawDetails ? [rawDetails] : [];
                      let totalProductPrice = 0;
                      
                      const itemsList = details.map((item, idx) => {
                        const price = item.realPrice || 0;
                        totalProductPrice += (price * item.quantity);
                        return (
                          <div key={idx} style={{ 
                            display: 'grid', gridTemplateColumns: '1.5fr 0.5fr 1fr', 
                            padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                            alignItems: 'center'
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', paddingRight: 10 }}>
                              {item.productDetailData?.productData?.name || 'Sản phẩm'}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: 700 }}>
                              x{item.quantity}
                            </div>
                            <div style={{ fontSize: 13, color: '#fff', textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(price * item.quantity)}
                            </div>
                          </div>
                        );
                      });

                      return (
                        <>
                          {itemsList}
                          <div style={{ marginTop: 24, padding: '20px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Tạm tính</span>
                              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{formatMoney(totalProductPrice)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Phí vận chuyển</span>
                              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{formatMoney(heroOrder.typeShipData?.price || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>TỔNG CỘNG</span>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                                  {formatMoney(totalProductPrice + (heroOrder.typeShipData?.price || 0))}
                                </div>
                                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, marginTop: 4 }}>ĐÃ BAO GỒM VAT</div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
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

          {completeModal && (
            <CompleteModal
              orderId={completeModal}
              onClose={() => setCompleteModal(null)}
              onDone={handleDeliveryDone}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default ShipperDashboard;
