import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import { getDetailOrder, getOrderShipperLocation } from '../../services/userService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon mặc định Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const statusText = {
  S4: 'Shipper đang đến lấy hàng',
  S5: 'Đang giao hàng',
};

const OrderTracking = () => {
  const { orderId } = useParams();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ shipper: null, delivery: null });
  const routeRef = useRef(null);
  const socketRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const truckIcon = L.divIcon({
    html: `<div style="font-size:32px;">🚚</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
  const deliveryIcon = L.divIcon({
    html: `<div style="font-size:32px;">📍</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
  const showMap = order?.statusId === 'S4' || order?.statusId === 'S5';

  // =============================
  // 1. Load dữ liệu + Socket
  // =============================
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    const loadData = async () => {
      if (!orderId) {
        setError('Thiếu mã đơn hàng.');
        setLoading(false);
        return;
      }

      try {
        const [orderRes, locRes] = await Promise.all([
          getDetailOrder(orderId),
          getOrderShipperLocation(orderId),
        ]);

        if (!mounted) return;

        if (orderRes?.errCode === 0) {
          setOrder(orderRes.data);
        } else {
          setError('Không tìm thấy thông tin đơn hàng.');
        }

        if (locRes?.errCode === 0 && locRes?.data?.lat && locRes?.data?.lng) {
          setShipperLoc({
            lat: parseFloat(locRes.data.lat),
            lng: parseFloat(locRes.data.lng),
          });
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    socketRef.current = socketIOClient(BACKEND_URL, {
      transports: ['websocket'],
    });

    socketRef.current.emit('join_order_tracking', { orderId, token });

    socketRef.current.on('order:shipper_location', (data) => {
      if (data?.orderId === parseInt(orderId, 10) && data?.lat && data?.lng) {
        setShipperLoc({
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
        });
      }
    });

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    if (order.addressUser?.lat != null && order.addressUser?.lng != null) {
      setDeliveryCoords({
        lat: parseFloat(order.addressUser.lat),
        lng: parseFloat(order.addressUser.lng),
      });
    }
  }, [order]);

  // =============================
  // 3. Khởi tạo Map
  // =============================
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([21.0285, 105.8542], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [showMap]);

  // =============================
  // 4. Update Marker + Route
  // =============================
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear cũ
    if (markersRef.current.shipper) map.removeLayer(markersRef.current.shipper);
    if (markersRef.current.delivery) map.removeLayer(markersRef.current.delivery);
    if (routeRef.current) map.removeLayer(routeRef.current);

    const points = [];

    // Delivery marker
    if (deliveryCoords) {
      const marker = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon })
        .bindPopup('<b>Địa chỉ giao hàng</b>')
        .addTo(map);
      markersRef.current.delivery = marker;
      points.push([deliveryCoords.lat, deliveryCoords.lng]);
    }

    // Shipper marker
    if (shipperLoc) {
      const marker = L.marker([shipperLoc.lat, shipperLoc.lng], { icon: truckIcon })
        .bindPopup('<b>Vị trí Shipper</b>')
        .addTo(map);
      markersRef.current.shipper = marker;
      points.push([shipperLoc.lat, shipperLoc.lng]);
    }

    // Nếu có đủ 2 điểm → vẽ route
    if (shipperLoc && deliveryCoords) {
      const url = `https://router.project-osrm.org/route/v1/driving/${shipperLoc.lng},${shipperLoc.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data?.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

            const line = L.polyline(coords, {
              color: '#007bff',
              weight: 5,
              opacity: 0.7,
            }).addTo(map);

            routeRef.current = line;

            map.fitBounds(line.getBounds(), { padding: [50, 50] });
          }
        })
        .catch(() => console.log('Routing error'));
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [shipperLoc, deliveryCoords]);

  // =============================
  // UI
  // =============================
  if (loading) return <div className="container py-5 text-center">Đang tải...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  if (!order) return null;

  const shipper = order.shipperData;

  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <h4>Theo dõi đơn hàng #{orderId}</h4>
        <hr />

        <p>
          <strong>Trạng thái:</strong>{' '}
          <span className="badge bg-primary">
            {statusText[order.statusId] || order.statusOrderData?.value || order.statusId}
          </span>
        </p>

        <p>
          <strong>Địa chỉ giao:</strong> {order.addressUser?.shipAdress}
        </p>

        {shipper && (
          <>
            <p>
              <strong>Shipper:</strong> {shipper.firstName} {shipper.lastName}
            </p>
            <a href={`tel:${shipper.phonenumber}`} className="btn btn-sm btn-outline-success">
              Gọi: {shipper.phonenumber}
            </a>
          </>
        )}

        {showMap ? (
          <div
            ref={mapContainerRef}
            style={{
              height: '500px',
              width: '100%',
              borderRadius: '12px',
              marginTop: '20px',
            }}
          />
        ) : (
          <div className="alert alert-warning mt-3">Bản đồ chưa khả dụng cho trạng thái này.</div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
