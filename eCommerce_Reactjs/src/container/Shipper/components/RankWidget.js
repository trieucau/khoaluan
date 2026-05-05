import React from 'react';

const RankWidget = ({ dragHandleClass }) => {
  return (
    <div className="sp-glass-panel" style={{ padding: 12, borderRadius: 16, position: 'relative' }}>
      <div className={dragHandleClass} style={{
        position: 'absolute', top: 5, left: '35%', right: '35%', height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.15)',
        cursor: 'grab'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', fontWeight: 800 }}>XẾ XỊN HẠNG S+</div>
        <div style={{ color: '#fbbf24' }}>
          <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 2.5, marginBottom: 6 }}>
        <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 2.5 }} />
      </div>
      <div style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', color: 'var(--sp-text-dim)', textAlign: 'right' }}>850 / 1000 điểm thưởng</div>
    </div>
  );
};

export default RankWidget;
