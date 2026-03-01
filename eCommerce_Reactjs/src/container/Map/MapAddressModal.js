import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CheckoutMap from './CheckoutMap';

function MapAddressModal({ isOpen, onClose, userId, onCreateAddress, currentAddress }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  if (!isOpen) return null;

  return (
    <div className="map-modal">
      <div className="map-container">
        <CheckoutMap setLocation={setSelectedLocation} setAddress={setSelectedAddress} />

        <div className="map-footer">
          <p>
            <b>Địa chỉ:</b> {selectedAddress}
          </p>

          <button
            onClick={async () => {
              if (!selectedLocation) {
                toast.error('Vui lòng chọn vị trí trên bản đồ');
                return;
              }

              await onCreateAddress({
                shipName: currentAddress?.shipName,
                shipEmail: currentAddress?.shipEmail,
                shipPhonenumber: currentAddress?.shipPhonenumber,
                shipAdress: selectedAddress,
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                userId: userId,
              });

              onClose();
            }}
          >
            Xác nhận
          </button>

          <button onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default MapAddressModal;
