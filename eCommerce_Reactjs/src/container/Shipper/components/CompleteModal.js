import React, { useState } from 'react';
import { shipperUpdateOrderStatus } from '../../../services/userService';
import { toast } from 'react-toastify';

const CompleteModal = ({ orderId, onClose, onDone, mode = 'complete' }) => {
  const [img, setImg] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImg(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (mode === 'complete' && !img) {
      toast.warning('Vui lòng chụp ảnh xác nhận để hoàn tất đơn hàng.');
      return;
    }
    if (mode === 'cancel' && !reason.trim()) {
      toast.warning('Vui lòng nhập lý do giao thất bại.');
      return;
    }
    setLoading(true);
    try {
      const statusId = mode === 'complete' ? 'S6' : 'S8';
      const payload = { orderId, statusId };
      if (mode === 'complete') payload.image = img;
      if (mode === 'cancel') payload.statusReason = reason;

      const res = await shipperUpdateOrderStatus(payload);
      if (res?.errCode === 0) {
        toast.success(mode === 'complete' ? 'Xác nhận giao hàng thành công!' : 'Đã hủy đơn hàng!');
        onDone();
      } else toast.error(res?.errMessage || 'Lỗi cập nhật trạng thái');
    } catch (e) {
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div
        className="sp-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="sp-modal-header"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span
            className="sp-modal-title"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}
          >
            {mode === 'complete' ? (
              <svg
                className="sp-icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            ) : (
              <svg
                className="sp-icon-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {mode === 'complete' ? 'Xác nhận giao hàng' : 'Xác nhận giao thất bại'}
          </span>
          <button className="sp-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sp-modal-body" style={{ padding: '24px' }}>
          {mode === 'complete' ? (
            <>
              <label
                className="sp-form-label"
                style={{ color: 'var(--sp-text-muted)', marginBottom: 12 }}
              >
                Ảnh xác nhận (bắt buộc)
              </label>
              <label
                className="sp-file-label"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input type="file" accept="image/*" onChange={handleImg} />
                {img ? (
                  <img
                    src={img}
                    alt="preview"
                    className="sp-img-preview"
                    style={{ maxHeight: 250, borderRadius: 12 }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--sp-text-dim)' }}>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ marginBottom: 12, opacity: 0.5 }}
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Nhấn để chụp/tải ảnh</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Bằng chứng đã giao hàng cho khách</div>
                  </div>
                )}
              </label>
            </>
          ) : (
            <>
              <label
                className="sp-form-label"
                style={{ color: 'var(--sp-text-muted)', marginBottom: 12, display: 'block' }}
              >
                Lý do giao thất bại (bắt buộc)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Khách không nghe máy, khách đổi ý, sai địa chỉ..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 16,
                  color: '#fff',
                  fontSize: 14,
                  minHeight: 120,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </>
          )}
        </div>
        <div
          className="sp-modal-footer"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px' }}
        >
          <button className="sp-btn sp-btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            className={`sp-btn ${mode === 'complete' ? 'sp-btn-success' : ''}`}
            onClick={handleConfirm}
            disabled={loading || (mode === 'complete' ? !img : !reason.trim())}
            style={{ 
              minWidth: 120,
              background: mode === 'complete' ? '' : '#ef4444',
              color: '#fff',
              border: 'none'
            }}
          >
            {loading ? 'Đang xử lý...' : (mode === 'complete' ? 'Xác nhận giao' : 'Xác nhận hủy')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteModal;
