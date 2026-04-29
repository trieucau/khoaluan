import React, { useEffect, useState, useCallback } from 'react';
import { getAllOrdersByShipper, shipperUpdateOrderStatus } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';
import ModalCancelOrder from '../../component/ModalCancelOrder/ModalCancelOrder';

const STATUS_CONFIG = {
  S4: { label: 'Chờ lấy hàng', badge: 'sp-badge-amber', icon: '📦' },
  S5: { label: 'Đang giao', badge: 'sp-badge-blue', icon: '🚚' },
  S6: { label: 'Đã giao', badge: 'sp-badge-green', icon: '✅' },
  S7: { label: 'Đã hủy', badge: 'sp-badge-red', icon: '🚫' },
  S8: { label: 'Giao thất bại', badge: 'sp-badge-red', icon: '❌' },
};

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'S4', label: 'Chờ lấy hàng' },
  { key: 'S5', label: 'Đang giao' },
  { key: 'S6', label: 'Đã hoàn thành' },
];

const Stepper = ({ statusId }) => {
  const steps = [
    { id: 'S4', label: 'Chờ lấy' },
    { id: 'S5', label: 'Đang giao' },
    { id: 'S6', label: 'Hoàn thành' },
  ];
  const order = { S4: 0, S5: 1, S6: 2 };
  const cur = order[statusId] ?? -1;
  return (
    <div className="sp-stepper">
      {steps.map((s, i) => {
        const state = cur > i ? 'done' : cur === i ? 'active' : 'pending';
        return (
          <div key={s.id} className="sp-step">
            <div className={`sp-step-dot ${state}`} title={s.label}>
              {state === 'done' ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`sp-step-line ${cur > i ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
};

const SkeletonRows = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i}>
        {[...Array(5)].map((_, j) => (
          <td key={j} style={{ padding: '14px' }}>
            <div className="sp-skeleton sp-skeleton-text" style={{ width: j === 2 ? '75%' : '55%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Modal xác nhận giao hàng (ảnh)
const CompleteModal = ({ orderId, onClose, onDone }) => {
  const [img, setImg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImg(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!img) { toast.warning('Vui lòng chụp ảnh xác nhận.'); return; }
    setLoading(true);
    try {
      const res = await shipperUpdateOrderStatus({ orderId, statusId: 'S6', image: img });
      if (res?.errCode === 0) { toast.success('✅ Giao hàng thành công!'); onDone(); }
      else toast.error(res?.errMessage || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-header">
          <span className="sp-modal-title">📸 Xác nhận giao hàng</span>
          <button className="sp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sp-modal-body">
          <label className="sp-form-label">Ảnh xác nhận (bắt buộc)</label>
          <label className="sp-file-label">
            <input type="file" accept="image/*" onChange={handleImg} />
            {img ? <img src={img} alt="preview" className="sp-img-preview" /> : <div style={{ color: 'var(--sp-text-dim)', fontSize: 13 }}>📷 Nhấn để chọn ảnh</div>}
          </label>
        </div>
        <div className="sp-modal-footer">
          <button className="sp-btn sp-btn-ghost" onClick={onClose}>Hủy</button>
          <button className="sp-btn sp-btn-success" onClick={handleConfirm} disabled={loading || !img}>
            {loading ? '⏳ Đang xác nhận...' : '✅ Xác nhận giao'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal giao thất bại
const FailModal = ({ orderId, onClose, onDone }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) { toast.warning('Vui lòng nhập lý do.'); return; }
    setLoading(true);
    try {
      const res = await shipperUpdateOrderStatus({ orderId, statusId: 'S8', statusReason: reason.trim() });
      if (res?.errCode === 0) { toast.success('Đã cập nhật giao thất bại.'); onDone(); }
      else toast.error(res?.errMessage || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-header">
          <span className="sp-modal-title">❌ Báo giao thất bại</span>
          <button className="sp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sp-modal-body">
          <label className="sp-form-label">Lý do (bắt buộc)</label>
          <textarea
            className="sp-textarea"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do giao thất bại..."
            maxLength={300}
          />
          <div className="sp-char-count">{reason.length}/300</div>
        </div>
        <div className="sp-modal-footer">
          <button className="sp-btn sp-btn-ghost" onClick={onClose}>Đóng</button>
          <button className="sp-btn sp-btn-danger" onClick={handleConfirm} disabled={loading || !reason.trim()}>
            {loading ? '⏳ Đang xử lý...' : '❌ Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrdersActive = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [actionLoading, setActionLoading] = useState(null); // orderId
  const [completeModal, setCompleteModal] = useState(null);
  const [failModal, setFailModal] = useState(null);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null });

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  const load = useCallback(async () => {
    if (!shipperId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getAllOrdersByShipper({ shipperId });
      setOrders(res?.errCode === 0 ? res.data || [] : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [shipperId]);

  useEffect(() => { load(); }, [load]);

  const handleStartDelivery = async (orderId) => {
    setActionLoading(orderId);
    try {
      const res = await shipperUpdateOrderStatus({ orderId, statusId: 'S5' });
      if (res?.errCode === 0) { toast.success('🚚 Đã bắt đầu giao!'); load(); }
      else toast.error(res?.errMessage || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setActionLoading(null); }
  };

  const handleCancelOrder = async (reason) => {
    try {
      const res = await shipperUpdateOrderStatus({ orderId: cancelModal.orderId, statusId: 'S7', statusReason: reason });
      if (res?.errCode === 0) { toast.success('Đã hủy đơn.'); setCancelModal({ show: false, orderId: null }); load(); }
      else toast.error(res?.errMessage || 'Lỗi');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? orders.length : orders.filter((o) => o.statusId === t.key).length;
    return acc;
  }, {});

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.statusId === tab);

  return (
    <div className="sp-page">
      <div className="sp-page-header">
        <div className="sp-page-title">📦 Đơn của tôi</div>
        <div className="sp-page-subtitle">Quản lý và cập nhật trạng thái đơn hàng</div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="sp-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`sp-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="sp-tab-badge">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sp-card">
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày</th>
                <th>Địa chỉ giao</th>
                <th>Tiến trình</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                    <div className="sp-empty">
                      <div className="sp-empty-icon">📭</div>
                      <div className="sp-empty-title">Không có đơn hàng nào</div>
                      <div className="sp-empty-desc">Chuyển sang tab khác hoặc nhận thêm đơn</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.statusId] || { label: o.statusId, badge: 'sp-badge-gray', icon: '📋' };
                  const isActing = actionLoading === o.id;
                  return (
                    <tr key={o.id} className="sp-row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                      <td><span className="sp-badge sp-badge-blue">#{o.id}</span></td>
                      <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                        {moment(o.createdAt).format('DD/MM')}<br />
                        <span style={{ color: 'var(--sp-text-dim)' }}>{moment(o.createdAt).format('HH:mm')}</span>
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                          📍 {o.addressUser?.shipAdress || '—'}
                        </div>
                        <span className={`sp-badge ${cfg.badge}`} style={{ marginTop: 4 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td>
                        {['S4', 'S5', 'S6'].includes(o.statusId)
                          ? <Stepper statusId={o.statusId} />
                          : <span style={{ fontSize: 12, color: 'var(--sp-text-dim)' }}>{cfg.icon} {cfg.label}</span>
                        }
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {o.statusId === 'S4' && (
                            <button className="sp-btn sp-btn-success sp-btn-sm" onClick={() => handleStartDelivery(o.id)} disabled={isActing}>
                              {isActing ? '⏳' : '🚚'} {isActing ? 'Đang xử lý' : 'Bắt đầu giao'}
                            </button>
                          )}
                          {o.statusId === 'S5' && (
                            <>
                              <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => setCompleteModal(o.id)}>📸 Hoàn thành</button>
                              <button className="sp-btn sp-btn-warning sp-btn-sm" onClick={() => setCancelModal({ show: true, orderId: o.id })}>🚫 Hủy đơn</button>
                              <button className="sp-btn sp-btn-danger sp-btn-sm" onClick={() => setFailModal(o.id)}>❌ Thất bại</button>
                            </>
                          )}
                          {o.statusId === 'S6' && (
                            <span style={{ color: 'var(--sp-success)', fontSize: 13, fontWeight: 600 }}>✅ Đã giao</span>
                          )}
                          {(o.statusId === 'S7' || o.statusId === 'S8') && (
                            <span style={{ color: 'var(--sp-danger)', fontSize: 13, fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {completeModal && (
        <CompleteModal
          orderId={completeModal}
          onClose={() => setCompleteModal(null)}
          onDone={() => { setCompleteModal(null); load(); }}
        />
      )}
      {failModal && (
        <FailModal
          orderId={failModal}
          onClose={() => setFailModal(null)}
          onDone={() => { setFailModal(null); load(); }}
        />
      )}
      <ModalCancelOrder
        show={cancelModal.show}
        onConfirm={handleCancelOrder}
        onClose={() => setCancelModal({ show: false, orderId: null })}
      />
    </div>
  );
};

export default OrdersActive;
