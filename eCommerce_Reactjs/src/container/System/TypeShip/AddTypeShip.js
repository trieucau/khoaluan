import React, { useEffect, useState } from 'react';
import { createNewTypeShipService, getDetailTypeShipByIdService, updateTypeShipService } from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';

const AddTypeShip = () => {
  const [isAdd, setIsAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ type: '', price: '' });
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailTypeShipByIdService(id).then(res => {
        if (res?.errCode === 0) setValues({ type: res.data.type, price: res.data.price });
      });
    }
  }, [id]);

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!values.type || !values.price) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewTypeShipService({ type: values.type, price: values.price })
        : await updateTypeShipService({ type: values.type, price: values.price, id });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Thêm loại ship thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ type: '', price: '' });
      } else if (res?.errCode === 2) toast.error(res.errMessage);
      else toast.error('Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? <><i className="fa-solid fa-plus" style={{marginRight: 6}}></i>Thêm loại giao hàng</> : <><i className="fa-solid fa-pen-to-square"></i>Cập nhật loại giao hàng</>}</div>
            <div className="ap-page-subtitle">Cấu hình hình thức vận chuyển và phí ship</div>
          </div>
          <Link to="/admin/list-typeship" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>
      <div className="ap-card" style={{ maxWidth: 560 }}>
        <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-truck-fast" style={{marginRight: 8}}></i>Thông tin loại giao hàng</span></div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Tên loại giao hàng *</label>
              <input className="ap-input" name="type" value={values.type} onChange={handleChange} placeholder="VD: Giao nhanh, Giao tiêu chuẩn..." />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Phí vận chuyển (VNĐ) *</label>
              <input className="ap-input" type="number" name="price" value={values.price} onChange={handleChange} placeholder="VD: 30000" />
              {values.price && (
                <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>
                  ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.price)}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
            </button>
            <Link to="/admin/list-typeship" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddTypeShip;
