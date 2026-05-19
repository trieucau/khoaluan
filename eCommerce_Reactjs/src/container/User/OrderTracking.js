import { useParams, useNavigate } from 'react-router-dom';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import TrackingMap from '../Map/TrackingMap';
import '../../css/user-pages.css';
import './OrderTracking.css';

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  S3: { label: 'Chờ xác nhận', icon: 'fa-solid fa-clock', color: '#F8B195', step: 1 },
  S4: { label: 'Chờ lấy hàng', icon: 'fa-solid fa-box', color: '#FF6B9D', step: 2 },
  S5: { label: 'Đang giao hàng', icon: 'fa-solid fa-truck-fast', color: '#3498DB', step: 3 },
  S6: { label: 'Đã giao hàng', icon: 'fa-solid fa-circle-check', color: '#2ECC71', step: 4 },
  S7: { label: 'Hủy đơn', icon: 'fa-solid fa-circle-xmark', color: '#E74C3C', step: -1 },
  S8: {
    label: 'Giao thất bại',
    icon: 'fa-solid fa-triangle-exclamation',
    color: '#E67E22',
    step: -1,
  },
};

const STEPS = [
  { key: 'S3', label: 'Chờ xác nhận', icon: 'fa-solid fa-clock' },
  { key: 'S4', label: 'Chờ lấy hàng', icon: 'fa-solid fa-box' },
  { key: 'S5', label: 'Đang giao hàng', icon: 'fa-solid fa-truck-fast' },
  { key: 'S6', label: 'Đã giao hàng', icon: 'fa-solid fa-circle-check' },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, shipperLoc, deliveryCoords, warehouse, loading, error } =
    useOrderTracking(orderId);

  /* ── Loading state ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ot-loading">
        <div className="ot-loading__spinner" />
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  /* ── Error state ──────────────────────────────────────────── */
  if (error) {
    return (
      <div className="ot-error">
        <i className="fa-solid fa-circle-exclamation" />
        <h3>{error}</h3>
        <button className="ot-back-btn" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left" /> Quay lại
        </button>
      </div>
    );
  }

  if (!order) return null;

  const showMap = order.statusId === 'S4' || order.statusId === 'S5';
  const shipper = order.shipperData;
  const statusCfg = STATUS_CONFIG[order.statusId] || STATUS_CONFIG.S3;
  const isFailed = order.statusId === 'S7' || order.statusId === 'S8';

  /* ── Active step index ────────────────────────────────────── */
  const currentStepIdx = isFailed ? -1 : STEPS.findIndex((s) => s.key === order.statusId);

  return (
    <div className="ot-page">
      {/* ── Back button ──────────────────────────────────────── */}
      <button className="ot-back-btn" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left" />
        Quay lại
      </button>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="ot-header">
        <div className="ot-header__left">
          <div className="ot-header__icon" style={{ background: statusCfg.color }}>
            <i className={statusCfg.icon} />
          </div>
          <div>
            <h1 className="ot-header__title">Theo dõi đơn hàng</h1>
            <p className="ot-header__id">#{orderId}</p>
          </div>
        </div>
        <div
          className="ot-status-badge"
          style={{
            background: `${statusCfg.color}18`,
            color: statusCfg.color,
            border: `1.5px solid ${statusCfg.color}40`,
          }}
        >
          <i className={statusCfg.icon} />
          {statusCfg.label}
        </div>
      </div>

      {/* Progress stepper */}
      {!isFailed && (
        <div className="ot-stepper">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <div
                key={step.key}
                className={`ot-step ${isDone ? 'ot-step--done' : ''} ${isActive ? 'ot-step--active' : ''}`}
              >
                {/* Connector line */}
                {idx > 0 && (
                  <div
                    className={`ot-step__line ${isDone || isActive ? 'ot-step__line--filled' : ''}`}
                  />
                )}
                <div className="ot-step__dot">
                  {isDone ? (
                    <i className="fa-solid fa-check" />
                  ) : isActive ? (
                    <i className={step.icon} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className="ot-step__label">{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Failed/Cancelled banner */}
      {isFailed && (
        <div className="ot-cancelled-banner">
          <div className="ot-cancelled-banner__header">
            <i className={statusCfg.icon} />
            {order.statusId === 'S7' ? 'Đơn hàng này đã bị hủy' : 'Giao hàng thất bại'}
          </div>
          {order.statusReason && (
            <div className="ot-cancelled-banner__reason">
              <strong>Lý do:</strong> {order.statusReason}
            </div>
          )}
        </div>
      )}

      {/* ── Info grid ────────────────────────────────────────── */}
      <div className="ot-info-grid">
        {/* Delivery address card */}
        <div className="ot-info-card">
          <div className="ot-info-card__header">
            <i className="fa-solid fa-location-dot" />
            Địa chỉ giao hàng
          </div>
          <div className="ot-info-card__body">
            {order.addressUser ? (
              <>
                <p className="ot-info-line">
                  <i className="fa-solid fa-user" />
                  {order.addressUser.shipName}
                </p>
                <p className="ot-info-line">
                  <i className="fa-solid fa-phone" />
                  {order.addressUser.shipPhonenumber}
                </p>
                <p className="ot-info-line">
                  <i className="fa-solid fa-map-pin" />
                  {order.addressUser.shipAdress}
                </p>
              </>
            ) : (
              <p className="ot-info-empty">Chưa có thông tin địa chỉ</p>
            )}
          </div>
        </div>

        {/* Shipper/Warehouse card */}
        <div className="ot-info-card">
          <div className="ot-info-card__header">
            {order.statusId === 'S4' ? (
              <>
                <i className="fa-solid fa-warehouse" />
                Thông tin kho hàng
              </>
            ) : (
              <>
                <i className="fa-solid fa-truck" />
                Thông tin shipper
              </>
            )}
          </div>
          <div className="ot-info-card__body">
            {order.statusId === 'S4' && warehouse ? (
              <>
                <p className="ot-info-line">
                  <i className="fa-solid fa-building" />
                  {warehouse.name}
                </p>
                <p className="ot-info-line">
                  <i className="fa-solid fa-phone" />
                  {warehouse.phonenumber || 'Chưa có SĐT'}
                </p>
                <p className="ot-info-line">
                  <i className="fa-solid fa-map-pin" />
                  {warehouse.address}
                </p>
              </>
            ) : shipper ? (
              <>
                <p className="ot-info-line">
                  <i className="fa-solid fa-user" />
                  {shipper.firstName} {shipper.lastName}
                </p>
                <p className="ot-info-line">
                  <i className="fa-solid fa-phone" />
                  {shipper.phonenumber}
                </p>
                <a href={`tel:${shipper.phonenumber}`} className="ot-call-btn">
                  <i className="fa-solid fa-phone" />
                  Gọi cho shipper
                </a>
              </>
            ) : (
              <p className="ot-info-empty">
                <i className="fa-solid fa-circle-info" />
                {order.statusId === 'S3'
                  ? 'Shop chưa chuẩn bị xong hàng'
                  : 'Không có thông tin shipper'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Map section ──────────────────────────────────────── */}
      <div className="ot-map-section">
        <div className="ot-map-section__header">
          <i className="fa-solid fa-map-location-dot" />
          Bản đồ theo dõi thời gian thực
          {showMap && (
            <span className="ot-live-badge">
              <span className="ot-live-dot" />
              LIVE
            </span>
          )}
        </div>

        {showMap ? (
          <div className="ot-map-wrapper">
            <TrackingMap
              shipperLoc={shipperLoc}
              deliveryCoords={deliveryCoords}
              statusId={order.statusId}
              shippingFee={order.typeShipData?.price}
            />
          </div>
        ) : (
          <div className="ot-map-unavailable">
            {order.statusId === 'S3' && (
              <>
                <i className="fa-solid fa-store" />
                <p>Đơn hàng đang chờ Shop xác nhận</p>
                <span>Bản đồ lộ trình sẽ xuất hiện sau khi Shop chuẩn bị xong hàng</span>
              </>
            )}
            {order.statusId === 'S6' && (
              <>
                <i className="fa-solid fa-box-open" style={{ color: '#2ECC71' }} />
                <p>Đơn hàng đã được giao thành công!</p>
                <span>Cảm ơn bạn đã mua sắm tại Solana</span>
              </>
            )}
            {isFailed && (
              <>
                <i className="fa-solid fa-ban" style={{ color: '#E74C3C' }} />
                <p>Bản đồ theo dõi đã bị vô hiệu hóa</p>
                <span>Giao dịch không thành công</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
