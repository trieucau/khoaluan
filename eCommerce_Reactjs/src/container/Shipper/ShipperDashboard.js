import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrdersByShipper } from '../../services/userService';
import moment from 'moment';

const STATUS_LABEL = { S4: 'Chờ lấy hàng', S5: 'Đang giao', S6: 'Đã giao', S7: 'Đã hủy', S8: 'Giao thất bại' };
const STATUS_BADGE = { S4: 'sp-badge-amber', S5: 'sp-badge-blue', S6: 'sp-badge-green', S7: 'sp-badge-red', S8: 'sp-badge-red' };

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

const ShipperDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;
  const firstName = userData?.firstName || 'Shipper';

  useEffect(() => {
    if (!shipperId) { setLoading(false); return; }
    getAllOrdersByShipper({ shipperId })
      .then((res) => { if (res?.errCode === 0) setOrders(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shipperId]);

  const today = moment().format('YYYY-MM-DD');
  const todayOrders = orders.filter((o) => moment(o.createdAt).format('YYYY-MM-DD') === today);
  const activeOrders = orders.filter((o) => o.statusId === 'S5');
  const doneOrders = orders.filter((o) => o.statusId === 'S6');
  const recent = [...orders].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  const STATS = [
    { icon: '📦', label: 'Đơn hôm nay', value: todayOrders.length, color: 'blue' },
    { icon: '🚚', label: 'Đang giao', value: activeOrders.length, color: 'cyan' },
    { icon: '✅', label: 'Đã hoàn thành', value: doneOrders.length, color: 'green' },
    { icon: '📋', label: 'Tổng đơn', value: orders.length, color: 'amber' },
  ];

  const QUICK = [
    { to: '/shipper/orders-available', icon: '📋', title: 'Đơn có thể nhận', desc: 'Xem và nhận các đơn đang chờ shipper.', color: 'blue' },
    { to: '/shipper/my-orders', icon: '📦', title: 'Đơn của tôi', desc: 'Quản lý đơn đã nhận: bắt đầu giao, hoàn thành, hủy.', color: 'cyan' },
    { to: '/shipper/map', icon: '🗺️', title: 'Bản đồ giao hàng', desc: 'Bật GPS và theo dõi tuyến đường realtime.', color: 'green' },
  ];

  return (
    <div className="sp-page">
      {/* Welcome */}
      <div className="sp-page-header">
        <div className="sp-page-title">Xin chào, {firstName}! 👋</div>
        <div className="sp-page-subtitle">{moment().format('dddd, DD/MM/YYYY')} — Chúc bạn giao hàng thuận lợi.</div>
      </div>

      {/* Stats */}
      <div className="sp-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className="sp-stat-card">
            <div className={`sp-stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="sp-stat-value">
                {loading ? '—' : <AnimatedNumber value={s.value} />}
              </div>
              <div className="sp-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 12 }}>
        <div className="sp-card-title" style={{ marginBottom: 14 }}>Truy cập nhanh</div>
      </div>
      <div className="sp-quick-grid" style={{ marginBottom: 28 }}>
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className={`sp-quick-card ${q.color}`}>
            <span className="sp-quick-icon">{q.icon}</span>
            <div className="sp-quick-title">{q.title}</div>
            <div className="sp-quick-desc">{q.desc}</div>
            <span className="sp-quick-arrow">›</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="sp-card">
        <div className="sp-card-header">
          <span className="sp-card-title">⏱ Hoạt động gần đây</span>
          <Link to="/shipper/my-orders" style={{ fontSize: 12, color: 'var(--sp-primary-light)', textDecoration: 'none', fontWeight: 600 }}>Xem tất cả →</Link>
        </div>
        <div>
          {loading ? (
            <div style={{ padding: '16px 20px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
                  <div className="sp-skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="sp-skeleton sp-skeleton-text w60" />
                    <div className="sp-skeleton sp-skeleton-text w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon">📭</div>
              <div className="sp-empty-title">Chưa có đơn hàng nào</div>
              <div className="sp-empty-desc">Hãy nhận đơn để bắt đầu giao hàng</div>
            </div>
          ) : (
            <div>
              {recent.map((o, i) => (
                <div
                  key={o.id}
                  className="sp-row-enter"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px',
                    borderBottom: i < recent.length - 1 ? '1px solid rgba(51,65,85,0.5)' : 'none',
                    animationDelay: `${i * 60}ms`
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text)' }}>
                      Đơn #{o.id} — {o.addressUser?.shipAdress || 'N/A'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sp-text-muted)', marginTop: 2 }}>
                      {moment(o.updatedAt).fromNow()}
                    </div>
                  </div>
                  <span className={`sp-badge ${STATUS_BADGE[o.statusId] || 'sp-badge-gray'}`}>
                    {STATUS_LABEL[o.statusId] || o.statusId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;
