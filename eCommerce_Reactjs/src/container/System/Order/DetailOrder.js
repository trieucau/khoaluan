import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDetailOrder, updateStatusOrderService } from '../../../services/userService';
import { toast } from 'react-toastify';
import ShopCartItem from '../../../component/ShopCart/ShopCartItem';
import CommonUtils from '../../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const STATUS_BADGE = {
  S1:'ap-badge-gray', S2:'ap-badge-amber', S3:'ap-badge-cyan',
  S4:'ap-badge-indigo', S5:'ap-badge-blue', S6:'ap-badge-green',
  S7:'ap-badge-red', S8:'ap-badge-red',
};

const InfoRow = ({ label, value, highlight }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--ap-border)', fontSize:13 }}>
    <span style={{ color:'var(--ap-text-muted)' }}>{label}</span>
    <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? '#fbbf24' : 'var(--ap-text)' }}>{value}</span>
  </div>
);

function DetailOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState({});
  const [lightboxImg, setLightboxImg] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  let subtotal = 0;

  const loadOrder = async () => {
    if (!id) return;
    const res = await getDetailOrder(id);
    if (res?.errCode === 0) { setOrder(res.data); }
    setLoading(false);
  };

  useEffect(() => { loadOrder(); }, []);

  const calcDiscount = (price, voucher) => {
    try {
      const tv = voucher.typeVoucherOfVoucherData;
      if (tv.typeVoucher === 'percent') {
        const disc = (price * tv.value) / 100;
        return disc > tv.maxValue ? tv.maxValue : disc;
      }
      return tv.maxValue;
    } catch { return 0; }
  };

  const updateStatus = async (statusId) => {
    const res = await updateStatusOrderService({ id: order.id, statusId, dataOrder: order });
    if (res?.errCode === 0) { toast.success('Cập nhật trạng thái thành công'); loadOrder(); }
    else toast.error('Thao tác thất bại');
  };

  if (loading) return (
    <div className="ap-page">
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {[1,2,3].map(i => <div key={i} className="ap-skeleton" style={{ height:120, borderRadius:'var(--ap-radius)' }} />)}
      </div>
    </div>
  );

  const shipPrice = Number(order.typeShipData?.price) || 0;
  
  // Calculate subtotal before computing discount
  if (order.orderDetail) {
    order.orderDetail.forEach(item => {
      subtotal += item.quantity * item.productDetail.discountPrice;
    });
  }

  const discount = order.voucherId ? calcDiscount(subtotal, order.voucherData) : 0;

  return (
    <div className="ap-page">
      {/* Page header */}
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">🧾 Chi tiết đơn hàng #{order.id}</div>
            <div className="ap-page-subtitle">Xem và quản lý trạng thái đơn hàng</div>
          </div>
          <Link to="/admin/list-order" className="ap-btn ap-btn-ghost">← Quay lại DS đơn hàng</Link>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>
        {/* Left: products */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Items card */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-cart-shopping" style={{marginRight: 8}}></i>Sản phẩm trong đơn</span></div>
            <div style={{ overflowX:'auto' }}>
              <table className="ap-table">
                <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th style={{textAlign:'center'}}>SL</th><th style={{textAlign:'right'}}>Tổng</th></tr></thead>
                <tbody>
                  {order.orderDetail?.map((item, idx) => {
                    const name = `${item.product.name} - ${item.productDetail.nameDetail} - ${item.productDetailSize?.sizeData?.value}`;
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 'var(--ap-radius-sm)', overflow: 'hidden', border: '1px solid var(--ap-border)', background: '#fff' }}>
                              <img src={item.productImage?.[0]?.image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ap-text)', lineHeight: 1.4 }}>{item.product.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--ap-text-muted)' }}>{item.productDetail.nameDetail} — {item.productDetailSize?.sizeData?.value}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--ap-text-dim)' }}>{CommonUtils.formatter.format(item.productDetail.discountPrice)}</td>
                        <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--ap-success)' }}>
                          {CommonUtils.formatter.format(item.quantity * item.productDetail.discountPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery image */}
          {order.image && (
            <div className="ap-card">
              <div className="ap-card-header"><span className="ap-card-title">📸 Ảnh xác nhận giao hàng</span></div>
              <div className="ap-card-body">
                <img
                  src={order.image} alt="delivery"
                  onClick={() => { setLightboxImg(order.image); setLightboxOpen(true); }}
                  style={{ maxWidth:240, borderRadius:'var(--ap-radius-sm)', cursor:'zoom-in', border:'1px solid var(--ap-border)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: info panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Status + actions */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-list-check" style={{marginRight: 8}}></i>Trạng thái đơn hàng</span></div>
            <div className="ap-card-body">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span className={`ap-badge ${STATUS_BADGE[order.statusId]||'ap-badge-gray'}`} style={{ fontSize:13, padding:'5px 12px' }}>
                  {order.statusOrderData?.value}
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {order.statusId === 'S3' && <>
                  <button className="ap-btn ap-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={() => updateStatus('S4')}>✅ Xác nhận đơn hàng</button>
                  {order.isPaymentOnlien === 0 && (
                    <button className="ap-btn ap-btn-danger" style={{width:'100%',justifyContent:'center'}} onClick={() => updateStatus('S7')}>🚫 Hủy đơn hàng</button>
                  )}
                </>}
                {order.statusId === 'S4' && (
                  <button className="ap-btn ap-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={() => updateStatus('S5')}><i className="fa-solid fa-box" style={{marginRight: 8}}></i>Xác nhận gửi hàng</button>
                )}
                {order.statusId === 'S5' && (
                  <button className="ap-btn ap-btn-success" style={{width:'100%',justifyContent:'center'}} onClick={() => updateStatus('S6')}>🎉 Đã giao hàng</button>
                )}
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-user" style={{marginRight: 8}}></i>Thông tin nhận hàng</span></div>
            <div className="ap-card-body">
              <InfoRow label="Tên người nhận" value={order.addressUser?.shipName} />
              <InfoRow label="Số điện thoại" value={order.addressUser?.shipPhonenumber} />
              <InfoRow label="Email" value={order.addressUser?.shipEmail} />
              <InfoRow label="Địa chỉ" value={order.addressUser?.shipAdress} />
            </div>
          </div>

          {/* Payment summary */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">💰 Thanh toán</span></div>
            <div className="ap-card-body">
              <InfoRow label="Hình thức" value={order.isPaymentOnlien === 0 ? '💵 Tiền mặt' : '💳 Online'} />
              <InfoRow label="Loại ship" value={`${order.typeShipData?.type} — ${CommonUtils.formatter.format(shipPrice)}`} />
              {order.voucherId && <InfoRow label="Voucher" value={order.voucherData?.codeVoucher} />}
              <InfoRow label="Tổng hàng" value={CommonUtils.formatter.format(subtotal)} />
              {discount > 0 && <InfoRow label="Giảm giá" value={`-${CommonUtils.formatter.format(discount)}`} />}
              <InfoRow label="Tổng thanh toán" value={CommonUtils.formatter.format(subtotal - discount + shipPrice)} highlight />
            </div>
          </div>

          {/* Shipper */}
          {order.shipperData && (
            <div className="ap-card">
              <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-truck-fast" style={{marginRight: 8}}></i>Shipper</span></div>
              <div className="ap-card-body">
                <InfoRow label="Tên" value={`${order.shipperData.firstName} ${order.shipperData.lastName}`} />
                <InfoRow label="SĐT" value={order.shipperData.phonenumber} />
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxOpen && <Lightbox slides={[{ src: lightboxImg }]} open={lightboxOpen} close={() => setLightboxOpen(false)} />}
    </div>
  );
}
export default DetailOrder;
