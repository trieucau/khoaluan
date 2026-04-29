import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';
import './ItemBlog.scss';

function ItemBlog({ data }) {
  if (!data) return null;
  const author = data.userData
    ? `${data.userData.firstName || ''} ${data.userData.lastName || ''}`.trim()
    : 'Solana';
  const commentCount = data.commentData ? data.commentData.length : 0;
  const dateDay = data.createdAt ? moment(data.createdAt).format('DD') : '';
  const dateMon = data.createdAt ? moment(data.createdAt).format('MMM') : '';

  return (
    <article className="blog-list-item">
      {/* Thumbnail */}
      <div className="blog-list-item__thumb">
        <img
          src={data.image}
          alt={data.title}
          loading="lazy"
        />
        {data.createdAt && (
          <div className="blog-list-item__date">
            <span className="blog-list-item__date-day">{dateDay}</span>
            <span className="blog-list-item__date-mon">{dateMon}</span>
          </div>
        )}
        <div className="blog-list-item__overlay" />
      </div>

      {/* Details */}
      <div className="blog-list-item__body">
        {/* Meta */}
        <div className="blog-list-item__meta">
          <span>
            <i className="fa-solid fa-user-pen" />
            {author}
          </span>
          <span>
            <i className="fa-regular fa-comment" />
            {commentCount} Bình luận
          </span>
        </div>

        {/* Title */}
        <Link to={`/blog-detail/${data.id}`} className="blog-list-item__title-link">
          <h2 className="blog-list-item__title">{data.title}</h2>
        </Link>

        {/* Description */}
        <p className="blog-list-item__desc">
          {data.shortdescription || data.description}
        </p>

        <Link to={`/blog-detail/${data.id}`} className="blog-list-item__cta">
          Đọc tiếp
          <i className="fa-solid fa-arrow-right" />
        </Link>
      </div>
    </article>
  );
}

export default ItemBlog;
