import React, { useState } from 'react';
import { handleChangePassword } from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';

const ChangePassword = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ oldpassword: '', newpassword: '', confirmpassword: '' });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const strength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Yếu', color: '#ef4444', width: '30%' };
    if (pw.length < 10) return { label: 'Trung bình', color: '#f59e0b', width: '60%' };
    return { label: 'Mạnh', color: '#10b981', width: '100%' };
  };

  const pw = strength(values.newpassword);
  const mismatch = values.confirmpassword && values.newpassword !== values.confirmpassword;

  const handleSave = async () => {
    if (!values.oldpassword || !values.newpassword || !values.confirmpassword) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    if (values.newpassword !== values.confirmpassword) { toast.error('Mật khẩu nhập lại không khớp'); return; }
    if (values.newpassword.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      const res = await handleChangePassword({ id, password: values.confirmpassword, oldpassword: values.oldpassword });
      if (res?.errCode === 0) {
        toast.success('Đổi mật khẩu thành công');
        setValues({ oldpassword: '', newpassword: '', confirmpassword: '' });
      } else toast.error(res?.errMessage || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  };

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ap-text-dim)', cursor: 'pointer', fontSize: 16, padding: 0 }}>
      {showPass[field] ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">🔐 Đổi mật khẩu</div>
            <div className="ap-page-subtitle">Cập nhật mật khẩu bảo mật tài khoản</div>
          </div>
          <Link to="/admin" className="ap-btn ap-btn-ghost">← Về Dashboard</Link>
        </div>
      </div>

      <div className="ap-card" style={{ maxWidth: 480 }}>
        <div className="ap-card-header"><span className="ap-card-title">🔐 Thông tin mật khẩu</span></div>
        <div className="ap-card-body">
          <div className="ap-form-group" style={{ position: 'relative' }}>
            <label className="ap-label">Mật khẩu cũ *</label>
            <input className="ap-input" type={showPass.old ? 'text' : 'password'} name="oldpassword"
              value={values.oldpassword} onChange={handleChange} placeholder="Nhập mật khẩu hiện tại" style={{ paddingRight: 40 }} />
            <EyeBtn field="old" />
          </div>

          <div className="ap-form-group" style={{ position: 'relative' }}>
            <label className="ap-label">Mật khẩu mới *</label>
            <input className="ap-input" type={showPass.new ? 'text' : 'password'} name="newpassword"
              value={values.newpassword} onChange={handleChange} placeholder="Ít nhất 6 ký tự" style={{ paddingRight: 40 }} />
            <EyeBtn field="new" />
            {pw && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 4, borderRadius: 4, background: 'var(--ap-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pw.width, background: pw.color, transition: 'width 0.3s, background 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: pw.color, marginTop: 3 }}>{pw.label}</div>
              </div>
            )}
          </div>

          <div className="ap-form-group" style={{ position: 'relative' }}>
            <label className="ap-label">Xác nhận mật khẩu mới *</label>
            <input className="ap-input" type={showPass.confirm ? 'text' : 'password'} name="confirmpassword"
              value={values.confirmpassword} onChange={handleChange} placeholder="Nhập lại mật khẩu mới"
              style={{ paddingRight: 40, borderColor: mismatch ? '#ef4444' : undefined }} />
            <EyeBtn field="confirm" />
            {mismatch && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>⚠️ Mật khẩu không khớp</div>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading || mismatch}>
              {loading ? '⏳ Đang cập nhật...' : '🔐 Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChangePassword;
