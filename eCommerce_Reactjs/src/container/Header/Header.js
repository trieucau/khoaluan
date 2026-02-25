import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import socketIOClient from "socket.io-client";

import { getItemCartStart } from "../../action/ShopCartAction";
import { listRoomOfUser } from "../../services/userService";
import TopMenu from "./TopMenu";
import "./Header.scss";

const Header = () => {
  const [quantityMessage, setQuantityMessage] = useState(0);
  const [user, setUser] = useState({});
  const [id, setId] = useState();

  const dispatch = useDispatch();
  const dataCart = useSelector((state) => state.shopcart.listCartItem);

  const host = process.env.REACT_APP_BACKEND_URL;
  const socketRef = useRef();

  // danh sách menu chính
  const navItems = [
    { path: "/", label: "Trang chủ", exact: true },
    { path: "/shop", label: "Cửa hàng" },
    { path: "/blog", label: "Tin tức" },
    { path: "/voucher", label: "Giảm giá" },
    { path: "/about", label: "Giới thiệu" },
  ];

  // lấy danh sách phòng chat + đếm tin nhắn chưa đọc
  const fetchListRoom = async (userId) => {
    const res = await listRoomOfUser(userId);
    if (res?.errCode === 0 && res.data?.[0]?.messageData?.length > 0) {
      const count = res.data[0].messageData.reduce(
        (acc, item) =>
          acc + (item.unRead === 1 && item.userId !== userId ? 1 : 0),
        0
      );
      setQuantityMessage(count);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    setUser(userData);

    if (userData) {
      dispatch(getItemCartStart(userData.id));

      socketRef.current = socketIOClient.connect(host);

      socketRef.current.on("getId", (data) => setId(data));
      socketRef.current.on("sendDataServer", () =>
        fetchListRoom(userData.id)
      );
      socketRef.current.on("loadRoomServer", () =>
        fetchListRoom(userData.id)
      );

      fetchListRoom(userData.id);

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [dispatch, host]);

  // sticky header khi scroll
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".main_menu");
      if (header) {
        header.classList.toggle("sticky", window.scrollY > 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="header_area">
      <TopMenu user={user} />

      <div className="main_menu">
        <div className="container">
          <nav className="navbar navbar-expand-lg navbar-light w-100">
            {/* logo */}
            <NavLink to="/" className="navbar-brand logo_h">
              <img src="/resources/img/logo.png" alt="Logo" style={{ width: "170px", height: "auto" }} />
            </NavLink>

            {/* nút toggle cho mobile */}
            <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>

            {/* nav links */}
            <div
              className="collapse navbar-collapse offset w-100"
              id="navbarSupportedContent"
            >
              <div className="row w-100 mr-0">
                <div className="col-lg-9 pr-0">
                  <ul className="nav navbar-nav center_nav pull-right">
                    {navItems.map((item, index) => (
                      <li key={index} className="nav-item">
                        <NavLink
                          exact={item.exact || false}
                          to={item.path}
                          className="nav-link"
                          activeClassName="selected"
                          activeStyle={{ color: "#71cd14" }}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* icon bên phải */}
                <div className="col-lg-3 pr-0">
                  <ul className="nav navbar-nav navbar-right right_nav pull-right">
                    {/* messenger */}
                    <li className="nav-item">
                      <Link to="/user/messenger" className="icons">
                        <i className="fa-brands fa-facebook-messenger"></i>
                      </Link>
                      {quantityMessage > 0 && (
                        <span className="box-message-quantity">
                          {quantityMessage}
                        </span>
                      )}
                    </li>

                    {/* giỏ hàng */}
                    <li className="nav-item">
                      <Link to="/shopcart" className="icons">
                        <i className="ti-shopping-cart" />
                      </Link>
                      {dataCart?.length > 0 && (
                        <span className="box-quantity-cart">
                          {dataCart.length}
                        </span>
                      )}
                    </li>

                    {/* user */}
                    <li className="nav-item">
                      <Link
                        to={`/user/detail/${user?.id || ""}`}
                        className="icons"
                      >
                        <i className="ti-user" aria-hidden="true" />
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
