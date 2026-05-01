import React from 'react';
import { useEffect, useState } from 'react';
import CommonUtils from '../../../../utils/CommonUtils';
import moment from 'moment';
import { toast } from 'react-toastify';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useFetchAllcode } from '../../../customize/fetch';
import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import { getProductDetailSizeByIdService } from '../../../../services/userService';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useParams,
} from 'react-router-dom';

const AddSizeModal = (props) => {
  const { data: dataSize } = useFetchAllcode('SIZE');
  const [inputValues, setInputValues] = useState({
    sizeId: '',
    width: '',
    height: '',
    isActionUpdate: false,
    id: '',
    weight: '',
  });
  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
  };
  if (dataSize && dataSize.length > 0 && inputValues.sizeId === '') {
    setInputValues({ ...inputValues, ['sizeId']: dataSize[0].code });
  }
  useEffect(() => {
    let id = props.productSizeId;

    if (id) {
      let fetchDetailProductSize = async () => {
        let res = await getProductDetailSizeByIdService(id);
        if (res && res.errCode === 0) {
          setInputValues({
            ...inputValues,
            ['isActionUpdate']: true,
            ['sizeId']: res.data.sizeId,
            ['width']: res.data.width,
            ['height']: res.data.height,
            ['weight']: res.data.weight,
          });
        }
      };
      fetchDetailProductSize();
    }
  }, [props.isOpenModal]);
  let handleSaveInfor = () => {
    props.sendDataFromModalSize({
      sizeId: inputValues.sizeId,

      width: inputValues.width,
      height: inputValues.height,
      isActionUpdate: inputValues.isActionUpdate,
      id: props.productSizeId,
      weight: inputValues.weight,
    });
    setInputValues({
      ...inputValues,
      ['sizeId']: '',
      ['width']: '',
      ['height']: '',
      ['weight']: '',
      ['isActionUpdate']: false,
    });
  };
  let handleCloseModal = () => {
    props.closeModal();
    setInputValues({
      ...inputValues,
      ['sizeId']: '',
      ['width']: '',
      ['height']: '',
      ['weight']: '',
      ['isActionUpdate']: false,
    });
  };
  return (
    <div className="">
      <Modal isOpen={props.isOpenModal} className={'booking-modal-container ap-modal-custom'} size="md" centered>
        <div className="modal-header border-bottom-0 pb-0">
          <h5 className="modal-title ap-page-title fs-5">{inputValues.isActionUpdate ? 'Cập nhật kích thước' : 'Thêm kích thước chi tiết sản phẩm'}</h5>
          <button
            onClick={handleCloseModal}
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
          ></button>
        </div>
        <ModalBody className="pt-3">
          <div className="row">
            <div className="col-12 ap-form-group">
              <label className="ap-label">Kích thước</label>
              <select
                value={inputValues.sizeId}
                name="sizeId"
                onChange={(event) => handleOnChange(event)}
                id="inputState"
                className="ap-select-input"
              >
                {dataSize &&
                  dataSize.length > 0 &&
                  dataSize.map((item, index) => {
                    return (
                      <option key={index} value={item.code}>
                        {item.value}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="col-12 ap-form-group">
              <label className="ap-label">Chiều rộng (cm)</label>
              <input
                value={inputValues.width}
                name="width"
                onChange={(event) => handleOnChange(event)}
                type="text"
                className="ap-input"
                placeholder="Nhập chiều rộng..."
              />
            </div>
            <div className="col-12 ap-form-group">
              <label className="ap-label">Chiều dài (cm)</label>
              <input
                value={inputValues.height}
                name="height"
                onChange={(event) => handleOnChange(event)}
                type="text"
                className="ap-input"
                placeholder="Nhập chiều dài..."
              />
            </div>
            <div className="col-12 ap-form-group mb-0">
              <label className="ap-label">Khối lượng (gram)</label>
              <input
                value={inputValues.weight}
                name="weight"
                onChange={(event) => handleOnChange(event)}
                type="text"
                className="ap-input"
                placeholder="Nhập khối lượng..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-top-0 pt-0">
          <button className="ap-btn ap-btn-ghost" onClick={handleCloseModal}>Hủy</button>
          <button className="ap-btn ap-btn-primary" onClick={handleSaveInfor}>
            Lưu thông tin
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
export default AddSizeModal;
