import React from 'react';

const ShipperStatusBar = ({ isOnline, sessionTimeMs, formatMs, firstName, dailyStats, formatMoney }) => {
  return (
    <section className="sp-float-status" style={{
      position: 'absolute', top: 'clamp(10px, 1.5vw, 24px)', left: '50%', transform: 'translateX(-50%)',
      width: '95%', maxWidth: 1400, zIndex: 1000,
      background: 'none', border: 'none', display: 'flex', 
      gap: 'clamp(8px, 1.2vw, 16px)', alignItems: 'center'
    }}>
      {/* TRÁI: STATUS PILL */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        padding: 'clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 18px)', 
        borderRadius: 100,
        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.6vw, 10px)', 
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)', flexShrink: 0
      }}>
        <div className={`sp-gps-dot ${isOnline ? 'on' : 'off'}`} style={{ 
          width: 'clamp(6px, 0.6vw, 10px)', height: 'clamp(6px, 0.6vw, 10px)', borderRadius: '50%',
          background: isOnline ? '#22c55e' : '#ef4444',
          boxShadow: isOnline ? '0 0 10px #22c55e' : '0 0 10px #ef4444'
        }} />
        <span style={{ 
          color: isOnline ? '#fff' : '#ef4444', 
          fontWeight: 900, 
          fontSize: 'clamp(10px, 1vw, 13px)', 
          letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {isOnline ? formatMs(sessionTimeMs) : 'OFFLINE'}
        </span>
      </div>

      {/* GIỮA: TICKER PILL */}
      <div style={{ 
        flex: 1, background: 'rgba(15, 23, 42, 0.85)', 
        padding: 'clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 24px)', 
        borderRadius: 100,
        border: '1px solid rgba(255,255,255,0.1)', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <svg className="sp-icon-xs" style={{ color: '#fbbf24', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <div className="sp-ticker-wrap" style={{ flex: 1 }}>
          <div className="sp-ticker-content" style={{ 
            fontSize: 'clamp(10px, 0.9vw, 12px)', 
            color: '#fbbf24', 
            fontWeight: 700 
          }}>
            Khu vực Quận 1 (+5k thưởng) • Lưu ý thời tiết mưa tại Quận 7 • Shipper {firstName} đã hoàn thành xuất sắc ca sáng! • Cảnh báo: Đường Nguyễn Huệ đang cấm xe • Chúc bạn một ngày làm việc hiệu quả!
          </div>
        </div>
      </div>

      {/* PHẢI: INCOME PILL */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        padding: 'clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 22px)', 
        borderRadius: 100,
        border: '1px solid rgba(255,255,255,0.1)', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 10,
        textAlign: 'right', flexShrink: 0
      }}>
        <svg className="sp-icon-xs" style={{ color: '#22c55e' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <div style={{ 
          fontSize: 'clamp(12px, 1.4vw, 18px)', 
          fontWeight: 900, 
          color: '#22c55e' 
        }}>
          +{formatMoney(dailyStats.income)}
        </div>
      </div>
    </section>
  );
};

export default ShipperStatusBar;
