import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';

import { truckIcon } from '../Map/mapIcons';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { getDistance } from '../../utils/MapUtils';
import OrderPanel from '../Shipper/OrderPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';
const OSRM_BASE   = 'https://router.project-osrm.org/route/v1/driving';

/* ── Auto-fit map to markers ── */
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    const valid = positions.filter(p => p && p[0] != null && p[1] != null);
    if (valid.length > 0) map.fitBounds(L.latLngBounds(valid), { padding: [60, 60] });
  }, [positions, map]);
  return null;
};

/* ── Numbered delivery marker ── */
const createNumberIcon = (number) =>
  L.divIcon({
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:linear-gradient(135deg,#3b82f6,#06b6d4);
      color:#fff;text-align:center;line-height:30px;
      font-weight:800;font-size:13px;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
      border:2px solid rgba(255,255,255,0.4);
    ">${number}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

/* ── OSRM ETA helper ── */
const fetchOSRMDuration = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const res  = await fetch(`${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`);
    const data = await res.json();
    if (data?.routes?.[0]?.duration != null) return data.routes[0].duration;
  } catch {}
  return null;
};

/* ── Main component ── */
const ShipperMap = () => {
  const socketRef   = useRef(null);
  const intervalRef = useRef(null);

  const [orderIds,     setOrderIds]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [sending,      setSending]      = useState(false);
  const [shipperLoc,   setShipperLoc]   = useState(null);
  const [customers,    setCustomers]    = useState([]);
  const [osrmDurations,setOsrmDurations]= useState({});
  const [lastUpdate,   setLastUpdate]   = useState(null);

  const userData  = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  /* Fetch active orders */
  const fetchOrders = async () => {
    if (!shipperId) return;
    const res = await getAllOrdersByShipper({ shipperId, status: 'working' });
    if (res?.errCode === 0 && res?.data?.length) {
      setOrders(res.data);
      setOrderIds(res.data.map(o => o.id));
      setCustomers(
        res.data
          .filter(o => o?.addressUser?.lat && o?.addressUser?.lng)
          .map(o => ({ orderId: o.id, lat: parseFloat(o.addressUser.lat), lng: parseFloat(o.addressUser.lng) }))
      );
    }
  };

  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    fetchOrders();
    return () => { clearInterval(intervalRef.current); socketRef.current?.disconnect(); };
  }, []);

  /* Fetch ETA for each customer when shipper location updates */
  useEffect(() => {
    if (!shipperLoc || customers.length === 0) return;
    const fetchAll = async () => {
      const results = {};
      await Promise.all(
        customers.map(async c => {
          results[c.orderId] = await fetchOSRMDuration(shipperLoc.lat, shipperLoc.lng, c.lat, c.lng);
        })
      );
      setOsrmDurations(results);
    };
    fetchAll();
  }, [shipperLoc, customers]);

  /* Sort customers by distance from shipper */
  const sortedCustomers = useMemo(() => {
    if (!shipperLoc) return [];
    return [...customers].sort((a, b) =>
      getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
      getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng)
    );
  }, [shipperLoc, customers]);

  /* OSRM route (single polyline, no territory check) */
  const waypoints = shipperLoc && sortedCustomers.length > 0 ? [shipperLoc, ...sortedCustomers] : [];
  const { routeCoords } = useOSRMRoute(waypoints);

  /* FitBounds positions */
  const fitPositions = useMemo(() => {
    const pts = [];
    if (shipperLoc) pts.push([shipperLoc.lat, shipperLoc.lng]);
    sortedCustomers.forEach(c => pts.push([c.lat, c.lng]));
    return pts;
  }, [shipperLoc, sortedCustomers]);

  /* GPS controls */
  const startSendingLocation = () => {
    if (!navigator.geolocation) { toast.error('Trình duyệt không hỗ trợ GPS'); return; }
    setSending(true);
    const send = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setShipperLoc({ lat, lng });
        setLastUpdate(moment().format('HH:mm:ss'));
        socketRef.current?.emit('shipper:location', { shipperId, lat, lng, orderIds });
      });
    };
    send();
    intervalRef.current = setInterval(send, 10000);
  };

  const stopSendingLocation = () => {
    setSending(false);
    clearInterval(intervalRef.current);
    toast.info('Đã tắt GPS');
  };

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-title">🗺️ Bản đồ giao hàng</div>
        <div className="sp-page-subtitle">Theo dõi vị trí và tuyến đường giao hàng realtime</div>
      </div>

      {/* GPS Status Bar */}
      <div className="sp-gps-bar">
        <div className="sp-gps-indicator">
          <div className={`sp-gps-dot ${sending ? 'on' : 'off'}`} />
          <span style={{ color: sending ? 'var(--sp-success)' : 'var(--sp-text-muted)' }}>
            {sending ? 'GPS đang hoạt động' : 'GPS chưa bật'}
          </span>
        </div>
        {sending && (
          <>
            <div className="sp-gps-sep" />
            <span style={{ fontSize: 13, color: 'var(--sp-text-muted)' }}>
              📦 {customers.length} điểm giao
            </span>
            {lastUpdate && (
              <>
                <div className="sp-gps-sep" />
                <span style={{ fontSize: 12, color: 'var(--sp-text-dim)' }}>
                  ⏱ Cập nhật: {lastUpdate}
                </span>
              </>
            )}
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            className={`sp-gps-btn ${sending ? 'on' : 'off'}`}
            onClick={sending ? stopSendingLocation : startSendingLocation}
          >
            {sending ? '🛑 Tắt GPS' : '📡 Bật GPS'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ position:'relative', height:540, borderRadius:'var(--sp-radius)', overflow:'hidden', border:'1px solid var(--sp-border)' }}>
        <OrderPanel orders={orders} shipperLoc={shipperLoc} osrmDurations={osrmDurations} />

        <MapContainer center={[16, 108]} zoom={6} style={{ height:'100%', width:'100%' }}
          preferCanvas={true}>
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            keepBuffer={2}
          />

          {/* Shipper marker */}
          {shipperLoc && (
            <Marker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon}>
              <Popup>🚚 Vị trí của bạn</Popup>
            </Marker>
          )}

          {/* Delivery destination markers */}
          {sortedCustomers.map((c, idx) => (
            <Marker key={c.orderId} position={[c.lat, c.lng]} icon={createNumberIcon(idx + 1)}>
              <Popup>📦 Đơn #{c.orderId}</Popup>
            </Marker>
          ))}

          {/* Route polyline — single unified line, no territory split */}
          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }}
            />
          )}

          {/* Auto-fit */}
          {fitPositions.length > 0 && <FitBounds positions={fitPositions} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default ShipperMap;
