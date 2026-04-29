import React from 'react';
import '../ShopCart/AddressModal.css'; // Reuse the beautiful confirm modal CSS

const DeleteShopCartModal = ({ isOpenModal, closeModal, handleDeleteShopCart, name }) => {
  if (!isOpenModal) return null;

  return (
    <div className="addr-modal-overlay" onClick={closeModal}>
      <div 
        className="addr-confirm-dialog" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="addr-confirm-icon">
          <i className="fa-solid fa-trash-can" />
        </div>
        
        <h3 className="addr-confirm-title">Xóa sản phẩm?</h3>
        <p className="addr-confirm-desc">
          Bạn có chắc chắn muốn bỏ sản phẩm <strong>{name}</strong> khỏi giỏ hàng không?
        </p>

        <div className="addr-confirm-actions">
          <button className="addr-btn-cancel" onClick={closeModal}>
            Hủy
          </button>
          <button className="addr-btn-delete-confirm" onClick={handleDeleteShopCart}>
            <i className="fa-solid fa-trash" />
            Đồng ý xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteShopCartModal;
