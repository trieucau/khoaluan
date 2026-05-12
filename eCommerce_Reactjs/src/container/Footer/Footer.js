import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.scss';

function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="footer-area">
      {/* Newsletter Banner */}
      <div className="footer-newsletter">
        <div className="container">
          <div className="footer-newsletter__inner">
            <div className="footer-newsletter__text">
              <h3>Đăng ký nhận thông báo</h3>
              <p>Nhận ngay voucher 10% cho đơn hàng đầu tiên</p>
            </div>
            <form className="footer-newsletter__form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-subscribe">
                {subscribed ? (
                  <>
                    <i className="fa-solid fa-check" />
                    Đã đăng ký!
                  </>
                ) : (
                  <>
                    Đăng ký
                    <i className="fa-solid fa-paper-plane" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="row g-5">
            {/* Brand Col */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-brand">
                <Link to="/" className="footer-logo">
                  <img src="/resources/img/logo.png" alt="Solana Shop" />
                </Link>
                <p className="footer-brand__desc">
                  Solana Shop — thương hiệu thời trang trẻ trung, hiện đại. Chúng tôi mang đến những
                  thiết kế độc đáo, chất lượng cao với mức giá phải chăng.
                </p>
                {/* Social Links */}
                <div className="footer-social">
                  <a
                    href="https://facebook.com"
                    className="social-btn"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-brands fa-facebook-f" />
                  </a>
                  <a
                    href="https://instagram.com"
                    className="social-btn"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-brands fa-instagram" />
                  </a>
                  <a
                    href="https://tiktok.com"
                    className="social-btn"
                    aria-label="TikTok"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-brands fa-tiktok" />
                  </a>
                  <a
                    href="https://youtube.com"
                    className="social-btn"
                    aria-label="YouTube"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-brands fa-youtube" />
                  </a>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="col-lg-2 col-md-3 col-6">
              <div className="footer-col">
                <h5 className="footer-col__title">Khám phá</h5>
                <ul className="footer-col__list">
                  <li>
                    <Link to="/">Trang chủ</Link>
                  </li>
                  <li>
                    <Link to="/shop">Cửa hàng</Link>
                  </li>
                  <li>
                    <Link to="/blog">Tin tức</Link>
                  </li>
                  <li>
                    <Link to="/voucher">Giảm giá</Link>
                  </li>
                  <li>
                    <Link to="/about">Giới thiệu</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Account Links */}
            <div className="col-lg-2 col-md-3 col-6">
              <div className="footer-col">
                <h5 className="footer-col__title">Tài khoản</h5>
                <ul className="footer-col__list">
                  <li>
                    <Link to="/login">Đăng nhập</Link>
                  </li>
                  <li>
                    <Link to="/register">Đăng ký</Link>
                  </li>
                  <li>
                    <Link to="/shopcart">Giỏ hàng</Link>
                  </li>
                  <li>
                    <Link to="/voucher">Kho voucher</Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Info */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-col">
                <h5 className="footer-col__title">Liên hệ</h5>
                <ul className="footer-contact">
                  <li>
                    <span className="footer-contact__icon">
                      <i className="fa-solid fa-phone" />
                    </span>
                    <span>1900 6868</span>
                  </li>
                  <li>
                    <span className="footer-contact__icon">
                      <i className="fa-solid fa-envelope" />
                    </span>
                    <span>solanashop77@gmail.com</span>
                  </li>
                  <li>
                    <span className="footer-contact__icon">
                      <i className="fa-solid fa-location-dot" />
                    </span>
                    <span>TP. Hồ Chí Minh, Việt Nam</span>
                  </li>
                  <li>
                    <span className="footer-contact__icon">
                      <i className="fa-regular fa-clock" />
                    </span>
                    <span>T2 - CN: 8:00 - 21:00</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom__inner">
            <p className="footer-bottom__copy">
              Bản quyền &copy;{new Date().getFullYear()} — Đồ án tốt nghiệp của{' '}
              <strong>Phan Thành Triều</strong> &amp; <strong>Võ Quang Tuấn Trí</strong>
            </p>
            <div className="footer-bottom__payment">
              <img
                src="/resources/img/payment/visa.png"
                alt="Visa"
                onError={(e) => (e.target.style.display = 'none')}
              />
              <img
                src="/resources/img/payment/mastercard.png"
                alt="Mastercard"
                onError={(e) => (e.target.style.display = 'none')}
              />
              <img
                src="/resources/img/payment/paypal.png"
                alt="PayPal"
                onError={(e) => (e.target.style.display = 'none')}
              />
              <span className="footer-vnpay">VNPay</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
