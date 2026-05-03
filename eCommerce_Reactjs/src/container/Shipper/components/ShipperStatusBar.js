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
          letterSpacing: '0.02em' 
        }}>
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
        overflow: 'hidden'
      }}>
        <div className="sp-ticker-wrap">
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
        textAlign: 'right', flexShrink: 0
      }}>
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
