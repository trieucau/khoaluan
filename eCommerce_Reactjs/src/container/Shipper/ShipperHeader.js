import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ShipperHeader = ({ onToggleSidebar, availableCount }) => {
  const [gpsOn, setGpsOn] = useState(false);

  useEffect(() => {
    // Init GPS state
    const saved = localStorage.getItem('shipperGPS');
    if (saved === 'true') setGpsOn(true);
  }, []);

  const toggleGps = () => {
    const newVal = !gpsOn;
    setGpsOn(newVal);
    localStorage.setItem('shipperGPS', String(newVal));
  };



  return (
    <nav className="sp-header-bar">
      {/* Hamburger */}
      <button className="sp-hamburger" onClick={onToggleSidebar} aria-label="Mở menu">☰</button>

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
          <div className="sp-toggle-wrap" onClick={toggleGps}>
            <span className={`sp-toggle-label ${gpsOn ? 'active' : ''}`}>GPS</span>
            <div className={`sp-toggle ${gpsOn ? 'on' : ''}`}>
              <div className="sp-toggle-knob" />
            </div>
          </div>

          {/* Notification Bell */}
          <Link to="/shipper/orders-available" className="sp-noti-btn" title="Đơn có thể nhận">
            🔔
            {availableCount > 0 && <span className="sp-noti-badge">{availableCount > 99 ? '99+' : availableCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default ShipperHeader;
