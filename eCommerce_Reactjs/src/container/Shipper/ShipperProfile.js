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
            <div className="sp-page-title">
              <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Thông tin cá nhân
            </div>
            <div className="sp-page-subtitle">Xem và cập nhật thông tin tài khoản Shipper của bạn</div>
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
                <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--sp-text)', marginBottom: 4 }}>
              {[values.firstName, values.lastName].filter(Boolean).join(' ') || 'Shipper'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-muted)', marginBottom: 12 }}>{values.email}</div>
            <span className="sp-badge sp-badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Shipper Chuyên Nghiệp
            </span>
          </div>
        </div>

        {/* Info form */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Thông tin cơ bản
            </span>
          </div>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--sp-border)' }}>
              <button className="sp-btn sp-btn-primary" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <Link to="/shipper/change-password" className="sp-btn sp-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Đổi mật khẩu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperProfile;
