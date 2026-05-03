import React from 'react';

const WeatherWidget = ({ dragHandleClass }) => {
  return (
    <div className="sp-glass-panel" style={{ padding: 12, borderRadius: 16, position: 'relative' }}>
      <div className={dragHandleClass} style={{
        position: 'absolute', top: 5, left: '35%', right: '35%', height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.15)',
        cursor: 'grab'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌦️</div>
        <div>
          <div style={{ fontSize: 'clamp(10px, 0.9vw, 12px)', fontWeight: 700 }}>28°C • Bình Dương</div>
          <div style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', color: 'var(--sp-text-dim)' }}>Trời nhiều mây, ít mưa</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
