import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CheckoutMap from './CheckoutMap';
import './MapAddressModal.css';

function MapAddressModal({ isOpen, onClose, userId, onCreateAddress, currentAddress }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedLocation) {
      toast.error('Vui lòng nhấn vào vị trí trên bản đồ để chọn địa chỉ');
      return;
    }
    setLoading(true);
    try {
      await onCreateAddress({
        shipName: currentAddress?.shipName,
        shipEmail: currentAddress?.shipEmail,
        shipPhonenumber: currentAddress?.shipPhonenumber,
        shipAdress: selectedAddress,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        userId,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addr-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="addr-modal addr-modal--map">
        {/* Header */}
        <div className="addr-modal__header">
          <div className="addr-modal__header-left">
            <div className="addr-modal__icon addr-modal__icon--map">
              <i className="fa-solid fa-map-location-dot" />
            </div>
            <div>
              <h3 className="addr-modal__title">Chọn vị trí trên bản đồ</h3>
              <p className="addr-modal__subtitle">Nhấn vào bản đồ để ghim địa chỉ giao hàng</p>
            </div>
          </div>
          <button className="addr-modal__close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Instruction banner */}
        <div className="addr-map-hint">
          <i className="fa-solid fa-circle-info" />
          Nhấn vào bất kỳ điểm nào trên bản đồ để chọn vị trí giao hàng
        </div>

        {/* Map */}
        <div className="addr-map-container">
          <CheckoutMap setLocation={setSelectedLocation} setAddress={setSelectedAddress} />
        </div>

        {/* Selected address preview */}
        <div className="addr-map-preview">
          <div className="addr-map-preview__label">
            <i className="fa-solid fa-location-dot" />
            Địa chỉ đã chọn
          </div>
          <div className="addr-map-preview__value">
            {selectedAddress ? (
              selectedAddress
            ) : (
              <span className="addr-map-preview__empty">
                Chưa chọn vị trí — nhấn vào bản đồ phía trên
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="addr-modal__footer">
          <button className="addr-btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="addr-btn-save"
            onClick={handleConfirm}
            disabled={loading || !selectedLocation}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" /> Xác nhận vị trí
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapAddressModal;
