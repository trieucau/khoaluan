import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { getItemCartStart } from '../../action/ShopCartAction';
import { addShopCartService, deleteItemShopCartService } from '../../services/userService';
import DeleteShopCartModal from '../../container/ShopCart/DeleteShopCartModal';
import CommonUtils from '../../utils/CommonUtils';
function ShopCartItem(props) {
  const [quantity, setquantity] = useState('');
  const [isOpenModal, setisOpenModal] = useState(false);
  const dispatch = useDispatch();
  let handleOnChange = async (event) => {
    setquantity(event.target.value);

    if (event.target.value === '0') {
      setisOpenModal(true);
    } else {
      if (event.target.value) {
        let res = await addShopCartService({
          type: 'UPDATE_QUANTITY',
          userId: props.userId,
          productdetailsizeId: props.productdetailsizeId,
          quantity: event.target.value,
        });
        if (res && res.errCode === 0) {
          dispatch(getItemCartStart(props.userId));
        } else {
          toast.error(res.errMessage);
          setquantity(res.quantity);
        }
      }
    }
  };
  useEffect(() => {
    setquantity(props.quantity);
  }, [props.quantity]);
  let closeModal = () => {
    setisOpenModal(false);
    setquantity(1);
  };
  let handleDeleteShopCart = async () => {
    let res = await deleteItemShopCartService({
      data: {
        id: props.id,
      },
    });
    if (res && res.errCode === 0) {
      dispatch(getItemCartStart(props.userId));
      setisOpenModal(false);
    } else {
      toast.error(res.errMessage);
    }
  };
  return (
    <tr>
      <td>
        <div className="media" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="d-flex" style={{ flexShrink: 0 }}>
            <img
              className="cart-item-img"
              src={props.image}
              alt={props.name}
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
            />
          </div>
          <div className="media-body">
            <p className="cart-item-name" style={{ margin: 0 }}>{props.name} </p>
          </div>
        </div>
      </td>
      <td>
        <h5>{CommonUtils.formatter.format(props.price)}</h5>
      </td>
      <td style={{ textAlign: 'center' }}>
        {props.isOrder === true ? (
          <span>{quantity}</span>
        ) : (
          <div className="product_count">
            <input
              type="number"
              name="qty"
              id="sst"
              value={quantity}
              title="Quantity:"
              className="input-text qty"
              min="0"
              onChange={(event) => handleOnChange(event)}
            />
          </div>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <h5 style={{ color: '#71cd14' }}>{CommonUtils.formatter.format(quantity * props.price)}</h5>
      </td>
      {props.isOrder === false && (
        <>
          <td className="link-delete" onClick={() => setisOpenModal(true)}>
            Xóa
          </td>
          <DeleteShopCartModal
            handleDeleteShopCart={handleDeleteShopCart}
            name={props.name}
            isOpenModal={isOpenModal}
            closeModal={closeModal}
          />
        </>
      )}
    </tr>
  );
}

export default ShopCartItem;
