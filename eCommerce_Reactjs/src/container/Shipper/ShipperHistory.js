import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { getAllOrdersByShipper } from '../../services/userService';

const ShipperHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('all'); // 'all', 'today', 'week'

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!shipperId) return;
      setLoading(true);
      try {
        // S6: Success, S7: Returned, S8: Failed
        const res = await getAllOrdersByShipper({ shipperId });
        if (res?.errCode === 0) {
          const finished = (res.data || []).filter(o => ['S6', 'S7', 'S8'].includes(o.statusId));
          // Sort by latest update
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
    const successCount = filteredOrders.filter(o => o.statusId === 'S6').length;
    return { totalEarned, successCount, total: filteredOrders.length };
  }, [filteredOrders]);

  if (loading) return (
    <div className="sp-page">
      <div className="sp-skeleton" style={{ height: 40, width: 250, marginBottom: 20 }} />
      <div className="sp-skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 30 }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div className="sp-skeleton" style={{ width: 60, height: 20 }} />
          <div className="sp-skeleton" style={{ flex: 1, height: 120, borderRadius: 16 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="sp-page" style={{ paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">
          <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Lịch sử giao hàng
        </div>
        <div className="sp-page-subtitle">Hành trình và thành quả của bạn qua từng chặng đường</div>
      </div>

      {/* Stats Overview */}
      <div className="sp-stats-grid" style={{ marginBottom: 40 }}>
        <div className="sp-stat-card">
          <div className="sp-stat-label">Tổng thu nhập</div>
          <div className="sp-stat-value" style={{ color: 'var(--sp-success)' }}>{new Intl.NumberFormat('vi-VN').format(stats.totalEarned)}đ</div>
          <div className="sp-stat-sub">Dựa trên {stats.successCount} đơn thành công</div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-label">Tổng chuyến đi</div>
          <div className="sp-stat-value">{stats.total}</div>
          <div className="sp-stat-sub">Bao gồm hoàn trả/thất bại</div>
        </div>
        <div className="sp-stat-card">
          <div className="sp-stat-label">Bộ lọc thời gian</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className={`sp-btn-tag ${filterDate === 'all' ? 'active' : ''}`} onClick={() => setFilterDate('all')}>Tất cả</button>
            <button className={`sp-btn-tag ${filterDate === 'today' ? 'active' : ''}`} onClick={() => setFilterDate('today')}>Hôm nay</button>
            <button className={`sp-btn-tag ${filterDate === 'week' ? 'active' : ''}`} onClick={() => setFilterDate('week')}>7 ngày</button>
          </div>
        </div>
      </div>

      {/* Timeline Roadmap */}
      <div className="sp-timeline-roadmap">
        {filteredOrders.length === 0 ? (
          <div className="sp-empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛣️</div>
            <h3>Chưa có dữ liệu hành trình</h3>
            <p>Các chuyến đi hoàn tất sẽ xuất hiện tại đây dưới dạng lộ trình.</p>
          </div>
        ) : (
          <div className="sp-roadmap-container">
            {filteredOrders.map((order, index) => {
              const isLast = index === filteredOrders.length - 1;
              const dateLabel = moment(order.updatedAt).format('DD/MM/YYYY');
              const showDateHeader = index === 0 || moment(filteredOrders[index - 1].updatedAt).format('DD/MM/YYYY') !== dateLabel;

              return (
                <React.Fragment key={order.id}>
                  {showDateHeader && (
                    <div className="sp-timeline-date-header">
                      <span>{dateLabel === moment().format('DD/MM/YYYY') ? 'Hôm nay' : dateLabel}</span>
                    </div>
                  )}
                  
                  <div className="sp-roadmap-item">
                    {/* Time & Indicator */}
                    <div className="sp-roadmap-left">
                      <div className="sp-roadmap-time">{moment(order.updatedAt).format('HH:mm')}</div>
                      <div className={`sp-roadmap-node ${order.statusId}`}>
                        <div className="sp-roadmap-node-inner" />
                      </div>
                      {!isLast && <div className="sp-roadmap-line" />}
                    </div>

                    {/* Content Card */}
                    <div className="sp-roadmap-right">
                      <div className={`sp-card sp-roadmap-card ${order.statusId}`}>
                        <div className="sp-roadmap-card-header">
                          <span className="sp-order-id">Đơn #{order.id}</span>
                          <span className={`sp-badge sp-badge-${
                            order.statusId === 'S6' ? 'green' : 
                            order.statusId === 'S7' ? 'amber' : 'red'
                          }`}>
                            {order.statusId === 'S6' ? 'Hoàn tất' : 
                             order.statusId === 'S7' ? 'Hoàn trả' : 'Thất bại'}
                          </span>
                        </div>

                        <div className="sp-roadmap-card-body">
                          <div className="sp-info-row">
                            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span>Giao đến: <strong>{order.addressUser?.shipAdress || 'N/A'}</strong></span>
                          </div>
                          <div className="sp-info-row">
                            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                            <span>Thu nhập chuyến: <strong style={{ color: 'var(--sp-success)' }}>+{order.statusId === 'S6' ? '20.000đ' : '0đ'}</strong></span>
                          </div>
                        </div>

                        <div className="sp-roadmap-card-footer">
                          <div className="sp-payment-tag">
                            {order.paymentId === 'PAY1' ? 'Tiền mặt (COD)' : 'Đã thanh toán'}
                          </div>
                          <div className="sp-time-ago">
                            {moment(order.updatedAt).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .sp-timeline-roadmap {
          padding-left: 10px;
        }
        .sp-timeline-date-header {
          margin: 30px 0 20px 80px;
          position: relative;
        }
        .sp-timeline-date-header span {
          background: rgba(255,255,255,0.05);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          color: var(--sp-text-muted);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .sp-roadmap-item {
          display: flex;
          gap: 24px;
          min-height: 140px;
        }
        .sp-roadmap-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 60px;
          flex-shrink: 0;
          position: relative;
        }
        .sp-roadmap-time {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .sp-roadmap-node {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 4px solid #1e293b;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px rgba(255,255,255,0.02);
        }
        .sp-roadmap-node.S6 { background: var(--sp-success); box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
        .sp-roadmap-node.S7 { background: var(--sp-warning); box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
        .sp-roadmap-node.S8 { background: var(--sp-danger); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
        
        .sp-roadmap-node-inner {
          width: 6px;
          height: 6px;
          background: #fff;
          border-radius: 50%;
        }
        .sp-roadmap-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(to bottom, var(--sp-border), transparent);
          margin-top: 4px;
          margin-bottom: -40px;
        }
        .sp-roadmap-right {
          flex: 1;
          padding-bottom: 32px;
        }
        .sp-roadmap-card {
          background: rgba(31, 41, 55, 0.4);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .sp-roadmap-card:hover {
          background: rgba(31, 41, 55, 0.6);
          border-color: rgba(255,255,255,0.1);
          transform: translateX(8px);
        }
        .sp-roadmap-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: rgba(255,255,255,0.1);
        }
        .sp-roadmap-card.S6::before { background: var(--sp-success); }
        .sp-roadmap-card.S7::before { background: var(--sp-warning); }
        .sp-roadmap-card.S8::before { background: var(--sp-danger); }

        .sp-roadmap-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-order-id {
          font-weight: 800;
          color: #fff;
          font-size: 15px;
        }
        .sp-roadmap-card-body {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sp-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--sp-text-muted);
        }
        .sp-info-row strong {
          color: #fff;
        }
        .sp-roadmap-card-footer {
          padding: 12px 20px;
          background: rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--sp-text-dim);
          font-weight: 600;
        }
        .sp-payment-tag {
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .sp-btn-tag {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--sp-text-muted);
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sp-btn-tag.active {
          background: var(--sp-primary);
          border-color: var(--sp-primary);
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default ShipperHistory;
