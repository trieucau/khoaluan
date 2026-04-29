import React, { useState } from 'react';
import { handleChangePassword } from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import '../../../css/user-pages.css';

const EyeBtn = ({ show, onToggle }) => (
  <button type="button" className="pw-eye-btn" onClick={onToggle}>
    <i className={show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
  </button>
);

const StrengthBar = ({ password }) => {
  if (!password) return null;
  let label, color, width;
  if (password.length < 6)   { label = 'Yếu';       color = '#ef4444'; width = '30%'; }
  else if (password.length < 10) { label = 'Trung bình'; color = '#f59e0b'; width = '65%'; }
  else                        { label = 'Mạnh';      color = '#10b981'; width = '100%'; }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="pw-strength-bar">
        <div className="pw-strength-bar__fill" style={{ width, background: color }} />
      </div>
      <div className="pw-strength-label" style={{ color }}>{label}</div>
    </div>
  );
};

const ChangePassword = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ oldpassword: '', newpassword: '', confirmpassword: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });

  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));
  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const mismatch = values.confirmpassword && values.newpassword !== values.confirmpassword;

  const handleSave = async () => {
    if (!values.oldpassword || !values.newpassword || !values.confirmpassword) {
      toast.error('Vui lòng điền đầy đủ thông tin'); return;
    }
    if (values.newpassword !== values.confirmpassword) {
      toast.error('Mật khẩu nhập lại không khớp'); return;
    }
    if (values.newpassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return;
    }
    setLoading(true);
    try {
      const res = await handleChangePassword({
        id,
        password: values.confirmpassword,
        oldpassword: values.oldpassword,
      });
      if (res?.errCode === 0) {
        toast.success('Đổi mật khẩu thành công');
        setValues({ oldpassword: '', newpassword: '', confirmpassword: '' });
      } else {
        toast.error(res?.errMessage || 'Đổi mật khẩu thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-page">
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="user-card">
          {/* Header */}
          <div className="user-card__header">
            <h2 className="user-card__title">
              <i className="fa-solid fa-lock" />
              Đổi mật khẩu
            </h2>
            <Link to="/" className="user-btn-outline" style={{ fontSize: 13, padding: '8px 18px' }}>
              <i className="fa-solid fa-arrow-left" />
              Trang chủ
            </Link>
          </div>

          {/* Body */}
          <div className="user-card__body">
            {/* Mật khẩu cũ */}
            <div className="user-form-group">
              <label htmlFor="oldpassword">Mật khẩu hiện tại *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="oldpassword"
                  className="user-input"
                  type={show.old ? 'text' : 'password'}
                  name="oldpassword"
                  value={values.oldpassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  style={{ paddingRight: 40 }}
                />
                <EyeBtn show={show.old} onToggle={() => toggle('old')} />
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="user-form-group">
              <label htmlFor="newpassword">Mật khẩu mới *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newpassword"
                  className="user-input"
                  type={show.new ? 'text' : 'password'}
                  name="newpassword"
                  value={values.newpassword}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  style={{ paddingRight: 40 }}
                />
                <EyeBtn show={show.new} onToggle={() => toggle('new')} />
              </div>
              <StrengthBar password={values.newpassword} />
            </div>

            {/* Xác nhận */}
            <div className="user-form-group">
              <label htmlFor="confirmpassword">Xác nhận mật khẩu mới *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmpassword"
                  className={`user-input ${mismatch ? 'user-input--error' : ''}`}
                  type={show.confirm ? 'text' : 'password'}
                  name="confirmpassword"
                  value={values.confirmpassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  style={{ paddingRight: 40 }}
                />
                <EyeBtn show={show.confirm} onToggle={() => toggle('confirm')} />
              </div>
              {mismatch && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} />
                  Mật khẩu không khớp
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ marginTop: 8 }}>
              <button
                className="user-btn-primary"
                onClick={handleSave}
                disabled={loading || !!mismatch}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Đang cập nhật...</>
                  : <><i className="fa-solid fa-shield-halved" /> Đổi mật khẩu</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
