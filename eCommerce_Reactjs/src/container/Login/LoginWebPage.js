import React, { useEffect } from 'react';
import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginWebPage.css';
import { FacebookLoginButton, GoogleLoginButton } from 'react-social-login-buttons';
import {
  handleLoginService,
  handleLoginSocialService,
  checkPhonenumberEmail,
  createNewUser,
} from '../../services/userService';

import { authentication } from '../../utils/firebase';
import {
  signInWithPopup,
  FacebookAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
const LoginWebPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingCredRef = useRef(null);
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowPasswordRegister, setIsShowPasswordRegister] = useState(false);

  const [inputValues, setInputValues] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phonenumber: '',
    isOpen: false,
  });

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
  };
  let handleLogin = async () => {
    const element = document.querySelector('form');
    element.addEventListener('submit', (event) => {
      event.preventDefault();
    });
    let res = await handleLoginService({
      email: inputValues.email,
      password: inputValues.password,
    });

    if (res && res.errCode === 0) {
      localStorage.setItem('userData', JSON.stringify(res.user));
      localStorage.setItem('token', JSON.stringify(res.accessToken));
      if (res.user.roleId === 'R1' || res.user.roleId === 'R4') {
        window.location.href = '/admin';
      } else if (res.user.roleId === 'R3') {
        window.location.href = '/shipper';
      } else {
        window.location.href = '/';
      }
    } else {
      toast.error(res.errMessage);
    }
  };

  let handleSaveUser = async () => {
    const element = document.querySelector('form');
    element.addEventListener('submit', (event) => {
      event.preventDefault();
    });
    let res = await checkPhonenumberEmail({
      phonenumber: inputValues.phonenumber,
      email: inputValues.email,
    });
    if (res.isCheck === true) {
      toast.error(res.errMessage);
    } else {
      const { email, firstName, lastName, password, phonenumber } = inputValues;
      let res = await createNewUser({
        email,
        firstName,
        lastName,
        phonenumber,
        password,
        roleId: 'R2',
      });
      if (res && res.errCode === 0) {
        toast.success('Tạo tài khoản thành công');
        handleLogin();
      } else {
        toast.error(res.errMessage);
      }
    }
  };

  let signInwithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    try {
      const re = await signInWithPopup(authentication, provider);
      LoginWithSocial(re);
    } catch (err) {
      console.log(err.message);
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        toast.info(
          `Email ${email ? email + ' ' : ''}đã được đăng ký bằng Google. Vui lòng click "Đăng nhập với Google" bên dưới để liên kết tự động.`
        );
        pendingCredRef.current = FacebookAuthProvider.credentialFromError(err);
      } else {
        toast.error('Đăng nhập Facebook thất bại.');
      }
    }
  };
  let LoginWithSocial = async (re) => {
    try {
      const idToken = await re.user.getIdToken();
      let res = await handleLoginSocialService({
        idToken: idToken,
      });

      if (res && res.errCode === 0) {
        localStorage.setItem('userData', JSON.stringify(res.user));
        localStorage.setItem('token', JSON.stringify(res.accessToken));
        if (res.user.roleId === 'R1' || res.user.roleId === 'R4') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        toast.error(res.errMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error('Đã xảy ra lỗi khi đăng nhập mạng xã hội');
    }
  };
  let signInwithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const re = await signInWithPopup(authentication, provider);

      let finalUserResult = re;
      if (pendingCredRef.current) {
        try {
          finalUserResult = await linkWithCredential(re.user, pendingCredRef.current);
          toast.success('Liên kết tài khoản thành công!');
        } catch (linkError) {
          console.error('Lỗi khi liên kết tài khoản:', linkError);
          toast.error('Không thể liên kết tài khoản Facebook.');
        } finally {
          pendingCredRef.current = null;
        }
      }

      LoginWithSocial(finalUserResult);
    } catch (err) {
      console.log(err.message);
      pendingCredRef.current = null;
    }
  };

  return (
    <>
      <div className="box-login">
        <div className="login-container">
          <section id="formHolder">
            <div className="row">
              {/* Brand Box */}
              <div className="col-sm-6 brand">
                <a href="#" className="logo">
                  MR <span>.</span>
                </a>
                <div className="heading">
                  <h2>SOL</h2>
                  <p>Sự lựa chọn của bạn</p>
                </div>
              </div>
              {/* Form Box */}
              <div className="col-sm-6 form">
                {/* Login Form */}
                <div className={`login form-peice ${isRegister ? 'switched' : ''}`}>
                  <form className="login-form">
                    <div className="form-group">
                      <label htmlFor="loginemail">Địa chỉ email</label>
                      <input
                        name="email"
                        onChange={(event) => handleOnChange(event)}
                        type="email"
                        id="loginemail"
                        required
                      />
                    </div>
                    <div className="form-group password-group">
                      <label htmlFor="loginPassword">Mật khẩu</label>
                      <input
                        name="password"
                        onChange={(event) => handleOnChange(event)}
                        type={isShowPassword ? 'text' : 'password'}
                        id="loginPassword"
                        required
                      />
                      <span
                        className="password-toggle"
                        onClick={() => setIsShowPassword(!isShowPassword)}
                      >
                        {isShowPassword ? (
                          <i className="fa-solid fa-eye-slash"></i>
                        ) : (
                          <i className="fa-solid fa-eye"></i>
                        )}
                      </span>
                    </div>
                    <div className="CTA">
                      <input onClick={() => handleLogin()} type="submit" value="Đăng nhập" />
                      <a
                        style={{ cursor: 'pointer' }}
                        className="switch"
                        onClick={() => {
                          setIsRegister(true);
                          navigate('/register');
                        }}
                      >
                        Tài khoản mới
                      </a>
                    </div>
                    <FacebookLoginButton
                      text="Đăng nhập với Facebook"
                      iconSize="25px"
                      style={{
                        width: '300px',
                        height: '40px',
                        fontSize: '16px',
                        marginTop: '40px',
                        marginBottom: '10px',
                      }}
                      onClick={() => signInwithFacebook()}
                    />
                    <GoogleLoginButton
                      text="Đăng nhập với Google"
                      iconSize="25px"
                      style={{
                        width: '300px',
                        height: '40px',
                        fontSize: '16px',
                      }}
                      onClick={() => signInwithGoogle()}
                    />
                  </form>
                </div>
                {/* End Login Form */}
                {/* Signup Form */}
                <div className={`signup form-peice ${isRegister ? '' : 'switched'}`}>
                  <form className="signup-form">
                    <div className="form-group name-row">
                      <div className="name-group">
                        <label htmlFor="firstName">Họ</label>
                        <input
                          type="text"
                          name="firstName"
                          onChange={(event) => handleOnChange(event)}
                          id="firstName"
                          className="name"
                          placeholder="Nguyễn"
                        />
                      </div>
                      <div className="name-group">
                        <label htmlFor="lastName">Tên</label>
                        <input
                          type="text"
                          name="lastName"
                          onChange={(event) => handleOnChange(event)}
                          id="lastName"
                          className="name"
                          placeholder="Văn A"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Địa chỉ email</label>
                      <input
                        type="email"
                        name="email"
                        onChange={(event) => handleOnChange(event)}
                        id="email"
                        className="email"
                      />
                      <span className="error" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Số điện thoại</label>
                      <input
                        type="text"
                        name="phonenumber"
                        onChange={(event) => handleOnChange(event)}
                        id="phone"
                      />
                    </div>
                    <div className="form-group password-group">
                      <label htmlFor="password">Mật khẩu</label>
                      <input
                        type={isShowPasswordRegister ? 'text' : 'password'}
                        name="password"
                        onChange={(event) => handleOnChange(event)}
                        id="password"
                        className="pass"
                      />
                      <span
                        className="password-toggle"
                        onClick={() => setIsShowPasswordRegister(!isShowPasswordRegister)}
                      >
                        {isShowPasswordRegister ? (
                          <i className="fa-solid fa-eye-slash"></i>
                        ) : (
                          <i className="fa-solid fa-eye"></i>
                        )}
                      </span>
                      <span className="error" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="passwordCon">Xác nhận mật khẩu</label>
                      <input
                        type={isShowPasswordRegister ? 'text' : 'password'}
                        name="passwordCon"
                        id="passwordCon"
                        className="passConfirm"
                      />
                      <span className="error" />
                    </div>
                    <div className="CTA">
                      <input
                        onClick={() => handleSaveUser()}
                        type="submit"
                        value="Lưu"
                        id="submit"
                      />
                      <a
                        style={{ cursor: 'pointer' }}
                        className="switch"
                        onClick={() => {
                          setIsRegister(false);
                          navigate('/login');
                        }}
                      >
                        Tôi có tài khoản
                      </a>
                    </div>
                  </form>
                </div>
                {/* End Signup Form */}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};
export default LoginWebPage;
