import React, { useEffect, useState, useRef } from 'react';
import { listRoomOfAdmin } from '../../../services/userService';
import MessageDisscution from '../../Message/MessageDisscution';
import ChatWindow from '../../Message/ChatWindow';
import socketIOClient from 'socket.io-client';

const Message = () => {
  const [dataUser, setDataUser] = useState({});
  const [dataRoom, setDataRoom] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [socketId, setSocketId] = useState('');
  const socketRef = useRef();
  const host = process.env.REACT_APP_BACKEND_URL;

  const fetchListRoom = async () => {
    const res = await listRoomOfAdmin();
    if (res?.errCode === 0) setDataRoom(res.data);
  };

  useEffect(() => {
    socketRef.current = socketIOClient.connect(host);
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setDataUser(userData);
    socketRef.current.on('getId', data => setSocketId(data));
    fetchListRoom();
    socketRef.current.on('sendDataServer', () => fetchListRoom());
    socketRef.current.on('loadRoomServer', () => fetchListRoom());
    return () => socketRef.current.disconnect();
  }, []);

  const handleClickRoom = (roomId) => {
    socketRef.current.emit('loadRoomClient', { roomId });
    setSelectedRoom(roomId);
  };

  return (
    <div className="ap-page" style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ap-border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ap-surface)' }}>
        <div style={{ fontSize: 20 }}>💬</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Tin nhắn khách hàng</div>
          <div style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>{dataRoom.length} cuộc trò chuyện</div>
        </div>
      </div>

      {/* Chat layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100% - 65px)', overflow: 'hidden' }}>
        {/* Room list */}
        <div style={{ borderRight: '1px solid var(--ap-border)', overflowY: 'auto', background: 'var(--ap-surface)' }}>
          <MessageDisscution
            userId={dataUser.id}
            isAdmin={true}
            handleClickRoom={handleClickRoom}
            data={dataRoom}
          />
        </div>

        {/* Chat window */}
        <div style={{ background: 'var(--ap-bg)', overflow: 'hidden' }}>
          {selectedRoom ? (
            <ChatWindow userId={dataUser.id} roomId={selectedRoom} />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--ap-text-muted)' }}>
              <div style={{ fontSize: 64, opacity: 0.3 }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Chọn cuộc trò chuyện</div>
              <div style={{ fontSize: 13 }}>Nhấn vào một phòng chat bên trái để bắt đầu</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Message;
