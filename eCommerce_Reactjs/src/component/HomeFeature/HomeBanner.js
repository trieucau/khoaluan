import React from 'react';
import './HomeBanner.scss';
import { Link } from 'react-router-dom';

function HomeBanner({ image, name, title, subtitle }) {
  const bannerImage = image ? image : '/resources/img/banner1.jpg';

  return (
    <section className="home_banner_area">
      <div
        className="box-banner"
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="banner_inner">
          <div className="container">
            <div className="banner_content text-center">
              <p className="sub">{name || 'Bộ sưu tập mới'}</p>
              <h2>
                {title || 'Phong cách'} <span>Riêng Của Bạn</span>
              </h2>
              <h4>{subtitle || 'Khám phá những thiết kế độc quyền tại Solana'}</h4>
              <Link className="main_btn" to="/shop">
                Khám phá ngay
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeBanner;
