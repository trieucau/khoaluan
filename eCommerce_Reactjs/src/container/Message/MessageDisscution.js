import React, { useEffect, useState } from 'react';
import moment from 'moment';
import '../../css/user-pages.css';

function MessageDisscution(props) {
  const [dataRoom, setdataRoom] = useState([]);
  const [textSearch, settextSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    if (props.data) loadRoom(props.data);
  }, [props.data]);

  const loadRoom = (data) => {
    const sorted = [...data].sort((a, b) => {
      const unA = a.messageData.filter((m) => m.unRead === 1).length;
      const unB = b.messageData.filter((m) => m.unRead === 1).length;
      return unB - unA;
    });
    setdataRoom(sorted);
  };

  const handleClickRoom = (roomId) => {
    setSelectedRoom(roomId);
    props.handleClickRoom(roomId);
  };

  // Filter by search
  const filteredRooms = dataRoom.filter((item) => {
    const userData = props.isAdmin ? item.userOneData : item.userTwoData;
    const name = `${userData?.firstName || ''} ${userData?.lastName || ''}`.toLowerCase();
    return name.includes(textSearch.toLowerCase());
  });

  return (
    <div className="messenger-sidebar">
      <div className="messenger-sidebar__header">
        <p className="messenger-sidebar__title">Tin nhắn</p>
        <div className="messenger-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={textSearch}
            onChange={(e) => settextSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="messenger-room-list">
        {filteredRooms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: '#9B8EA4', fontSize: 13 }}>
            {textSearch ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn nào'}
          </div>
        )}

        {filteredRooms.map((item) => {
          const userData = props.isAdmin ? item.userOneData : item.userTwoData;
          const unreadCount = item.messageData.filter(
            (m) => m.unRead === 1 && m.userId !== props.userId
          ).length;
          const lastMsg = item.messageData.length > 0
            ? item.messageData[item.messageData.length - 1].text
            : 'Chưa có tin nhắn';

          return (
            <div
              key={item.id}
              className={`messenger-room-item ${selectedRoom === item.id ? 'active' : ''}`}
              onClick={() => handleClickRoom(item.id)}
            >
              <div className="messenger-room-avatar">
                <img
                  src={userData?.image || 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'}
                  alt={userData?.firstName}
                />
                {unreadCount > 0 && (
                  <span className="messenger-unread-badge">{unreadCount}</span>
                )}
              </div>
              <div className="messenger-room-info">
                <div className="messenger-room-name">
                  {userData?.firstName} {userData?.lastName}
                </div>
                <div className="messenger-room-preview">{lastMsg}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MessageDisscution;
