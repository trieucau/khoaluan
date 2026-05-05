import React, { useState } from 'react';
import { shipperUpdateOrderStatus } from '../../../services/userService';
import { toast } from 'react-toastify';

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
    if (!img) { 
      toast.warning('Vui lòng chụp ảnh xác nhận để hoàn tất đơn hàng.'); 
      return; 
    }
    setLoading(true);
    try {
      // S6 is "Đã giao" (Delivered)
      const res = await shipperUpdateOrderStatus({ orderId, statusId: 'S6', image: img });
      if (res?.errCode === 0) { 
        toast.success('Xác nhận giao hàng thành công!'); 
        onDone(); 
      }
      else toast.error(res?.errMessage || 'Lỗi cập nhật trạng thái');
    } catch (e) { 
      toast.error('Lỗi kết nối server'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="sp-modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="sp-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="sp-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
            <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Xác nhận giao hàng
          </span>
          <button className="sp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sp-modal-body" style={{ padding: '24px' }}>
          <label className="sp-form-label" style={{ color: 'var(--sp-text-muted)', marginBottom: 12 }}>Ảnh xác nhận (bắt buộc)</label>
          <label className="sp-file-label" style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <input type="file" accept="image/*" onChange={handleImg} />
            {img ? (
              <img src={img} alt="preview" className="sp-img-preview" style={{ maxHeight: 250, borderRadius: 12 }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--sp-text-dim)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.5 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Nhấn để chụp/tải ảnh</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Bằng chứng đã giao hàng cho khách</div>
              </div>
            )}
          </label>
        </div>
        <div className="sp-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 24px' }}>
          <button className="sp-btn sp-btn-ghost" onClick={onClose}>Hủy</button>
          <button 
            className="sp-btn sp-btn-success" 
            onClick={handleConfirm} 
            disabled={loading || !img}
            style={{ minWidth: 120 }}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận giao'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteModal;
