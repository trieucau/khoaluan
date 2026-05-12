import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { handleChangePassword } from '../../../services/userService';

const AdminChangePassword = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ oldpassword: '', newpassword: '', confirmpassword: '' });
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false });

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const strength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Yếu', color: '#ef4444', width: '30%' };
    if (pw.length < 10) return { label: 'Trung bình', color: '#f59e0b', width: '60%' };
    return { label: 'Mạnh', color: '#10b981', width: '100%' };
  };

  const pw = strength(values.newpassword);
  const mismatch = values.confirmpassword && values.newpassword !== values.confirmpassword;

  const handleSave = async () => {
    if (!values.oldpassword || !values.newpassword || !values.confirmpassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (values.newpassword !== values.confirmpassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }
    if (values.newpassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      const res = await handleChangePassword({
        id,
        password: values.confirmpassword,
        oldpassword: values.oldpassword,
      });
      if (res?.errCode === 0) {
        toast.success('✅ Đổi mật khẩu thành công!');
        setValues({ oldpassword: '', newpassword: '', confirmpassword: '' });
      } else toast.error(res?.errMessage || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (extra = {}) => ({
    width: '100%',
    background: 'var(--ap-surface2)',
    border: '1px solid var(--ap-border)',
    borderRadius: 8,
    padding: '10px 44px 10px 13px',
    color: 'var(--ap-text-primary)',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    ...extra,
  });

  const EyeBtn = ({ field }) => (
    <button
      type="button"
      onClick={() => setShowPass((s) => ({ ...s, [field]: !s[field] }))}
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: 'var(--ap-text-dim)',
        cursor: 'pointer',
        fontSize: 16,
        padding: 0,
      }}
    >
      {showPass[field] ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-page-header">
        <div
          className="ap-page-header-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <div>
            <div className="ap-page-title">🔐 Đổi mật khẩu</div>
            <div className="ap-page-subtitle">Cập nhật mật khẩu bảo mật tài khoản Quản trị</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/admin/infor/${id}`} className="ap-btn ap-btn-ghost">
              ← Thông tin
            </Link>
            <Link to="/admin" className="ap-btn ap-btn-ghost">
              🏠 Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 460 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">🔐 Cập nhật mật khẩu</span>
          </div>
          <div className="ap-card-body">
            {/* Tips */}
            <div
              style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 20,
                fontSize: 12,
                color: 'var(--ap-text-dim)',
                lineHeight: 1.7,
              }}
            >
              💡 Mật khẩu mạnh nên có <b>ít nhất 10 ký tự</b>, bao gồm chữ hoa, chữ thường và số.
            </div>

            {/* Old password */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label
                className="ap-form-label"
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  color: 'var(--ap-text-secondary)',
                }}
              >
                Mật khẩu hiện tại *
              </label>
              <input
                type={showPass.old ? 'text' : 'password'}
                name="oldpassword"
                value={values.oldpassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                style={inputStyle()}
              />
              <EyeBtn field="old" />
            </div>

            {/* New password */}
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label
                className="ap-form-label"
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  color: 'var(--ap-text-secondary)',
                }}
              >
                Mật khẩu mới *
              </label>
              <input
                type={showPass.new ? 'text' : 'password'}
                name="newpassword"
                value={values.newpassword}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                style={inputStyle()}
              />
              <EyeBtn field="new" />
              {pw && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 4,
                      background: 'var(--ap-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: pw.width,
                        background: pw.color,
                        borderRadius: 4,
                        transition: 'width 0.3s, background 0.3s',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: pw.color, marginTop: 3 }}>
                    Độ mạnh: {pw.label}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <label
                className="ap-form-label"
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 13,
                  color: 'var(--ap-text-secondary)',
                }}
              >
                Xác nhận mật khẩu mới *
              </label>
              <input
                type={showPass.confirm ? 'text' : 'password'}
                name="confirmpassword"
                value={values.confirmpassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                style={inputStyle({ borderColor: mismatch ? '#ef4444' : undefined })}
              />
              <EyeBtn field="confirm" />
              {mismatch && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
                  ⚠️ Mật khẩu không khớp
                </div>
              )}
              {values.confirmpassword && !mismatch && values.newpassword && (
                <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>✅ Mật khẩu khớp</div>
              )}
            </div>

            <button
              className="ap-btn ap-btn-primary"
              onClick={handleSave}
              disabled={loading || !!mismatch}
              style={{
                width: '100%',
                justifyContent: 'center',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {loading ? '⏳ Đang cập nhật...' : '🔐 Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;
