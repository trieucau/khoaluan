import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import {
  getDetailUserById,
  UpdateUserService,
  handleSendVerifyEmail,
} from '../../services/userService';
import { useFetchAllcode } from '../customize/fetch';
import CommonUtils from '../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import '../../css/user-pages.css';
import './DetailUserPage.scss';

function DetailUserPage() {
  const { id } = useParams();
  const { data: dataGender } = useFetchAllcode('GENDER');
  const [birthday, setbirthday] = useState(new Date());
  const [isChangeDate, setisChangeDate] = useState(false);
  const [inputValues, setInputValues] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phonenumber: '',
    genderId: '',
    dob: '',
    roleId: '',
    email: '',
    image: '',
    isActiveEmail: '',
    imageReview: '',
    isOpen: false,
  });

  if (dataGender && dataGender.length > 0 && inputValues.genderId === null) {
    setInputValues({ ...inputValues, genderId: dataGender[0].code });
  }

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getDetailUserById(id);
      if (res?.errCode === 0) setStateUser(res.data);
    };
    fetchUser();
  }, [id]);

  const setStateUser = (data) => {
    setInputValues({
      ...inputValues,
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      phonenumber: data.phonenumber,
      genderId: data.genderId,
      roleId: data.roleId,
      email: data.email,
      id: data.id,
      dob: data.dob,
      image: data.image ||
        'https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg',
      isActiveEmail: data.isActiveEmail,
    });
    setbirthday(moment.unix(+data.dob / 1000).locale('vi').toDate());
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValues({ ...inputValues, [name]: value });
  };

  const handleOnChangeDatePicker = (date) => {
    setbirthday(date);
    setisChangeDate(true);
  };

  const handleSaveInfor = async () => {
    const res = await UpdateUserService({
      id,
      firstName: inputValues.firstName,
      lastName: inputValues.lastName,
      address: inputValues.address,
      roleId: inputValues.roleId,
      genderId: inputValues.genderId,
      phonenumber: inputValues.phonenumber,
      dob: isChangeDate ? new Date(birthday).getTime() : inputValues.dob,
      image: inputValues.image,
    });
    if (res?.errCode === 0) toast.success('Cập nhật thành công!');
    else toast.error(res?.errMessage);
  };

  const handleSendEmail = async () => {
    const res = await handleSendVerifyEmail({ id });
    if (res?.errCode === 0) toast.success('Vui lòng kiểm tra email!');
    else toast.error(res?.errMessage);
  };

  const handleOnChangeImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 31312281) { toast.error('File phải nhỏ hơn 30MB'); return; }
    const base64 = await CommonUtils.getBase64(file);
    const objectUrl = URL.createObjectURL(file);
    setInputValues({ ...inputValues, image: base64, imageReview: objectUrl });
  };

  const openPreviewImage = (url) => {
    setInputValues({ ...inputValues, isOpen: true, imageReview: url });
  };

  const displayName = `${inputValues.firstName || ''} ${inputValues.lastName || ''}`.trim() || 'Người dùng';

  return (
    <div className="user-page">
      <div className="container-fluid px-0">
        <div className="user-card">
          <div className="row g-0" style={{ minHeight: 500 }}>

            {/* ── Left: Avatar panel ── */}
            <div className="col-md-3 col-sm-12">
              <div className="user-profile-avatar">
                {/* Avatar */}
                <img
                  src={inputValues.imageReview || inputValues.image}
                  alt={displayName}
                  className="user-avatar-img"
                  onClick={() => openPreviewImage(inputValues.image)}
                />

                <p className="user-avatar-name">{displayName}</p>
                <p className="user-avatar-email">{inputValues.email}</p>

                {/* Email verify */}
                <div className="user-email-verify">
                  {inputValues.isActiveEmail === 1 ? (
                    <span className="verify-badge verify-badge--ok">
                      <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="verify-badge verify-badge--no">
                      <i className="fa-solid fa-circle-xmark" style={{ marginRight: 4 }} />
                      Chưa xác thực
                    </span>
                  )}
                </div>

                {inputValues.isActiveEmail === 0 && (
                  <span className="verify-link" onClick={handleSendEmail}>
                    Gửi email xác thực
                  </span>
                )}

                {/* Upload avatar */}
                <input
                  type="file"
                  id="previewImg"
                  accept=".jpg,.png,.jpeg"
                  hidden
                  onChange={handleOnChangeImage}
                />
                <label htmlFor="previewImg" className="upload-avatar-label">
                  <i className="fa-solid fa-camera" />
                  Đổi ảnh
                </label>
              </div>
            </div>

            {/* ── Right: Form ── */}
            <div className="col-md-9 col-sm-12">
              <div className="user-card__header">
                <h2 className="user-card__title">
                  <i className="fa-solid fa-id-card" />
                  Thông tin cá nhân
                </h2>
              </div>
              <div className="user-card__body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label htmlFor="firstName">Họ</label>
                      <input
                        id="firstName"
                        name="firstName"
                        className="user-input"
                        type="text"
                        value={inputValues.firstName}
                        onChange={handleOnChange}
                        placeholder="Họ của bạn"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label htmlFor="lastName">Tên</label>
                      <input
                        id="lastName"
                        name="lastName"
                        className="user-input"
                        type="text"
                        value={inputValues.lastName}
                        onChange={handleOnChange}
                        placeholder="Tên của bạn"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label htmlFor="phonenumber">Số điện thoại</label>
                      <input
                        id="phonenumber"
                        name="phonenumber"
                        className="user-input"
                        type="text"
                        value={inputValues.phonenumber}
                        onChange={handleOnChange}
                        placeholder="0xxx xxx xxx"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label htmlFor="genderId">Giới tính</label>
                      <select
                        id="genderId"
                        name="genderId"
                        className="user-input"
                        value={inputValues.genderId}
                        onChange={handleOnChange}
                      >
                        {dataGender?.map((item) => (
                          <option key={item.code} value={item.code}>{item.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label>Ngày sinh</label>
                      <DatePicker
                        className="user-input"
                        onChange={handleOnChangeDatePicker}
                        selected={birthday}
                        dateFormat="dd/MM/yyyy"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="user-form-group">
                      <label htmlFor="address">Địa chỉ</label>
                      <input
                        id="address"
                        name="address"
                        className="user-input"
                        type="text"
                        value={inputValues.address}
                        onChange={handleOnChange}
                        placeholder="Địa chỉ của bạn"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="user-btn-primary" onClick={handleSaveInfor}>
                    <i className="fa-solid fa-floppy-disk" />
                    Lưu thông tin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {inputValues.isOpen && (
        <Lightbox
          mainSrc={inputValues.imageReview}
          onCloseRequest={() => setInputValues({ ...inputValues, isOpen: false })}
        />
      )}
    </div>
  );
}

export default DetailUserPage;
