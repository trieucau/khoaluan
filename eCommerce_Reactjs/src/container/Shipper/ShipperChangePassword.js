import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { handleChangePassword } from '../../services/userService';

const ShipperChangePassword = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const id = userData?.id;

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ oldpassword: '', newpassword: '', confirmpassword: '' });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });

  const handleChange = e => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const strength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6)  return { label: 'Yếu',       color: '#ef4444', width: '30%' };
    if (pw.length < 10) return { label: 'Trung bình', color: '#f59e0b', width: '60%' };
    return                     { label: 'Mạnh',       color: '#10b981', width: '100%' };
  };

  const pw       = strength(values.newpassword);
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
      const res = await handleChangePassword({ id, password: values.confirmpassword, oldpassword: values.oldpassword });
      if (res?.errCode === 0) {
        toast.success('✅ Đổi mật khẩu thành công!');
        setValues({ oldpassword: '', newpassword: '', confirmpassword: '' });
      } else toast.error(res?.errMessage || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  };

  const inputStyle = (extra = {}) => ({
    width: '100%', background: 'var(--sp-surface2)', border: '1px solid var(--sp-border)',
    borderRadius: 8, padding: '10px 44px 10px 13px', color: 'var(--sp-text)',
    fontSize: 13, fontFamily: 'inherit', outline: 'none', ...extra,
  });

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sp-text-dim)', cursor: 'pointer', fontSize: 16, padding: 0 }}>
      {showPass[field] ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="sp-page">
      {/* Header */}
      <div className="sp-page-header">
        <div className="sp-page-header-row">
          <div>
            <div className="sp-page-title">🔐 Đổi mật khẩu</div>
            <div className="sp-page-subtitle">Cập nhật mật khẩu bảo mật tài khoản Shipper</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/shipper/profile" className="sp-btn sp-btn-ghost">← Thông tin</Link>
            <Link to="/shipper" className="sp-btn sp-btn-ghost">🏠 Dashboard</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 460 }}>
        <div className="sp-card">
          <div className="sp-card-header"><span className="sp-card-title">🔐 Cập nhật mật khẩu</span></div>
          <div className="sp-card-body">

            {/* Tips */}
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--sp-text-muted)', lineHeight: 1.7 }}>
              💡 Mật khẩu mạnh nên có <b>ít nhất 10 ký tự</b>, bao gồm chữ hoa, chữ thường và số.
            </div>

            {/* Old password */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label className="sp-form-label">Mật khẩu hiện tại *</label>
              <input type={showPass.old ? 'text' : 'password'} name="oldpassword"
                value={values.oldpassword} onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại" style={inputStyle()} />
              <EyeBtn field="old" />
            </div>

            {/* New password */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label className="sp-form-label">Mật khẩu mới *</label>
              <input type={showPass.new ? 'text' : 'password'} name="newpassword"
                value={values.newpassword} onChange={handleChange}
                placeholder="Ít nhất 6 ký tự" style={inputStyle()} />
              <EyeBtn field="new" />
              {pw && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--sp-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pw.width, background: pw.color, borderRadius: 4, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: pw.color, marginTop: 3 }}>Độ mạnh: {pw.label}</div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <label className="sp-form-label">Xác nhận mật khẩu mới *</label>
              <input type={showPass.confirm ? 'text' : 'password'} name="confirmpassword"
                value={values.confirmpassword} onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                style={inputStyle({ borderColor: mismatch ? '#ef4444' : undefined })} />
              <EyeBtn field="confirm" />
              {mismatch && <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>⚠️ Mật khẩu không khớp</div>}
              {values.confirmpassword && !mismatch && values.newpassword && (
                <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>✅ Mật khẩu khớp</div>
              )}
            </div>

            <button className="sp-btn sp-btn-primary" onClick={handleSave}
              disabled={loading || !!mismatch} style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}>
              {loading ? '⏳ Đang cập nhật...' : '🔐 Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperChangePassword;
