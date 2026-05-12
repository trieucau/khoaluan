import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { loadMessage } from '../../services/userService';
import moment from 'moment';
import '../../css/user-pages.css';

const host = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 10;

function ChatWindow({ roomId, userId, onBack }) {
  const [mess, setMess] = useState([]);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState({});
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(LIMIT);
  const boxChatRef = useRef(null);
  const socketRef = useRef();
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (boxChatRef.current) {
        boxChatRef.current.scrollTop = boxChatRef.current.scrollHeight;
      }
    }, 80);
  };

  const fetchMessage = async (loadMore = false) => {
    const currentOffset = loadMore ? offset : 0;
    const res = await loadMessage(roomId, userId, LIMIT, currentOffset);
    if (res?.data) {
      if (loadMore) {
        setMess((prev) => [...res.data, ...prev]);
        setOffset((prev) => prev + LIMIT);
      } else {
        setMess(res.data);
        setOffset(LIMIT);
        scrollToBottom();
      }
      setHasMore(res.data.length === LIMIT);
    }
  };

  useEffect(() => {
    // Get local user
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData || {});

    // Connect socket
    socketRef.current = socketIOClient.connect(host);

    if (roomId) {
      socketRef.current.emit('joinRoom', roomId);
      fetchMessage();
    }

    // Clear old listener before adding new
    socketRef.current.off('sendDataServer');
    socketRef.current.on('sendDataServer', () => {
      fetchMessage();
    });

    return () => {
      if (roomId) socketRef.current.emit('leaveRoom', roomId);
      socketRef.current.off('sendDataServer');
      socketRef.current.disconnect();
    };
  }, [roomId]); // re-run when roomId changes — THIS is the bug fix

  const sendMessage = () => {
    if (!message.trim()) return;
    const msg = {
      text: message.trim(),
      userId: user?.id,
      roomId,
      userData: user,
    };
    socketRef.current.emit('sendDataClient', msg);
    setMessage('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--ap-bg)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--ap-border)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back button (mostly for mobile, but fine to always show or conditionally show) */}
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ap-text-muted)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '4px 8px',
              marginLeft: -8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'var(--ap-transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ap-surface2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ←
          </button>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--ap-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Hỗ trợ khách hàng
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--ap-success)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--ap-success)',
                  display: 'inline-block',
                  boxShadow: '0 0 8px var(--ap-success)',
                }}
              />
              Phản hồi ngay lập tức
            </div>
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}
        >
          💬
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={boxChatRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button
              onClick={() => fetchMessage(true)}
              style={{
                background: 'var(--ap-surface)',
                border: '1px solid var(--ap-border)',
                color: 'var(--ap-text-muted)',
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'var(--ap-transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ap-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ap-text-muted)')}
            >
              ⟳ Tải tin nhắn cũ hơn
            </button>
          </div>
        )}

        {mess.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--ap-text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👋</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Chưa có tin nhắn nào</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Hãy gửi lời chào đến khách hàng!</div>
          </div>
        )}

        {mess.map((item, index) => {
          if (!item.userData) return null;
          const isMine = item.userData.id === user?.id;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {!isMine && (
                <img
                  src={
                    item.userData.image ||
                    'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'
                  }
                  alt={item.userData.firstName}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--ap-border)',
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    padding: '0 4px',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ap-text-muted)' }}>
                    {isMine ? 'Bạn' : `${item.userData.firstName} ${item.userData.lastName}`}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--ap-text-dim)' }}>
                    {moment(item.createdAt).format('HH:mm')}
                  </span>
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#1e293b',
                    color: isMine ? '#ffffff' : '#e2e8f0',
                    fontSize: 14,
                    lineHeight: 1.4,
                    boxShadow: isMine
                      ? '0 4px 12px rgba(59,130,246,0.2)'
                      : '0 2px 6px rgba(0,0,0,0.1)',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--ap-surface)',
          borderTop: '1px solid var(--ap-border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--ap-bg)',
            border: '1px solid var(--ap-border)',
            borderRadius: 24,
            padding: '6px 6px 6px 16px',
            transition: 'border 0.2s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ap-primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--ap-border)')}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--ap-text)',
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              padding: '6px 0',
              maxHeight: 100,
              fontFamily: 'inherit',
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: message.trim() ? 'var(--ap-primary)' : 'var(--ap-surface2)',
              color: message.trim() ? '#fff' : 'var(--ap-text-dim)',
              border: 'none',
              cursor: message.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
