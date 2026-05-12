import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import {
  getDetailUserById,
  UpdateUserService,
  handleSendVerifyEmail,
} from '../../../services/userService';
import { useFetchAllcode } from '../../customize/fetch';
import CommonUtils from '../../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const DEFAULT_AVATAR =
  'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg';

const Information = () => {
  const { id } = useParams();
  const { data: dataGender } = useFetchAllcode('GENDER');
  const [birthday, setBirthday] = useState(new Date());
  const [isChangeDate, setIsChangeDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phonenumber: '',
    genderId: '',
    dob: '',
    roleId: '',
    email: '',
    image: DEFAULT_AVATAR,
    isActiveEmail: '',
    imageReview: '',
  });

  useEffect(() => {
    getDetailUserById(id).then((res) => {
      if (res?.errCode === 0) {
        const d = res.data;
        setValues({
          firstName: d.firstName,
          lastName: d.lastName,
          address: d.address,
          phonenumber: d.phonenumber,
          genderId: d.genderId,
          roleId: d.roleId,
          email: d.email,
          id: d.id,
          dob: d.dob,
          image: d.image || DEFAULT_AVATAR,
          isActiveEmail: d.isActiveEmail,
          imageReview: '',
        });
        setBirthday(moment.unix(+d.dob / 1000).toDate());
      }
    });
  }, [id]);

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 31312281) {
      toast.error('Dung lượng < 30MB');
      return;
    }
    const base64 = await CommonUtils.getBase64(file);
    setValues((v) => ({ ...v, image: base64, imageReview: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await UpdateUserService({
        id,
        firstName: values.firstName,
        lastName: values.lastName,
        address: values.address,
        roleId: values.roleId,
        genderId: values.genderId,
        phonenumber: values.phonenumber,
        dob: isChangeDate ? new Date(birthday).getTime() : values.dob,
        image: values.image,
      });
      if (res?.errCode === 0) toast.success('Cập nhật thành công');
      else toast.error(res?.errMessage || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const res = await handleSendVerifyEmail({ id });
    if (res?.errCode === 0) toast.success('Email xác thực đã được gửi');
    else toast.error(res?.errMessage);
  };

  const displayImg = values.imageReview || values.image;
  const initials = `${values.firstName?.[0] || ''}${values.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              <i className="fa-solid fa-user" style={{ marginRight: 8 }}></i>Thông tin cá nhân
            </div>
            <div className="ap-page-subtitle">Xem và cập nhật thông tin tài khoản Admin</div>
          </div>
          <Link to="/admin" className="ap-btn ap-btn-ghost">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Avatar panel */}
        <div className="ap-card">
          <div className="ap-card-body" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {displayImg && displayImg !== DEFAULT_AVATAR ? (
                <img
                  src={displayImg}
                  alt="avatar"
                  onClick={() => setLightboxOpen(true)}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--ap-primary)',
                    cursor: 'zoom-in',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--ap-primary), #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 40,
                    fontWeight: 800,
                    color: '#fff',
                    border: '3px solid var(--ap-primary)',
                    margin: '0 auto',
                  }}
                >
                  {initials || '?'}
                </div>
              )}
              <input
                type="file"
                id="avatarImg"
                accept=".jpg,.png,.webp"
                hidden
                onChange={handleImageChange}
              />
              <label
                htmlFor="avatarImg"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--ap-primary)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  border: '2px solid var(--ap-surface)',
                }}
              >
                📷
              </label>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {values.firstName} {values.lastName}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--ap-text-muted)' }}>{values.email}</span>
              {values.isActiveEmail === 1 ? (
                <span style={{ color: '#10b981', fontSize: 16 }}>✔</span>
              ) : (
                <span style={{ color: '#ef4444', fontSize: 16 }}>✖</span>
              )}
            </div>
            {values.isActiveEmail === 0 && (
              <button
                className="ap-btn ap-btn-ghost"
                style={{ marginTop: 10, fontSize: 12 }}
                onClick={handleSendEmail}
              >
                📧 Gửi email xác thực
              </button>
            )}
            <div style={{ marginTop: 12 }}>
              <span
                className={`ap-badge ${values.roleId === 'R1' ? 'ap-badge-indigo' : 'ap-badge-cyan'}`}
              >
                {values.roleId === 'R1' ? (
                  '👑 Admin'
                ) : values.roleId === 'R2' ? (
                  <>
                    <i className="fa-solid fa-box" style={{ marginRight: 8 }}></i>Shipper
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user" style={{ marginRight: 8 }}></i>User
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">
              <i className="fa-solid fa-pen-to-square" style={{ marginRight: 8 }}></i>Chỉnh sửa
              thông tin
            </span>
          </div>
          <div className="ap-card-body">
            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">Họ</label>
                <input
                  className="ap-input"
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  placeholder="Nguyễn"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Tên</label>
                <input
                  className="ap-input"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  placeholder="Văn A"
                />
              </div>
            </div>
            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">Số điện thoại</label>
                <input
                  className="ap-input"
                  name="phonenumber"
                  value={values.phonenumber}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Ngày sinh</label>
                <div className="ap-datepicker-wrap" style={{ display: 'block' }}>
                  <DatePicker
                    className="ap-input"
                    selected={birthday}
                    dateFormat="dd/MM/yyyy"
                    onChange={(d) => {
                      setBirthday(d);
                      setIsChangeDate(true);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Địa chỉ</label>
              <input
                className="ap-input"
                name="address"
                value={values.address}
                onChange={handleChange}
                placeholder="123 Đường ABC, Q.1..."
              />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Giới tính</label>
              <select
                className="ap-select"
                name="genderId"
                value={values.genderId}
                onChange={handleChange}
              >
                {dataGender?.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.value}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
              </button>
              <Link to={`/admin/change-password/${id}`} className="ap-btn ap-btn-ghost">
                🔐 Đổi mật khẩu
              </Link>
            </div>
          </div>
        </div>
      </div>
      {lightboxOpen && (
        <Lightbox
          slides={[{ src: displayImg }]}
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
export default Information;
