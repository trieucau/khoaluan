import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getAllOrdersByShipper } from '../../services/userService';
import moment from 'moment';

const MetricCard = ({ title, value, unit, color, icon, description }) => (
  <div className="sp-glass-panel sp-metric-card" style={{ padding: '20px', borderRadius: '20px', flex: 1, minWidth: '140px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ padding: 8, borderRadius: 10, background: `${color}15`, color: color }}>
        {icon}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}{unit}</div>
        <div style={{ fontSize: 11, color: 'var(--sp-text-dim)', marginTop: 4 }}>{title}</div>
      </div>
    </div>
    <div style={{ fontSize: 10, color: 'var(--sp-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
      {description}
    </div>
  </div>
);

const ActivityRate = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTime, setActiveTime] = useState('0h 0m');

  const shipperId = JSON.parse(localStorage.getItem('userData') || '{}')?.id;

  const loadData = useCallback(async () => {
    if (!shipperId) return;
    setLoading(true);
    try {
      const res = await getAllOrdersByShipper({ shipperId });
      if (res?.errCode === 0) setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  useEffect(() => {
    loadData();

    // GPS Time Calculation
    const updateTime = () => {
      const isOnline = localStorage.getItem('shipperGPS') === 'true';
      let totalMs = parseInt(localStorage.getItem('gpsTotalMs') || '0', 10);
      const startTime = parseInt(localStorage.getItem('gpsStartTime') || '0', 10);
      const savedDate = localStorage.getItem('gpsDate');

      if (savedDate === new Date().toDateString()) {
        if (isOnline && startTime) {
          totalMs += (Date.now() - startTime);
        }
      } else {
        totalMs = 0; // Reset if different day
      }

      const hours = Math.floor(totalMs / 3600000);
      const mins = Math.floor((totalMs % 3600000) / 60000);
      setActiveTime(`${hours}h ${mins}m`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [loadData]);

  const stats = useMemo(() => {
    if (!orders.length) return { completion: 0, cancellation: 0, success: 0, total: 0, score: 0 };

    const total = orders.length;
    const completed = orders.filter(o => o.statusId === 'S6').length;
    const cancelled = orders.filter(o => o.statusId === 'S7').length;
    const failed = orders.filter(o => o.statusId === 'S8').length;

    const completionRate = Math.round((completed / total) * 100);
    const cancellationRate = Math.round((cancelled / total) * 100);
    const successRate = (completed + failed) > 0 ? Math.round((completed / (completed + failed)) * 100) : 0;

    // Weighted score: 70% completion, 30% success delivery vs failed
    const reliabilityScore = Math.max(0, Math.min(100, Math.round(completionRate * 0.7 + successRate * 0.3)));

    return {
      completion: completionRate,
      cancellation: cancellationRate,
      success: successRate,
      total,
      score: reliabilityScore
    };
  }, [orders]);

  // Simulated Weekly Data (in a real app, this would come from the backend)
  const weeklyData = [
    { day: 'T2', val: 45 }, { day: 'T3', val: 70 }, { day: 'T4', val: 60 },
    { day: 'T5', val: 90 }, { day: 'T6', val: 85 }, { day: 'T7', val: 40 }, { day: 'CN', val: 20 }
  ];

  const rankDetails = useMemo(() => {
    const s = stats.score;
    if (s >= 95) return {
      label: 'Bạch Kim (Legend)',
      color: '#06b6d4',
      badge: 'sp-badge-cyan',
      desc: 'Ưu tiên nhận đơn cao nhất & Thưởng 10% doanh thu'
    };
    if (s >= 90) return {
      label: 'Kim Cương',
      color: '#3b82f6',
      badge: 'sp-badge-blue',
      desc: 'Ưu tiên nhận đơn & Thưởng 5% doanh thu'
    };
    if (s >= 80) return {
      label: 'Hạng Vàng',
      color: '#f59e0b',
      badge: 'sp-badge-amber',
      desc: 'Tài xế chuyên nghiệp, hoạt động ổn định'
    };
    if (s >= 70) return {
      label: 'Hạng Bạc',
      color: '#10b981',
      badge: 'sp-badge-green',
      desc: 'Tài xế tiềm năng, cần cố gắng thêm'
    };
    return {
      label: 'Hạng Đồng',
      color: '#ef4444',
      badge: 'sp-badge-red',
      desc: 'Tỉ lệ hoạt động thấp, cần cải thiện hiệu suất'
    };
  }, [stats.score]);

  return (
    <div className="sp-page" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">
          Tỉ lệ hoạt động
        </div>
        <div className="sp-page-subtitle">Phân tích hiệu suất và độ tin cậy của tài xế</div>
      </div>

      <div className="sp-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Reliability Score Gauge */}
        <div className="sp-glass-panel" style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 24 }}>
          <div className="sp-gauge-container">
            <svg className="sp-gauge-svg" width="200" height="200" viewBox="0 0 100 100">
              <circle className="sp-gauge-bg" cx="50" cy="50" r="45" />
              <circle className="sp-gauge-fill" cx="50" cy="50" r="45"
                stroke={rankDetails.color}
                strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * stats.score / 100)}
                style={{ filter: `drop-shadow(0 0 8px ${rankDetails.color})` }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.score}%</div>
              <div style={{ fontSize: 12, color: 'var(--sp-text-muted)', fontWeight: 600, marginTop: 4 }}>ĐỘ TIN CẬY</div>
            </div>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div className={`sp-badge ${rankDetails.badge}`} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {rankDetails.label}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--sp-text-dim)', maxWidth: 220, lineHeight: 1.5 }}>
              {rankDetails.desc}
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <MetricCard
            title="Tỉ lệ hoàn thành"
            value={stats.completion} unit="%"
            color="#10b981"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
            description="Mục tiêu duy trì trên 90%"
          />
          <MetricCard
            title="Tỉ lệ hủy đơn"
            value={stats.cancellation} unit="%"
            color="#ef4444"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
            description="Tỉ lệ hủy thấp giúp tăng ưu tiên"
          />
          <MetricCard
            title="Thời gian online"
            value={activeTime} unit=""
            color="#3b82f6"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            description="Thời gian hoạt động trong ngày"
          />
          <MetricCard
            title="Tổng đơn hàng"
            value={stats.total} unit=""
            color="#a855f7"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
            description="Số lượng đơn đã tiếp nhận"
          />
        </div>

      </div>

      {/* Weekly Activity Chart */}
      <div className="sp-glass-panel" style={{ marginTop: 24, padding: 24, borderRadius: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg className="sp-icon-sm" style={{ color: 'var(--sp-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
          Biểu đồ hoạt động tuần
        </div>
        <div className="sp-weekly-chart">
          {weeklyData.map((d, i) => (
            <div key={d.day} className="sp-chart-col">
              <div className={`sp-chart-bar${i === 4 ? ' active' : ''}`} style={{ height: `${d.val}%` }}>
                {i === 4 && <div className="sp-chart-bar-val">{d.val}</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--sp-text-muted)', fontWeight: 600 }}>{d.day}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--sp-text-dim)', textAlign: 'center', fontStyle: 'italic' }}>
          Khối lượng đơn hàng tăng mạnh nhất vào Thứ 6 (Peak Day)
        </div>
      </div>

    </div>
  );
};

export default ActivityRate;
