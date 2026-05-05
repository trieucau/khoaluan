import React, { useState, useMemo } from 'react';

const formatDistance = (km) => {
  if (km == null) return '—';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)}h ${m % 60}p`;
};

const formatPrice = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const SortIcon = ({ column, sortKey, sortDir }) => {
  const active = sortKey === column;
  return (
    <span style={{ marginLeft: 4, fontSize: 10, color: active ? '#93c5fd' : '#475569', userSelect: 'none' }}>
      {active && sortDir === 'asc' ? '▲' : active && sortDir === 'desc' ? '▼' : '⇅'}
    </span>
  );
};

const OrderPanel = ({ orders, shipperLoc, osrmDurations }) => {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const lat = parseFloat(order?.addressUser?.lat);
      const lng = parseFloat(order?.addressUser?.lng);
      const distKm =
        shipperLoc && lat && lng
          ? (() => {
              const R = 6371;
              const dLat = ((lat - shipperLoc.lat) * Math.PI) / 180;
              const dLng = ((lng - shipperLoc.lng) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos((shipperLoc.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            })()
          : null;

      const durationSeconds =
        osrmDurations?.[order.id] != null
          ? osrmDurations[order.id]
          : distKm != null ? (distKm / 40) * 3600 : null;

      const rawDetails = order?.orderDetail || order?.orderDetails || [];
      const details = Array.isArray(rawDetails) ? rawDetails : rawDetails ? [rawDetails] : [];
      const subTotal = details.reduce((sum, d) => sum + (Number(d.realPrice) || 0) * (Number(d.quantity) || 1), 0);

      let discount = 0;
      const voucher = order?.voucherData;
      const typeVoucher = voucher?.typeVoucherOfVoucherData;
      if (voucher && typeVoucher && subTotal >= Number(typeVoucher.minValue)) {
        if (typeVoucher.typeVoucher === 'percent') discount = Math.min((subTotal * Number(typeVoucher.value)) / 100, Number(typeVoucher.maxValue));
        if (typeVoucher.typeVoucher === 'money') discount = Number(typeVoucher.value);
      }

      return {
        ...order,
        distKm,
        durationSeconds,
        totalPrice: Math.max(0, subTotal - discount),
        name: order?.addressUser?.shipName ?? '—',
        phone: order?.addressUser?.shipPhonenumber ?? '—',
        shippingFee: order?.typeShipData?.price != null ? Number(order.typeShipData.price) : null,
      };
    });
  }, [orders, shipperLoc, osrmDurations]);

  const sortedOrders = useMemo(() => {
    if (!sortKey) return enrichedOrders;
    return [...enrichedOrders].sort((a, b) => {
      const va = a[sortKey] ?? Infinity;
      const vb = b[sortKey] ?? Infinity;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [enrichedOrders, sortKey, sortDir]);

  const COLS = [
    { label: 'Mã đơn', key: null, w: '10%' },
    { label: 'Khoảng cách', key: 'distKm', w: '14%', sortable: true },
    { label: 'Thời gian', key: 'durationSeconds', w: '13%', sortable: true },
    { label: 'Giá trị', key: null, w: '15%' },
    { label: 'Phí ship', key: null, w: '13%' },
    { label: 'Tên – SĐT', key: null, w: '35%' },
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'absolute', top: '50%', left: open ? 'calc(98% - 18px)' : 0,
          transform: 'translateY(-50%)', zIndex: 3000,
          width: 28, height: 56, background: 'linear-gradient(135deg,#1d4ed8,#0891b2)',
          color: '#fff', border: 'none', borderRadius: '0 8px 8px 0',
          cursor: 'pointer', fontSize: 18, fontWeight: 700,
          boxShadow: '2px 0 12px rgba(59,130,246,0.4)',
          transition: 'left 0.35s cubic-bezier(.4,0,.2,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={open ? 'Ẩn bảng đơn hàng' : 'Xem bảng đơn hàng'}
      >
        {open ? '‹' : '›'}
      </button>

      {/* Sliding Panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%', width: '100%',
        background: '#0f172a', zIndex: 2900,
        boxShadow: open ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Panel Header */}
        <div style={{
          padding: '14px 20px 12px',
          background: 'linear-gradient(135deg,#1e3a8a,#0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Danh sách đơn đang giao
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'spPulse 1.5s infinite' }} />
              {sortedOrders.length} đơn đang giao
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {sortedOrders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>
                <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><path d="M2 9.5 12 15l10-5.5"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Không có đơn hàng nào</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Bật GPS để tải dữ liệu</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              <thead>
                <tr style={{ background: 'rgba(30,41,59,0.95)', position: 'sticky', top: 0, zIndex: 10 }}>
                  {COLS.map((col) => (
                    <th
                      key={col.label}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{
                        padding: '9px 10px', textAlign: 'left',
                        fontWeight: 700, color: '#64748b', fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        borderBottom: '1px solid #1e293b',
                        width: col.w, cursor: col.sortable ? 'pointer' : 'default',
                        whiteSpace: 'nowrap', userSelect: 'none',
                      }}
                    >
                      {col.label}
                      {col.sortable && <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    style={{ background: idx % 2 === 0 ? '#0f172a' : '#111827', borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#0f172a' : '#111827')}
                  >
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', borderRadius: 5, padding: '2px 7px', fontWeight: 700, fontSize: 11 }}>#{order.id}</span>
                    </td>
                    <td style={{ padding: '9px 10px', color: '#34d399', fontWeight: 600 }}>{formatDistance(order.distKm)}</td>
                    <td style={{ padding: '9px 10px', color: '#a78bfa', fontWeight: 600 }}>{formatDuration(order.durationSeconds)}</td>
                    <td style={{ padding: '9px 10px', color: '#fbbf24', fontWeight: 600 }}>{formatPrice(order.totalPrice)}</td>
                    <td style={{ padding: '9px 10px', color: '#f472b6', fontWeight: 600 }}>{formatPrice(order.shippingFee)}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 12 }}>{order.name}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {order.phone}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {sortedOrders.length > 0 && (
          <div style={{ padding: '10px 16px', background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', gap: 20, flexShrink: 0, fontSize: 11, color: '#94a3b8', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Tổng KM: <strong style={{ color: '#34d399' }}>{formatDistance(sortedOrders.reduce((s, o) => s + (o.distKm || 0), 0))}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Tổng TG: <strong style={{ color: '#a78bfa' }}>{formatDuration(sortedOrders.reduce((s, o) => s + (o.durationSeconds || 0), 0))}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Tổng GT: <strong style={{ color: '#fbbf24' }}>{formatPrice(sortedOrders.reduce((s, o) => s + (o.totalPrice || 0), 0))}</strong>
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderPanel;
