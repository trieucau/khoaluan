import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import DetailUserPage from './DetailUserPage';
import CategoryUser from './CategoryUser';
import StoreVoucher from './StoreVoucher';
import AddressUser from './AddressUser';
import ChangePassword from '../System/User/ChangePassword';
import OrderUser from './OrderUser';
import OrderTracking from './OrderTracking';
import MessagePage from '../Message/MessagePage';
import '../../css/dashboard.css';

function UserHomePage(props) {
  const [user, setUser] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData);
  }, []);


  return (
    <div className="container user-dashboard-wrapper">
      <CategoryUser id={user.id} />
      <div className="user-dashboard-content">
        <Routes>
          <Route path="messenger" element={<MessagePage />} />
          <Route path="messenger/:id" element={<MessagePage />} />
          <Route path="detail/:id" element={<DetailUserPage />} />
          <Route path="store-voucher/:id" element={<StoreVoucher id={user.id} />} />
          <Route path="address/:id" element={<AddressUser id={user.id} />} />
          <Route path="order/:id" element={<OrderUser id={user.id} />} />
          <Route path="order-tracking/:orderId" element={<OrderTracking />} />
          <Route path="changepassword/:id" element={<ChangePassword id={user.id} />} />
        </Routes>
      </div>
    </div>
  );
}

export default UserHomePage;
