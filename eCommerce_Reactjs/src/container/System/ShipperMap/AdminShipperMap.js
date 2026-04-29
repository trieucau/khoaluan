import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketIOClient from 'socket.io-client';
import { getAdminShippersOnMap, getDetailOrder } from '../../../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

// ── Icon factory (needs window.L) ──────────────────────────
const makeIcon = (color, emoji) => {
  if (!window.L) return null;
  return window.L.divIcon({
    className: '',
    html: `<div style="
      width:38px;height:38px;border-radius:50%;
      background:${color};border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.45);
      cursor:pointer;
    ">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40],
  });
};

const waitForLeaflet = (cb, tries = 0) => {
  if (window.L) { cb(); return; }
  if (tries > 40) return;
  setTimeout(() => waitForLeaflet(cb, tries + 1), 150);
};

// ── Main component ─────────────────────────────────────────
const AdminShipperMap = () => {
  const mapDivRef   = useRef(null);
  const mapRef      = useRef(null);          // Leaflet map instance
  const shipMarkersRef  = useRef({});        // shipperId → marker
  const orderMarkersRef = useRef({});        // orderId  → marker
  const socketRef   = useRef(null);
  const [list, setList]         = useState([]);
  const [orderDetails, setOrderDetails] = useState({}); // orderId → detail
  const [loading, setLoading]   = useState(true);
  const [mapReady, setMapReady] = useState(false);

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

  // ── 4. Render shipper markers ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.L) return;

    // Remove old shipper markers
    Object.values(shipMarkersRef.current).forEach(m => m && map.removeLayer(m));
    shipMarkersRef.current = {};

    const bounds = [];

    list.forEach(s => {
      if (s.lat == null || s.lng == null) return;
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const name = s.shipper
        ? `${s.shipper.firstName || ''} ${s.shipper.lastName || ''}`.trim()
        : 'Shipper';
      const phone = s.shipper?.phonenumber || '';
      const orders = (s.orderIds || []).join(', ');

      const icon = makeIcon('#6366f1', '🛵');
      const popup = `
        <div style="min-width:180px;font-family:sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">🛵 ${name}</div>
          <div style="font-size:12px;color:#555">📞 ${phone || '—'}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">📦 Đơn: <b>${orders || '—'}</b></div>
          <div style="font-size:11px;color:#888;margin-top:4px">
            GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        </div>`;

      const m = icon
        ? window.L.marker([lat, lng], { icon }).bindPopup(popup).addTo(map)
        : window.L.marker([lat, lng]).bindPopup(popup).addTo(map);

      shipMarkersRef.current[s.shipperId] = m;
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }); } catch (_) {}
    }
  }, [list, mapReady]);

  // ── 5. Render order destination markers ────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.L) return;

    // Remove old order markers
    Object.values(orderMarkersRef.current).forEach(m => m && map.removeLayer(m));
    orderMarkersRef.current = {};

    Object.entries(orderDetails).forEach(([oid, order]) => {
      // Try address lat/lng from order
      const addr = order?.addressUserData;
      const lat = parseFloat(addr?.lat);
      const lng = parseFloat(addr?.lng);
      if (!addr || isNaN(lat) || isNaN(lng)) return;

      const customerName = order?.userOrderData
        ? `${order.userOrderData.firstName || ''} ${order.userOrderData.lastName || ''}`.trim()
        : 'Khách hàng';
      const address = [addr.address, addr.ward, addr.district, addr.city]
        .filter(Boolean).join(', ');

      const icon = makeIcon('#f59e0b', '📍');
      const popup = `
        <div style="min-width:200px;font-family:sans-serif">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">📍 Điểm giao #${oid}</div>
          <div style="font-size:12px;color:#555">👤 ${customerName}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">🏠 ${address || '—'}</div>
          <div style="font-size:11px;color:#888;margin-top:4px">
            GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
        </div>`;

      const m = icon
        ? window.L.marker([lat, lng], { icon }).bindPopup(popup).addTo(map)
        : window.L.marker([lat, lng]).bindPopup(popup).addTo(map);

      orderMarkersRef.current[oid] = m;
    });
  }, [orderDetails, mapReady]);

  // ── 6. Render ───────────────────────────────────────────
  const shipperCount = list.length;
  const orderCount   = Object.keys(orderDetails).length;
  const onlineCount  = list.filter(s => s.lat != null).length;

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-page-header">
        <div className="ap-page-header-row">
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

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng shipper', value: shipperCount, icon: '🛵', color: '#6366f1' },
          { label: 'Đang online/GPS', value: onlineCount, icon: '📡', color: '#10b981' },
          { label: 'Điểm giao hàng', value: orderCount, icon: '📍', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="ap-card" style={{ margin: 0 }}>
            <div className="ap-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Legend */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">🗺️ Bản đồ realtime</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ap-text-muted)', alignItems: 'center' }}>
            <span>🛵 <span style={{ color: '#a5b4fc' }}>Shipper</span></span>
            <span>📍 <span style={{ color: '#fcd34d' }}>Điểm giao</span></span>
          </div>
        </div>
        {/* CRITICAL: isolation:isolate contains Leaflet z-indexes inside this box */}
        <div style={{ position: 'relative', isolation: 'isolate', zIndex: 0, borderRadius: '0 0 var(--ap-radius) var(--ap-radius)', overflow: 'hidden' }}>
          <div
            ref={mapDivRef}
            style={{ height: 520, width: '100%' }}
          />
        </div>
      </div>

      {/* Shipper list */}
      <div className="ap-card">
        <div className="ap-card-header"><span className="ap-card-title">📋 Danh sách Shipper đang giao</span></div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Shipper</th>
                <th>Số điện thoại</th>
                <th>Trạng thái GPS</th>
                <th>Đơn hàng phụ trách</th>
                <th>Tọa độ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ap-text-dim)' }}>
                    {loading ? '⏳ Đang tải dữ liệu...' : '🛵 Chưa có shipper nào đang giao'}
                  </td>
                </tr>
              ) : list.map((s, idx) => {
                const name = s.shipper
                  ? `${s.shipper.firstName || ''} ${s.shipper.lastName || ''}`.trim()
                  : 'Shipper';
                const hasGps = s.lat != null && s.lng != null;
                return (
                  <tr key={s.shipperId} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {name[0] || '?'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ap-text-muted)', fontSize: 13 }}>{s.shipper?.phonenumber || '—'}</td>
                    <td>
                      <span className={`ap-badge ${hasGps ? 'ap-badge-green' : 'ap-badge-gray'}`}>
                        {hasGps ? '📡 Online' : '⚫ Offline'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(s.orderIds || []).length === 0
                          ? <span style={{ color: 'var(--ap-text-dim)', fontSize: 12 }}>—</span>
                          : (s.orderIds || []).map(oid => (
                              <span key={oid} className="ap-badge ap-badge-indigo" style={{ fontFamily: 'monospace' }}>#{oid}</span>
                            ))
                        }
                      </div>
                    </td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--ap-text-dim)' }}>
                      {hasGps ? `${parseFloat(s.lat).toFixed(4)}, ${parseFloat(s.lng).toFixed(4)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order destinations */}
      {Object.keys(orderDetails).length > 0 && (
        <div className="ap-card" style={{ marginTop: 16 }}>
          <div className="ap-card-header"><span className="ap-card-title">📍 Địa chỉ giao hàng</span></div>
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr><th>Mã đơn</th><th>Khách hàng</th><th>Địa chỉ giao</th><th>Tọa độ</th></tr>
              </thead>
              <tbody>
                {Object.entries(orderDetails).map(([oid, order], idx) => {
                  const addr   = order?.addressUserData;
                  const name   = order?.userOrderData
                    ? `${order.userOrderData.firstName || ''} ${order.userOrderData.lastName || ''}`.trim()
                    : '—';
                  const addrTxt = addr
                    ? [addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')
                    : '—';
                  const hasCoords = addr && !isNaN(parseFloat(addr.lat)) && !isNaN(parseFloat(addr.lng));
                  return (
                    <tr key={oid} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                      <td><span style={{ fontFamily: 'monospace', color: 'var(--ap-primary)', fontWeight: 600 }}>#{oid}</span></td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)', maxWidth: 280 }}>{addrTxt}</td>
                      <td>
                        {hasCoords
                          ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fcd34d' }}>
                              {parseFloat(addr.lat).toFixed(4)}, {parseFloat(addr.lng).toFixed(4)}
                            </span>
                          : <span className="ap-badge ap-badge-gray" style={{ fontSize: 11 }}>Chưa có tọa độ</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShipperMap;
