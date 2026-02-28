import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper } from '../../services/userService';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const ShipperMap = () => {
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  const [orderIds, setOrderIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [customers, setCustomers] = useState([]);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  // ======================= TÍNH KHOẢNG CÁCH (HAVERSINE)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ======================= LOAD ĐƠN + GEO CODE NHIỀU ĐỊA CHỈ
  const fetchOrders = async () => {
    if (!shipperId) return;
    const res = await getAllOrdersByShipper({ shipperId, status: 'working' });
    if (res?.errCode === 0 && res?.data?.length) {
      setOrderIds(res.data.map((o) => o.id));

      const geoResults = [];

      for (let o of res.data) {
        const address = o?.addressUser?.shipAdress;
        if (!address) continue;

        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            address + ', Vietnam'
          )}&format=json&limit=1`
        );
        const arr = await geo.json();
        if (arr && arr[0]) {
          geoResults.push({
            orderId: o.id,
            lat: parseFloat(arr[0].lat),
            lng: parseFloat(arr[0].lon),
          });
        }
      }

      setCustomers(geoResults);
    }
  };

  // ======================= SOCKET + LOAD
  useEffect(() => {
    socketRef.current = socketIOClient.connect(BACKEND_URL);
    fetchOrders();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  // ======================= INIT MAP
  useEffect(() => {
    if (!window.L) return;
    const map = window.L.map('shipper-map-container').setView([16, 108], 6);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => map.remove();
  }, []);

  // ======================= UPDATE MAP (MULTI STOP)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !shipperLoc || customers.length === 0) return;

    // Clear cũ
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);

    // SORT GẦN TRƯỚC
    const sorted = [...customers].sort((a, b) => {
      return (
        getDistance(shipperLoc.lat, shipperLoc.lng, a.lat, a.lng) -
        getDistance(shipperLoc.lat, shipperLoc.lng, b.lat, b.lng)
      );
    });

    // Marker shipper
    const shipperMarker = window.L.marker([shipperLoc.lat, shipperLoc.lng])
      .bindPopup('🚚 Bạn')
      .addTo(map);
    markersRef.current.push(shipperMarker);

    // Marker khách có số thứ tự
    sorted.forEach((c, index) => {
      const marker = window.L.marker([c.lat, c.lng], {
        icon: window.L.divIcon({
          html: `<div style="background:red;color:white;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-weight:bold;">${index + 1}</div>`,
          className: '',
        }),
      })
        .bindPopup(`Đơn #${c.orderId}`)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // TẠO ROUTE WAYPOINT
    const waypoints = [
      `${shipperLoc.lng},${shipperLoc.lat}`,
      ...sorted.map((c) => `${c.lng},${c.lat}`),
    ].join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);

          routeLayerRef.current = window.L.polyline(coords, {
            color: 'blue',
            weight: 5,
          }).addTo(map);

          map.fitBounds(routeLayerRef.current.getBounds(), {
            padding: [60, 60],
          });
        }
      });
  }, [shipperLoc, customers]);

  // ======================= GPS
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
    intervalRef.current = setInterval(send, 5000);
  };

  const stopSendingLocation = () => {
    setSending(false);
    clearInterval(intervalRef.current);
  };

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

      <div id="shipper-map-container" style={{ height: 650, width: '100%', borderRadius: 8 }} />
    </div>
  );
};

export default ShipperMap;
