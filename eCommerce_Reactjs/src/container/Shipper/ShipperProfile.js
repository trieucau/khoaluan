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
        let imageBase64 = d.image || DEFAULT_AVATAR;
        
        // Handle Buffer if backend returns binary BLOB as Buffer object
        if (d.image && typeof d.image === 'object' && d.image.data) {
          const base64String = Buffer.from(d.image.data).toString('base64');
          imageBase64 = base64String.startsWith('data:image') ? base64String : `data:image/png;base64,${base64String}`;
        }

        setValues({
          firstName: d.firstName || '', lastName: d.lastName || '',
          address: d.address || '', phonenumber: d.phonenumber || '',
          genderId: d.genderId || 'M', email: d.email || '',
          image: imageBase64, imageReview: '',
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
    <div className="sp-page sp-profile-page">
      <div className="sp-page-header">
        <h1 className="sp-page-title">Thông tin cá nhân</h1>
        <p className="sp-page-subtitle">Quản lý và cập nhật thông tin tài khoản của bạn</p>
      </div>

      <div className="sp-profile-container">
        {/* Sidebar: Avatar & Summary */}
        <aside className="sp-profile-aside">
          <div className="sp-card avatar-section">
            <div className="avatar-wrapper">
              {displayImg && (displayImg.length > 100 || displayImg.startsWith('blob:')) ? (
                <img src={displayImg} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{initials}</div>
              )}
              <label className="avatar-upload-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
            </div>
            <div className="profile-brief">
              <h3 className="name">{[values.firstName, values.lastName].filter(Boolean).join(' ') || 'Shipper'}</h3>
              <p className="email">{values.email}</p>
              <div className="badge-wrapper">
                <span className="sp-badge sp-badge-blue">Tài xế chuyên nghiệp</span>
              </div>
            </div>
          </div>
          
          <Link to="/shipper/change-password" title="Bảo mật tài khoản" className="sp-btn sp-btn-ghost sp-btn-block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, marginRight: 8 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Đổi mật khẩu
          </Link>
        </aside>

        {/* Main Content: Form */}
        <main className="sp-profile-main">
          <div className="sp-card">
            <div className="sp-card-body">
              <div className="sp-form-grid">
                <div className="sp-form-group">
                  <label className="sp-form-label">Họ</label>
                  <input className="sp-input" name="firstName" value={values.firstName} onChange={handleChange} placeholder="Nguyễn" />
                </div>
                <div className="sp-form-group">
                  <label className="sp-form-label">Tên</label>
                  <input className="sp-input" name="lastName" value={values.lastName} onChange={handleChange} placeholder="Văn A" />
                </div>
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Email (Liên hệ)</label>
                <input className="sp-input readonly" value={values.email} readOnly />
              </div>

              <div className="sp-form-grid">
                <div className="sp-form-group">
                  <label className="sp-form-label">Số điện thoại</label>
                  <input className="sp-input" name="phonenumber" value={values.phonenumber} onChange={handleChange} placeholder="09xxxxxxx" />
                </div>
                <div className="sp-form-group">
                  <label className="sp-form-label">Giới tính</label>
                  <select className="sp-select" name="genderId" value={values.genderId} onChange={handleChange}>
                    {GENDER_OPTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Ngày sinh</label>
                <DatePicker
                  selected={birthday}
                  onChange={date => { setBirthday(date); setIsChangeDate(true); }}
                  dateFormat="dd/MM/yyyy"
                  showYearDropdown
                  customInput={<input className="sp-input" />}
                />
              </div>

              <div className="sp-form-group">
                <label className="sp-form-label">Địa chỉ cư trú</label>
                <input className="sp-input" name="address" value={values.address} onChange={handleChange} placeholder="Địa chỉ đầy đủ..." />
              </div>

              <div className="sp-form-actions">
                <button className="sp-btn sp-btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .sp-profile-page { max-width: 1000px; margin: 0 auto; padding-bottom: 60px; }
        .sp-profile-container { display: grid; grid-template-columns: 280px 1fr; gap: 24px; margin-top: 24px; }
        
        .avatar-section { padding: 32px 20px; text-align: center; margin-bottom: 16px; }
        .avatar-wrapper { position: relative; display: inline-block; margin-bottom: 16px; }
        .avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--sp-primary); box-shadow: 0 8px 24px rgba(59,130,246,0.2); }
        .avatar-placeholder { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--sp-primary), #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: #fff; border: 4px solid rgba(255,255,255,0.1); }
        
        .avatar-upload-btn { 
          position: absolute; bottom: 4px; right: 4px; width: 32px; height: 32px; 
          background: var(--sp-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; 
          color: #fff; cursor: pointer; border: 3px solid var(--sp-bg); transition: 0.2s;
        }
        .avatar-upload-btn:hover { transform: scale(1.1); }
        .avatar-upload-btn svg { width: 16px; height: 16px; }

        .profile-brief .name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .profile-brief .email { font-size: 13px; color: var(--sp-text-muted); margin-bottom: 16px; }
        
        .sp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sp-form-group { margin-bottom: 20px; }
        .sp-form-label { display: block; font-size: 13px; font-weight: 600; color: var(--sp-text-muted); margin-bottom: 8px; }
        
        .sp-input, .sp-select { 
          width: 100%; background: var(--sp-surface2); border: 1px solid var(--sp-border); 
          border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 14px; transition: 0.2s; outline: none;
        }
        .sp-input:focus { border-color: var(--sp-primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .sp-input.readonly { background: rgba(255,255,255,0.03); color: var(--sp-text-dim); cursor: not-allowed; }
        
        .sp-form-actions { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--sp-border); }
        .sp-btn-block { width: 100%; justify-content: center; }

        @media (max-width: 900px) {
          .sp-profile-container { grid-template-columns: 1fr; }
          .sp-profile-aside { max-width: 400px; margin: 0 auto; width: 100%; }
        }

        @media (max-width: 600px) {
          .sp-form-grid { grid-template-columns: 1fr; gap: 0; }
          .sp-page { padding: 20px 16px; }
        }
      `}</style>
    </div>
  );
};

export default ShipperProfile;
