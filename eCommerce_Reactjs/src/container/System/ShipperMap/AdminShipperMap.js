import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { getAdminShippersOnMap } from '../../../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const AdminShipperMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const socketRef = useRef(null);
  const [list, setList] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const load = async () => {
      try {
        const res = await getAdminShippersOnMap();
        if (res && res.errCode === 0 && res.data) setList(res.data);
      } catch (e) {
        console.error('checkout AdminShipperMap');
      }
    };
    load();

    socketRef.current = socketIOClient.connect(BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current.emit('join_admin_shipper_map', { token });
    socketRef.current.on('shipper:location', (data) => {
      if (!data?.shipperId) return;
      setList((prev) =>
        prev.map((s) =>
          s.shipperId === data.shipperId ? { ...s, lat: data.lat, lng: data.lng } : s
        )
      );
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) return;
    const container = document.getElementById('admin-shipper-map');
    if (!container || mapInstanceRef.current) return;

    const map = window.L.map('admin-shipper-map').setView([21.0, 105.8], 10);
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
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    Object.values(markersRef.current).forEach((m) => {
      if (m) map.removeLayer(m);
    });
    markersRef.current = {};

    list.forEach((s) => {
      if (s.lat != null && s.lng != null) {
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lng);
        const name = s.shipper
          ? `${s.shipper.firstName || ''} ${s.shipper.lastName || ''}`.trim()
          : 'Shipper';
        const orders = (s.orderIds || []).join(', ');
        const m = window.L.marker([lat, lng])
          .bindPopup(`<b>${name}</b><br/>Đơn: ${orders || '—'}`)
          .addTo(map);
        markersRef.current[s.shipperId] = m;
      }
    });
  }, [list]);

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Bản đồ shipper đang giao</h1>
      <p className="mb-3 text-muted">Vị trí realtime của các shipper có đơn S4/S5.</p>
      <div id="admin-shipper-map" style={{ height: 500, width: '100%', borderRadius: 8 }} />
      <div className="mt-3">
        {list.length === 0 ? (
          <p className="text-muted">Chưa có shipper nào đang giao.</p>
        ) : (
          <ul className="list-group">
            {list.map((s) => (
              <li key={s.shipperId} className="list-group-item d-flex justify-content-between">
                <span>
                  {s.shipper?.firstName} {s.shipper?.lastName} – {s.shipper?.phonenumber}
                </span>
                <span>Đơn: {(s.orderIds || []).join(', ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminShipperMap;
