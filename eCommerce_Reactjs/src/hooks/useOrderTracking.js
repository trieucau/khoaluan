// useOrderTracking.js
import { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { getDetailOrder, getOrderShipperLocation } from '../services/userService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

export const useOrderTracking = (orderId) => {
  const socketRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [shipperLoc, setShipperLoc] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
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

        if (orderRes?.errCode === 0) {
          setOrder(orderRes.data);

          if (orderRes.data.addressUser?.lat && orderRes.data.addressUser?.lng) {
            setDeliveryCoords({
              lat: parseFloat(orderRes.data.addressUser.lat),
              lng: parseFloat(orderRes.data.addressUser.lng),
            });
          }
        } else {
          setError('Không tìm thấy đơn hàng');
        }

        if (locRes?.errCode === 0) {
          setShipperLoc({
            lat: parseFloat(locRes.data.lat),
            lng: parseFloat(locRes.data.lng),
          });
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
      if (data?.orderId === parseInt(orderId)) {
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
    loading,
    error,
  };
};
