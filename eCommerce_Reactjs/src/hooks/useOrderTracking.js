// useOrderTracking.js
import { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { getDetailOrder, getOrderShipperLocation, getAllWarehouses } from '../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';
const POLL_INTERVAL_MS = 3000; // fallback poll mỗi 3s nếu socket chưa nhận được

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useOrderTracking = (orderId) => {
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  const [order, setOrder] = useState(null);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    const token = localStorage.getItem('token');

    /* ── Load initial data ── */
    const loadData = async () => {
      try {
        const [orderRes, locRes] = await Promise.all([
          getDetailOrder(orderId),
          getOrderShipperLocation(orderId),
        ]);

        if (!mountedRef.current) return;

        let deliveryLat, deliveryLng;
        if (orderRes?.errCode === 0) {
          setOrder(orderRes.data);

          if (orderRes.data.addressUser?.lat && orderRes.data.addressUser?.lng) {
            deliveryLat = parseFloat(orderRes.data.addressUser.lat);
            deliveryLng = parseFloat(orderRes.data.addressUser.lng);
            setDeliveryCoords({ lat: deliveryLat, lng: deliveryLng });
          }
        } else {
          setError('Không tìm thấy đơn hàng');
        }

        if (locRes?.errCode === 0 && locRes.data?.lat && locRes.data?.lng) {
          setShipperLoc({
            lat: parseFloat(locRes.data.lat),
            lng: parseFloat(locRes.data.lng),
          });
        } else if (orderRes?.data?.statusId === 'S4') {
          try {
            const whRes = await getAllWarehouses();
            if (whRes?.errCode === 0 && whRes.data?.length > 0) {
              const warehouses = whRes.data;
              let nearest = warehouses[0];
              if (deliveryLat && deliveryLng) {
                let minDist = calculateDistance(nearest.lat, nearest.lng, deliveryLat, deliveryLng);
                for (let i = 1; i < warehouses.length; i++) {
                  const d = calculateDistance(warehouses[i].lat, warehouses[i].lng, deliveryLat, deliveryLng);
                  if (d < minDist) { minDist = d; nearest = warehouses[i]; }
                }
              }
              setWarehouse(nearest);
              setShipperLoc({ lat: nearest.lat, lng: nearest.lng });
            }
          } catch (e) {
            console.error('Error fetching warehouses', e);
          }
        }
      } catch {
        if (mountedRef.current) setError('Lỗi tải dữ liệu');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadData();

    /* ── Socket.IO setup ── */
    // BUG CŨ: emit join_order_tracking TRƯỚC khi socket connected → server bỏ qua
    // FIX: emit bên trong on('connect') → đảm bảo gửi đúng lúc server đã sẵn sàng
    const socket = socketIOClient(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    /* ── Socket event handlers ── */
    const joinRoom = () => socket.emit('join_order_tracking', { orderId, token });

    const startPolling = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        if (!mountedRef.current) return;
        try {
          const locRes = await getOrderShipperLocation(orderId);
          if (locRes?.errCode === 0 && locRes.data?.lat && locRes.data?.lng) {
            if (mountedRef.current)
              setShipperLoc({ lat: parseFloat(locRes.data.lat), lng: parseFloat(locRes.data.lng) });
          }
        } catch { /* bỏ qua lỗi poll */ }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    // Kết nối thành công: join room + dừng polling (socket đảm nhiệm)
    socket.on('connect', () => { stopPolling(); joinRoom(); });

    // Mất kết nối: bật polling fallback
    socket.on('disconnect', () => startPolling());

    // Nhận vị trí thời gian thực từ shipper → tắt polling ngay
    socket.on('order:shipper_location', (data) => {
      if (String(data?.orderId) === String(orderId) && data.lat != null && data.lng != null) {
        if (mountedRef.current)
          setShipperLoc({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
        stopPolling(); // socket OK → không cần poll nữa
      }
    });

    socket.on('reconnect', joinRoom);

    // Bật polling ban đầu (fallback trong khi chờ socket join room)
    startPolling();

    return () => {
      mountedRef.current = false;
      stopPolling();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('order:shipper_location');
      socket.disconnect();
    };
  }, [orderId]);

  return { order, shipperLoc, deliveryCoords, warehouse, loading, error };
};
