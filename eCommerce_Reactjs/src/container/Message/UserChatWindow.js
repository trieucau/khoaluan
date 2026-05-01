import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { loadMessage } from '../../services/userService';
import moment from 'moment';
import '../../css/user-pages.css';

const host = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 10;

function UserChatWindow({ roomId, userId, onBack }) {
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
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData || {});

    socketRef.current = socketIOClient.connect(host);

    if (roomId) {
      socketRef.current.emit('joinRoom', roomId);
      fetchMessage();
    }

    socketRef.current.off('sendDataServer');
    socketRef.current.on('sendDataServer', () => {
      fetchMessage();
    });

    return () => {
      if (roomId) socketRef.current.emit('leaveRoom', roomId);
      socketRef.current.off('sendDataServer');
      socketRef.current.disconnect();
    };
  }, [roomId]);

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
    <div className="messenger-chatbox" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back button */}
          <button onClick={onBack} className="messenger-back-btn">
             ←
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              Hỗ trợ khách hàng
            </div>
            <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Đang hoạt động
            </div>
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          💬
        </div>
      </div>

      {/* Messages Area */}
      <div ref={boxChatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <button onClick={() => fetchMessage(true)} style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => {e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#f8fafc'}} onMouseLeave={e => {e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#ffffff'}}>
              ⟳ Tải tin nhắn cũ hơn
            </button>
          </div>
        )}

        {mess.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>👋</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#475569' }}>Chưa có tin nhắn nào</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Hãy gửi lời chào đến chúng tôi!</div>
          </div>
        )}

        {mess.map((item, index) => {
          if (!item.userData) return null;
          const isMine = item.userData.id === user?.id;
          
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {!isMine && (
                <img
                  src={item.userData.image || 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'}
                  alt={item.userData.firstName}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
                />
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                    {isMine ? 'Bạn' : `${item.userData.firstName} ${item.userData.lastName}`}
                  </span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {moment(item.createdAt).format('HH:mm')}
                  </span>
                </div>
                
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMine ? '#3b82f6' : '#ffffff',
                  color: isMine ? '#ffffff' : '#1e293b',
                  fontSize: 14,
                  lineHeight: 1.4,
                  boxShadow: isMine ? '0 4px 12px rgba(59,130,246,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  border: isMine ? 'none' : '1px solid #e2e8f0',
                  wordBreak: 'break-word'
                }}>
                  {item.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 24, padding: '6px 6px 6px 16px', transition: 'border 0.2s, box-shadow 0.2s' }} 
             onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
             onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
          
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
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#1e293b', fontSize: 14, resize: 'none', outline: 'none', padding: '6px 0', maxHeight: 100, fontFamily: 'inherit' }}
          />
          
          <button 
            onClick={sendMessage}
            disabled={!message.trim()}
            style={{ width: 36, height: 36, borderRadius: '50%', background: message.trim() ? '#3b82f6' : '#e2e8f0', color: message.trim() ? '#fff' : '#94a3b8', border: 'none', cursor: message.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserChatWindow;
