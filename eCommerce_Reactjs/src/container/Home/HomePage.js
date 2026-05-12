import React, { useState, useEffect } from 'react';
import HomeBanner from '../../component/HomeFeature/HomeBanner';
import MainFeature from '../../component/HomeFeature/MainFeature';
import ProductFeature from '../../component/HomeFeature/ProductFeature';
import NewProductFeature from '../../component/HomeFeature/NewProductFeature';
import HomeBlog from '../../component/HomeFeature/HomeBlog';
import {
  getAllBanner,
  getProductFeatureService,
  getProductNewService,
  getNewBlog,
  getProductRecommendService,
} from '../../services/userService';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import useScrollReveal from '../../hooks/useScrollReveal';

import { Link } from 'react-router-dom';

function HomePage(props) {
  const [dataProductFeature, setDataProductFeature] = useState([]);
  const [dataNewProductFeature, setNewProductFeature] = useState([]);
  const [dataNewBlog, setdataNewBlog] = useState([]);
  const [dataBanner, setdataBanner] = useState([]);
  const [dataProductRecommend, setdataProductRecommend] = useState([]);

  // Trigger scroll animations
  useScrollReveal();

  let settings = {
    dots: false,
    infinite: true,
    speed: 8000, // Tốc độ trượt liên tục (8 giây cho 1 ảnh)
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplaySpeed: 0, // Không có thời gian dừng
    autoplay: true,
    cssEase: 'linear', // Trượt đều không bị giật hay chậm lại
    variableWidth: true, // Chiều rộng của mỗi slide sẽ tự động bằng với chiều rộng thực của ảnh
    pauseOnHover: false,
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      fetchProductRecommend(userData.id);
    }
    fetchBlogFeature();
    fetchDataBrand();
    fetchProductFeature();
    fetchProductNew();

    window.scrollTo(0, 0);
  }, []);
  let fetchBlogFeature = async () => {
    let res = await getNewBlog(3);
    if (res && res.errCode === 0) {
      setdataNewBlog(res.data);
    }
  };
  let fetchProductFeature = async () => {
    let res = await getProductFeatureService(6);
    if (res && res.errCode === 0) {
      setDataProductFeature(res.data);
    }
  };
  let fetchProductRecommend = async (userId) => {
    let res = await getProductRecommendService({
      limit: 20,
      userId: userId,
    });
    if (res && res.errCode === 0) {
      setdataProductRecommend(res.data);
    }
  };
  let fetchDataBrand = async () => {
    let res = await getAllBanner({
      limit: 6,
      offset: 0,
      keyword: '',
    });
    if (res && res.errCode === 0) {
      setdataBanner(res.data);
    }
  };
  let fetchProductNew = async () => {
    let res = await getProductNewService(8);
    if (res && res.errCode === 0) {
      setNewProductFeature(res.data);
    }
  };
  return (
    <div>
      <section className="home_banner_area" style={{ position: 'relative' }}>
        <div className="marquee-container">
          <div className="marquee-track">
            {/* Original set */}
            {dataBanner &&
              dataBanner.length > 0 &&
              dataBanner.map((item, index) => {
                return <HomeBanner key={`orig-${item.id || index}`} image={item.image} />;
              })}
            {/* Duplicated set for infinite loop */}
            {dataBanner &&
              dataBanner.length > 0 &&
              dataBanner.map((item, index) => {
                return <HomeBanner key={`dup-${item.id || index}`} image={item.image} />;
              })}
          </div>
        </div>

        {/* Text nổi lên trên, hoàn toàn đứng im không trượt theo Slider */}
        <div
          className="banner_inner"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div className="container" style={{ width: '100%' }}>
            <div className="banner_content text-center" style={{ pointerEvents: 'auto' }}>
              <p className="sub">Bộ sưu tập mới</p>
              <h2>
                Phong cách <span>Riêng Của Bạn</span>
              </h2>
              <h4>Khám phá những thiết kế độc quyền tại Solana</h4>
              <Link className="main_btn" to="/shop" style={{ display: 'inline-flex' }}>
                Khám phá ngay
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MainFeature></MainFeature>
      <ProductFeature title={'Gợi ý sản phẩm'} data={dataProductRecommend}></ProductFeature>
      <NewProductFeature
        title="Sản phẩm mới"
        description="Những sản phẩm vừa ra mắt mới lạ cuốn hút người xem"
        data={dataNewProductFeature}
      ></NewProductFeature>
      <HomeBlog data={dataNewBlog} />
    </div>
  );
}

export default HomePage;
