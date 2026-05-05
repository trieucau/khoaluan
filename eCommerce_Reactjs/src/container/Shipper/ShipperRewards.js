import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { getAllOrdersByShipper } from '../../services/userService';

// --- CONSTANTS ---
const TIER_CONFIG = [
  { min: 95, label: 'Bạch Kim (Legend)', next: 'Hết cấp', color: 'cyan', icon: '🏆' },
  { min: 90, label: 'Kim Cương (S+)', next: 'Bạch Kim', color: 'blue', icon: '💎' },
  { min: 80, label: 'Vàng (S)', next: 'Kim Cương', color: 'amber', icon: '🥇' },
  { min: 70, label: 'Bạc (A)', next: 'Vàng', color: 'green', icon: '🥈' },
  { min: 0, label: 'Đồng (B)', next: 'Bạc', color: 'red', icon: '🥉' },
];

const REWARDS = [
  { id: 1, title: 'Thẻ nạp điện thoại 50k', cost: 500, type: 'Card', icon: '📱', color: 'blue' },
  { id: 2, title: 'Voucher giảm giá 10%', cost: 300, type: 'Voucher', icon: '🎫', color: 'amber' },
  { id: 3, title: 'Voucher xăng xe 100k', cost: 1000, type: 'Gas', icon: '⛽', color: 'green' },
  { id: 4, title: 'Áo khoác Shipper Pro', cost: 2500, type: 'Gear', icon: '🧥', color: 'cyan' },
];

const ShipperRewards = () => {
  const [tab, setTab] = useState('redeem');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPoints: 0,
    lifetimePoints: 0,
    score: 0,
    currentTier: null,
    history: []
  });

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  const loadData = useCallback(async () => {
    if (!shipperId) return;
    setLoading(true);
    try {
      const res = await getAllOrdersByShipper({ shipperId });
      if (res?.errCode === 0) {
        const orders = res.data || [];
        
        // 1. Calculate Reliability Score (70% Completion, 30% Success/Fail Ratio)
        const total = orders.length;
        const completed = orders.filter(o => o.statusId === 'S6').length;
        const failed = orders.filter(o => o.statusId === 'S8').length;
        
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const successRate = (completed + failed) > 0 ? (completed / (completed + failed)) * 100 : 0;
        const score = Math.max(0, Math.min(100, Math.round(completionRate * 0.7 + successRate * 0.3)));

        // 2. Points Logic: 10 points per completed order + (score * 5) bonus
        const currentPoints = (completed * 10) + (score * 5); 
        
        // 3. Determine Tier
        const tier = TIER_CONFIG.find(t => score >= t.min) || TIER_CONFIG[TIER_CONFIG.length - 1];

        // 4. Build History (Latest 10 orders)
        const history = orders.slice(0, 10).map(o => ({
          id: o.id,
          title: `Hoàn thành đơn #${o.id}`,
          points: o.statusId === 'S6' ? 10 : 0,
          type: 'earn',
          date: o.updatedAt
        }));

        setStats({
          totalPoints: currentPoints,
          lifetimePoints: currentPoints + 500, // Mocking some spent points for UI
          score,
          currentTier: tier,
          history
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="sp-page">
      <div className="sp-skeleton" style={{ height: 40, width: 300, marginBottom: 20 }} />
      <div className="sp-skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 28 }} />
      <div className="sp-skeleton" style={{ height: 40, width: '100%', marginBottom: 20 }} />
      <div className="sp-stats-grid">
        {[1, 2, 3].map(i => <div key={i} className="sp-skeleton" style={{ height: 200, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  const { totalPoints, score, currentTier, history } = stats;
  const nextGoal = TIER_CONFIG.find(t => t.next === currentTier?.label) || { min: 100 };
  const progressPct = score; // Use score directly as progress percentage for simplicity

  return (
    <div className="sp-page" style={{ paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">
          <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
          Chương trình thưởng
        </div>
        <div className="sp-page-subtitle">Tích lũy điểm thưởng từ mỗi đơn hàng và đổi những phần quà giá trị</div>
      </div>

      <div className="sp-card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, background: 'var(--sp-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(40px)' }} />
        
        <div className="sp-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 13, color: 'var(--sp-text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Điểm hiện tại</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalPoints.toLocaleString()}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--sp-primary-light)' }}>ĐIỂM</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--sp-text-muted)' }}>
              Độ tin cậy: <span style={{ color: score > 80 ? 'var(--sp-success)' : 'var(--sp-warning)', fontWeight: 700 }}>{score}%</span>
            </div>
          </div>

          <div style={{ flex: '2 1 300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <span className={`sp-badge sp-badge-${currentTier?.color || 'blue'}`} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8 }}>
                  {currentTier?.icon} Hạng {currentTier?.label}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--sp-text-dim)', fontWeight: 700 }}>HẠNG KẾ TIẾP</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{currentTier?.next}</div>
              </div>
            </div>
            
            <div className="sp-progress-wrap" style={{ margin: '8px 0' }}>
              <div className="sp-progress-bar" style={{ height: 10, borderRadius: 5 }}>
                <div className="sp-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: 'var(--sp-text-dim)' }}>Hiệu suất hiện tại: {score}%</span>
                <span style={{ color: 'var(--sp-primary-light)' }}>{progressPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="sp-tabs" style={{ maxWidth: 500 }}>
          <button className={`sp-tab${tab === 'redeem' ? ' active' : ''}`} onClick={() => setTab('redeem')}>
            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>
            <span>Đổi quà</span>
          </button>
          <button className={`sp-tab${tab === 'perks' ? ' active' : ''}`} onClick={() => setTab('perks')}>
            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <span>Đặc quyền</span>
          </button>
          <button className={`sp-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Lịch sử</span>
          </button>
        </div>
      </div>

      <div className="sp-tab-content">
        {tab === 'redeem' && (
          <div className="sp-quick-grid">
            {REWARDS.map(r => (
              <div key={r.id} className={`sp-card sp-reward-card ${r.color}`} style={{ padding: 20, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{r.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--sp-text-muted)', marginBottom: 16 }}>Loại: {r.type}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--sp-primary-light)' }}>{r.cost} <span style={{ fontSize: 11 }}>ĐIỂM</span></div>
                  <button className="sp-btn sp-btn-sm sp-btn-primary" style={{ borderRadius: 8 }}>Đổi ngay</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'perks' && (
          <div className="sp-card">
            <div className="sp-card-header">
              <div className="sp-card-title">Đặc quyền hạng {currentTier?.label}</div>
            </div>
            <div className="sp-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {[
                { label: 'Ưu tiên nhận đơn xa', min: 0 },
                { label: 'Giảm 5% phí dịch vụ', min: 70 },
                { label: 'Hỗ trợ kỹ thuật 24/7', min: 80 },
                { label: 'Thanh toán hỏa tốc', min: 90 },
                { label: 'Thưởng nóng 2% doanh thu', min: 95 }
              ].map((p, idx) => {
                const isActive = score >= p.min;
                return (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, padding: 16, 
                    background: isActive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    opacity: isActive ? 1 : 0.5
                  }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: isActive ? 'var(--sp-success)' : 'var(--sp-text-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      {isActive ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#fff' : 'var(--sp-text-dim)' }}>{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="sp-card">
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Nội dung</th>
                    <th style={{ width: 120 }}>Điểm</th>
                    <th style={{ width: 180 }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--sp-text-dim)' }}>Chưa có lịch sử biến động điểm</td></tr>
                  ) : (
                    history.map((h, i) => (
                      <tr key={h.id} className="sp-row-enter" style={{ animationDelay: `${i * 50}ms` }}>
                        <td><div style={{ fontWeight: 600, color: '#fff' }}>{h.title}</div></td>
                        <td><span style={{ fontSize: 15, fontWeight: 800, color: 'var(--sp-success)' }}>+{h.points}</span></td>
                        <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                          {moment(h.date).format('DD/MM/YYYY')} · <span style={{ color: 'var(--sp-text-dim)' }}>{moment(h.date).format('HH:mm')}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sp-reward-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          border-color: var(--sp-primary);
        }
        .sp-reward-card.blue:hover { border-color: #3b82f6; }
        .sp-reward-card.green:hover { border-color: #22c55e; }
        .sp-reward-card.amber:hover { border-color: #f59e0b; }
        .sp-reward-card.red:hover { border-color: #ef4444; }
        .sp-reward-card.cyan:hover { border-color: #06b6d4; }
      `}</style>
    </div>
  );
};


export default ShipperRewards;
