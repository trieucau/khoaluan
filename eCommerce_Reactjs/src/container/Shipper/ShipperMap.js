import React, { useEffect, useRef, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { getAllOrdersByShipper } from '../../services/userService';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:6969';

const ShipperMap = () => {
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const [orderIds, setOrderIds] = useState([]);
  const [sending, setSending] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;
  const token = localStorage.getItem('token');

  const fetchS5OrderIds = async () => {
    if (!shipperId) return [];
    try {
      const res = await getAllOrdersByShipper({ shipperId, status: 'working' });
      if (res && res.errCode === 0 && res.data) {
        return res.data.map((o) => o.id);
      }
    } catch (e) {
      console.error('check fetchS5OrderIds');
    }
    return [];
  };

  useEffect(() => {
    let mounted = true;
    const connect = () => {
      socketRef.current = socketIOClient.connect(BACKEND_URL, {
        transports: ['websocket', 'polling'],
      });
    };
    connect();

    const load = async () => {
      const ids = await fetchS5OrderIds();
      if (mounted) setOrderIds(ids);
    };
    load();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [shipperId]);

  const startSendingLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS.');
      return;
    }
    if (orderIds.length === 0) {
      toast.info('Bạn chưa có đơn nào đang giao (S5). Vị trí vẫn sẽ được gửi lên server.');
    }
    setSending(true);
    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('shipper:location', {
              shipperId,
              lat,
              lng,
              orderIds,
            });
          }
        },
        () => toast.warning('Không lấy được vị trí.')
      );
    };
    send();
    intervalRef.current = setInterval(send, 5000);
  };

  const stopSendingLocation = () => {
    setSending(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Bản đồ giao hàng</h1>
      <p className="mb-3 text-muted">
        #Đơn đang giao: {orderIds.length} đơn. <br /> #Mã đơn:{' '}
        {orderIds.length ? orderIds.join(', ') : '—'}
      </p>
      <div className="mb-3">
        {!sending ? (
          <button className="btn btn-success" onClick={startSendingLocation}>
            Bật gửi vị trí (mỗi 5s)
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopSendingLocation}>
            Tắt gửi vị trí
          </button>
        )}
      </div>
      <div
        id="shipper-map-container"
        style={{ height: 400, background: '#e9ecef', borderRadius: 8 }}
        className="d-flex align-items-center justify-content-center"
      >
        <span className="text-muted">
          Bản đồ (Leaflet) có thể tích hợp tại đây. Hiện tại vị trí đã được gửi lên server khi bật
          nút trên.
        </span>
      </div>
    </div>
  );
};

export default ShipperMap;
