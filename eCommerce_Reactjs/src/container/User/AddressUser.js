import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getAllAddressUserByUserIdService,
  createNewAddressUserrService,
  deleteAddressUserService,
  editAddressUserService,
  getDetailUserByIdService,
  getDetailUserById,
} from '../../services/userService';

import AddressUsersModal from '../ShopCart/AdressUserModal';
import MapAddressModal from '../Map/MapAddressModal';
import './AddressUser.scss';

function AddressUser(props) {
  const [dataAddressUser, setDataAddressUser] = useState([]);
  const [addressUserId, setAddressUserId] = useState('');
  const [isOpenModalAddressUser, setIsOpenModalAddressUser] = useState(false);
  const [isOpenMapModal, setIsOpenMapModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  /* ================= LOAD USER INFO ================= */
  const loadUserInfo = async () => {
    let res = await getDetailUserById(props.id);
    if (res && res.errCode === 0) {
      setUserInfo(res.data);
    }
  };

  /* ================= LOAD ADDRESS ================= */
  const loadDataAddress = async () => {
    let res = await getAllAddressUserByUserIdService(props.id);
    if (res && res.errCode === 0) {
      setDataAddressUser(res.data);
    }
  };

  useEffect(() => {
    if (props.id) {
      loadDataAddress();
      loadUserInfo();
    }
  }, [props.id]);

  /* ================= CREATE / EDIT ADDRESS ================= */
  const sendDataFromModalAddress = async (data) => {
    setIsOpenModalAddressUser(false);
    setAddressUserId('');

    if (!data.isActionUpdate) {
      let res = await createNewAddressUserrService({
        shipName: data.shipName,
        shipAdress: data.shipAdress,
        shipEmail: data.shipEmail,
        shipPhonenumber: data.shipPhonenumber,
        userId: props.id,
        lat: data.lat,
        lng: data.lng,
      });

      if (res && res.errCode === 0) {
        toast.success('Thêm địa chỉ thành công!');
        await loadDataAddress();
      } else {
        toast.error(res.errMessage);
      }
    } else {
      let res = await editAddressUserService({
        id: data.id,
        shipName: data.shipName,
        shipAdress: data.shipAdress,
        shipEmail: data.shipEmail,
        shipPhonenumber: data.shipPhonenumber,
        userId: props.id,
      });

      if (res && res.errCode === 0) {
        toast.success('Cập nhật địa chỉ thành công!');
        await loadDataAddress();
      } else {
        toast.error(res.errMessage);
      }
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteAddress = async (id) => {
    let res = await deleteAddressUserService({ data: { id } });

    if (res && res.errCode === 0) {
      toast.success('Xóa địa chỉ thành công');
      await loadDataAddress();
    } else {
      toast.error('Xóa địa chỉ thất bại');
    }
  };

  /* ================= CREATE ADDRESS FROM MAP ================= */
  const handleCreateAddressFromMap = async (mapData) => {
    if (!userInfo) {
      toast.error('Không lấy được thông tin người dùng');
      return;
    }

    let res = await createNewAddressUserrService({
      shipName: userInfo.firstName + ' ' + userInfo.lastName,
      shipPhonenumber: userInfo.phonenumber,
      shipEmail: userInfo.email,
      shipAdress: mapData.shipAdress,
      lat: mapData.lat,
      lng: mapData.lng,
      userId: props.id,
    });

    if (res && res.errCode === 0) {
      toast.success('Đã thêm địa chỉ mới');
      await loadDataAddress();
      setIsOpenMapModal(false);
    } else {
      toast.error('Thêm thất bại');
    }
  };

  return (
    <div className="container rounded bg-white mt-5 mb-5">
      <div className="row">
        <div className="col-md-12 border-right border-left">
          <div className="box-heading">
            <div className="content-left">
              <span>Địa chỉ của tôi</span>
            </div>
            <div className="content-right">
              <i
                className="fas fa-map-marked-alt"
                style={{ cursor: 'pointer', color: '#ee4d2d', marginLeft: '15px' }}
                onClick={() => setIsOpenMapModal(true)}
              ></i>
              <div className="wrap-add-address">
                <i className="fas fa-plus"></i>
                <span onClick={() => setIsOpenModalAddressUser(true)}>Thêm địa chỉ mới</span>
              </div>
            </div>
          </div>

          {dataAddressUser.map((item) => (
            <div key={item.id} className="box-address-user">
              <div className="content-left">
                <div className="box-label">
                  <div className="label">
                    <div>Họ Và Tên</div>
                    <div>Số Điện Thoại</div>
                    <div>Địa Chỉ</div>
                  </div>

                  <div className="content">
                    <div>{item.shipName}</div>
                    <div>{item.shipPhonenumber}</div>
                    <div>{item.shipAdress}</div>
                  </div>
                </div>
              </div>

              <div className="content-right">
                <span
                  onClick={() => {
                    setAddressUserId(item.id);
                    setIsOpenModalAddressUser(true);
                  }}
                  className="text-underline"
                >
                  Sửa
                </span>

                <span onClick={() => handleDeleteAddress(item.id)} className="text-underline">
                  Xóa
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal thường */}
      <AddressUsersModal
        addressUserId={addressUserId}
        sendDataFromModalAddress={sendDataFromModalAddress}
        isOpenModal={isOpenModalAddressUser}
        closeModaAddressUser={() => setIsOpenModalAddressUser(false)}
      />

      {/* Modal Map */}
      <MapAddressModal
        isOpen={isOpenMapModal}
        onClose={() => setIsOpenMapModal(false)}
        userId={props.id}
        onCreateAddress={handleCreateAddressFromMap}
      />
    </div>
  );
}

export default AddressUser;
