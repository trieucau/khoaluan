import React, { useEffect, useState } from 'react';
import { createNewSupplierService, getDetailSupplierByIdService, updateSupplierService } from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';

const AddSupplier = () => {
  const [isAdd, setIsAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ name: '', address: '', phonenumber: '', email: '' });
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailSupplierByIdService(id).then(res => {
        if (res?.errCode === 0) setValues({ name: res.data.name, address: res.data.address, phonenumber: res.data.phonenumber, email: res.data.email });
      });
    }
  }, [id]);

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!values.name) { toast.error('Vui lòng nhập tên nhà cung cấp'); return; }
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewSupplierService({ name: values.name, address: values.address, email: values.email, phonenumber: values.phonenumber })
        : await updateSupplierService({ name: values.name, address: values.address, email: values.email, phonenumber: values.phonenumber, id });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Thêm nhà cung cấp thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ name: '', address: '', phonenumber: '', email: '' });
      } else if (res?.errCode === 2) toast.error(res.errMessage);
      else toast.error('Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? '➕ Thêm nhà cung cấp' : '✏️ Cập nhật nhà cung cấp'}</div>
            <div className="ap-page-subtitle">{isAdd ? 'Đăng ký nhà cung cấp mới' : 'Cập nhật thông tin nhà cung cấp'}</div>
          </div>
          <Link to="/admin/list-supplier" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>
      <div className="ap-card" style={{ maxWidth: 680 }}>
        <div className="ap-card-header"><span className="ap-card-title">🏭 Thông tin nhà cung cấp</span></div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Tên nhà cung cấp *</label>
              <input className="ap-input" name="name" value={values.name} onChange={handleChange} placeholder="Công ty TNHH ABC..." />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Email</label>
              <input className="ap-input" type="email" name="email" value={values.email} onChange={handleChange} placeholder="contact@supplier.com" />
            </div>
          </div>
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Số điện thoại</label>
              <input className="ap-input" name="phonenumber" value={values.phonenumber} onChange={handleChange} placeholder="0901 234 567" />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Địa chỉ</label>
              <input className="ap-input" name="address" value={values.address} onChange={handleChange} placeholder="123 Đường XYZ, Q.1..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
            </button>
            <Link to="/admin/list-supplier" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddSupplier;
