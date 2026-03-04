import React, { useState, useMemo } from 'react';

// ================= FORMAT HELPERS
const formatDistance = (km) => {
  if (km == null) return '—';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} phút`;
  return `${Math.floor(m / 60)}h ${m % 60}p`;
};

const formatPrice = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

// ================= SORT ICON
const SortIcon = ({ column, sortKey, sortDir }) => {
  const active = sortKey === column;
  return (
    <span
      style={{
        marginLeft: 4,
        fontSize: 11,
        color: active ? '#2563eb' : '#9ca3af',
        userSelect: 'none',
      }}
    >
      {active && sortDir === 'asc' ? '▲' : active && sortDir === 'desc' ? '▼' : '⇅'}
    </span>
  );
};

// ================= ORDER PANEL COMPONENT (Case C: tách riêng)
const OrderPanel = ({ orders, shipperLoc, osrmDurations }) => {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Case A: gộp thêm totalPrice, name, phone
  // Case B: dùng duration thật từ OSRM (osrmDurations map orderId -> seconds)
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
                Math.cos((shipperLoc.lat * Math.PI) / 180) *
                  Math.cos((lat * Math.PI) / 180) *
                  Math.sin(dLng / 2) ** 2;
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            })()
          : null;

      // Case B: lấy duration thật từ OSRM nếu có, fallback ước tính 40km/h
      const durationSeconds =
        osrmDurations?.[order.id] != null
          ? osrmDurations[order.id]
          : distKm != null
            ? (distKm / 40) * 3600
            : null;

      // Case A: tính totalPrice từ orderDetails (quantity * realPrice)
      const totalPrice =
        Array.isArray(order?.orderDetails) && order.orderDetail.length > 0
          ? order.orderDetail.reduce(
              (sum, d) => sum + (Number(d.realPrice) || 0) * (Number(d.quantity) || 1),
              0
            )
          : null;

      const name = order?.addressUser?.shipName ?? order?.user?.name ?? '—';
      const phone = order?.addressUser?.shipPhonenumber ?? order?.user?.phone ?? '—';

      // Phí ship theo loại ship (typeShip.price)
      const shippingFee = order?.typeShip?.price != null ? Number(order.typeShipData.price) : null;

      return {
        ...order,
        distKm,
        durationSeconds,
        totalPrice,
        name,
        phone,
        shippingFee,
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

  return (
    <>
      {/* ===== TOGGLE BUTTON bên trái bản đồ ===== */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'absolute',
          top: '50%',
          left: open ? 'calc(40% - 18px)' : 0,
          transform: 'translateY(-50%)',
          zIndex: 1100,
          width: 28,
          height: 56,
          background: '#1e40af',
          color: '#fff',
          border: 'none',
          borderRadius: open ? '0 8px 8px 0' : '0 8px 8px 0',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
          boxShadow: '2px 0 8px rgba(0,0,0,0.18)',
          transition: 'left 0.35s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={open ? 'Ẩn bảng đơn hàng' : 'Xem bảng đơn hàng'}
      >
        {open ? '‹' : '›'}
      </button>

      {/* ===== SLIDING PANEL ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '40%',
          background: '#fff',
          zIndex: 1050,
          boxShadow: open ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px 12px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: '#fff',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
              📦 Danh sách đơn hàng
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              {sortedOrders.length} đơn đang giao
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f1f5f9',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                {[
                  { label: 'Mã đơn', key: null, width: '10%' },
                  {
                    label: 'Khoảng cách',
                    key: 'distKm',
                    width: '13%',
                    sortable: true,
                  },
                  {
                    label: 'Thời gian',
                    key: 'durationSeconds',
                    width: '12%',
                    sortable: true,
                  },
                  { label: 'Giá trị đơn', key: null, width: '14%' },
                  { label: 'Phí ship', key: null, width: '13%' },
                  { label: 'Tên – SĐT', key: null, width: '38%' },
                ].map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding: '9px 10px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#374151',
                      borderBottom: '2px solid #e2e8f0',
                      width: col.width,
                      cursor: col.sortable ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {col.label}
                    {col.sortable && (
                      <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: '#9ca3af',
                      fontSize: 14,
                    }}
                  >
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    style={{
                      background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc')
                    }
                  >
                    {/* Mã đơn */}
                    <td style={{ padding: '8px 10px' }}>
                      <span
                        style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          borderRadius: 5,
                          padding: '2px 7px',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        #{order.id}
                      </span>
                    </td>

                    {/* Khoảng cách */}
                    <td style={{ padding: '8px 10px', color: '#0f766e', fontWeight: 600 }}>
                      {formatDistance(order.distKm)}
                    </td>

                    {/* Thời gian di chuyển (Case B: OSRM thật) */}
                    <td style={{ padding: '8px 10px', color: '#7c3aed', fontWeight: 600 }}>
                      {formatDuration(order.durationSeconds)}
                    </td>

                    {/* Giá trị đơn (Case A) */}
                    <td style={{ padding: '8px 10px', color: '#b45309', fontWeight: 600 }}>
                      {formatPrice(order.totalPrice)}
                    </td>

                    {/* Phí giao hàng */}
                    <td style={{ padding: '8px 10px', color: '#be185d', fontWeight: 600 }}>
                      {formatPrice(order.shippingFee)}
                    </td>

                    {/* Tên – SĐT (Case A) */}
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 12 }}>
                        {order.name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                        📞 {order.phone}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tổng */}
        {sortedOrders.length > 0 && (
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: 20,
              flexShrink: 0,
              fontSize: 12,
              color: '#475569',
              flexWrap: 'wrap',
            }}
          >
            <span>
              🗺️ Tổng KM:{' '}
              <strong style={{ color: '#0f766e' }}>
                {formatDistance(sortedOrders.reduce((s, o) => s + (o.distKm || 0), 0))}
              </strong>
            </span>
            <span>
              ⏱️ Tổng TG:{' '}
              <strong style={{ color: '#7c3aed' }}>
                {formatDuration(sortedOrders.reduce((s, o) => s + (o.durationSeconds || 0), 0))}
              </strong>
            </span>
            <span>
              💰 Tổng giá trị:{' '}
              <strong style={{ color: '#b45309' }}>
                {formatPrice(sortedOrders.reduce((s, o) => s + (o.totalPrice || 0), 0))}
              </strong>
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderPanel;
