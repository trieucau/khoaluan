import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { getDetailUserById, UpdateUserService } from '../../services/userService';
import CommonUtils from '../../utils/CommonUtils';

const DEFAULT_AVATAR = 'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg';

const GENDER_OPTS = [
  { value: 'M', label: 'Nam' },
  { value: 'F', label: 'Nữ' },
  { value: 'O', label: 'Khác' },
];

const ShipperProfile = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const id = userData?.id;

  const [birthday, setBirthday] = useState(new Date());
  const [isChangeDate, setIsChangeDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    firstName: '', lastName: '', address: '', phonenumber: '',
    genderId: 'M', email: '', image: DEFAULT_AVATAR, imageReview: '',
  });

  useEffect(() => {
    if (!id) return;
    getDetailUserById(id).then(res => {
      if (res?.errCode === 0) {
        const d = res.data;
        setValues({
          firstName: d.firstName || '', lastName: d.lastName || '',
          address: d.address || '', phonenumber: d.phonenumber || '',
          genderId: d.genderId || 'M', email: d.email || '',
          image: d.image || DEFAULT_AVATAR, imageReview: '',
        });
        if (d.dob) setBirthday(moment.unix(+d.dob / 1000).toDate());
      }
    });
  }, [id]);

  const handleChange = e => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleImageChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 31312281) { toast.error('Dung lượng < 30MB'); return; }
    const base64 = await CommonUtils.getBase64(file);
    setValues(v => ({ ...v, image: base64, imageReview: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await UpdateUserService({
        id, firstName: values.firstName, lastName: values.lastName,
        address: values.address, genderId: values.genderId,
        phonenumber: values.phonenumber,
        dob: isChangeDate ? new Date(birthday).getTime() : undefined,
        image: values.image,
      });
      if (res?.errCode === 0) toast.success('✅ Cập nhật thành công!');
      else toast.error(res?.errMessage || 'Cập nhật thất bại');
    } finally { setLoading(false); }
  };

  const displayImg = values.imageReview || values.image;
  const initials = `${values.firstName?.[0] || ''}${values.lastName?.[0] || ''}`.toUpperCase() || 'S';

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-header-row">
          <div>
            <div className="sp-page-title">👤 Thông tin cá nhân</div>
            <div className="sp-page-subtitle">Xem và cập nhật thông tin tài khoản Shipper</div>
          </div>
          <Link to="/shipper" className="sp-btn sp-btn-ghost">← Dashboard</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18 }}>
        {/* Avatar panel */}
        <div className="sp-card" style={{ height: 'fit-content' }}>
          <div className="sp-card-body" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {displayImg && displayImg !== DEFAULT_AVATAR ? (
                <img src={displayImg} alt="avatar"
                  style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--sp-primary)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }} />
              ) : (
                <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#fff', border: '3px solid rgba(255,255,255,0.1)' }}>
                  {initials}
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%', background: 'var(--sp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--sp-bg)', fontSize: 13 }}>
                📷<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--sp-text)', marginBottom: 4 }}>
              {[values.firstName, values.lastName].filter(Boolean).join(' ') || 'Shipper'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-muted)', marginBottom: 12 }}>{values.email}</div>
            <span className="sp-badge sp-badge-blue">🚚 Shipper</span>
          </div>
        </div>

        {/* Info form */}
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">📋 Thông tin cơ bản</span></div>
          <div className="sp-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Họ *', name: 'firstName', placeholder: 'Nguyễn' },
                { label: 'Tên *', name: 'lastName', placeholder: 'Văn A' },
              ].map(f => (
                <div key={f.name}>
                  <label className="sp-form-label">{f.label}</label>
                  <input className="sp-input" name={f.name} value={values[f.name]} onChange={handleChange} placeholder={f.placeholder}
                    style={{ width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="sp-form-label">Email</label>
              <input value={values.email} readOnly
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text-dim)', fontSize: 13, fontFamily: 'inherit', cursor: 'not-allowed' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div>
                <label className="sp-form-label">Số điện thoại</label>
                <input className="sp-input" name="phonenumber" value={values.phonenumber} onChange={handleChange} placeholder="0912345678"
                  style={{ width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label className="sp-form-label">Giới tính</label>
                <select name="genderId" value={values.genderId} onChange={handleChange}
                  style={{ width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {GENDER_OPTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="sp-form-label">Ngày sinh</label>
              <DatePicker
                selected={birthday}
                onChange={date => { setBirthday(date); setIsChangeDate(true); }}
                dateFormat="dd/MM/yyyy"
                showYearDropdown dropdownMode="select"
                customInput={
                  <input style={{ width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                }
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="sp-form-label">Địa chỉ</label>
              <input name="address" value={values.address} onChange={handleChange} placeholder="Số nhà, đường, quận..."
                style={{ width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--sp-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="sp-btn sp-btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
              <Link to="/shipper/change-password" className="sp-btn sp-btn-ghost">🔐 Đổi mật khẩu</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperProfile;
