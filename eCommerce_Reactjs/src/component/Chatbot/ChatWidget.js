// src/component/Chatbot/ChatWidget.js
import React, { useState, useRef, useEffect } from 'react';
import useChatbot from '../../hooks/useChatbot';
import './ChatWidget.scss';

// ── Bubble trigger ──────────────────────────────────────────
const ChatBubble = ({ isOpen, onClick, hasUnread }) => (
  <button
    className={`chat-bubble ${isOpen ? 'chat-bubble--open' : ''}`}
    onClick={onClick}
    aria-label="Mở chatbot"
  >
    {!isOpen ? (
      <>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" />
        </svg>
        {hasUnread && <span className="chat-bubble__dot" />}
      </>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )}
  </button>
);

// ── Single message bubble ───────────────────────────────────
const MessageBubble = ({ message }) => {
  console.log('MESSAGE:', message);
  console.log('CONTENT:', message.content);
  const isUser = message.role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--bot'}`}>
      {!isUser && <div className="chat-msg__avatar">AI</div>}
      <div className="chat-msg__bubble">
        {/* Hiển thị xuống dòng */}
        {message.content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < message.content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
        {message.isStreaming && <span className="chat-msg__cursor" />}
      </div>
    </div>
  );
};

// Quick suggestions — no emojis per design requirement
const QUICK_ACTIONS = ['Kiểm tra đơn hàng', 'Gợi ý sản phẩm', 'Mã giảm giá', 'Chính sách đổi trả'];

// ── Main Chat Window ────────────────────────────────────────
const ChatWindow = ({ onClose }) => {
  const { messages, isLoading, toolStatus, sendMessage, stopStreaming, clearHistory } =
    useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log('>>>>>>>>>check messages 1:', messages);
  }, [messages, toolStatus]);

  // Focus input khi mở
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  console.log('>>>>>>>>>check messages 2:', messages);
  const showQuickActions = messages.length === 1; // chỉ có welcome

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window__header">
        <div className="chat-window__header-info">
          <div className="chat-window__avatar">AI</div>
          <div>
            <p className="chat-window__title">Trợ lý Shop</p>
            <p className="chat-window__status">
              {isLoading ? toolStatus || 'Đang trả lời...' : 'Trực tuyến'}
            </p>
          </div>
        </div>
        <div className="chat-window__actions">
          <button onClick={clearHistory} className="chat-window__btn" title="Cuộc hội thoại mới">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={onClose} className="chat-window__btn" title="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-window__messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Tool status indicator */}
        {toolStatus && (
          <div className="chat-tool-status">
            <span className="chat-tool-status__dot" />
            <span className="chat-tool-status__dot chat-tool-status__dot--2" />
            <span className="chat-tool-status__dot chat-tool-status__dot--3" />
            <span>{toolStatus}</span>
          </div>
        )}

        {/* Quick action chips */}
        {showQuickActions && (
          <div className="chat-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                className="chat-quick-actions__chip"
                onClick={() => sendMessage(action.replace(/^[^\s]+\s/, ''))}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-window__footer">
        <textarea
          ref={inputRef}
          className="chat-window__input"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />
        {isLoading ? (
          <button className="chat-window__send chat-window__send--stop" onClick={stopStreaming}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            className={`chat-window__send ${input.trim() ? 'chat-window__send--active' : ''}`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ── Root Widget ─────────────────────────────────────────────
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem('token');

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Chỉ hiện với customer R2
  if (!token || userData.roleId !== 'R2') return null;

  return (
    <div className="chat-widget">
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <ChatBubble isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
    </div>
  );
};

export default ChatWidget;
