import React, { useEffect, useState } from 'react';
import { createNewReceiptService, getAllSupplier, getAllProductAdmin } from '../../../services/userService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const AddReceipt = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [productDetailSizes, setProductDetailSizes] = useState([]);
  const [values, setValues] = useState({ supplierId: '', productId: '', productDetailId: '', quantity: '', price: '' });
  const [sizeId, setSizeId] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUser(userData);
    Promise.all([
      getAllSupplier({ limit: '', offset: '', keyword: '' }),
      getAllProductAdmin({ sortName: '', sortPrice: '', categoryId: 'ALL', brandId: 'ALL', limit: '', offset: '', keyword: '' }),
    ]).then(([s, p]) => {
      if (s?.errCode === 0) setSuppliers(s.data);
      if (p?.errCode === 0) {
        setProducts(p.data);
        if (p.data.length > 0) {
          const firstProduct = p.data[0];
          setProductDetails(firstProduct.productDetail || []);
          if (firstProduct.productDetail?.[0]) {
            setProductDetailSizes(firstProduct.productDetail[0].productDetailSize || []);
            setSizeId(firstProduct.productDetail[0].productDetailSize?.[0]?.id || '');
          }
          setValues(v => ({ ...v, supplierId: s.data[0]?.id || '', productId: firstProduct.id }));
        }
      }
    });
  }, []);

  const handleProductChange = (e) => {
    const pid = e.target.value;
    setValues(v => ({ ...v, productId: pid }));
    const prod = products.find(p => String(p.id) === String(pid));
    if (prod?.productDetail?.length > 0) {
      setProductDetails(prod.productDetail);
      setProductDetailSizes(prod.productDetail[0].productDetailSize || []);
      setSizeId(prod.productDetail[0].productDetailSize?.[0]?.id || '');
    }
  };

  const handleDetailChange = (e) => {
    const did = e.target.value;
    const detail = productDetails.find(d => String(d.id) === String(did));
    if (detail) {
      setProductDetailSizes(detail.productDetailSize || []);
      setSizeId(detail.productDetailSize?.[0]?.id || '');
    }
  };

  const handleSave = async () => {
    if (!values.quantity || !values.price || !sizeId) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const res = await createNewReceiptService({ supplierId: values.supplierId, userId: user.id, productDetailSizeId: sizeId, quantity: values.quantity, price: values.price });
      if (res?.errCode === 0) {
        toast.success('Tạo phiếu nhập thành công');
        setValues(v => ({ ...v, quantity: '', price: '' }));
      } else if (res?.errCode === 2) toast.error(res.errMessage);
      else toast.error('Tạo phiếu nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">📥 Tạo phiếu nhập hàng</div>
            <div className="ap-page-subtitle">Ghi nhận hàng hóa nhập từ nhà cung cấp</div>
          </div>
          <Link to="/admin/list-receipt" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>

      <div className="ap-card" style={{ maxWidth: 760 }}>
        <div className="ap-card-header"><span className="ap-card-title">📋 Thông tin phiếu nhập</span></div>
        <div className="ap-card-body">
          <div className="ap-form-group">
            <label className="ap-label">Nhà cung cấp *</label>
            <select className="ap-select" name="supplierId" value={values.supplierId} onChange={e => setValues(v => ({ ...v, supplierId: e.target.value }))}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — {s.phonenumber}</option>)}
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--ap-border)', margin: '16px 0', paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ap-text-muted)', marginBottom: 12 }}>🛍️ Chọn sản phẩm nhập</div>
            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">Sản phẩm *</label>
                <select className="ap-select" value={values.productId} onChange={handleProductChange}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Phân loại *</label>
                <select className="ap-select" onChange={handleDetailChange}>
                  {productDetails.map(d => <option key={d.id} value={d.id}>{d.nameDetail}</option>)}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Size *</label>
                <select className="ap-select" value={sizeId} onChange={e => setSizeId(e.target.value)}>
                  {productDetailSizes.map(s => <option key={s.id} value={s.id}>{s.sizeData?.value || s.sizeId}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Số lượng nhập *</label>
              <input className="ap-input" type="number" min="1" name="quantity" value={values.quantity} onChange={e => setValues(v => ({ ...v, quantity: e.target.value }))} placeholder="VD: 100" />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Đơn giá nhập (VNĐ) *</label>
              <input className="ap-input" type="number" min="0" name="price" value={values.price} onChange={e => setValues(v => ({ ...v, price: e.target.value }))} placeholder="VD: 150000" />
              {values.price && (
                <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>
                  ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.price)}
                </div>
              )}
            </div>
          </div>

          {values.quantity && values.price && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--ap-radius-sm)', padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
              💰 Tổng giá trị nhập: <strong style={{ color: '#fbbf24' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.quantity * values.price)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang tạo...' : '📥 Tạo phiếu nhập'}
            </button>
            <Link to="/admin/list-receipt" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddReceipt;
