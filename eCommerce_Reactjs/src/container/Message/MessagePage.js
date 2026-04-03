import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import MessageDisscution from './MessageDisscution';
import './MessagePage.scss';
import { createNewRoom, listRoomOfUser } from '../../services/userService';
import socketIOClient from 'socket.io-client';

function MessagePage(props) {
  const [dataRoom, setdataRoom] = useState([]);
  const [selectedRoom, setselectedRoom] = useState('');
  const [dataUser, setdataUser] = useState({});
  const host = process.env.REACT_APP_BACKEND_URL;
  const socketRef = useRef();
  const [id, setId] = useState();
  useEffect(() => {
    socketRef.current = socketIOClient.connect(host);
    const userData = JSON.parse(localStorage.getItem('userData'));
    setdataUser(userData);
    if (!userData) return;
    socketRef.current.on('getId', (data) => {
      setId(data);
    });
    let initRoom = async () => {
      await createNewRoom({ userId1: userData.id });
      fetchListRoom(userData.id);
    };
    initRoom();
    socketRef.current.off('sendDataServer');
    socketRef.current.off('loadRoomServer');

    socketRef.current.on('sendDataServer', () => {
      fetchListRoom(userData.id);
    });
    socketRef.current.on('loadRoomServer', () => {
      fetchListRoom(userData.id);
    });
    return () => {
      socketRef.current.off('sendDataServer');
      socketRef.current.off('loadRoomServer');
      socketRef.current.disconnect();
    };
  }, []);
  let handleClickRoom = (roomId) => {
    if (selectedRoom) {
      socketRef.current.emit('leaveRoom', selectedRoom); // rời room cũ
    }
    socketRef.current.emit('joinRoom', roomId); // vào room mới
    socketRef.current.emit('loadRoomClient', { roomId });
    setselectedRoom(roomId);
  };
  let fetchListRoom = async (userId) => {
    let res = await listRoomOfUser(userId);
    if (res && res.errCode === 0) {
      setdataRoom(res.data);
    }
  };
  return (
    <div className="container rounded bg-white mt-5 mb-5">
      <div className="row">
        <MessageDisscution
          userId={dataUser.id}
          isAdmin={false}
          handleClickRoom={handleClickRoom}
          data={dataRoom}
        />
        {selectedRoom ? <ChatWindow userId={dataUser.id} roomId={selectedRoom} /> : ''}
      </div>
    </div>
  );
}

export default MessagePage;
