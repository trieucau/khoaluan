import React from 'react';
import './MainFeature.scss';

const features = [
  {
    icon: 'fa-solid fa-tag',
    title: 'Mua nhiều giảm nhiều',
    desc: 'Giảm giá lên tận 50% cho đơn hàng combo',
    color: '#FF6B9D',
    bg: '#fff0f6',
  },
  {
    icon: 'fa-solid fa-truck-fast',
    title: 'Miễn phí vận chuyển',
    desc: 'Giao hàng nhanh trong phạm vi 5km',
    color: '#7C4DFF',
    bg: '#f3f0ff',
  },
  {
    icon: 'fa-solid fa-headset',
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng',
    color: '#00BCD4',
    bg: '#e0f7fa',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Thanh toán an toàn',
    desc: 'Bảo mật cao qua PayPal & VNPay',
    color: '#F8B195',
    bg: '#fff8f5',
  },
];

function MainFeature() {
  return (
    <section className="feature-area section_gap_bottom_custom">
      <div className="container">
        <div className="row g-4">
          {features.map((item, i) => (
            <div key={i} className="col-lg-3 col-md-6 col-sm-6">
              <div
                className="single-feature-card scroll-reveal"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feature-icon-wrap" style={{ background: item.bg }}>
                  <i className={item.icon} style={{ color: item.color }} />
                </div>
                <div className="feature-body">
                  <h5 className="feature-title">{item.title}</h5>
                  <p className="feature-desc">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MainFeature;
