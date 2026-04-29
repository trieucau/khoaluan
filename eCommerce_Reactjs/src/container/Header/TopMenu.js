import React from 'react';
import { NavLink } from 'react-router-dom';
import './Header.scss';

const TopMenu = (props) => {
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const name =
    props.user && props.user.id
      ? `${props.user.firstName || ''} ${props.user.lastName || ''}`.trim()
      : '';

  return (
    <div className="top_menu">
      <div className="container">
        <div className="row">
          <div className="col-lg-7">
            <div className="float-left">
              <p>
                <i className="fa-solid fa-phone" style={{ fontSize: '11px' }} />
                19006868
              </p>
              <p>
                <i className="fa-solid fa-envelope" style={{ fontSize: '11px' }} />
                solanashop77@gmail.com
              </p>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="float-right">
              <ul className="right_side">
                <li>
                  {props.user && props.user.id ? (
                    <NavLink to={`/user/detail/${props.user.id}`}>
                      {name}
                    </NavLink>
                  ) : (
                    <NavLink to="/login">Đăng nhập</NavLink>
                  )}
                </li>
                <li>
                  {props.user && props.user.id ? (
                    <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
                      Đăng xuất
                    </a>
                  ) : (
                    <NavLink to="/register">Đăng ký</NavLink>
                  )}
                </li>
                <li>
                  <a>VI</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMenu;
