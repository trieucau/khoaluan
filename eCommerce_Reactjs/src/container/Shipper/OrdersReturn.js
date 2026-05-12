import React, { useEffect, useState, useCallback } from 'react';
import { getAllOrdersByShipper } from '../../services/userService';
import moment from 'moment';

const STATUS_CONFIG = {
  S7: {
    label: 'Đã hủy',
    badge: 'sp-badge-red',
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  S8: {
    label: 'Giao thất bại',
    badge: 'sp-badge-red',
    icon: (
      <svg
        className="sp-icon-sm"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

const SkeletonRows = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i}>
        {[...Array(5)].map((_, j) => (
          <td key={j} style={{ padding: '14px' }}>
            <div
              className="sp-skeleton sp-skeleton-text"
              style={{ width: j === 2 ? '75%' : '55%' }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const RETURN_TABS = [
  {
    key: 'all',
    label: 'Tất cả',
    icon: (
      <svg
        className="sp-icon-xs"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: 'S7',
    label: 'Đã hủy',
    icon: (
      <svg
        className="sp-icon-xs"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    key: 'S8',
    label: 'Giao thất bại',
    icon: (
      <svg
        className="sp-icon-xs"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const OrdersReturn = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  const load = useCallback(async () => {
    if (!shipperId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAllOrdersByShipper({ shipperId });
      if (res?.errCode === 0) {
        // Filter only Cancelled (S7) and Failed (S8)
        const returnOrders = (res.data || []).filter(
          (o) => o.statusId === 'S7' || o.statusId === 'S8'
        );
        setOrders(returnOrders);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(() => {
    return RETURN_TABS.reduce((acc, t) => {
      acc[t.key] =
        t.key === 'all' ? orders.length : orders.filter((o) => o.statusId === t.key).length;
      return acc;
    }, {});
  }, [orders]);

  const filtered = React.useMemo(() => {
    return tab === 'all' ? orders : orders.filter((o) => o.statusId === tab);
  }, [orders, tab]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagedItems = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="sp-page" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">Đơn cần hoàn trả</div>
        <div className="sp-page-subtitle">
          Danh sách các đơn hàng đã hủy hoặc giao thất bại cần xử lý hoàn trả
        </div>
      </div>

      {/* Tabs Filter */}
      <div style={{ marginBottom: 20 }}>
        <div className="sp-tabs">
          {RETURN_TABS.map((t) => (
            <button
              key={t.key}
              className={`sp-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className="sp-tab-badge">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sp-card">
        <div
          className="sp-table-wrap sp-hide-scrollbar"
          style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}
        >
          <table className="sp-table">
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: 'var(--sp-surface)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                <th style={{ width: 100 }}>Mã đơn</th>
                <th style={{ width: 120 }}>Thời gian</th>
                <th>Thông tin giao hàng</th>
                <th style={{ width: 150 }}>Trạng thái</th>
                <th>Lý do hoàn trả</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0, border: 'none' }}>
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
                      <div className="sp-empty-title">Không có đơn hàng cần hoàn trả</div>
                      <div className="sp-empty-desc">Tất cả các đơn hàng đã được xử lý xong</div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.statusId] || {
                    label: o.statusId,
                    badge: 'sp-badge-gray',
                    icon: null,
                  };
                  return (
                    <tr
                      key={o.id}
                      className="sp-row-enter"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td>
                        <span className="sp-badge sp-badge-blue">#{o.id}</span>
                      </td>
                      <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                        {moment(o.updatedAt).format('DD/MM/YYYY')}
                        <br />
                        <span style={{ color: 'var(--sp-text-dim)' }}>
                          {moment(o.updatedAt).format('HH:mm')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 13,
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            <svg
                              className="sp-icon-xs"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {o.addressUser?.shipAdress || '—'}
                          </div>
                          <div
                            style={{ fontSize: 12, color: 'var(--sp-text-dim)', paddingLeft: 20 }}
                          >
                            Người nhận: {o.addressUser?.shipName || 'Khách hàng'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`sp-badge ${cfg.badge}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: '#fca5a5', fontStyle: 'italic' }}>
                          {o.statusReason || 'Không có lý do cụ thể'}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

export default OrdersReturn;
