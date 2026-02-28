import React from 'react';
import { Link } from 'react-router-dom';

const ShipperDashboard = () => {
  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Trang chủ Shipper</h1>
      <p className="lead">Chào bạn! Chọn một mục bên trái để bắt đầu.</p>
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Đơn có thể nhận</h5>
              <p className="card-text">Xem và nhận các đơn đang chờ shipper (S3).</p>
              <Link to="/shipper/orders-available" className="btn btn-primary">
                Xem đơn
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Đơn của tôi</h5>
              <p className="card-text">Quản lý đơn đã nhận: bắt đầu giao, hoàn thành, hủy.</p>
              <Link to="/shipper/my-orders" className="btn btn-primary">
                Đơn của tôi
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Bản đồ giao hàng</h5>
              <p className="card-text">Bật gửi vị trí realtime khi đang giao (S5).</p>
              <Link to="/shipper/map" className="btn btn-primary">
                Mở bản đồ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;
