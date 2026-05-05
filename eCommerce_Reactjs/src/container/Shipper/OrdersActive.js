import React, { useEffect, useState, useCallback } from 'react';
import { getAllOrdersByShipper, shipperUpdateOrderStatus } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';
import ModalCancelOrder from '../../component/ModalCancelOrder/ModalCancelOrder';
import CompleteModal from './components/CompleteModal';

const STATUS_CONFIG = {
  S4: { label: 'Chờ lấy hàng', badge: 'sp-badge-amber', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>) },
  S5: { label: 'Đang giao', badge: 'sp-badge-blue', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>) },
  S6: { label: 'Đã giao', badge: 'sp-badge-green', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>) },
  S7: { label: 'Đã hủy', badge: 'sp-badge-red', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>) },
  S8: { label: 'Giao thất bại', badge: 'sp-badge-red', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>) },
};

const TABS = [
  { key: 'all', label: 'Tất cả', icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>) },
  { key: 'S5', label: 'Đang giao', icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>) },
  { key: 'S6', label: 'Đã hoàn thành', icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>) },
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
              {state === 'done' ? (
                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
              ) : i + 1}
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
          <span className="sp-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Báo giao thất bại
          </span>
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
          <button className="sp-btn sp-btn-danger" onClick={handleConfirm} disabled={loading || !reason.trim()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {loading ? 'Đang xử lý...' : 'Xác nhận thất bại'}
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
      if (res?.errCode === 0) { toast.success('Đã bắt đầu giao!'); load(); }
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
        <div className="sp-page-title">
          <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Đơn của tôi
        </div>
        <div className="sp-page-subtitle">Quản lý và cập nhật trạng thái đơn hàng thời gian thực</div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="sp-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`sp-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.icon}
              <span>{t.label}</span>
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
                <th style={{ width: 100 }}>Mã đơn</th>
                <th style={{ width: 100 }}>Thời gian</th>
                <th>Thông tin khách hàng</th>
                <th style={{ width: 150 }}>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác nhanh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                    <div className="sp-empty">
                      <div className="sp-empty-icon">
                        <svg className="sp-title-icon" style={{ opacity: 0.5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><path d="M2 9.5 12 15l10-5.5"/></svg>
                      </div>
                      <div className="sp-empty-title">Không có đơn hàng nào</div>
                      <div className="sp-empty-desc">Chuyển sang tab khác hoặc nhận thêm đơn</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.statusId] || { label: o.statusId, badge: 'sp-badge-gray', icon: (<svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>) };
                  const isActing = actionLoading === o.id;
                  return (
                    <tr key={o.id} className="sp-row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                      <td><span className="sp-badge sp-badge-blue">#{o.id}</span></td>
                      <td style={{ color: 'var(--sp-text-muted)', fontSize: 12 }}>
                        {moment(o.createdAt).format('DD/MM')}<br />
                        <span style={{ color: 'var(--sp-text-dim)' }}>{moment(o.createdAt).format('HH:mm')}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#fff', fontWeight: 600 }}>
                            <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            {o.addressUser?.shipAdress || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--sp-text-dim)', paddingLeft: 20 }}>
                            Người nhận: {o.addressUser?.shipName || 'Khách hàng'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`sp-badge ${cfg.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <div style={{ marginTop: 8 }}>
                          {['S4', 'S5', 'S6'].includes(o.statusId) && <Stepper statusId={o.statusId} />}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {o.statusId === 'S4' && (
                            <button className="sp-btn sp-btn-success sp-btn-sm" onClick={() => handleStartDelivery(o.id)} disabled={isActing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isActing ? (
                                <svg className="sp-icon-xs spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                              ) : (
                                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                              )}
                              {isActing ? 'Đang xử lý' : 'Bắt đầu giao'}
                            </button>
                          )}
                          {o.statusId === 'S5' && (
                            <>
                              <button className="sp-btn sp-btn-primary sp-btn-sm" onClick={() => setCompleteModal(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                Hoàn thành
                              </button>
                              <button className="sp-btn sp-btn-warning sp-btn-sm" onClick={() => setCancelModal({ show: true, orderId: o.id })} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                Hủy đơn
                              </button>
                              <button className="sp-btn sp-btn-danger sp-btn-sm" onClick={() => setFailModal(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                Thất bại
                              </button>
                            </>
                          )}
                          {o.statusId === 'S6' && (
                            <span style={{ color: 'var(--sp-success)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              Đã giao
                            </span>
                          )}
                          {(o.statusId === 'S7' || o.statusId === 'S8') && (
                            <span style={{ color: 'var(--sp-danger)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{cfg.icon} {cfg.label}</span>
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
