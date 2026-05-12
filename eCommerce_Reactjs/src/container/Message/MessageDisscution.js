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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--ap-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--ap-border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(22,27,34,0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ap-text-muted)',
              fontSize: 13,
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={textSearch}
            onChange={(e) => settextSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: 20,
              background: 'var(--ap-bg)',
              border: '1px solid var(--ap-border)',
              color: 'var(--ap-text)',
              fontSize: 13,
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--ap-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--ap-border)')}
          />
        </div>
      </div>

      {/* Room list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {filteredRooms.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--ap-text-muted)',
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🔍</div>
            {textSearch ? 'Không tìm thấy kết quả' : 'Chưa có tin nhắn nào'}
          </div>
        )}

        {filteredRooms.map((item) => {
          const userData = props.isAdmin ? item.userOneData : item.userTwoData;
          const unreadCount = item.messageData.filter(
            (m) => m.unRead === 1 && m.userId !== props.userId
          ).length;
          const lastMsg =
            item.messageData.length > 0
              ? item.messageData[item.messageData.length - 1].text
              : 'Chưa có tin nhắn';
          const isActive = props.selectedRoom === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleClickRoom(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 4,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))'
                  : 'transparent',
                borderLeft: isActive ? '3px solid var(--ap-primary)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                <img
                  src={
                    userData?.image ||
                    'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'
                  }
                  alt={userData?.firstName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '1px solid var(--ap-border)',
                  }}
                />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -4,
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      border: '2px solid var(--ap-surface)',
                      boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
                      animation: 'apPulse 2s infinite',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontWeight: isActive ? 700 : 600,
                      fontSize: 14,
                      color: isActive ? 'var(--ap-primary-light)' : 'var(--ap-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {userData?.firstName} {userData?.lastName}
                  </div>
                  {item.messageData.length > 0 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: unreadCount > 0 ? '#ef4444' : 'var(--ap-text-dim)',
                        flexShrink: 0,
                        fontWeight: unreadCount > 0 ? 700 : 500,
                      }}
                    >
                      {moment(item.messageData[item.messageData.length - 1].createdAt).format(
                        'HH:mm'
                      )}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: unreadCount > 0 ? '#e2e8f0' : 'var(--ap-text-muted)',
                    fontWeight: unreadCount > 0 ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {lastMsg}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MessageDisscution;
