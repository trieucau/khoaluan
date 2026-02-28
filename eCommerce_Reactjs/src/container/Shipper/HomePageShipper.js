import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ShipperHeader from './ShipperHeader';
import ShipperSideBar from './ShipperSideBar';
import ShipperDashboard from './ShipperDashboard';
import OrdersAvailable from './OrdersAvailable';
import OrdersActive from './OrdersActive';
import ShipperMap from './ShipperMap';

const ShipperLayout = ({ children }) => (
  <div className="sb-nav-fixed">
    <ShipperHeader />
    <div id="layoutSidenav">
      <ShipperSideBar />
      <div id="layoutSidenav_content">
        <main>{children}</main>
      </div>
    </div>
  </div>
);

function HomePageShipper() {
  return (
    <ShipperLayout>
      <Routes>
        <Route path="/shipper" element={<ShipperDashboard />} />
        <Route path="/shipper/orders-available" element={<OrdersAvailable />} />
        <Route path="/shipper/my-orders" element={<OrdersActive />} />
        <Route path="/shipper/map" element={<ShipperMap />} />
      </Routes>
    </ShipperLayout>
  );
}

export default HomePageShipper;
