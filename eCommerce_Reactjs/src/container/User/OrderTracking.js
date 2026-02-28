import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import { getDetailOrder, getOrderShipperLocation } from '../../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const statusText = {
  S4: 'Shipper đang đến lấy hàng',
  S5: 'Đang giao hàng',
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);
  const socketRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [shipperLoc, setShipperLoc] = useState({ lat: null, lng: null });
  const [deliveryCoords, setDeliveryCoords] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    const load = async () => {
      if (!orderId) {
        setError('Thiếu mã đơn.');
        setLoading(false);
        return;
      }
      try {
        const [orderRes, locRes] = await Promise.all([
          getDetailOrder(orderId),
          getOrderShipperLocation(orderId),
        ]);
        if (!mounted) return;
        if (orderRes?.errCode === 0 && orderRes?.data) {
          setOrder(orderRes.data);
          if (orderRes.data.statusId !== 'S4' && orderRes.data.statusId !== 'S5') {
            setError('Chỉ theo dõi được khi đơn ở trạng thái Chờ lấy hàng hoặc Đang giao.');
          }
        } else {
          setError('Không tìm thấy đơn.');
        }
        if (locRes?.errCode === 0 && locRes?.data) {
          if (locRes.data.lat != null && locRes.data.lng != null) {
            setShipperLoc({ lat: parseFloat(locRes.data.lat), lng: parseFloat(locRes.data.lng) });
          }
        }
      } catch (e) {
        setError('Lỗi tải dữ liệu.');
      }
      setLoading(false);
    };
    load();

    socketRef.current = socketIOClient.connect(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current.emit('join_order_tracking', { orderId, token });
    socketRef.current.on('order:shipper_location', (data) => {
      if (data?.orderId === parseInt(orderId, 10) && data?.lat != null && data?.lng != null) {
        setShipperLoc({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
      }
    });

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (!order?.addressUser?.shipAdress || deliveryCoords.lat != null) return;
    const addr = order.addressUser.shipAdress + ', Vietnam';
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`
    )
      .then((r) => r.json())
      .then((arr) => {
        if (arr && arr[0]) {
          setDeliveryCoords({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
        }
      })
      .catch(() => {});
  }, [order]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) return;
    const container = document.getElementById('order-tracking-map');
    if (!container || mapInstanceRef.current) return;

    const center =
      deliveryCoords.lat != null ? [deliveryCoords.lat, deliveryCoords.lng] : [21.0, 105.8];
    const map = window.L.map('order-tracking-map').setView(center, 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [deliveryCoords.lat, deliveryCoords.lng]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    if (markersRef.current.delivery) {
      map.removeLayer(markersRef.current.delivery);
    }
    if (deliveryCoords.lat != null && deliveryCoords.lng != null) {
      const m = window.L.marker([deliveryCoords.lat, deliveryCoords.lng])
        .bindPopup('Địa chỉ giao hàng')
        .addTo(map);
      markersRef.current.delivery = m;
    }

    if (markersRef.current.shipper) {
      map.removeLayer(markersRef.current.shipper);
    }
    if (shipperLoc.lat != null && shipperLoc.lng != null) {
      const m = window.L.marker([shipperLoc.lat, shipperLoc.lng])
        .bindPopup('Vị trí shipper')
        .addTo(map);
      markersRef.current.shipper = m;
    }

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }
    if (
      shipperLoc.lat != null &&
      shipperLoc.lng != null &&
      deliveryCoords.lat != null &&
      deliveryCoords.lng != null
    ) {
      const url = `https://router.project-osrm.org/route/v1/driving/${shipperLoc.lng},${shipperLoc.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.routes && data.routes[0]?.geometry?.coordinates && mapInstanceRef.current) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
            const line = window.L.polyline(coords, { color: 'blue', weight: 4 }).addTo(map);
            routeLayerRef.current = line;
            map.fitBounds(line.getBounds(), { padding: [30, 30] });
          }
        })
        .catch(() => {});
    }
  }, [shipperLoc, deliveryCoords]);

  if (loading) return <div className="container py-5">Đang tải...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  if (!order) return null;

  const status = order.statusId;
  const showMap = status === 'S4' || status === 'S5';
  const shipper = order.shipperData;

  return (
    <div className="container py-4">
      <h4>Theo dõi đơn #{orderId}</h4>
      <p className="text-muted mb-2">
        <strong>Trạng thái:</strong> {statusText[status] || order.statusOrderData?.value || status}
      </p>
      {shipper && (
        <p className="mb-2">
          <strong>Shipper:</strong> {shipper.firstName} {shipper.lastName}{' '}
          {shipper.phonenumber && <a href={`tel:${shipper.phonenumber}`}>{shipper.phonenumber}</a>}
        </p>
      )}
      <p className="mb-3">
        <strong>Địa chỉ giao:</strong> {order.addressUser?.shipAdress}
      </p>
      {showMap && (
        <div
          id="order-tracking-map"
          style={{ height: 400, width: '100%', borderRadius: 8 }}
          className="mb-3"
        />
      )}
    </div>
  );
};

export default OrderTracking;
