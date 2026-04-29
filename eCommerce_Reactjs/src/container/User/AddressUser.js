import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getAllAddressUserByUserIdService,
  createNewAddressUserrService,
  deleteAddressUserService,
  editAddressUserService,
  getDetailUserById,
  getAllOrdersByUser,
} from '../../services/userService';
import AddressUsersModal from '../ShopCart/AdressUserModal';
import MapAddressModal from '../Map/MapAddressModal';
import '../../css/user-pages.css';
import '../ShopCart/AddressModal.css';

function AddressUser(props) {
  const [dataAddressUser, setDataAddressUser] = useState([]);
  const [addressUserId, setAddressUserId] = useState('');
  const [isOpenModalAddressUser, setIsOpenModalAddressUser] = useState(false);
  const [isOpenMapModal, setIsOpenMapModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [usedAddressIds, setUsedAddressIds] = useState([]);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadUserInfo = async () => {
    const res = await getDetailUserById(props.id);
    if (res?.errCode === 0) setUserInfo(res.data);
  };

  const loadDataAddress = async () => {
    const res = await getAllAddressUserByUserIdService(props.id);
    if (res?.errCode === 0) setDataAddressUser(res.data);
  };

  const loadUsedAddressIds = async () => {
    const res = await getAllOrdersByUser(props.id);
    if (res?.errCode === 0) {
      const ids = [
        ...new Set(
          res.data
            .filter((item) => item.order?.length > 0)
            .map((item) => item.id)
        ),
      ];
      setUsedAddressIds(ids);
    }
  };

  useEffect(() => {
    if (props.id) {
      loadDataAddress();
      loadUserInfo();
      loadUsedAddressIds();
    }
  }, [props.id]);

  const sendDataFromModalAddress = async (data) => {
    setIsOpenModalAddressUser(false);
    setAddressUserId('');

    if (!data.isActionUpdate) {
      const res = await createNewAddressUserrService({
        shipName: data.shipName,
        shipAdress: data.shipAdress,
        shipEmail: data.shipEmail,
        shipPhonenumber: data.shipPhonenumber,
        userId: props.id,
        lat: data.lat,
        lng: data.lng,
      });
      if (res?.errCode === 0) { toast.success('Thêm địa chỉ thành công!'); await loadDataAddress(); }
      else toast.error(res?.errMessage);
    } else {
      const res = await editAddressUserService({
        id: data.id,
        shipName: data.shipName,
        shipAdress: data.shipAdress,
        shipEmail: data.shipEmail,
        shipPhonenumber: data.shipPhonenumber,
        userId: props.id,
        lat: data.lat,
        lng: data.lng,
      });
      if (res?.errCode === 0) { toast.success('Cập nhật địa chỉ thành công!'); await loadDataAddress(); }
      else toast.error(res?.errMessage);
    }
  };

  const handleDeleteAddress = (id) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await deleteAddressUserService({ data: { id: pendingDeleteId } });
      if (res?.errCode === 0) {
        toast.success('Đã xóa địa chỉ thành công!');
        await loadDataAddress();
      } else {
        toast.error(res?.errMessage || 'Xóa địa chỉ thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCreateAddressFromMap = async (mapData) => {
    if (!userInfo) { toast.error('Không lấy được thông tin người dùng'); return; }
    const res = await createNewAddressUserrService({
      shipName: `${userInfo.firstName} ${userInfo.lastName}`,
      shipPhonenumber: userInfo.phonenumber,
      shipEmail: userInfo.email,
      shipAdress: mapData.shipAdress,
      lat: mapData.lat,
      lng: mapData.lng,
      userId: props.id,
    });
    if (res?.errCode === 0) {
      toast.success('Đã thêm địa chỉ mới');
      await loadDataAddress();
      setIsOpenMapModal(false);
    } else toast.error('Thêm địa chỉ thất bại');
  };

  return (
    <div className="user-page">
      <div className="container-fluid px-0">
        <div className="user-card">

          {/* Header */}
          <div className="address-header">
            <h2 className="address-header__title">
              <i className="fa-solid fa-location-dot" style={{ color: '#FF6B9D', marginRight: 10 }} />
              Địa chỉ của tôi
            </h2>
            <div className="address-header__actions">
              {/* Map button */}
              <button
                className="address-map-btn"
                onClick={() => setIsOpenMapModal(true)}
              >
                <i className="fa-solid fa-map-location-dot" />
                Chọn từ bản đồ
              </button>
              {/* Manual add */}
              <button
                className="user-btn-primary"
                style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={() => { setAddressUserId(''); setIsOpenModalAddressUser(true); }}
              >
                <i className="fa-solid fa-plus" />
                Thêm địa chỉ mới
              </button>
            </div>
          </div>

          {/* Address list */}
          <div className="address-list">
            {dataAddressUser.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9B8EA4' }}>
                <i className="fa-solid fa-map-pin" style={{ fontSize: 36, color: '#F0E6EE', marginBottom: 12, display: 'block' }} />
                <p style={{ margin: 0, fontSize: 14 }}>Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới!</p>
              </div>
            )}

            {dataAddressUser.map((item) => {
              const isUsed = usedAddressIds.includes(item.id);
              return (
                <div key={item.id} className="address-card">
                  <div className="address-card__info">
                    <div className="address-info-row">
                      <span className="address-info-label">Họ và tên</span>
                      <span className="address-info-value">{item.shipName}</span>
                    </div>
                    <div className="address-info-row">
                      <span className="address-info-label">Điện thoại</span>
                      <span className="address-info-value">{item.shipPhonenumber}</span>
                    </div>
                    <div className="address-info-row">
                      <span className="address-info-label">Email</span>
                      <span className="address-info-value">{item.shipEmail}</span>
                    </div>
                    <div className="address-info-row">
                      <span className="address-info-label">Địa chỉ</span>
                      <span className="address-info-value">{item.shipAdress}</span>
                    </div>
                  </div>

                  <div className="address-card__actions">
                    {isUsed ? (
                      <span className="address-used-badge">Đã dùng trong đơn hàng</span>
                    ) : (
                      <>
                        <button
                          className="address-action-btn address-action-btn--edit"
                          onClick={() => { setAddressUserId(item.id); setIsOpenModalAddressUser(true); }}
                        >
                          <i className="fa-solid fa-pen" style={{ marginRight: 5 }} />
                          Sửa
                        </button>
                        <button
                          className="address-action-btn address-action-btn--delete"
                          onClick={() => handleDeleteAddress(item.id)}
                        >
                          <i className="fa-solid fa-trash" style={{ marginRight: 5 }} />
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal thường */}
      <AddressUsersModal
        addressUserId={addressUserId}
        sendDataFromModalAddress={sendDataFromModalAddress}
        isOpenModal={isOpenModalAddressUser}
        closeModaAddressUser={() => { setIsOpenModalAddressUser(false); setAddressUserId(''); }}
      />

      {/* Modal Map */}
      <MapAddressModal
        isOpen={isOpenMapModal}
        onClose={() => setIsOpenMapModal(false)}
        userId={props.id}
        onCreateAddress={handleCreateAddressFromMap}
      />

      {/* Confirm Delete Dialog */}
      {pendingDeleteId && (
        <div
          className="addr-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setPendingDeleteId(null)}
          style={{ zIndex: 10000 }}
        >
          <div className="addr-confirm-dialog">
            <div className="addr-confirm-icon">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h4 className="addr-confirm-title">Xóa địa chỉ?</h4>
            <p className="addr-confirm-desc">
              Hành động này không thể hoàn tác. Địa chỉ sẽ bị xóa vĩnh viễn.
            </p>
            <div className="addr-confirm-actions">
              <button
                className="addr-btn-cancel"
                onClick={() => setPendingDeleteId(null)}
              >
                Hủy bỏ
              </button>
              <button
                className="addr-btn-delete-confirm"
                onClick={confirmDelete}
              >
                <i className="fa-solid fa-trash" />
                Xóa địa chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressUser;
