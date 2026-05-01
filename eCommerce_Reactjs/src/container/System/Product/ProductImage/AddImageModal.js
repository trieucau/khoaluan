import React from 'react';
import { useEffect, useState } from 'react';
import CommonUtils from '../../../../utils/CommonUtils';
import moment from 'moment';
import { toast } from 'react-toastify';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useParams,
} from 'react-router-dom';
import { getProductDetailImageByIdService } from '../../../../services/userService';

const AddImageModal = (props) => {
  const [inputValues, setInputValues] = useState({
    image: '',
    imageReview: '',
    caption: '',
    isOpen: false,
    isActionUpdate: false,
    id: '',
  });

  useEffect(() => {
    let id = props.productImageId;
    console.log('check id', id);
    if (id) {
      let fetchProductImage = async () => {
        let res = await getProductDetailImageByIdService(id);
        if (res && res.errCode === 0) {
          setInputValues({
            ...inputValues,
            ['isActionUpdate']: true,
            ['caption']: res.data.caption,
            ['image']: res.data.image,
            ['imageReview']: res.data.image,
          });
        }
      };
      fetchProductImage();
    }
  }, [props.isOpenModal]);

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
  };

  let handleOnChangeImage = async (event) => {
    let data = event.target.files;
    let file = data[0];
    if (file?.size > 31312281) {
      toast.error('Dung lượng file bé hơn 30mb');
    } else {
      let base64 = await CommonUtils.getBase64(file);
      let objectUrl = URL.createObjectURL(file);
      setInputValues({
        ...inputValues,
        ['image']: base64,
        ['imageReview']: objectUrl,
      });
    }
  };
  let openPreviewImage = () => {
    if (!inputValues.imageReview) return;

    setInputValues({ ...inputValues, ['isOpen']: true });
  };
  let HandleSendDataFromModal = () => {
    props.sendDataFromModal({
      image: inputValues.image,
      caption: inputValues.caption,
      isActionUpdate: inputValues.isActionUpdate,
      id: props.productImageId,
    });
    setInputValues({
      ...inputValues,
      ['image']: '',
      ['imageReview']: '',
      ['caption']: '',
      ['isActionUpdate']: false,
    });
  };
  let handleCloseModal = () => {
    props.closeModal();
    setInputValues({
      ...inputValues,
      ['image']: '',
      ['imageReview']: '',
      ['caption']: '',
      ['isActionUpdate']: false,
    });
  };
  return (
    <div className="">
      <Modal isOpen={props.isOpenModal} className={'booking-modal-container ap-modal-custom'} size="md" centered>
        <div className="modal-header border-bottom-0 pb-0">
          <h5 className="modal-title ap-page-title fs-5">{inputValues.isActionUpdate ? 'Cập nhật hình ảnh' : 'Thêm hình ảnh chi tiết sản phẩm'}</h5>
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
              <label className="ap-label">Tên hình ảnh</label>
              <input
                value={inputValues.caption}
                name="caption"
                onChange={(event) => handleOnChange(event)}
                type="text"
                className="ap-input"
                placeholder="Nhập tên hình ảnh..."
              />
            </div>
            <div className="col-12 ap-form-group">
              <label className="ap-label">Ảnh hiển thị</label>
              <div
                style={{
                  backgroundImage: `url(${inputValues.imageReview})`,
                  display: inputValues.imageReview ? 'block' : 'none'
                }}
                onClick={() => openPreviewImage()}
                className="img-review rounded shadow-sm border border-secondary"
                title="Nhấp để xem lớn"
              ></div>
              {!inputValues.imageReview && (
                <div className="text-muted small fst-italic">Chưa có ảnh nào được chọn.</div>
              )}
            </div>
            <div className="col-12 ap-form-group mb-0">
              <label className="ap-label">Chọn hình ảnh mới</label>
              <input
                onChange={(event) => handleOnChangeImage(event)}
                type="file"
                accept=".jpg,.png"
                className="ap-input"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-top-0 pt-0">
          <button className="ap-btn ap-btn-ghost" onClick={handleCloseModal}>Hủy</button>
          <button className="ap-btn ap-btn-primary" onClick={HandleSendDataFromModal}>
            Lưu thông tin
          </button>
        </ModalFooter>
      </Modal>
      {inputValues.isOpen === true && (
        <Lightbox
          mainSrc={inputValues.imageReview}
          onCloseRequest={() => setInputValues({ ...inputValues, ['isOpen']: false })}
        />
      )}
    </div>
  );
};
export default AddImageModal;
