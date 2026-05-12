import React, { useState } from 'react';
import { toast } from 'react-toastify';

function ModalCancelOrder({ show, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const MAX = 300;

  if (!show) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy đơn');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="sp-modal-backdrop" onClick={handleClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-modal-header">
          <span className="sp-modal-title">
            <span style={{ color: 'var(--sp-warning)', fontSize: 20 }}>⚠️</span>
            Hủy đơn hàng
          </span>
          <button className="sp-modal-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="sp-modal-body">
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#fca5a5',
            }}
          >
            Hành động này không thể hoàn tác. Đơn hàng sẽ được chuyển sang trạng thái đã hủy.
          </div>
          <label className="sp-form-label">Lý do hủy (bắt buộc)</label>
          <textarea
            className="sp-textarea"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX))}
            placeholder="Nhập lý do hủy đơn..."
            autoFocus
          />
          <div
            className="sp-char-count"
            style={{ color: reason.length > MAX * 0.9 ? 'var(--sp-warning)' : undefined }}
          >
            {reason.length}/{MAX}
          </div>
        </div>
        <div className="sp-modal-footer">
          <button className="sp-btn sp-btn-ghost" onClick={handleClose}>
            Đóng
          </button>
          <button
            className="sp-btn sp-btn-danger"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            🚫 Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCancelOrder;
