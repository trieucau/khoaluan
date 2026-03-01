import { useParams } from 'react-router-dom';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import TrackingMap from '../Map/TrackingMap';
const statusText = {
  S4: 'Shipper đang đến lấy hàng',
  S5: 'Đang giao hàng',
};

const OrderTracking = () => {
  const { orderId } = useParams();

  const { order, shipperLoc, deliveryCoords, loading, error } = useOrderTracking(orderId);

  if (loading) return <div className="container py-5 text-center">Đang tải...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  if (!order) return null;

  const showMap = order.statusId === 'S4' || order.statusId === 'S5';
  const shipper = order.shipperData;

  return (
    <div className="container py-4">
      <div className="card shadow-sm p-4">
        <h4>Theo dõi đơn hàng #{orderId}</h4>
        <hr />

        {/* ✅ Trạng thái */}
        <p>
          <strong>Trạng thái:</strong>{' '}
          <span className="badge bg-primary">
            {statusText[order.statusId] || order.statusOrderData?.value || order.statusId}
          </span>
        </p>

        {/* ✅ Địa chỉ */}
        <p>
          <strong>Địa chỉ giao:</strong> {order.addressUser?.shipAdress}
        </p>

        {/* ✅ Thông tin shipper */}
        {shipper && (
          <>
            <p>
              <strong>Shipper:</strong> {shipper.firstName} {shipper.lastName}
            </p>

            <a href={`tel:${shipper.phonenumber}`} className="btn btn-sm btn-outline-success">
              Gọi: {shipper.phonenumber}
            </a>
          </>
        )}

        {/* ✅ Bản đồ */}
        {showMap ? (
          <div style={{ marginTop: '20px' }}>
            <TrackingMap shipperLoc={shipperLoc} deliveryCoords={deliveryCoords} />
          </div>
        ) : (
          <div className="alert alert-warning mt-3">Bản đồ chưa khả dụng cho trạng thái này.</div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
