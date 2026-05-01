import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketIOClient from 'socket.io-client';
import { getAdminShippersOnMap, getDetailOrder } from '../../../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

// ── Icon factory (needs window.L) ──────────────────────────
const makeIcon = (color, emoji, image = null, size = 38) => {
  if (!window.L) return null;
  const innerHtml = image 
    ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : emoji;
    
  const borderWidth = size <= 24 ? 2 : 3;
  const fontSize = size <= 24 ? 11 : 18;
    
  return window.L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${borderWidth}px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;box-shadow:0 2px 8px rgba(0,0,0,0.45);
      cursor:pointer;
      overflow:hidden;
    ">${innerHtml}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
};

const waitForLeaflet = (cb, tries = 0) => {
  if (window.L) { cb(); return; }
  if (tries > 40) return;
  setTimeout(() => waitForLeaflet(cb, tries + 1), 150);
};

const osrmCache = {};
const osrmQueue = [];
let isProcessingQueue = false;

const processOsrmQueue = async () => {
  if (isProcessingQueue || osrmQueue.length === 0) return;
  isProcessingQueue = true;
  
  while (osrmQueue.length > 0) {
    const { url, cacheKey, callback } = osrmQueue.shift();
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const geojsonCoords = data.routes[0].geometry.coordinates;
        const pathCoords = geojsonCoords.map(c => [c[1], c[0]]);
        osrmCache[cacheKey] = pathCoords;
        callback(pathCoords);
      } else {
        callback(null);
      }
    } catch (err) {
      callback(null);
    }
    
    // Giãn cách request 150ms để tránh Rate Limit (429 Too Many Requests)
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  isProcessingQueue = false;
};

// ── Main component ─────────────────────────────────────────
const AdminShipperMap = ({ isMini = false }) => {
  const mapDivRef   = useRef(null);
  const mapRef      = useRef(null);          // Leaflet map instance
  const shipMarkersRef  = useRef({});        // shipperId → marker
  const orderMarkersRef = useRef({});        // orderId  → marker
  const socketRef   = useRef(null);
  const [list, setList]         = useState([]);
  const [orderDetails, setOrderDetails] = useState({}); // orderId → detail
  const [loading, setLoading]   = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── 1. Init map after Leaflet CDN loads ─────────────────
  useEffect(() => {
    waitForLeaflet(() => {
      if (!mapDivRef.current || mapRef.current) return;
      const map = window.L.map(mapDivRef.current, { zoomControl: true })
        .setView([10.8, 106.6], 11);          // default: Hồ Chí Minh

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── 2. Fetch shippers + socket ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);

    getAdminShippersOnMap()
      .then(res => { if (res?.errCode === 0 && res.data) setList(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    socketRef.current = socketIOClient.connect(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current.emit('join_admin_shipper_map', { token });
    socketRef.current.on('shipper:location', (data) => {
      if (!data?.shipperId) return;
      setList(prev =>
        prev.map(s => s.shipperId === data.shipperId
          ? { ...s, lat: data.lat, lng: data.lng } : s)
      );
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  // ── 3. Fetch order details for address pins ─────────────
  useEffect(() => {
    const allOrderIds = list.flatMap(s => s.orderIds || []);
    const unique = [...new Set(allOrderIds)];
    unique.forEach(oid => {
      if (orderDetails[oid]) return;           // already fetched
      getDetailOrder(oid)
        .then(res => {
          if (res?.errCode === 0 && res.data) {
            setOrderDetails(prev => ({ ...prev, [oid]: res.data }));
          }
        })
        .catch(() => {});
    });
  }, [list]);

  const polylineLayersRef = useRef({});        // shipperId -> polyline group

  // ── 4 & 5. Render markers & routes ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.L) return;

    // Clear old layers
    Object.values(shipMarkersRef.current).forEach(m => m && map.removeLayer(m));
    Object.values(orderMarkersRef.current).forEach(m => m && map.removeLayer(m));
    Object.values(polylineLayersRef.current).forEach(p => p && map.removeLayer(p));
    
    shipMarkersRef.current = {};
    orderMarkersRef.current = {};
    polylineLayersRef.current = {};

    const bounds = [];

    let displayList = list;
    if (selectedShipper) {
      displayList = list.filter(s => s.shipperId === selectedShipper.shipperId);
    }

    displayList.forEach((s, idx) => {
      const color = COLORS[idx % COLORS.length];
      const hasShipperLoc = s.lat != null && s.lng != null;
      let sLat, sLng;

      // Draw Shipper
      if (hasShipperLoc) {
        sLat = parseFloat(s.lat);
        sLng = parseFloat(s.lng);
        if (!isNaN(sLat) && !isNaN(sLng)) {
          const name = s.shipper ? `${s.shipper.firstName || ''} ${s.shipper.lastName || ''}`.trim() : 'Shipper';
          const popup = `
            <div style="min-width:180px;font-family:sans-serif">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">🛵 ${name}</div>
              <div style="font-size:12px;color:#555">📞 ${s.shipper?.phonenumber || '—'}</div>
              <div style="font-size:11px;color:#888;margin-top:4px">GPS: ${sLat.toFixed(5)}, ${sLng.toFixed(5)}</div>
            </div>`;
          const icon = makeIcon(color, '🛵', s.shipper?.image);
          const m = window.L.marker([sLat, sLng], { icon: icon || undefined }).bindPopup(popup).addTo(map);
          shipMarkersRef.current[s.shipperId] = m;
          bounds.push([sLat, sLng]);
        }
      }

      // Draw Orders & Polylines for this shipper (Smart Route / TSP)
      const points = [];
      (s.orderIds || []).forEach(oid => {
        if (selectedOrderId && oid !== selectedOrderId) return; // Micro-Focus filter
        
        const order = orderDetails[oid];
        if (!order) return;
        const addr = order.addressUser;
        const lat = parseFloat(addr?.lat);
        const lng = parseFloat(addr?.lng);
        if (isNaN(lat) || isNaN(lng)) return;
        points.push({ oid, order, addr, lat, lng });
      });

      const sortedPoints = [];
      if (hasShipperLoc && points.length > 0) {
        let currentLoc = { lat: sLat, lng: sLng };
        let unvisited = [...points];

        while (unvisited.length > 0) {
          let closestIdx = 0;
          let minDistance = Infinity;
          for (let i = 0; i < unvisited.length; i++) {
            const dist = calcDistanceKm(currentLoc.lat, currentLoc.lng, unvisited[i].lat, unvisited[i].lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestIdx = i;
            }
          }
          const closestPoint = unvisited.splice(closestIdx, 1)[0];
          sortedPoints.push(closestPoint);
          currentLoc = { lat: closestPoint.lat, lng: closestPoint.lng };
        }
      } else {
        sortedPoints.push(...points);
      }

      const routeCoords = [];
      if (hasShipperLoc) routeCoords.push([sLat, sLng]);

      sortedPoints.forEach((p, pIdx) => {
        routeCoords.push([p.lat, p.lng]);

        const customerName = p.addr?.shipName || p.order.userData?.firstName || 'Khách hàng';
        const address = p.addr?.shipAdress || '—';
        
        const seqNumber = hasShipperLoc ? (pIdx + 1) : '';
        const iconContent = seqNumber 
          ? `<span style="font-size:11px;font-weight:900;color:#fff">${seqNumber}</span>` 
          : '📍';
        
        const popup = `
          <div style="min-width:200px;font-family:sans-serif">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">
              ${seqNumber ? `<span style="background:${color};color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;margin-right:6px">Điểm ${seqNumber}</span>` : ''} 
              Mã đơn #${p.oid}
            </div>
            <div style="font-size:12px;color:#555">👤 ${customerName}</div>
            <div style="font-size:12px;color:#555;margin-top:4px">🏠 ${address || '—'}</div>
          </div>`;
        const icon = makeIcon(color, iconContent, null, 22);
        const m = window.L.marker([p.lat, p.lng], { icon: icon || undefined }).bindPopup(popup).addTo(map);
        orderMarkersRef.current[p.oid] = m;
        bounds.push([p.lat, p.lng]);
      });

      // Draw single route line through all points (Real Street Paths via OSRM)
      if (isMini) return; // Optimize performance in mini mode by disabling complex route drawing
      if (routeCoords.length > 1) {
        // Cache key dựa trên tọa độ đã làm tròn (chênh lệch ~100m sẽ tái sử dụng cache)
        const cacheKey = routeCoords.map(c => `${c[0].toFixed(3)},${c[1].toFixed(3)}`).join(';');
        
        if (osrmCache[cacheKey]) {
          const polyline = window.L.polyline(osrmCache[cacheKey], { color: color, weight: 5, opacity: 0.85 }).addTo(map);
          polylineLayersRef.current[s.shipperId] = polyline;
        } else {
          // Vẽ tạm đường thẳng mờ trong lúc chờ OSRM API (Fallback UI)
          const fallbackLine = window.L.polyline(routeCoords, { color: color, weight: 4, opacity: 0.4, dashArray: '5, 10' }).addTo(map);
          polylineLayersRef.current[s.shipperId] = fallbackLine;
          
          const coordsStr = routeCoords.map(c => `${c[1]},${c[0]}`).join(';');
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
          
          osrmQueue.push({
            url: osrmUrl,
            cacheKey: cacheKey,
            callback: (pathCoords) => {
              if (!mapRef.current) return;
              // Xóa đường thẳng tạm và vẽ đường thật
              if (polylineLayersRef.current[s.shipperId]) {
                mapRef.current.removeLayer(polylineLayersRef.current[s.shipperId]);
              }
              const finalCoords = pathCoords || routeCoords; // Nếu API lỗi, dùng đường thẳng
              const finalLine = window.L.polyline(finalCoords, { color: color, weight: 5, opacity: 0.85 }).addTo(mapRef.current);
              polylineLayersRef.current[s.shipperId] = finalLine;
            }
          });
          processOsrmQueue();
        }
      }
    });

    if (bounds.length > 0) {
      try { 
        let ptLeft = [40, 40];
        if (isPanelOpen && !isMobile && selectedShipper && mapDivRef.current) {
           ptLeft = [mapDivRef.current.clientWidth * 0.4 + 40, 40];
        }
        map.fitBounds(bounds, { paddingTopLeft: ptLeft, paddingBottomRight: [40, 40], maxZoom: 14 }); 
      } catch (_) {}
    }
  }, [list, orderDetails, mapReady, selectedShipper, selectedOrderId, isPanelOpen, isMobile]);

  // ── 6. Render ───────────────────────────────────────────
  const shipperCount = list.length;
  const orderCount   = Object.keys(orderDetails).length;
  const onlineCount  = list.filter(s => s.lat != null).length;

  let sidebarWidth = '100%';
  if (isPanelOpen && !isMobile && selectedShipper) {
    sidebarWidth = '40%';
  }
  
  const sidebarLeft = isPanelOpen ? 0 : '-100%';
  const toggleLeft = isPanelOpen ? (sidebarWidth === '100%' ? 'calc(100% - 28px)' : '40%') : 0;

  const mapContent = (
    <div style={{ display: 'flex', height: isMini ? 320 : '75vh', minHeight: isMini ? 320 : 600, width: '100%', overflow: 'hidden', position: 'relative', borderRadius: isMini ? 0 : 'var(--ap-radius)' }}>
        {/* Map Container */}
        <div ref={mapDivRef} style={{ height: '100%', width: '100%', zIndex: 0, isolation: 'isolate' }} />

        {/* --- UI overlays --- */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
          
          {/* Top-right stats */}
          {!isMini && (
            <div style={{ 
              position: 'absolute', top: 16, right: 16, 
              display: 'flex', gap: isMobile ? 8 : 12,
              pointerEvents: 'none' 
            }}>
              {[
                { label: 'Tổng shipper', value: shipperCount, icon: '🛵', color: '#6366f1' },
                { label: 'GPS Online', value: onlineCount, icon: '📡', color: '#10b981' },
                { label: 'Điểm giao', value: orderCount, icon: '📍', color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255, 255, 255, 0.92)', 
                  backdropFilter: 'blur(8px)',
                  borderRadius: 6, padding: isMobile ? '4px 8px' : '6px 10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8,
                  border: '1px solid rgba(255,255,255,0.6)',
                  pointerEvents: 'auto'
                }}>
                  <div style={{ width: isMobile ? 20 : 26, height: isMobile ? 20 : 26, borderRadius: '50%', background: `${s.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 10 : 14 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: isMobile ? 7 : 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, lineHeight: 1 }}>{s.label}</div>
                    <div style={{ fontWeight: 800, fontSize: isMobile ? 11 : 14, color: s.color, marginTop: 3, lineHeight: 1 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle Button */}
          {!isMini && (
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              style={{ 
                position: 'absolute', top: '50%', left: toggleLeft, zIndex: 1000,
                transform: 'translateY(-50%)',
                width: 28, height: 56, background: 'linear-gradient(135deg,#1d4ed8,#0891b2)',
                color: '#fff', border: 'none', borderRadius: isPanelOpen && isMobile ? '8px 0 0 8px' : '0 8px 8px 0', cursor: 'pointer',
                fontSize: 18, fontWeight: 700, boxShadow: '2px 0 12px rgba(59,130,246,0.4)',
                transition: 'left 0.35s cubic-bezier(.4,0,.2,1), border-radius 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'auto'
              }}
              title={isPanelOpen ? 'Ẩn bảng điều khiển' : 'Xem bảng điều khiển'}
            >
              {isPanelOpen ? '‹' : '›'}
            </button>
          )}

          {/* Floating Sidebar */}
          {!isMini && (
            <div style={{
              position: 'absolute', top: 0, left: sidebarLeft, width: sidebarWidth, height: '100%',
              background: '#0f172a', zIndex: 999, transition: 'left 0.35s cubic-bezier(.4,0,.2,1)',
              boxShadow: '4px 0 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', pointerEvents: 'auto'
            }}>
              {!selectedShipper ? (
                // VIEW 1: Shipper List
                <>
                  <div style={{ padding: '14px 20px 12px', background: 'linear-gradient(135deg,#1e3a8a,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: 0.3 }}>🛵 Danh sách Shipper</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        {onlineCount} đang online • {list.length} tổng
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                    {list.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📭</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Không có shipper đang giao</div>
                      </div>
                    ) : list.map((s, idx) => {
                      const color = COLORS[idx % COLORS.length];
                      const name = s.shipper ? `${s.shipper.firstName || ''} ${s.shipper.lastName || ''}`.trim() : 'Shipper';
                      const hasGps = s.lat != null && s.lng != null;
                      const orderIds = s.orderIds || [];
                      
                      return (
                        <div key={s.shipperId} 
                             onClick={() => setSelectedShipper(s)}
                             style={{ padding: 14, borderRadius: 8, cursor: 'pointer', marginBottom: 10, background: idx % 2 === 0 ? '#111827' : '#1e293b', border: '1px solid #334155', display: 'flex', gap: 14, alignItems: 'center', transition: 'background 0.2s' }}
                             onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                             onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#111827' : '#1e293b')}
                             >
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, border: `2px solid ${color}` }}>
                            {s.shipper?.image ? <img src={s.shipper.image} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : name[0]}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0' }}>📞 {s.shipper?.phonenumber || '—'}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: hasGps ? 'rgba(52,211,153,0.1)' : 'rgba(100,116,139,0.1)', color: hasGps ? '#34d399' : '#94a3b8' }}>{hasGps ? 'GPS On' : 'Offline'}</span>
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>📦 {orderIds.length} đơn</span>
                            </div>
                          </div>
                          <div style={{ color: '#3b82f6', fontSize: 20 }}>›</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                // VIEW 2: Order List for Selected Shipper
                <>
                  <div style={{ padding: '14px 20px 12px', background: 'linear-gradient(135deg,#1e3a8a,#0891b2)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <button onClick={() => { setSelectedShipper(null); setSelectedOrderId(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: 0.3, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        📦 Đơn của {selectedShipper.shipper ? `${selectedShipper.shipper.firstName} ${selectedShipper.shipper.lastName}` : 'Shipper'}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        {selectedShipper.orderIds?.length || 0} đơn đang giao
                        {selectedOrderId && (
                           <button onClick={() => setSelectedOrderId(null)} style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#bfdbfe', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 10, marginLeft: 6 }}>✕ Bỏ lọc</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'Be Vietnam Pro', sans-serif", minWidth: 400 }}>
                        <thead>
                          <tr style={{ background: 'rgba(30,41,59,0.95)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>Mã đơn</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>Khoảng cách</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>Phí ship</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>Tên – SĐT</th>
                            <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' }}>Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedShipper.orderIds || []).map((oid, idx) => {
                            const order = orderDetails[oid];
                            if (!order) return null;
                            const addr = order.addressUser;
                            const customerName = addr?.shipName || order.userData?.firstName || '—';
                            
                            let distKm = '—';
                            if (selectedShipper.lat && selectedShipper.lng && addr?.lat && addr?.lng) {
                              const km = calcDistanceKm(selectedShipper.lat, selectedShipper.lng, addr.lat, addr.lng);
                              distKm = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
                            }
                            
                            const shipPrice = order.typeShipData?.price || 0;
                            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipPrice);
                            
                            return (
                              <tr key={oid} style={{ background: idx % 2 === 0 ? '#0f172a' : '#111827', borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#0f172a' : '#111827')}>
                                <td style={{ padding: '9px 10px' }}>
                                  <span style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', borderRadius: 5, padding: '2px 7px', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>#{oid}</span>
                                </td>
                                <td style={{ padding: '9px 10px', color: '#34d399', fontWeight: 600, whiteSpace: 'nowrap' }}>{distKm}</td>
                                <td style={{ padding: '9px 10px', color: '#f472b6', fontWeight: 600, whiteSpace: 'nowrap' }}>{formattedPrice}</td>
                                <td style={{ padding: '9px 10px', minWidth: 140 }}>
                                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 12 }}>{customerName}</div>
                                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>📞 {addr?.shipPhonenumber || '—'}</div>
                                </td>
                                <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                                   <button onClick={() => setSelectedOrderId(selectedOrderId === oid ? null : oid)} style={{ background: selectedOrderId === oid ? '#3b82f6' : 'transparent', border: '1px solid #3b82f6', color: selectedOrderId === oid ? '#fff' : '#38bdf8', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 11, marginRight: 8, fontWeight: 600 }}>
                                     {selectedOrderId === oid ? '✓ Đang xem' : '⌖ Lộ trình'}
                                   </button>
                                   <a href={`/admin/order-detail/${oid}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, textDecoration: 'none', color: '#94a3b8', fontWeight: 600 }}>Chi tiết ↗</a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
    </div>
  );

  if (isMini) return mapContent;

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-page-header">
        <div className="ap-page-header-row" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 10 }}>
          <div>
            <div className="ap-page-title">🗺️ Bản đồ Shipper</div>
            <div className="ap-page-subtitle">Vị trí realtime của shipper và điểm giao hàng</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {loading && (
              <span style={{ fontSize: 13, color: 'var(--ap-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ animation: 'apPulse 1s infinite' }}>⏳</span> Đang tải...
              </span>
            )}
            <button className="ap-btn ap-btn-ghost ap-btn-sm"
              onClick={() => { setList([]); setOrderDetails({}); setLoading(true); getAdminShippersOnMap().then(res => { if (res?.errCode === 0) setList(res.data); }).finally(() => setLoading(false)); }}>
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>
      <div className="ap-card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden', position: 'relative', zIndex: 0, isolation: 'isolate' }}>
        {mapContent}
      </div>
    </div>
  );
};

export default AdminShipperMap;
