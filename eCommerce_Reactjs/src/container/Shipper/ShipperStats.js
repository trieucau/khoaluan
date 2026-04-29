import React, { useEffect, useRef, useState } from 'react';
import { getAllOrdersByShipper } from '../../services/userService';
import moment from 'moment';

const STATUS = {
  S4: { label: 'Chờ lấy hàng', color: '#f59e0b', icon: '📦' },
  S5: { label: 'Đang giao',    color: '#3b82f6', icon: '🚚' },
  S6: { label: 'Đã giao',     color: '#10b981', icon: '✅' },
  S7: { label: 'Đã hủy',      color: '#ef4444', icon: '🚫' },
  S8: { label: 'Giao thất bại',color: '#ef4444', icon: '❌' },
};

/* ── animated counter ── */
const Counter = ({ to, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let cur = 0; const step = Math.ceil(to / 30);
    const t = setInterval(() => { cur = Math.min(cur + step, to); setVal(cur); if (cur >= to) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}{suffix}</>;
};

/* ── donut chart via canvas ── */
const DonutChart = ({ data, total }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 160;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, R = 62, r = 40;
    ctx.clearRect(0, 0, size, size);
    if (!data.length) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155'; ctx.lineWidth = R - r; ctx.stroke();
      return;
    }
    let start = -Math.PI / 2;
    data.forEach(({ value, color }) => {
      const angle = (value / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, start + angle);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      start += angle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b'; ctx.fill();
  }, [data, total]);
  return <canvas ref={ref} />;
};

/* ── bar chart via canvas ── */
const BarChart = ({ labels, values, color = '#3b82f6' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 320, H = 160;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...values, 1);
    const pad = 28, barW = Math.max(8, (W - pad * 2) / labels.length - 6);
    const gap = (W - pad * 2 - barW * labels.length) / (labels.length - 1 || 1);
    labels.forEach((lbl, i) => {
      const x = pad + i * (barW + gap);
      const bh = ((values[i] || 0) / max) * (H - 40);
      const y = H - 20 - bh;
      const grad = ctx.createLinearGradient(0, y, 0, H - 20);
      grad.addColorStop(0, color); grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      const rx = 4;
      ctx.beginPath();
      ctx.moveTo(x + rx, y); ctx.lineTo(x + barW - rx, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + rx);
      ctx.lineTo(x + barW, H - 20); ctx.lineTo(x, H - 20);
      ctx.lineTo(x, y + rx); ctx.quadraticCurveTo(x, y, x + rx, y); ctx.fill();
      ctx.fillStyle = '#64748b'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x + barW / 2, H - 6);
      if (values[i]) { ctx.fillStyle = '#94a3b8'; ctx.fillText(values[i], x + barW / 2, y - 4); }
    });
  }, [labels, values, color]);
  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} />;
};

/* ── main component ── */
const ShipperStats = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // week | month | all
  const { id: shipperId, firstName } = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    if (!shipperId) { setLoading(false); return; }
    getAllOrdersByShipper({ shipperId })
      .then(r => setOrders(r?.errCode === 0 ? r.data || [] : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shipperId]);

  /* ── filter by period ── */
  const filtered = orders.filter(o => {
    if (period === 'all') return true;
    const days = period === 'week' ? 7 : 30;
    return moment(o.createdAt).isAfter(moment().subtract(days, 'days'));
  });

  /* ── derived stats ── */
  const done    = filtered.filter(o => o.statusId === 'S6').length;
  const active  = filtered.filter(o => o.statusId === 'S5').length;
  const waiting = filtered.filter(o => o.statusId === 'S4').length;
  const failed  = filtered.filter(o => ['S7','S8'].includes(o.statusId)).length;
  const total   = filtered.length;
  const rate    = total ? Math.round((done / total) * 100) : 0;

  /* donut data */
  const donutData = Object.entries(STATUS).map(([key, s]) => ({
    label: s.label, color: s.color, value: filtered.filter(o => o.statusId === key).length,
  })).filter(d => d.value > 0);

  /* bar chart — last 7 days */
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = moment().subtract(6 - i, 'days');
    return { label: d.format('DD/M'), count: orders.filter(o => moment(o.createdAt).isSame(d, 'day') && o.statusId === 'S6').length };
  });

  /* streaks */
  const sortedDone = orders.filter(o => o.statusId === 'S6').sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt));
  const thisMonth  = orders.filter(o => moment(o.createdAt).isSame(moment(), 'month') && o.statusId === 'S6').length;
  const lastMonth  = orders.filter(o => moment(o.createdAt).isSame(moment().subtract(1,'month'), 'month') && o.statusId === 'S6').length;
  const trend = thisMonth > lastMonth ? '📈 Tốt hơn tháng trước' : thisMonth < lastMonth ? '📉 Ít hơn tháng trước' : '➡️ Tương đương tháng trước';

  const STATS = [
    { icon: '📦', label: 'Tổng đơn', value: total, color: '#6366f1' },
    { icon: '✅', label: 'Đã giao',  value: done,  color: '#10b981' },
    { icon: '🚚', label: 'Đang giao',value: active, color: '#3b82f6' },
    { icon: '❌', label: 'Thất bại', value: failed, color: '#ef4444' },
  ];

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-header-row">
          <div>
            <div className="sp-page-title">📊 Thống kê của {firstName || 'bạn'}</div>
            <div className="sp-page-subtitle">Theo dõi hiệu suất giao hàng realtime</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['week','7 ngày'],['month','30 ngày'],['all','Tất cả']].map(([k,lbl]) => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`sp-btn sp-btn-sm ${period===k ? 'sp-btn-primary' : 'sp-btn-ghost'}`}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="sp-stats-grid" style={{ marginBottom:20 }}>
        {STATS.map((s,i) => (
          <div key={i} className="sp-stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ width:44,height:44,borderRadius:12,background:`${s.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:26,fontWeight:800,color:s.color,lineHeight:1 }}>
                {loading ? '—' : <Counter to={s.value} />}
              </div>
              <div className="sp-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Success rate + donut */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Rate card */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">🎯 Tỉ lệ thành công</span></div>
          <div className="sp-card-body" style={{ textAlign:'center', padding:'24px 20px' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" strokeWidth="14"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*50}`}
                  strokeDashoffset={`${2*Math.PI*50*(1-rate/100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition:'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontSize:22,fontWeight:800,color:'#f1f5f9' }}>{rate}%</span>
                <span style={{ fontSize:10,color:'#64748b' }}>thành công</span>
              </div>
            </div>
            <div style={{ marginTop:12,fontSize:13,color:'#94a3b8' }}>{trend}</div>
            <div style={{ marginTop:6,fontSize:12,color:'#64748b' }}>{thisMonth} đơn tháng này</div>
          </div>
        </div>

        {/* Donut */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">🗂️ Phân loại đơn</span></div>
          <div className="sp-card-body" style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'16px 14px' }}>
            <DonutChart data={donutData} total={total || 1} />
            <div style={{ width:'100%',display:'flex',flexDirection:'column',gap:5 }}>
              {donutData.map((d,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,fontSize:11 }}>
                  <div style={{ width:10,height:10,borderRadius:3,background:d.color,flexShrink:0 }} />
                  <span style={{ flex:1,color:'#94a3b8',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{d.label}</span>
                  <span style={{ fontWeight:700,color:'#f1f5f9' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart — delivered per day */}
      <div className="sp-card" style={{ marginBottom:16 }}>
        <div className="sp-card-header">
          <span className="sp-card-title">📅 Đơn giao thành công — 7 ngày gần đây</span>
        </div>
        <div className="sp-card-body" style={{ padding:'16px 20px 12px' }}>
          <BarChart labels={last7.map(d=>d.label)} values={last7.map(d=>d.count)} color="#10b981" />
        </div>
      </div>

      {/* Performance highlights */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { icon:'🏆', label:'Tháng này', value: thisMonth + ' đơn', sub:'hoàn thành' },
          { icon:'📅', label:'Tháng trước', value: lastMonth + ' đơn', sub:'hoàn thành' },
          { icon:'⚡', label:'Hôm nay', value: orders.filter(o=>moment(o.updatedAt).isSame(moment(),'day')&&o.statusId==='S6').length + ' đơn', sub:'đã giao' },
        ].map((h,i) => (
          <div key={i} className="sp-card" style={{ textAlign:'center' }}>
            <div className="sp-card-body" style={{ padding:'16px 10px' }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{h.icon}</div>
              <div style={{ fontSize:11,color:'#64748b',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px' }}>{h.label}</div>
              <div style={{ fontSize:18,fontWeight:800,color:'#f1f5f9' }}>{h.value}</div>
              <div style={{ fontSize:11,color:'#94a3b8' }}>{h.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent timeline */}
      <div className="sp-card">
        <div className="sp-card-header"><span className="sp-card-title">⏱ Lịch sử gần đây</span></div>
        <div>
          {loading ? (
            <div style={{ padding:20 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ display:'flex',gap:12,marginBottom:14,alignItems:'center' }}>
                  <div className="sp-skeleton" style={{ width:36,height:36,borderRadius:'50%',flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div className="sp-skeleton sp-skeleton-text" style={{ width:'60%' }} />
                    <div className="sp-skeleton sp-skeleton-text" style={{ width:'40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="sp-empty" style={{ padding:'40px 24px' }}>
              <div className="sp-empty-icon">📊</div>
              <div className="sp-empty-title">Chưa có dữ liệu</div>
              <div className="sp-empty-desc">Hãy nhận và giao đơn để xem thống kê</div>
            </div>
          ) : (
            [...filtered].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,8).map((o,i) => {
              const s = STATUS[o.statusId] || { label: o.statusId, color:'#64748b', icon:'❓' };
              return (
                <div key={o.id} className="sp-row-enter" style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom: i<7 ? '1px solid rgba(51,65,85,0.5)':'none',animationDelay:`${i*40}ms` }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:`${s.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>{s.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:'#f1f5f9' }}>Đơn #{o.id}</div>
                    <div style={{ fontSize:11,color:'#64748b',marginTop:2 }}>{moment(o.updatedAt).fromNow()}</div>
                  </div>
                  <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:50,background:`${s.color}22`,color:s.color,whiteSpace:'nowrap' }}>{s.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipperStats;
