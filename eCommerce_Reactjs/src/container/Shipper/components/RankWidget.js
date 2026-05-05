import React, { useMemo } from 'react';

const RankWidget = ({ dragHandleClass, score = 0, isMobile }) => {
  const rank = useMemo(() => {
    if (score >= 95) return { label: 'BẠCH KIM (LEGEND)', color: '#06b6d4', target: 1000 };
    if (score >= 90) return { label: 'HẠNG KIM CƯƠNG', color: '#3b82f6', target: 1000 };
    if (score >= 80) return { label: 'HẠNG VÀNG', color: '#f59e0b', target: 1000 };
    if (score >= 70) return { label: 'HẠNG BẠC', color: '#10b981', target: 1000 };
    return { label: 'HẠNG ĐỒNG', color: '#ef4444', target: 1000 };
  }, [score]);

  // Points calculation: score * 10 (simple visualization)
  const points = score * 10;

  return (
    <div className="sp-glass-panel" style={{ 
      padding: isMobile ? '16px' : '12px 16px', 
      borderRadius: 20, 
      position: 'relative',
      background: 'rgba(15, 23, 42, 0.92)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(16px)',
    }}>
      {!isMobile && (
        <div className={dragHandleClass} style={{
          position: 'absolute', top: 5, left: '35%', right: '35%', height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.15)',
          cursor: 'grab'
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 16 : 10, marginTop: isMobile ? 0 : 4 }}>
        <div style={{ 
          width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, borderRadius: 12, 
          background: `linear-gradient(135deg, ${rank.color}22, ${rank.color}44)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: rank.color,
          boxShadow: `0 0 20px ${rank.color}22`
        }}>
          <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55-.47.98-.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: isMobile ? 10 : 9, fontWeight: 900, color: rank.color, letterSpacing: 1 }}>{rank.label}</div>
          <div style={{ fontSize: isMobile ? 13 : 12, fontWeight: 800, color: '#fff' }}>{points} điểm</div>
        </div>
      </div>

      <div style={{ position: 'relative', height: isMobile ? 6 : 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ 
          width: `${score}%`, height: '100%', 
          background: `linear-gradient(90deg, #3b82f6, ${rank.color})`, 
          borderRadius: 10, 
          transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: `0 0 10px ${rank.color}44`
        }} />
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sp-text-dim)' }}>0</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>Mục tiêu: {rank.target}</span>
      </div>
    </div>
  );
};

export default RankWidget;
