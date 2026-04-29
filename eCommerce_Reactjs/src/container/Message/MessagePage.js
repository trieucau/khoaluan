import React, { useEffect, useState, useRef } from 'react';
import ChatWindow from './ChatWindow';
import MessageDisscution from './MessageDisscution';
import { createNewRoom, listRoomOfUser } from '../../services/userService';
import socketIOClient from 'socket.io-client';
import '../../css/user-pages.css';

function MessagePage() {
  const [dataRoom, setdataRoom] = useState([]);
  const [selectedRoom, setselectedRoom] = useState('');
  const [dataUser, setdataUser] = useState({});
  const host = process.env.REACT_APP_BACKEND_URL;
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIOClient.connect(host);
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;
    setdataUser(userData);

    const initRoom = async () => {
      await createNewRoom({ userId1: userData.id });
      fetchListRoom(userData.id);
    };
    initRoom();

    socketRef.current.off('sendDataServer');
    socketRef.current.off('loadRoomServer');

    socketRef.current.on('sendDataServer', () => fetchListRoom(userData.id));
    socketRef.current.on('loadRoomServer', () => fetchListRoom(userData.id));

    return () => {
      socketRef.current.off('sendDataServer');
      socketRef.current.off('loadRoomServer');
      socketRef.current.disconnect();
    };
  }, []);

  const handleClickRoom = (roomId) => {
    if (selectedRoom && selectedRoom !== roomId) {
      socketRef.current.emit('leaveRoom', selectedRoom);
    }
    socketRef.current.emit('joinRoom', roomId);
    socketRef.current.emit('loadRoomClient', { roomId });
    setselectedRoom(roomId);
  };

  const fetchListRoom = async (userId) => {
    const res = await listRoomOfUser(userId);
    if (res?.errCode === 0) setdataRoom(res.data);
  };

  return (
    <div className="user-page">
      <div className="container-fluid px-0">
        <div className="messenger-layout">
          {/* Sidebar danh sách phòng */}
          <MessageDisscution
            userId={dataUser.id}
            isAdmin={false}
            handleClickRoom={handleClickRoom}
            data={dataRoom}
          />

          {/* Chat window */}
          {selectedRoom ? (
            <ChatWindow userId={dataUser.id} roomId={selectedRoom} />
          ) : (
            <div className="messenger-empty">
              <i className="fa-regular fa-comment-dots" />
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagePage;
