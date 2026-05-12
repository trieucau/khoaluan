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
            <div
              className="sp-skeleton sp-skeleton-text"
              style={{ width: j === 3 ? '80%' : '60%' }}
            />
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  useEffect(() => {
    load();
  }, [load]);

  const handleTake = async (orderId) => {
    setTakingId(orderId);
    try {
      const shipperId = JSON.parse(localStorage.getItem('userData') || '{}')?.id;
      const res = await shipperTakeOrder(orderId, shipperId);
      if (res?.errCode === 0) {
        toast.success('Đã nhận đơn thành công!');
        load();
      } else toast.error(res?.errMessage || 'Không thể nhận đơn');
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setTakingId(null);
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      return (
        !q ||
        String(o.id).includes(q) ||
        (o.addressUser?.shipAdress || '').toLowerCase().includes(q) ||
        `${o.userData?.firstName} ${o.userData?.lastName}`.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedItems = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="sp-page" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-header-row">
          <div>
            <div className="sp-page-title">Đơn có thể nhận</div>
            <div className="sp-page-subtitle">
              Các đơn hàng đang chờ shipper tiếp nhận trong khu vực
            </div>
          </div>
          <button
            className="sp-btn sp-btn-ghost"
            onClick={() => load(true)}
            disabled={refreshing}
            title="Làm mới"
          >
            <svg
              className={`sp-icon-sm sp-refresh-icon${refreshing ? ' spinning' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="sp-card">
        {/* Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--sp-border)',
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div className="sp-search-bar" style={{ flex: 1, minWidth: 220 }}>
            <span className="sp-search-icon">
              <svg
                className="sp-icon-xs"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, địa chỉ, khách hàng..."
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--sp-text-dim)',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sp-text-muted)', whiteSpace: 'nowrap' }}>
            {loading ? (
              '...'
            ) : (
              <>
                <span style={{ color: 'var(--sp-primary-light)', fontWeight: 700 }}>
                  {filtered.length}
                </span>{' '}
                / {orders.length} đơn
              </>
            )}
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
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                    <div className="sp-empty">
                      <div className="sp-empty-icon">
                        <svg
                          className="sp-title-icon"
                          style={{ opacity: 0.5 }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                          <path d="M2 9.5 12 15l10-5.5" />
                        </svg>
                      </div>
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
                pagedItems.map((o, i) => (
                  <tr key={o.id} className="sp-row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <span className="sp-badge sp-badge-blue">#{o.id}</span>
                    </td>
                    <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                      {moment(o.createdAt).format('DD/MM/YYYY')}
                      <br />
                      <span style={{ color: 'var(--sp-text-dim)' }}>
                        {moment(o.createdAt).format('HH:mm')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(59,130,246,0.15)',
                            color: 'var(--sp-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {(o.userData?.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>
                          {o.userData?.firstName} {o.userData?.lastName}
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--sp-text-muted)',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <svg
                          className="sp-icon-xs"
                          style={{ flexShrink: 0, color: 'var(--sp-primary-light)' }}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {o.addressUser?.shipAdress || '—'}
                      </div>
                    </td>
                    <td>
                      <span
                        className="sp-badge sp-badge-amber"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <svg
                          className="sp-icon-xs"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Chờ nhận
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="sp-btn sp-btn-primary sp-btn-sm"
                        onClick={() => handleTake(o.id)}
                        disabled={takingId === o.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <svg
                          className="sp-icon-xs"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {takingId === o.id ? 'Đang nhận...' : 'Nhận đơn'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="sp-pagination"
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--sp-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--sp-text-dim)', fontWeight: 600 }}>
              Hiển thị{' '}
              <span style={{ color: '#fff' }}>
                {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filtered.length)}
              </span>{' '}
              trong <span style={{ color: '#fff' }}>{filtered.length}</span> đơn
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="sp-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`sp-pagination-btn${currentPage === i + 1 ? ' active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="sp-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersAvailable;
