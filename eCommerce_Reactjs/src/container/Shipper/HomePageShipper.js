import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ShipperHeader from './ShipperHeader';
import ShipperSideBar from './ShipperSideBar';
import ShipperDashboard from './ShipperDashboard';
import OrdersAvailable from './OrdersAvailable';
import OrdersActive from './OrdersActive';
import ShipperMap from '../Map/ShipperMap';
import '../../css/shipper.css';

const HomePageShipper = () => {
  return (
    <div className="shipper-portal">
      <div className="sp-layout">
        <div className="sp-header">
          <ShipperHeader />
        </div>
        <div className="sp-sidebar">
          <ShipperSideBar />
        </div>
        <main className="sp-main">
          <Routes>
            <Route path="/" element={<ShipperDashboard />} />
            <Route path="/orders-available" element={<OrdersAvailable />} />
            <Route path="/my-orders" element={<OrdersActive />} />
            <Route path="/map" element={<ShipperMap />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default HomePageShipper;
