import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper, shipperUpdateOrderStatus } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';

import { truckIcon } from '../Map/mapIcons';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { getDistance } from '../../utils/MapUtils';
import OrderPanel from '../Shipper/OrderPanel';
import CompleteModal from '../Shipper/components/CompleteModal';
import ModalCancelOrder from '../../component/ModalCancelOrder/ModalCancelOrder';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/* ── AutoFit: fitBounds MỘT LẦN khi lần đầu có đủ dữ liệu ── */
const AutoFit = ({ positions }) => {
  const map = useMap();
  const hasFit = useRef(false);
  useEffect(() => {
    if (hasFit.current) return;
    const valid = positions.filter((p) => p && p[0] != null && p[1] != null);
    if (valid.length === 0) return;
    map.fitBounds(L.latLngBounds(valid), { padding: [60, 60], animate: true, duration: 1 });
    hasFit.current = true;
  }, [positions, map]);
  return null;
};

/* ── FitToSelected: zoom vào đơn được chọn khi filter ── */
const FitToSelected = ({ shipperLoc, target }) => {
  const map = useMap();
  const prevId = useRef(null);
  useEffect(() => {
    if (!target || prevId.current === target.orderId) return;
    prevId.current = target.orderId;
    const pts = [];
    if (shipperLoc) pts.push([shipperLoc.lat, shipperLoc.lng]);
    pts.push([target.lat, target.lng]);
    map.fitBounds(L.latLngBounds(pts), { padding: [80, 80], animate: true, duration: 1 });
  }, [target, shipperLoc, map]);
  return null;
};

/* ── SmoothShipperMarker: di chuyển marker mượt mà, không re-render ── */
const SmoothShipperMarker = ({ position, icon }) => {
  const map = useMap();
  const markerRef = useRef(null);
  const prevPos = useRef(null);
  useEffect(() => {
    if (!position) return;
    const latlng = L.latLng(position[0], position[1]);
    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon }).addTo(map);
      markerRef.current.bindPopup('🚚 Vị trí của bạn');
    } else {
      markerRef.current.setLatLng(latlng);
    }
    const mapBounds = map.getBounds();
    const padding = 0.15;
    const latPad = (mapBounds.getNorth() - mapBounds.getSouth()) * padding;
    const lngPad = (mapBounds.getEast() - mapBounds.getWest()) * padding;
    const innerBounds = L.latLngBounds(
      [mapBounds.getSouth() + latPad, mapBounds.getWest() + lngPad],
      [mapBounds.getNorth() - latPad, mapBounds.getEast() - lngPad]
    );
    if (!innerBounds.contains(latlng) && prevPos.current) {
      map.panTo(latlng, { animate: true, duration: 0.8 });
    }
    prevPos.current = latlng;
  }, [position, map, icon]);
  useEffect(
    () => () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    },
    []
  );
  return null;
};

/* ── Numbered delivery marker ── */
const createNumberIcon = (number, highlighted = false) =>
  L.divIcon({
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${highlighted ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)'};
      color:#fff;text-align:center;line-height:30px;
      font-weight:800;font-size:13px;
      box-shadow:0 2px 8px rgba(59,130,246,0.5);
      border:2px solid ${highlighted ? '#fff' : 'rgba(255,255,255,0.4)'};
      transform:${highlighted ? 'scale(1.3)' : 'scale(1)'};
    ">${number}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

/* ── OSRM ETA ── */
const fetchOSRMDuration = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const res = await fetch(`${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`);
    const data = await res.json();
    if (data?.routes?.[0]?.duration != null) return data.routes[0].duration;
  } catch {}
  return null;
};

/* ── FailModal inline ── */
const FailModal = ({ orderId, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.warning('Vui lòng nhập lý do.');
      return;
    }
    setLoading(true);
    try {
      const res = await shipperUpdateOrderStatus({
        orderId,
        statusId: 'S8',
        statusReason: reason.trim(),
      });
      if (res?.errCode === 0) {
        toast.success('Đã cập nhật giao thất bại.');
        onDone();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 24,
          width: 340,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: '#ef4444', marginBottom: 16 }}>
          ⚠ Báo giao thất bại
        </div>
        <textarea
          rows={3}
          style={{
            width: '100%',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#e2e8f0',
            padding: 10,
            fontSize: 13,
            resize: 'none',
          }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do..."
          maxLength={300}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            style={{
              flex: 1,
              padding: '8px 0',
              background: '#ef4444',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── QuickActionPanel: hiển thị đơn gần nhất / đơn được chọn + nút xác nhận nhanh ── */
const QuickActionPanel = ({
  order,
  osrmDurations,
  shipperLoc,
  onDelivered,
  onCancel,
  onFail,
  isSelected,
}) => {
  if (!order) return null;
  const distKm =
    shipperLoc && order.addressUser?.lat && order.addressUser?.lng
      ? getDistance(
          shipperLoc.lat,
          shipperLoc.lng,
          parseFloat(order.addressUser.lat),
          parseFloat(order.addressUser.lng)
        )
      : null;
  const duration = osrmDurations?.[order.id];
  const formatD = (km) =>
    km == null ? '—' : km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  const formatT = (s) => {
    if (s == null) return '—';
    const m = Math.round(s / 60);
    return m < 60 ? `${m}p` : `${Math.floor(m / 60)}h${m % 60}p`;
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        right: 14,
        zIndex: 2000,
        background: 'linear-gradient(135deg,#0f172a,#1e293b)',
        border: `1px solid ${isSelected ? '#3b82f6' : '#334155'}`,
        borderRadius: 12,
        padding: '12px 14px',
        width: 260,
        boxShadow: isSelected ? '0 4px 24px rgba(59,130,246,0.4)' : '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: isSelected ? '#60a5fa' : '#f59e0b',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {isSelected ? '⌖ Đơn đang lọc' : '📍 Đơn gần nhất'}
      </div>
      {/* Order ID */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            background: 'rgba(59,130,246,0.2)',
            color: '#93c5fd',
            borderRadius: 5,
            padding: '2px 8px',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          #{order.id}
        </span>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          {formatD(distKm)} · {formatT(duration)}
        </span>
      </div>
      {/* Address */}
      <div
        style={{
          fontSize: 11,
          color: '#e2e8f0',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 4,
        }}
      >
        <span>📍</span>
        <span style={{ flex: 1 }}>{order.addressUser?.shipAdress || '—'}</span>
      </div>
      {/* Customer */}
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
        👤 {order.addressUser?.shipName || '—'}
        {order.addressUser?.shipPhonenumber ? ` · ${order.addressUser.shipPhonenumber}` : ''}
      </div>
      {/* Action buttons — chỉ khi đang giao (S5) */}
      {order.statusId === 'S5' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onDelivered(order.id)}
            style={{
              flex: 2,
              padding: '7px 0',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ✓ Giao
          </button>
          <button
            onClick={() => onCancel(order.id)}
            style={{
              flex: 1,
              padding: '7px 0',
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              color: '#fbbf24',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => onFail(order.id)}
            style={{
              flex: 1,
              padding: '7px 0',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              borderRadius: 8,
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Lỗi
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Main component ── */
const ShipperMap = () => {
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastLocRef = useRef(null);
  const lastEtaLocRef = useRef(null);

  const [orderIds, setOrderIds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sending, setSending] = useState(false);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [osrmDurations, setOsrmDurations] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  // State cho filter đơn & action nhanh
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [failModal, setFailModal] = useState(null);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null });

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
          }))
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

  /* Sort customers by distance */
  const sortedCustomers = useMemo(() => {
    if (!shipperLoc) return customers;
    return [...customers].sort(
      (a, b) =>
        getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
        getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng)
    );
  }, [shipperLoc, customers]);

  /* TH1: filter theo đơn được chọn / TH2: hiển thị tất cả */
  const displayedCustomers = useMemo(() => {
    if (!selectedOrderId) return sortedCustomers;
    return sortedCustomers.filter((c) => c.orderId === selectedOrderId);
  }, [selectedOrderId, sortedCustomers]);

  /* selectedTarget để FitToSelected zoom vào */
  const selectedTarget = useMemo(() => {
    if (!selectedOrderId) return null;
    return sortedCustomers.find((c) => c.orderId === selectedOrderId) || null;
  }, [selectedOrderId, sortedCustomers]);

  /* activeOrder: đơn được chọn (TH1) hoặc đơn gần nhất (TH2) */
  const activeOrder = useMemo(() => {
    if (orders.length === 0) return null;
    if (selectedOrderId) return orders.find((o) => o.id === selectedOrderId) || null;
    if (sortedCustomers.length === 0) return null;
    return orders.find((o) => o.id === sortedCustomers[0].orderId) || null;
  }, [selectedOrderId, orders, sortedCustomers]);

  /* ETA khi di chuyển >50m */
  useEffect(() => {
    if (!shipperLoc || customers.length === 0) return;
    if (lastEtaLocRef.current) {
      const moved = getDistance(
        lastEtaLocRef.current.lat,
        lastEtaLocRef.current.lng,
        shipperLoc.lat,
        shipperLoc.lng
      );
      if (moved < 0.05) return;
    }
    lastEtaLocRef.current = shipperLoc;
    Promise.all(
      customers.map(async (c) => {
        const dur = await fetchOSRMDuration(shipperLoc.lat, shipperLoc.lng, c.lat, c.lng);
        return { id: c.orderId, dur };
      })
    ).then((results) => {
      const map = {};
      results.forEach(({ id, dur }) => {
        map[id] = dur;
      });
      setOsrmDurations(map);
    });
  }, [shipperLoc, customers]);

  /* OSRM route */
  const waypoints =
    shipperLoc && displayedCustomers.length > 0 ? [shipperLoc, ...displayedCustomers] : [];
  const { routeCoords } = useOSRMRoute(waypoints);

  /* Positions cho AutoFit */
  const fitPositions = useMemo(() => {
    const pts = [];
    if (shipperLoc) pts.push([shipperLoc.lat, shipperLoc.lng]);
    sortedCustomers.forEach((c) => pts.push([c.lat, c.lng]));
    return pts;
  }, [shipperLoc, sortedCustomers]);

  /* GPS Controls */
  const startSendingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setSending(true);
    const onSuccess = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      lastLocRef.current = { lat, lng };
      setShipperLoc({ lat, lng });
    };
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      (err) => console.warn('GPS error:', err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
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

  /* Action handlers */
  const handleCancelOrder = async (reason) => {
    try {
      const res = await shipperUpdateOrderStatus({
        orderId: cancelModal.orderId,
        statusId: 'S7',
        statusReason: reason,
      });
      if (res?.errCode === 0) {
        toast.success('Đã hủy đơn.');
        setCancelModal({ show: false, orderId: null });
        if (selectedOrderId === cancelModal.orderId) setSelectedOrderId(null);
        fetchOrders();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch {
      toast.error('Lỗi kết nối');
    }
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
              📦 {displayedCustomers.length}/{customers.length} điểm giao
              {selectedOrderId && (
                <span style={{ color: '#60a5fa', marginLeft: 4 }}>
                  • Đang lọc #{selectedOrderId}
                </span>
              )}
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
        {/* OrderPanel: danh sách đơn với nút Lộ trình */}
        <OrderPanel
          orders={orders}
          shipperLoc={shipperLoc}
          osrmDurations={osrmDurations}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
        />

        {/* QuickActionPanel: đơn được chọn (TH1) hoặc gần nhất (TH2) */}
        <QuickActionPanel
          order={activeOrder}
          osrmDurations={osrmDurations}
          shipperLoc={shipperLoc}
          isSelected={!!selectedOrderId}
          onDelivered={(id) => setCompleteModal(id)}
          onCancel={(id) => setCancelModal({ show: true, orderId: id })}
          onFail={(id) => setFailModal(id)}
        />

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

          {shipperLoc && (
            <SmoothShipperMarker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon} />
          )}

          {/* Markers: highlight đơn được chọn */}
          {displayedCustomers.map((c, idx) => (
            <Marker
              key={c.orderId}
              position={[c.lat, c.lng]}
              icon={createNumberIcon(idx + 1, c.orderId === selectedOrderId)}
            >
              <Popup>📦 Đơn #{c.orderId}</Popup>
            </Marker>
          ))}

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

          {/* AutoFit: chỉ chạy 1 lần khi lần đầu có đủ dữ liệu */}
          {fitPositions.length > 0 && <AutoFit positions={fitPositions} />}

          {/* FitToSelected: zoom vào đơn khi filter */}
          {selectedTarget && <FitToSelected shipperLoc={shipperLoc} target={selectedTarget} />}
        </MapContainer>
      </div>

      {/* Modals */}
      {completeModal && (
        <CompleteModal
          orderId={completeModal}
          onClose={() => setCompleteModal(null)}
          onDone={() => {
            setCompleteModal(null);
            if (selectedOrderId === completeModal) setSelectedOrderId(null);
            fetchOrders();
          }}
        />
      )}
      {failModal && (
        <FailModal
          orderId={failModal}
          onClose={() => setFailModal(null)}
          onDone={() => {
            setFailModal(null);
            if (selectedOrderId === failModal) setSelectedOrderId(null);
            fetchOrders();
          }}
        />
      )}
      <ModalCancelOrder
        show={cancelModal.show}
        onConfirm={handleCancelOrder}
        onClose={() => setCancelModal({ show: false, orderId: null })}
      />
    </div>
  );
};

export default ShipperMap;
