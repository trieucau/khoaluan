import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import socketIOClient from 'socket.io-client';

import { getItemCartStart } from '../../action/ShopCartAction';
import { listRoomOfUser } from '../../services/userService';
import TopMenu from './TopMenu';
import GlobalEffect from '../../component/Effects/GlobalEffect';
import './Header.scss';

const Header = () => {
  const [quantityMessage, setQuantityMessage] = useState(0);
  const [user, setUser] = useState({});
  const [id, setId] = useState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dispatch = useDispatch();
  const dataCart = useSelector((state) => state.shopcart.listCartItem);

  const host = process.env.REACT_APP_BACKEND_URL;
  const socketRef = useRef();

  const navItems = [
    { path: '/', label: 'Trang chủ', end: true },
    { path: '/shop', label: 'Cửa hàng', end: false },
    { path: '/blog', label: 'Tin tức', end: false },
    { path: '/voucher', label: 'Giảm giá', end: false },
    { path: '/about', label: 'Giới thiệu', end: false },
  ];

  const fetchListRoom = async (userId) => {
    const res = await listRoomOfUser(userId);
    if (res?.errCode === 0 && res.data?.[0]?.messageData?.length > 0) {
      const count = res.data[0].messageData.reduce(
        (acc, item) => acc + (item.unRead === 1 && item.userId !== userId ? 1 : 0),
        0
      );
      setQuantityMessage(count);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData);

    if (userData) {
      dispatch(getItemCartStart(userData.id));

      socketRef.current = socketIOClient.connect(host);
      socketRef.current.on('getId', (data) => setId(data));
      socketRef.current.on('sendDataServer', () => fetchListRoom(userData.id));
      socketRef.current.on('loadRoomServer', () => fetchListRoom(userData.id));
      fetchListRoom(userData.id);

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [dispatch, host]);

  // Sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.main_menu');
      if (header) header.classList.toggle('sticky', window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <header className="header_area">
      <GlobalEffect />
      <TopMenu user={user} />

      <div className="main_menu">
        <div className="container">
          <nav className="navbar navbar-expand-lg navbar-light w-100">
            {/* Logo */}
            <NavLink to="/" className="navbar-brand logo_h">
              <img
                src="/resources/img/logo.png"
                alt="Solana Shop"
                style={{ width: '170px', height: 'auto' }}
              />
            </NavLink>

            {/* Mobile toggle */}
            <button
              className="navbar-toggler d-lg-none"
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>

            {/* Nav links */}
            <div
              className={`navbar-collapse${mobileOpen ? ' show' : ''} d-lg-flex`}
              id="navbarSupportedContent"
            >
              <div className="row w-100 mr-0 align-items-center">
                {/* Center nav */}
                <div className="col-lg-9 pr-0">
                  <ul className="nav navbar-nav center_nav">
                    {navItems.map((item) => (
                      <li key={item.path} className="nav-item">
                        <NavLink
                          to={item.path}
                          end={item.end}
                          className={({ isActive }) =>
                            isActive ? 'nav-link selected' : 'nav-link'
                          }
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}

                    {/* Mobile-only auth links */}
                    {user?.id ? (
                      <li className="nav-item mobile-only">
                        <a
                          className="nav-link"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.preventDefault();
                            localStorage.removeItem('userData');
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                          }}
                        >
                          Đăng xuất
                        </a>
                      </li>
                    ) : (
                      <>
                        <li className="nav-item mobile-only">
                          <NavLink
                            to="/login"
                            className={({ isActive }) =>
                              isActive ? 'nav-link selected' : 'nav-link'
                            }
                            onClick={() => setMobileOpen(false)}
                          >
                            Đăng nhập
                          </NavLink>
                        </li>
                        <li className="nav-item mobile-only">
                          <NavLink
                            to="/register"
                            className={({ isActive }) =>
                              isActive ? 'nav-link selected' : 'nav-link'
                            }
                            onClick={() => setMobileOpen(false)}
                          >
                            Đăng ký
                          </NavLink>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Right icons */}
                <div className="col-lg-3 pr-0">
                  <ul className="nav navbar-nav navbar-right right_nav pull-right">
                    {/* Messenger */}
                    <li className="nav-item" style={{ position: 'relative' }}>
                      <Link to="/user/messenger" className="icons">
                        <i className="fa-brands fa-facebook-messenger" />
                      </Link>
                      {quantityMessage > 0 && (
                        <span className="box-message-quantity">{quantityMessage}</span>
                      )}
                    </li>

                    {/* Cart */}
                    <li className="nav-item" style={{ position: 'relative' }}>
                      <Link to="/shopcart" className="icons">
                        <i className="ti-shopping-cart" />
                      </Link>
                      {dataCart?.length > 0 && (
                        <span className="box-quantity-cart">{dataCart.length}</span>
                      )}
                    </li>

                    {/* User */}
                    <li className="nav-item">
                      <Link to={`/user/detail/${user?.id || ''}`} className="icons">
                        <i className="ti-user" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
