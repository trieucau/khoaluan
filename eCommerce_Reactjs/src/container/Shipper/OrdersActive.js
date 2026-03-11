import React, { useEffect, useState } from 'react';
import { getAllOrdersByShipper, shipperUpdateOrderStatus } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';
import ModalCancelOrder from '../../component/ModalCancelOrder/ModalCancelOrder';

const OrdersActive = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, orderId: null, type: null });
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null });
  const [reason, setReason] = useState('');
  const [imageBase64, setImageBase64] = useState('');

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;

  const load = async () => {
    if (!shipperId) return;
    setLoading(true);
    try {
      const res = await getAllOrdersByShipper({ shipperId });
      if (res && res.errCode === 0) setOrders(res.data || []);
      else setOrders([]);
    } catch (e) {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shipperId]);

  const handleStartDelivery = async (orderId) => {
    try {
      const res = await shipperUpdateOrderStatus({ orderId, statusId: 'S5' });
      if (res && res.errCode === 0) {
        toast.success('Đã bắt đầu giao!');
        load();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  const openCompleteModal = (orderId) => {
    setModal({ show: true, orderId, type: 'S6' });
    setImageBase64('');
  };

  const openFailModal = (orderId) => {
    setModal({ show: true, orderId, type: 'S8' });
    setReason('');
  };

  // Dùng ModalCancelOrder chung cho S7
  const openCancelModal = (orderId) => {
    setCancelModal({ show: true, orderId });
  };

  const handleCompleteWithImage = async () => {
    if (!modal.orderId || !imageBase64) {
      toast.warning('Vui lòng chụp ảnh xác nhận giao hàng.');
      return;
    }
    try {
      const res = await shipperUpdateOrderStatus({
        orderId: modal.orderId,
        statusId: 'S6',
        image: imageBase64,
      });
      if (res && res.errCode === 0) {
        toast.success('Đã xác nhận giao thành công!');
        setModal({ show: false, orderId: null, type: null });
        setImageBase64('');
        load();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleFail = async () => {
    if (!modal.orderId || !reason.trim()) {
      toast.warning('Vui lòng nhập lý do.');
      return;
    }
    try {
      const res = await shipperUpdateOrderStatus({
        orderId: modal.orderId,
        statusId: 'S8',
        statusReason: reason.trim(),
      });
      if (res && res.errCode === 0) {
        toast.success('Đã cập nhật giao thất bại.');
        setModal({ show: false, orderId: null, type: null });
        setReason('');
        load();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  // Xử lý hủy đơn từ ModalCancelOrder chung
  const handleCancelOrder = async (reason) => {
    try {
      const res = await shipperUpdateOrderStatus({
        orderId: cancelModal.orderId,
        statusId: 'S7',
        statusReason: reason,
      });
      if (res && res.errCode === 0) {
        toast.success('Đã hủy đơn.');
        setCancelModal({ show: false, orderId: null });
        load();
      } else toast.error(res?.errMessage || 'Lỗi');
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Đơn của tôi</h1>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="card">
          <div className="card-body">
            {orders.length === 0 ? (
              <p className="text-muted">Chưa có đơn nào.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày</th>
                      <th>Địa chỉ giao</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{moment(o.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                        <td>{o.addressUser?.shipAdress}</td>
                        <td>{o.statusOrderData?.value || o.statusId}</td>
                        <td>
                          {o.statusId === 'S4' && (
                            <button
                              className="btn btn-success btn-sm me-1"
                              onClick={() => handleStartDelivery(o.id)}
                            >
                              Bắt đầu giao
                            </button>
                          )}
                          {o.statusId === 'S5' && (
                            <>
                              <button
                                className="btn btn-primary btn-sm me-1"
                                onClick={() => openCompleteModal(o.id)}
                              >
                                Hoàn thành
                              </button>
                              <button
                                className="btn btn-warning btn-sm me-1"
                                onClick={() => openCancelModal(o.id)}
                              >
                                Hủy đơn
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => openFailModal(o.id)}
                              >
                                Giao thất bại
                              </button>
                            </>
                          )}
                          {o.statusId === 'S6' && <span className="text-success">Đã giao</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN GIAO HÀNG - S6 */}
      {modal.show && modal.type === 'S6' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận giao hàng</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModal({ show: false })}
                />
              </div>
              <div className="modal-body">
                <p>Chụp ảnh xác nhận giao hàng (bắt buộc):</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-control"
                />
                {imageBase64 && (
                  <img src={imageBase64} alt="preview" style={{ maxWidth: '100%', marginTop: 8 }} />
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal({ show: false })}>
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={handleCompleteWithImage}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GIAO THẤT BẠI - S8 */}
      {modal.show && modal.type === 'S8' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Giao thất bại</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModal({ show: false })}
                />
              </div>
              <div className="modal-body">
                <label>Lý do (bắt buộc):</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do giao thất bại..."
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal({ show: false })}>
                  Đóng
                </button>
                <button className="btn btn-danger" onClick={handleFail}>
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỦY ĐƠN - tái sử dụng component chung */}
      <ModalCancelOrder
        show={cancelModal.show}
        onConfirm={handleCancelOrder}
        onClose={() => setCancelModal({ show: false, orderId: null })}
      />
    </div>
  );
};

export default OrdersActive;
