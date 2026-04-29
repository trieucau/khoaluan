import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';

function PopularItemBlog({ data }) {
  if (!data) return null;
  const date = data.createdAt
    ? moment(data.createdAt).format('DD/MM/YYYY')
    : '';

  return (
    <div className="popular_post_widget">
      <Link to={`/blog-detail/${data.id}`} className="popular-post" style={{ textDecoration: 'none' }}>
        <img src={data.image} alt={data.title} loading="lazy" />
        <div className="popular-post__info">
          <h6>{data.title}</h6>
          {date && <span><i className="fa-regular fa-calendar" style={{ marginRight: '4px', color: 'var(--c-primary)' }} />{date}</span>}
        </div>
      </Link>
    </div>
  );
}

export default PopularItemBlog;
