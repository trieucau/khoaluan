import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { getAllOrdersByShipper } from '../../services/userService';

const ShipperHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('all');

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!shipperId) return;
      setLoading(true);
      try {
        const res = await getAllOrdersByShipper({ shipperId });
        if (res?.errCode === 0) {
          const finished = (res.data || []).filter(o => ['S6', 'S7', 'S8'].includes(o.statusId));
          finished.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setOrders(finished);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [shipperId]);

  const filteredOrders = useMemo(() => {
    if (filterDate === 'all') return orders;
    const today = moment().startOf('day');
    const lastWeek = moment().subtract(7, 'days').startOf('day');
    return orders.filter(o => {
      const orderDate = moment(o.updatedAt);
      if (filterDate === 'today') return orderDate.isSameOrAfter(today);
      if (filterDate === 'week') return orderDate.isSameOrAfter(lastWeek);
      return true;
    });
  }, [orders, filterDate]);

  const stats = useMemo(() => {
    const totalEarned = filteredOrders.reduce((sum, o) => sum + (o.statusId === 'S6' ? 20000 : 0), 0);
    return { totalEarned, count: filteredOrders.length };
  }, [filteredOrders]);

  if (loading) return (
    <div className="sp-page"><div className="sp-loading-shimmer" /></div>
  );

  return (
    <div className="sp-page sp-history-page">
      <header className="sp-history-header">
        <div>
          <h1 className="sp-page-title">Lịch sử giao hàng</h1>
          <p className="sp-page-subtitle">Xem lại các đơn hàng đã hoàn tất của bạn</p>
        </div>
      </header>

      <section className="sp-history-overview">
        <div className="sp-history-stat-box">
          <span className="label">Thu nhập (ước tính)</span>
          <span className="value">{new Intl.NumberFormat('vi-VN').format(stats.totalEarned)}đ</span>
        </div>
        <div className="sp-history-stat-box">
          <span className="label">Tổng số đơn</span>
          <span className="value">{stats.count} đơn</span>
        </div>
      </section>

      <div className="sp-history-filters">
        {['all', 'today', 'week'].map(f => (
          <button key={f} 
            className={`sp-history-filter-btn ${filterDate === f ? 'active' : ''}`}
            onClick={() => setFilterDate(f)}>
            {f === 'all' ? 'Tất cả' : f === 'today' ? 'Hôm nay' : '7 ngày qua'}
          </button>
        ))}
      </div>

      <main className="sp-history-list">
        {filteredOrders.length === 0 ? (
          <div className="sp-empty-state">
            <p>Không tìm thấy lịch sử giao hàng trong thời gian này.</p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const dateLabel = moment(order.updatedAt).format('DD/MM/YYYY');
            const showDate = idx === 0 || moment(filteredOrders[idx-1].updatedAt).format('DD/MM/YYYY') !== dateLabel;
            
            return (
              <React.Fragment key={order.id}>
                {showDate && <div className="sp-history-date-divider">{dateLabel}</div>}
                <div className={`sp-history-item-card status-${order.statusId}`}>
                  <div className="card-left">
                    <div className="time">{moment(order.updatedAt).format('HH:mm')}</div>
                    <div className="status-dot" />
                  </div>
                  <div className="card-main">
                    <div className="card-row">
                      <span className="order-id">#{order.id}</span>
                      <span className={`badge badge-${order.statusId}`}>
                        {order.statusId === 'S6' ? 'Thành công' : order.statusId === 'S7' ? 'Đã hoàn trả' : 'Thất bại'}
                      </span>
                    </div>
                    <div className="address">{order.addressUser?.shipAdress || 'N/A'}</div>
                    <div className="meta">
                      {order.addressUser?.shipName} • {order.paymentId === 'PAY1' ? 'Tiền mặt' : 'Đã thanh toán'}
                    </div>
                  </div>
                  <div className="card-right">
                    <div className="earning">{order.statusId === 'S6' ? '+20k' : '0đ'}</div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </main>

      <style>{`
        .sp-history-page { max-width: 800px; margin: 0 auto; padding-bottom: 80px; }
        .sp-history-header { margin-bottom: 24px; }
        
        .sp-history-overview { 
          display: flex; gap: 12px; margin-bottom: 24px; 
        }
        .sp-history-stat-box {
          flex: 1; background: var(--sp-surface); padding: 16px; border-radius: 12px;
          border: 1px solid var(--sp-border); display: flex; flex-direction: column; gap: 4px;
        }
        .sp-history-stat-box .label { font-size: 12px; color: var(--sp-text-dim); }
        .sp-history-stat-box .value { font-size: 20px; font-weight: 700; color: #fff; }

        .sp-history-filters { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
        .sp-history-filter-btn {
          white-space: nowrap; padding: 8px 16px; border-radius: 20px; background: var(--sp-surface);
          border: 1px solid var(--sp-border); color: var(--sp-text-muted); cursor: pointer; font-size: 13px; transition: 0.2s;
        }
        .sp-history-filter-btn.active { background: var(--sp-primary); color: #fff; border-color: var(--sp-primary); }

        .sp-history-date-divider { 
          font-size: 12px; font-weight: 700; color: var(--sp-text-dim); 
          margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .sp-history-item-card {
          display: flex; gap: 16px; background: var(--sp-surface); 
          border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid var(--sp-border);
          transition: 0.2s; align-items: center;
        }
        .sp-history-item-card:hover { border-color: var(--sp-primary); transform: translateX(4px); }

        .card-left { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 45px; flex-shrink: 0; }
        .card-left .time { font-size: 13px; font-weight: 700; color: var(--sp-text-muted); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sp-text-dim); }
        .status-S6 .status-dot { background: var(--sp-success); box-shadow: 0 0 8px var(--sp-success); }
        .status-S7 .status-dot { background: var(--sp-warning); }
        .status-S8 .status-dot { background: var(--sp-danger); }

        .card-main { flex: 1; min-width: 0; }
        .card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .order-id { font-size: 14px; font-weight: 700; color: #fff; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
        .badge-S6 { background: rgba(34, 197, 94, 0.15); color: var(--sp-success); }
        .badge-S7 { background: rgba(245, 158, 11, 0.15); color: var(--sp-warning); }
        .badge-S8 { background: rgba(239, 68, 68, 0.15); color: var(--sp-danger); }

        .address { font-size: 13px; color: var(--sp-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .meta { font-size: 11px; color: var(--sp-text-dim); }

        .card-right { flex-shrink: 0; text-align: right; }
        .earning { font-size: 15px; font-weight: 800; color: var(--sp-success); }
        .status-S7 .earning, .status-S8 .earning { color: var(--sp-text-dim); }

        @media (max-width: 600px) {
          .sp-history-overview { flex-direction: column; }
          .sp-history-item-card { padding: 12px; gap: 12px; }
          .card-left { width: 40px; }
          .card-left .time { font-size: 12px; }
          .earning { font-size: 14px; }
        }
      `}</style>
    </div>
  );
};

export default ShipperHistory;
