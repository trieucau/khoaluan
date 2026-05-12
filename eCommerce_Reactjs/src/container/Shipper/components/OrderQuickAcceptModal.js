import React, { useMemo } from 'react';
import moment from 'moment';
import { getDistance } from '../../../utils/MapUtils';

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const OrderQuickAcceptModal = ({ orders, shipperPos, skippedIds, onAccept, onSkip, onClose }) => {
  // Process orders: separate unskipped and skipped
  const processedOrders = useMemo(() => {
    const unskipped = [];
    const skipped = [];

    // Sort by newest first
    const sorted = [...orders].sort((a, b) => b.id - a.id);

    sorted.forEach((order) => {
      // Calculate distance
      let distance = null;
      if (shipperPos && order.addressUser?.lat && order.addressUser?.lng) {
        distance = getDistance(
          shipperPos[0],
          shipperPos[1],
          parseFloat(order.addressUser.lat),
          parseFloat(order.addressUser.lng)
        );
      }

      // Calculate income
      const income = order.typeShipData?.price != null ? Number(order.typeShipData.price) : 20000;

      const enriched = { ...order, distance, income };

      if (skippedIds.has(order.id)) {
        skipped.push(enriched);
      } else {
        unskipped.push(enriched);
      }
    });

    return { unskipped, skipped };
  }, [orders, shipperPos, skippedIds]);

  const { unskipped, skipped } = processedOrders;

  return (
    <div className="sp-quick-accept-wrap" onClick={(e) => e.stopPropagation()}>
      <div className="sp-quick-accept-container">
        <div className="sp-qa-header">
          <div className="sp-qa-title">
            <svg
              className="sp-icon-sm"
              style={{ color: 'var(--sp-primary)' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Đơn mới có thể nhận
            {unskipped.length > 0 && <span className="sp-qa-count">{unskipped.length}</span>}
          </div>
          <button className="sp-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sp-qa-list">
          {unskipped.length === 0 && skipped.length === 0 ? (
            <div className="sp-qa-empty">
              <div className="sp-qa-empty-icon">
                <svg
                  className="sp-title-icon"
                  style={{ opacity: 0.5 }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                  <path d="M2 9.5 12 15l10-5.5" />
                </svg>
              </div>
              <div style={{ color: '#fff', fontWeight: 600 }}>Không có đơn hàng mới</div>
              <div style={{ color: 'var(--sp-text-dim)', fontSize: 12 }}>
                Vui lòng quay lại sau ít phút
              </div>
            </div>
          ) : (
            <>
              {unskipped.map((order, index) => (
                <div
                  key={order.id}
                  className="sp-qa-item"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="sp-qa-item-top">
                    <span className="sp-qa-id">Đơn #{order.id}</span>
                    <span className="sp-qa-time">{moment(order.createdAt).fromNow()}</span>
                  </div>

                  <div className="sp-qa-info-grid">
                    <div className="sp-qa-info-box">
                      <span className="sp-qa-info-label">Quãng đường</span>
                      <span className="sp-qa-info-val blue">
                        {order.distance ? `${order.distance.toFixed(1)} km` : '—'}
                      </span>
                    </div>
                    <div className="sp-qa-info-box">
                      <span className="sp-qa-info-label">Thu nhập</span>
                      <span className="sp-qa-info-val green">{formatMoney(order.income)}</span>
                    </div>
                  </div>

                  <div className="sp-qa-actions">
                    <button className="sp-qa-btn sp-qa-btn-skip" onClick={() => onSkip(order.id)}>
                      Bỏ qua
                    </button>
                    <button
                      className="sp-qa-btn sp-qa-btn-accept"
                      onClick={() => onAccept(order.id)}
                    >
                      <svg
                        className="sp-icon-xs"
                        style={{ marginRight: 6 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Nhận ngay
                    </button>
                  </div>
                </div>
              ))}

              {skipped.length > 0 && (
                <>
                  <div className="sp-qa-divider">
                    <span>Đơn đã xem</span>
                  </div>
                  {skipped.map((order, index) => (
                    <div
                      key={order.id}
                      className="sp-qa-item"
                      style={{
                        opacity: 0.6,
                        animationDelay: `${(unskipped.length + index) * 50}ms`,
                      }}
                    >
                      <div className="sp-qa-item-top">
                        <span className="sp-qa-id">Đơn #{order.id}</span>
                        <span className="sp-qa-time">{moment(order.createdAt).fromNow()}</span>
                      </div>

                      <div className="sp-qa-info-grid">
                        <div className="sp-qa-info-box">
                          <span className="sp-qa-info-label">Quãng đường</span>
                          <span className="sp-qa-info-val">
                            {order.distance ? `${order.distance.toFixed(1)} km` : '—'}
                          </span>
                        </div>
                        <div className="sp-qa-info-box">
                          <span className="sp-qa-info-label">Thu nhập</span>
                          <span className="sp-qa-info-val">{formatMoney(order.income)}</span>
                        </div>
                      </div>

                      <div className="sp-qa-actions">
                        <div />
                        <button
                          className="sp-qa-btn sp-qa-btn-accept"
                          onClick={() => onAccept(order.id)}
                        >
                          Nhận đơn
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderQuickAcceptModal;
