import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper } from '../../services/userService';
import { toast } from 'react-toastify';

import { truckIcon } from '../Map/mapIcons';
import { useOSRMRoute } from '../../hooks/useOSRMRoute';
import { getDistance } from '../../utils/MapUtils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

// ================= Fit bounds component
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

const ShipperMap = () => {
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  const [orderIds, setOrderIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [customers, setCustomers] = useState([]);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  // ================= LOAD ORDERS
  const fetchOrders = async () => {
    if (!shipperId) return;

    const res = await getAllOrdersByShipper({
      shipperId,
      status: 'working',
    });

    if (res?.errCode === 0 && res?.data?.length) {
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

  // ================= SORT CUSTOMER BY DISTANCE
  const sortedCustomers = useMemo(() => {
    if (!shipperLoc) return [];

    return [...customers].sort(
      (a, b) =>
        getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
        getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng)
    );
  }, [shipperLoc, customers]);

  // ================= ROUTE (SỬ DỤNG HOOK MỚI)
  const waypoints =
    shipperLoc && sortedCustomers.length > 0 ? [shipperLoc, ...sortedCustomers] : [];

  const { routeCoords } = useOSRMRoute(waypoints);

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

        socketRef.current?.emit('shipper:location', {
          shipperId,
          lat,
          lng,
          orderIds,
        });
      });
    };

    send();
    //s10 cập nhật lại
    intervalRef.current = setInterval(send, 10000);
  };

  const stopSendingLocation = () => {
    setSending(false);
    clearInterval(intervalRef.current);
  };

  // ================= ICON SỐ THỨ TỰ
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

      <MapContainer
        center={[16, 108]}
        zoom={6}
        style={{ height: 650, width: '100%', borderRadius: 8 }}
      >
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

        {routeCoords.length > 0 && (
          <>
            <Polyline positions={routeCoords} pathOptions={{ color: 'blue', weight: 5 }} />

            <FitBounds
              positions={[
                [shipperLoc?.lat, shipperLoc?.lng],
                ...sortedCustomers.map((c) => [c.lat, c.lng]),
              ]}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default ShipperMap;
