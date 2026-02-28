import React, { useEffect, useState } from 'react';
import { getOrdersAvailableForShipper, shipperTakeOrder } from '../../services/userService';
import { toast } from 'react-toastify';
import moment from 'moment';

const OrdersAvailable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getOrdersAvailableForShipper();
      if (res && res.errCode === 0) setOrders(res.data || []);
      else setOrders([]);
    } catch (e) {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleTake = async (orderId) => {
    try {
      const res = await shipperTakeOrder(orderId);
      if (res && res.errCode === 0) {
        toast.success('Đã nhận đơn!');
        load();
      } else {
        toast.error(res?.errMessage || 'Không thể nhận đơn');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    }
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Đơn có thể nhận</h1>
      <p className="mb-4">Các đơn đang chờ shipper (S3). Bấm &quot;Nhận đơn&quot; để giao.</p>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="card">
          <div className="card-body">
            {orders.length === 0 ? (
              <p className="text-muted">Không có đơn nào.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Khách hàng</th>
                      <th>Địa chỉ giao</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>{moment(o.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                        <td>
                          {o.userData?.firstName} {o.userData?.lastName}
                        </td>
                        <td>{o.addressUser?.shipAdress}</td>
                        <td>{o.statusOrderData?.value || o.statusId}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleTake(o.id)}
                          >
                            Nhận đơn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersAvailable;
