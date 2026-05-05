import React, { useMemo } from 'react';

const RankWidget = ({ dragHandleClass, score = 0 }) => {
  const rank = useMemo(() => {
    if (score >= 95) return { label: 'XẾ XỊN HẠNG S+', color: '#10b981', target: 1000 };
    if (score >= 90) return { label: 'XẾ XỊN HẠNG S', color: '#34d399', target: 1000 };
    if (score >= 80) return { label: 'TÀI XẾ HẠNG A', color: '#3b82f6', target: 1000 };
    if (score >= 70) return { label: 'TÀI XẾ HẠNG B', color: '#f59e0b', target: 1000 };
    return { label: 'HẠNG C (CẢNH BÁO)', color: '#ef4444', target: 1000 };
  }, [score]);

  // Points calculation: score * 10 (simple visualization)
  const points = score * 10;

  return (
    <div className="sp-glass-panel" style={{ padding: 12, borderRadius: 16, position: 'relative' }}>
      <div className={dragHandleClass} style={{
        position: 'absolute', top: 5, left: '35%', right: '35%', height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.15)',
        cursor: 'grab'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <div style={{ fontSize: 'clamp(9px, 0.8vw, 11px)', fontWeight: 800 }}>{rank.label}</div>
        <div style={{ color: rank.color }}>
          <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55-.47.98-.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 2.5, marginBottom: 6 }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, #3b82f6, ${rank.color})`, borderRadius: 2.5, transition: 'width 1s ease' }} />
      </div>
      <div style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', color: 'var(--sp-text-dim)', textAlign: 'right' }}>{points} / {rank.target} điểm tin cậy</div>
    </div>
  );
};

export default RankWidget;
