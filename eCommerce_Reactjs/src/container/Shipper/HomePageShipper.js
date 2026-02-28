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
        <Route path="/" element={<ShipperDashboard />} />
        <Route path="/orders-available" element={<OrdersAvailable />} />
        <Route path="/my-orders" element={<OrdersActive />} />
        <Route path="/map" element={<ShipperMap />} />
      </Routes>
    </ShipperLayout>
  );
}

export default HomePageShipper;
