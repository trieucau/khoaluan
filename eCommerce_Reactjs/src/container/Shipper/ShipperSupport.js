import React, { useState } from 'react';

const ShipperSupport = () => {
  const [formData, setFormData] = useState({ category: 'general', content: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Feature not yet integrated notification
    setTimeout(() => {
      alert('Tính năng "Gửi yêu cầu hỗ trợ" hiện đang trong quá trình tích hợp hệ thống. Vui lòng liên hệ qua Hotline hoặc Zalo để được hỗ trợ ngay lập tức!');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="sp-page" style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">
          Hỗ trợ trực tuyến
        </div>
        <div className="sp-page-subtitle">Liên hệ ngay để được giải đáp thắc mắc và xử lý sự cố nhanh chóng</div>
      </div>

      {/* Primary Contact Cards */}
      <div className="sp-quick-grid" style={{ marginBottom: 32 }}>
        <a href="tel:19006868" className="sp-card sp-support-card" style={{ textDecoration: 'none' }}>
          <div className="sp-card-body" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div className="sp-support-icon-circle blue">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Hotline 24/7</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--sp-primary-light)', letterSpacing: 1 }}>1900 6868</div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-dim)', marginTop: 8 }}>Gọi ngay để xử lý sự cố khẩn cấp</div>
          </div>
        </a>

        <a href="https://zalo.me" target="_blank" rel="noreferrer" className="sp-card sp-support-card" style={{ textDecoration: 'none' }}>
          <div className="sp-card-body" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div className="sp-support-icon-circle cyan">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Chat Zalo</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#06b6d4', letterSpacing: 1 }}>Hỗ trợ Chat</div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-dim)', marginTop: 8 }}>Nhắn tin cho điều phối viên</div>
          </div>
        </a>
      </div>

      {/* Support Form */}
      <div className="sp-card">
        <div className="sp-card-header">
          <div className="sp-card-title">Gửi yêu cầu hỗ trợ</div>
        </div>
        <div className="sp-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="sp-form-label">Loại yêu cầu</label>
              <select
                className="sp-textarea"
                style={{ height: 44, padding: '0 14px' }}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="general">Hỗ trợ chung</option>
                <option value="order">Sự cố đơn hàng</option>
                <option value="app">Lỗi ứng dụng</option>
                <option value="payment">Vấn đề thanh toán/thu nhập</option>
                <option value="account">Tài khoản & Hồ sơ</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="sp-form-label">Nội dung chi tiết</label>
              <textarea
                className="sp-textarea"
                rows="5"
                placeholder="Mô tả vấn đề bạn đang gặp phải..."
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <div className="sp-char-count">{formData.content.length}/500</div>
            </div>

            <button
              type="submit"
              className="sp-btn sp-btn-primary"
              style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg className="sp-refresh-icon spinning" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Đang gửi...
                </span>
              ) : 'Gửi yêu cầu ngay'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .sp-support-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(31, 41, 55, 0.4);
          border-color: rgba(255, 255, 255, 0.05);
        }
        .sp-support-card:hover {
          transform: translateY(-8px);
          background: rgba(31, 41, 55, 0.6);
          border-color: var(--sp-primary);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .sp-support-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: var(--sp-transition);
        }
        .sp-support-icon-circle.blue {
          background: rgba(59, 130, 246, 0.15);
          color: var(--sp-primary-light);
        }
        .sp-support-icon-circle.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #06b6d4;
        }
        .sp-support-card:hover .sp-support-icon-circle {
          transform: scale(1.1) rotate(10deg);
        }
      `}</style>
    </div>
  );
};

export default ShipperSupport;
