import React, { useState } from 'react';
import { toast } from 'react-toastify';

function ModalCancelOrder({ show, onConfirm, onClose }) {
  const [reason, setReason] = useState('');

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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Hủy đơn hàng</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            <label className="form-label">Lý do hủy (bắt buộc):</label>
            <textarea
              className="form-control"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>
              Đóng
            </button>
            <button className="btn btn-danger" onClick={handleConfirm}>
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalCancelOrder;
