import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper } from '../../services/userService';
import { toast } from 'react-toastify';

import { truckIcon } from '../Map/mapIcons';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { getDistance } from '../../utils/MapUtils';
import * as turf from '@turf/turf';
import vietnamBorder from '../../data/vietnamBorder.json';
import OrderPanel from '../Shipper/OrderPanel'; // Case C: tách thành component riêng

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// ================= VIETNAM BOUNDARY CHECK
const vietnamPolygon = turf.feature(vietnamBorder.features[0].geometry);
const isInVietnam = (lat, lng) => {
  const point = turf.point([lng, lat]);
  return turf.booleanPointInPolygon(point, vietnamPolygon);
};

// ================= FIT BOUNDS
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
};

// ================= FETCH OSRM DURATION (Case B: duration thật từ OSRM)
// Hàm này gọi OSRM để lấy thời gian di chuyển từ shipperLoc đến 1 điểm
const fetchOSRMDuration = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.routes?.[0]?.duration != null) {
      return data.routes[0].duration; // seconds
    }
  } catch (e) {
    // Silently fallback
  }
  return null;
};

const ShipperMap = () => {
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const [orderIds, setOrderIds] = useState([]);
  const [orders, setOrders] = useState([]); // lưu full order data
  const [sending, setSending] = useState(false);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [customers, setCustomers] = useState([]);

  // Case B: map orderId -> duration (seconds) từ OSRM
  const [osrmDurations, setOsrmDurations] = useState({});

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  // ================= LOAD ORDERS
  const fetchOrders = async () => {
    if (!shipperId) return;
    const res = await getAllOrdersByShipper({ shipperId, status: 'working' });
    if (res?.errCode === 0 && res?.data?.length) {
      setOrders(res.data); // Case A: lưu full order để lấy totalPrice, name, phone
      setOrderIds(res.data.map((o) => o.id));

      const customerCoords = res.data
        .filter((o) => o?.addressUser?.lat && o?.addressUser?.lng)
        .map((o) => ({
          orderId: o.id,
          lat: parseFloat(o.addressUser.lat),
          lng: parseFloat(o.addressUser.lng),
        }));
      setCustomers(customerCoords);
    }
  };

  // ================= SOCKET INIT
  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    fetchOrders();
    return () => {
      clearInterval(intervalRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  // ================= FETCH OSRM DURATIONS khi có shipperLoc và customers (Case B)
  useEffect(() => {
    if (!shipperLoc || customers.length === 0) return;

    const fetchAll = async () => {
      const results = {};
      await Promise.all(
        customers.map(async (c) => {
          const duration = await fetchOSRMDuration(shipperLoc.lat, shipperLoc.lng, c.lat, c.lng);
          results[c.orderId] = duration;
        })
      );
      setOsrmDurations(results);
    };

    fetchAll();
  }, [shipperLoc, customers]);

  // ================= SORT CUSTOMERS BY DISTANCE
  const sortedCustomers = useMemo(() => {
    if (!shipperLoc) return [];
    return [...customers].sort(
      (a, b) =>
        getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
        getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng)
    );
  }, [shipperLoc, customers]);

  // ================= ROUTE
  const waypoints =
    shipperLoc && sortedCustomers.length > 0 ? [shipperLoc, ...sortedCustomers] : [];
  const { routeCoords } = useOSRMRoute(waypoints);

  // ================= TÁCH ROUTE TRONG / NGOÀI VIỆT NAM
  const { insideRoute, outsideRoute } = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return { insideRoute: [], outsideRoute: [] };

    const inside = [];
    const outside = [];
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const cur = routeCoords[i];
      const nxt = routeCoords[i + 1];
      if (isInVietnam(cur[0], cur[1]) && isInVietnam(nxt[0], nxt[1])) {
        inside.push([cur, nxt]);
      } else {
        outside.push([cur, nxt]);
      }
    }
    return { insideRoute: inside, outsideRoute: outside };
  }, [routeCoords]);

  // ================= GPS
  const startSendingLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Không hỗ trợ GPS');
      return;
    }
    setSending(true);
    const send = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setShipperLoc({ lat, lng });
        socketRef.current?.emit('shipper:location', { shipperId, lat, lng, orderIds });
      });
    };
    send();
    intervalRef.current = setInterval(send, 10000);
  };

  const stopSendingLocation = () => {
    setSending(false);
    clearInterval(intervalRef.current);
  };

  // ================= NUMBERED MARKER ICON
  const createNumberIcon = (number) =>
    L.divIcon({
      html: `<div style="background:red;color:white;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-weight:bold;">${number}</div>`,
      className: '',
    });

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Bản đồ giao nhiều điểm</h1>

      <div className="mb-3">
        {!sending ? (
          <button className="btn btn-success" onClick={startSendingLocation}>
            Bật GPS
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopSendingLocation}>
            Tắt GPS
          </button>
        )}
      </div>

      {/* ===== MAP WRAPPER: position relative để OrderPanel absolute bên trong ===== */}
      <div style={{ position: 'relative', height: 650, borderRadius: 8, overflow: 'hidden' }}>
        {/* Case C: OrderPanel là component riêng, nhận props */}
        <OrderPanel
          orders={orders}
          shipperLoc={shipperLoc}
          osrmDurations={osrmDurations} // Case B: truyền duration thật từ OSRM
        />

        <MapContainer center={[16, 108]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {shipperLoc && (
            <Marker position={[shipperLoc.lat, shipperLoc.lng]} icon={truckIcon}>
              <Popup>🚚 Shipper</Popup>
            </Marker>
          )}

          {sortedCustomers.map((c, index) => (
            <Marker key={c.orderId} position={[c.lat, c.lng]} icon={createNumberIcon(index + 1)}>
              <Popup>Đơn #{c.orderId}</Popup>
            </Marker>
          ))}

          {/* Route trong Việt Nam - nét liền xanh */}
          {insideRoute.map((segment, i) => (
            <Polyline
              key={`inside-${i}`}
              positions={segment}
              pathOptions={{ color: 'blue', weight: 5 }}
            />
          ))}

          {/* Route ngoài Việt Nam - nét đứt vàng */}
          {outsideRoute.map((segment, i) => (
            <Polyline
              key={`outside-${i}`}
              positions={segment}
              pathOptions={{ color: 'yellow', weight: 5, dashArray: '10,10' }}
            />
          ))}

          {routeCoords.length > 0 && (
            <FitBounds
              positions={[
                [shipperLoc?.lat, shipperLoc?.lng],
                ...sortedCustomers.map((c) => [c.lat, c.lng]),
              ]}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default ShipperMap;
