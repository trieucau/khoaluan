import React from 'react';
import { Link } from 'react-router-dom';

const ShipperSideBar = () => {
  return (
    <div id="layoutSidenav_nav">
      <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
        <div className="sb-sidenav-menu">
          <div className="nav">
            <Link to="/shipper" className="nav-link">
              <div className="sb-nav-link-icon">
                <i className="fas fa-tachometer-alt" />
              </div>
              Trang chủ
            </Link>
            <Link to="/shipper/orders-available" className="nav-link">
              <div className="sb-nav-link-icon">
                <i className="fas fa-list" />
              </div>
              Đơn có thể nhận
            </Link>
            <Link to="/shipper/my-orders" className="nav-link">
              <div className="sb-nav-link-icon">
                <i className="fas fa-box" />
              </div>
              Đơn của tôi
            </Link>
            <Link to="/shipper/map" className="nav-link">
              <div className="sb-nav-link-icon">
                <i className="fas fa-map-marker-alt" />
              </div>
              Bản đồ giao hàng
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ShipperSideBar;
