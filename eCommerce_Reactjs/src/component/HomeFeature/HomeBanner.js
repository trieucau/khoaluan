import React from 'react';
import './HomeBanner.scss';

function HomeBanner({ image }) {
  const bannerImage = image ? image : '/resources/img/banner1.jpg';

  return (
    <div className="box-banner">
      <img src={bannerImage} alt="Banner" className="banner-img" />
      <div className="banner_overlay"></div>
    </div>
  );
}

export default HomeBanner;
