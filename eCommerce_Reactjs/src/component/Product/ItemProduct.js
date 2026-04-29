import React from 'react';
import { Link } from 'react-router-dom';
import CommonUtils from '../../utils/CommonUtils';
import './ItemProduct.scss';

function ItemProduct(props) {
  // Tính % giảm giá
  const discountPercent =
    props.price && props.discountPrice && props.price > props.discountPrice
      ? Math.round(((props.price - props.discountPrice) / props.price) * 100)
      : 0;

  return (
    <div className={props.type}>
      <Link to={`/detail-product/${props.id}`} className="product-card-link">
        <div className="product-card">
          {/* Badges */}
          <div className="product-badges">
            {discountPercent > 0 && (
              <span className="product-badge product-badge--sale">-{discountPercent}%</span>
            )}
          </div>

          {/* Image */}
          <div className="product-img-wrap">
            <img
              className="product-img"
              src={props.img}
              alt={props.name || 'Sản phẩm'}
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="product-overlay">
              <span className="product-overlay__btn">
                <i className="fa-solid fa-eye" />
                Xem chi tiết
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <h4 className="product-name">{props.name}</h4>
            <div className="product-price">
              <span className="product-price--current">
                {CommonUtils.formatter.format(props.discountPrice)}
              </span>
              {props.price && props.price !== props.discountPrice && (
                <del className="product-price--original">
                  {CommonUtils.formatter.format(props.price)}
                </del>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ItemProduct;
