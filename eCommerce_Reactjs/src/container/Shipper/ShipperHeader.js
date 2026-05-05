import React from 'react';
import { Link } from 'react-router-dom';

const ShipperHeader = ({ onToggleSidebar, availableCount, isOnline, onToggleGps, onToggleNotifications }) => {
  return (
    <nav className="sp-header-bar">
      {/* Hamburger */}
      <button className="sp-hamburger" onClick={onToggleSidebar} aria-label="Mở menu">
        <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <Link className="sp-logo" to="/shipper" style={{ marginLeft: 8 }}>
        <div className="sp-logo-icon" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
          <img src="/favicon.ico" alt="ShipperHub"
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
        </div>
        <span className="sp-logo-text">ShipperHub</span>
      </Link>

      <div className="sp-header-right">
        <div className="sp-header-actions" style={{ marginRight: 0 }}>
          {/* GPS Toggle */}
          <div className="sp-toggle-wrap" onClick={onToggleGps}>
            <span className={`sp-toggle-label ${isOnline ? 'active' : ''}`}>GPS</span>
            <div className={`sp-toggle ${isOnline ? 'on' : ''}`}>
              <div className="sp-toggle-knob" />
            </div>
          </div>

          {/* Notification Bell */}
          <button className="sp-noti-btn" onClick={onToggleNotifications} title="Đơn có thể nhận">
            <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {availableCount > 0 && <span className="sp-noti-badge">{availableCount > 99 ? '99+' : availableCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ShipperHeader;
