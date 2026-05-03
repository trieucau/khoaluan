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
        <div style={{ fontSize: 'clamp(12px, 1.1vw, 15px)' }}>🏆</div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 2.5, marginBottom: 6 }}>
        <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 2.5 }} />
      </div>
      <div style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', color: 'var(--sp-text-dim)', textAlign: 'right' }}>850 / 1000 điểm thưởng</div>
    </div>
  );
};

export default RankWidget;
