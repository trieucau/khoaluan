import React from 'react';
import HeaderContent from '../Content/HeaderContent';
import HomeBlogItem from './HomeBlogItem';
import './HomeBlog.scss';

function HomeBlog({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <section className="blog-area section-gap">
      <div className="container">
        <HeaderContent
          mainContent="Blog mới đăng"
          infoContent="Những bài blog về thời trang mới nhất từ Solana"
        />
        <div className="row g-3">
          {data.map((item, index) => (
            <HomeBlogItem key={index} data={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeBlog;
