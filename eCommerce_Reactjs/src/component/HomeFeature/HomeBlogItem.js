import React from 'react';
import { Link } from 'react-router-dom';
import './HomeBlog.scss';

function HomeBlogItem({ data }) {
  if (!data) return null;
  const authorName = data.userData
    ? `${data.userData.firstName || ''} ${data.userData.lastName || ''}`.trim()
    : 'Solana';
  const commentCount = data.commentData ? data.commentData.length : 0;

  // Format date
  const date = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="col-lg-4 col-md-6">
      <div className="blog-card">
        {/* Thumbnail */}
        <Link to={`/blog-detail/${data.id}`} className="blog-card__thumb">
          <img
            src={data.image}
            alt={data.title}
            loading="lazy"
          />
          <div className="blog-card__overlay" />
        </Link>

        {/* Content */}
        <div className="blog-card__body">
          {/* Meta */}
          <div className="blog-card__meta">
            <span className="blog-card__author">
              <i className="fa-solid fa-user-pen" />
              {authorName}
            </span>
            {date && (
              <span className="blog-card__date">
                <i className="fa-regular fa-calendar" />
                {date}
              </span>
            )}
            <span className="blog-card__comment">
              <i className="fa-regular fa-comment" />
              {commentCount}
            </span>
          </div>

          {/* Title */}
          <Link to={`/blog-detail/${data.id}`}>
            <h4 className="blog-card__title">{data.title}</h4>
          </Link>

          {/* Description */}
          <p className="blog-card__desc">{data.description}</p>

          {/* Read more */}
          <Link to={`/blog-detail/${data.id}`} className="blog-card__cta">
            Đọc thêm
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomeBlogItem;
