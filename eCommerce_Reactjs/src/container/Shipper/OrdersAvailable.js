import React, { useEffect, useState, useCallback } from 'react';
import { getOrdersAvailableForShipper, shipperTakeOrder } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';

const SkeletonRows = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i}>
        {[...Array(6)].map((_, j) => (
          <td key={j} style={{ padding: '12px 14px' }}>
            <div className="sp-skeleton sp-skeleton-text" style={{ width: j === 3 ? '80%' : '60%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const OrdersAvailable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getOrdersAvailableForShipper();
      setOrders(res?.errCode === 0 ? res.data || [] : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTake = async (orderId) => {
    setTakingId(orderId);
    try {
      const shipperId = JSON.parse(localStorage.getItem('userData') || '{}')?.id;
      const res = await shipperTakeOrder(orderId, shipperId);
      if (res?.errCode === 0) { toast.success('✅ Đã nhận đơn thành công!'); load(); }
      else toast.error(res?.errMessage || 'Không thể nhận đơn');
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setTakingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(o.id).includes(q) ||
      (o.addressUser?.shipAdress || '').toLowerCase().includes(q) ||
      (`${o.userData?.firstName} ${o.userData?.lastName}`).toLowerCase().includes(q)
    );
  });

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-header-row">
          <div>
            <div className="sp-page-title">📋 Đơn có thể nhận</div>
            <div className="sp-page-subtitle">Các đơn hàng đang chờ shipper tiếp nhận</div>
          </div>
          <button
            className="sp-btn sp-btn-ghost"
            onClick={() => load(true)}
            disabled={refreshing}
            title="Làm mới"
          >
            <span className={`sp-refresh-icon${refreshing ? ' spinning' : ''}`}>🔄</span>
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="sp-card">
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sp-border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="sp-search-bar" style={{ flex: 1, minWidth: 220 }}>
            <span className="sp-search-icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, địa chỉ, khách hàng..."
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--sp-text-dim)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sp-text-muted)', whiteSpace: 'nowrap' }}>
            {loading ? '...' : <><span style={{ color: 'var(--sp-primary-light)', fontWeight: 700 }}>{filtered.length}</span> / {orders.length} đơn</>}
          </div>
        </div>

        {/* Table */}
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày đặt</th>
                <th>Khách hàng</th>
                <th>Địa chỉ giao</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                    <div className="sp-empty">
                      <div className="sp-empty-icon">📭</div>
                      <div className="sp-empty-title">
                        {search ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}
                      </div>
                      <div className="sp-empty-desc">
                        {search ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy kiểm tra lại sau ít phút'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o, i) => (
                  <tr key={o.id} className="sp-row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <span className="sp-badge sp-badge-blue">#{o.id}</span>
                    </td>
                    <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                      {moment(o.createdAt).format('DD/MM/YYYY')}<br />
                      <span style={{ color: 'var(--sp-text-dim)' }}>{moment(o.createdAt).format('HH:mm')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: 'var(--sp-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(o.userData?.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>
                          {o.userData?.firstName} {o.userData?.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sp-text-muted)', fontSize: 13 }}>
                        📍 {o.addressUser?.shipAdress || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="sp-badge sp-badge-amber">⏳ Chờ nhận</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="sp-btn sp-btn-primary sp-btn-sm"
                        onClick={() => handleTake(o.id)}
                        disabled={takingId === o.id}
                      >
                        {takingId === o.id ? '⏳ Đang nhận...' : '✋ Nhận đơn'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersAvailable;
