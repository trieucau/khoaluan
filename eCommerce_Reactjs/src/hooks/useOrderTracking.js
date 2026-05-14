// useOrderTracking.js
import { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { getDetailOrder, getOrderShipperLocation, getAllWarehouses } from '../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

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

  const [order, setOrder] = useState(null);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    const loadData = async () => {
      try {
        const [orderRes, locRes] = await Promise.all([
          getDetailOrder(orderId),
          getOrderShipperLocation(orderId),
        ]);

        if (!mounted) return;

        let deliveryLat, deliveryLng;
        if (orderRes?.errCode === 0) {
          setOrder(orderRes.data);

          if (orderRes.data.addressUser?.lat && orderRes.data.addressUser?.lng) {
            deliveryLat = parseFloat(orderRes.data.addressUser.lat);
            deliveryLng = parseFloat(orderRes.data.addressUser.lng);
            setDeliveryCoords({
              lat: deliveryLat,
              lng: deliveryLng,
            });
          }
        } else {
          setError('Không tìm thấy đơn hàng');
        }

        if (locRes?.errCode === 0 && locRes.data && locRes.data.lat && locRes.data.lng) {
          setShipperLoc({
            lat: parseFloat(locRes.data.lat),
            lng: parseFloat(locRes.data.lng),
          });
        } else if (orderRes?.data?.statusId === 'S4') {
          // Trạng thái Chờ lấy hàng nhưng shipper chưa có vị trí -> Tìm kho gần nhất
          try {
            const whRes = await getAllWarehouses();
            if (whRes?.errCode === 0 && whRes.data?.length > 0) {
              const warehouses = whRes.data;
              let nearest = warehouses[0];

              if (deliveryLat && deliveryLng) {
                let minDistance = calculateDistance(
                  nearest.lat,
                  nearest.lng,
                  deliveryLat,
                  deliveryLng
                );
                for (let i = 1; i < warehouses.length; i++) {
                  const dist = calculateDistance(
                    warehouses[i].lat,
                    warehouses[i].lng,
                    deliveryLat,
                    deliveryLng
                  );
                  if (dist < minDistance) {
                    minDistance = dist;
                    nearest = warehouses[i];
                  }
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
        setError('Lỗi tải dữ liệu');
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
      if (data?.orderId === parseInt(orderId) && data.lat && data.lng) {
        setShipperLoc({
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
        });
      }
    });

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [orderId]);

  return {
    order,
    shipperLoc,
    deliveryCoords,
    warehouse,
    loading,
    error,
  };
};
