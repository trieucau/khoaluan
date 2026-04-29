import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import { loadMessage } from '../../services/userService';
import moment from 'moment';
import '../../css/user-pages.css';

const host = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 15;

function ChatWindow({ roomId, userId }) {
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
    <div className="messenger-chatbox">
      {/* Header */}
      <div className="messenger-chat-header">
        <div>
          <div className="messenger-chat-title">Hỗ trợ Solana Shop</div>
          <div className="messenger-chat-subtitle">Chúng tôi thường phản hồi trong vài phút</div>
        </div>
        <i className="fa-brands fa-facebook-messenger" style={{ color: '#FF6B9D', fontSize: 22 }} />
      </div>

      {/* Messages */}
      <div className="messenger-messages" ref={boxChatRef}>
        {/* Load more */}
        {hasMore && (
          <div className="messenger-load-more">
            <button onClick={() => fetchMessage(true)}>
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 6 }} />
              Tải tin nhắn cũ hơn
            </button>
          </div>
        )}

        {mess.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 'auto', color: '#9B8EA4', fontSize: 13 }}>
            <i className="fa-regular fa-comment-dots" style={{ fontSize: 32, color: '#F0E6EE', display: 'block', marginBottom: 8 }} />
            Hãy bắt đầu cuộc trò chuyện!
          </div>
        )}

        {mess.map((item, index) => {
          if (!item.userData) return null;
          const isMine = item.userData.id === user?.id;
          return (
            <div key={index} className={`msg-row ${isMine ? 'msg-row--mine' : ''}`}>
              <img
                className="msg-avatar"
                src={item.userData.image || 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg'}
                alt={item.userData.firstName}
              />
              <div className="msg-bubble-wrap">
                <span className="msg-sender">
                  {isMine ? 'Bạn' : `${item.userData.firstName} ${item.userData.lastName}`}
                </span>
                <div className={`msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--other'}`}>
                  {item.text}
                </div>
                <span className="msg-time">{moment(item.createdAt).fromNow()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="messenger-input-area">
        <textarea
          ref={textareaRef}
          className="messenger-textarea"
          rows={1}
          placeholder="Nhắn tin... (Enter để gửi, Shift+Enter xuống dòng)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="messenger-send-btn" onClick={sendMessage}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
