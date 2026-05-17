import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/* ─────────────────────────────────────────────────────────────────────────────
   AutoFit — chỉ gọi fitBounds MỘT LẦN DUY NHẤT khi lần đầu có đủ dữ liệu.
   Sau đó không bao giờ reset zoom/pan nữa → tránh giật khi shipper di chuyển.
───────────────────────────────────────────────────────────────────────────── */
const AutoFit = ({ positions }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current) return;                              // đã fit rồi → bỏ qua
    const valid = positions.filter((p) => p && p[0] != null && p[1] != null);
    if (valid.length === 0) return;
    map.fitBounds(L.latLngBounds(valid), { padding: [60, 60], animate: true, duration: 1 });
    hasFit.current = true;
  }, [positions, map]);

  return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   SmoothShipperMarker — dùng imperative Leaflet API để di chuyển marker
   mà KHÔNG re-render toàn bộ React tree → mượt mà, không nhấp nháy.
   Khi shipper di chuyển, bản đồ sẽ pan nhẹ nhàng theo.
───────────────────────────────────────────────────────────────────────────── */
const SmoothShipperMarker = ({ position, icon }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const prevPos = useRef(null);

  useEffect(() => {
    if (!position) return;
    const latlng = L.latLng(position[0], position[1]);

    if (!markerRef.current) {
      // Tạo marker lần đầu
      markerRef.current = L.marker(latlng, { icon }).addTo(map);
      markerRef.current.bindPopup('🚚 Vị trí của bạn');
    } else {
      // Di chuyển marker mượt mà bằng imperative API
      markerRef.current.setLatLng(latlng);
    }

    // Pan bản đồ nhẹ nhàng nếu marker ra gần rìa viewport (không reset zoom)
    const mapBounds = map.getBounds();
    const padding = 0.15; // 15% từ mép
    const latPad = (mapBounds.getNorth() - mapBounds.getSouth()) * padding;
    const lngPad = (mapBounds.getEast() - mapBounds.getWest()) * padding;
    const innerBounds = L.latLngBounds(
      [mapBounds.getSouth() + latPad, mapBounds.getWest() + lngPad],
      [mapBounds.getNorth() - latPad, mapBounds.getEast() - lngPad],
    );

    if (!innerBounds.contains(latlng) && prevPos.current) {
      map.panTo(latlng, { animate: true, duration: 0.8 });
    }
    prevPos.current = latlng;
  }, [position, map, icon]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

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
    const res = await fetch(`${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`);
    const data = await res.json();
    if (data?.routes?.[0]?.duration != null) return data.routes[0].duration;
  } catch {}
  return null;
};

/* ── Main component ── */
const ShipperMap = () => {
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);       // watchPosition ID
  const intervalRef = useRef(null);      // setInterval 1s emit socket
  const lastLocRef = useRef(null);       // vị trí GPS mới nhất (từ watchPosition)
  const lastEtaLocRef = useRef(null);    // vị trí lần cuối gọi OSRM ETA

  const [orderIds, setOrderIds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sending, setSending] = useState(false);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [osrmDurations, setOsrmDurations] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  /* Fetch active orders */
  const fetchOrders = useCallback(async () => {
    if (!shipperId) return;
    const res = await getAllOrdersByShipper({ shipperId, status: 'working' });
    if (res?.errCode === 0 && res?.data?.length) {
      setOrders(res.data);
      setOrderIds(res.data.map((o) => o.id));
      setCustomers(
        res.data
          .filter((o) => o?.addressUser?.lat && o?.addressUser?.lng)
          .map((o) => ({
            orderId: o.id,
            lat: parseFloat(o.addressUser.lat),
            lng: parseFloat(o.addressUser.lng),
          })),
      );
    }
  }, [shipperId]);

  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    fetchOrders();
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      socketRef.current?.disconnect();
    };
  }, [fetchOrders]);

  /* ── Fetch ETA khi shipper di chuyển > 50m ── */
  useEffect(() => {
    if (!shipperLoc || customers.length === 0) return;

    // Throttle: chỉ gọi OSRM ETA khi đã di chuyển hơn 50m so với lần trước
    if (lastEtaLocRef.current) {
      const moved = getDistance(
        lastEtaLocRef.current.lat, lastEtaLocRef.current.lng,
        shipperLoc.lat, shipperLoc.lng,
      );
      if (moved < 0.05) return; // < 50m → bỏ qua
    }
    lastEtaLocRef.current = shipperLoc;

    const fetchAll = async () => {
      const results = {};
      await Promise.all(
        customers.map(async (c) => {
          results[c.orderId] = await fetchOSRMDuration(
            shipperLoc.lat, shipperLoc.lng, c.lat, c.lng,
          );
        }),
      );
      setOsrmDurations(results);
    };
    fetchAll();
  }, [shipperLoc, customers]);

  /* Sort customers by distance from shipper */
  const sortedCustomers = useMemo(() => {
    if (!shipperLoc) return [];
    return [...customers].sort(
      (a, b) =>
        getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
        getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng),
    );
  }, [shipperLoc, customers]);

  /* OSRM route */
  const waypoints =
    shipperLoc && sortedCustomers.length > 0 ? [shipperLoc, ...sortedCustomers] : [];
  const { routeCoords } = useOSRMRoute(waypoints);

  /* Positions cho AutoFit (chỉ dùng 1 lần) */
  const fitPositions = useMemo(() => {
    const pts = [];
    if (shipperLoc) pts.push([shipperLoc.lat, shipperLoc.lng]);
    sortedCustomers.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [shipperLoc, sortedCustomers]);

  /* ── GPS Controls — Hybrid: watchPosition (accuracy) + setInterval 1s (emit) ── */
  const startSendingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setSending(true);

    // watchPosition: cập nhật vị trí ngay khi thiết bị di chuyển, độ chính xác cao
    // Lưu vị trí mới nhất vào ref (không emit trực tiếp để tránh flood socket)
    const onSuccess = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      lastLocRef.current = { lat, lng };
      setShipperLoc({ lat, lng }); // cập nhật UI marker ngay lập tức
    };

    const onError = (err) => console.warn('GPS error:', err.message);

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,   // không dùng cache, luôn lấy vị trí tươi
      timeout: 5000,
    });

    // setInterval 1s: mỗi giây đọc vị trí mới nhất từ ref rồi emit socket
    // Đảm bảo server nhận đúng 1 update/giây, ổn định và có kiểm soát
    intervalRef.current = setInterval(() => {
      const loc = lastLocRef.current;
      if (!loc) return;
      setLastUpdate(moment().format('HH:mm:ss'));
      socketRef.current?.emit('shipper:location', {
        shipperId,
        lat: loc.lat,
        lng: loc.lng,
        orderIds,
      });
    }, 1000);
  }, [shipperId, orderIds]);

  const stopSendingLocation = useCallback(() => {
    setSending(false);
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastLocRef.current = null;
    toast.info('Đã tắt GPS');
  }, []);

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
      <div
        style={{
          position: 'relative',
          height: 540,
          borderRadius: 'var(--sp-radius)',
          overflow: 'hidden',
          border: '1px solid var(--sp-border)',
        }}
      >
        <OrderPanel orders={orders} shipperLoc={shipperLoc} osrmDurations={osrmDurations} />

        <MapContainer
          center={[16, 108]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          preferCanvas={true}
          zoomControl={true}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            keepBuffer={4}
          />

          {/* Shipper marker — mượt mà, không re-render */}
          {shipperLoc && (
            <SmoothShipperMarker
              position={[shipperLoc.lat, shipperLoc.lng]}
              icon={truckIcon}
            />
          )}

          {/* Delivery destination markers */}
          {sortedCustomers.map((c, idx) => (
            <Marker key={c.orderId} position={[c.lat, c.lng]} icon={createNumberIcon(idx + 1)}>
              <Popup>📦 Đơn #{c.orderId}</Popup>
            </Marker>
          ))}

          {/* Route polyline */}
          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: '#3b82f6',
                weight: 5,
                opacity: 0.9,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          )}

          {/* AutoFit — chỉ chạy 1 lần khi lần đầu có đủ dữ liệu */}
          {fitPositions.length > 0 && <AutoFit positions={fitPositions} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default ShipperMap;
