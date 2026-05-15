import React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import CommonUtils from '../../../../utils/CommonUtils';
import '../AddProduct.scss';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useFetchAllcode } from '../../../customize/fetch';
import { CreateNewProductDetailService } from '../../../../services/userService';
import { PageHeader } from '../../AdminShared';

const AddProductDetail = (props) => {
  const { data: dataSize } = useFetchAllcode('SIZE');
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputValues, setInputValues] = useState({
    width: '',
    height: '',
    sizeId: '',
    originalPrice: '',
    discountPrice: '',
    image: '',
    imageReview: '',
    isOpen: false,
    nameDetail: '',
    description: '',
    weight: '',
  });

  if (dataSize && dataSize.length > 0 && inputValues.sizeId === '') {
    setInputValues({ ...inputValues, ['sizeId']: dataSize[0].code });
  }
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
  let handleSaveProductDetail = async () => {
    let res = await CreateNewProductDetailService({
      id: id,
      width: inputValues.width,
      height: inputValues.height,
      description: inputValues.description,
      sizeId: inputValues.sizeId,

      originalPrice: inputValues.originalPrice,
      discountPrice: inputValues.discountPrice,
      image: inputValues.image,
      nameDetail: inputValues.nameDetail,
      weight: inputValues.weight,
    });
    if (res && res.errCode === 0) {
      toast.success('Tạo mới loại sản phẩm thành công!');
      setInputValues({
        ...inputValues,

        ['width']: '',
        ['height']: '',
        ['description']: '',
        ['sizeId']: '',

        ['originalPrice']: '',
        ['discountPrice']: '',
        ['image']: '',
        ['imageReview']: '',
        ['nameDetail']: '',
        ['weight']: '',
      });
    } else {
      toast.error(res.errMessage);
    }
  };
  return (
    <div className="ap-page">
      <PageHeader
        title="➕ Thêm mới chi tiết sản phẩm"
        subtitle={`Thêm phân loại mới cho sản phẩm #${id}`}
        actions={
          <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-1"></i> Quay lại
          </button>
        }
      />

      <div className="ap-card mb-4">
        <div className="ap-card-body">
          <form>
            <div className="ap-form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div className="ap-form-group">
                <label className="ap-label">Tên loại sản phẩm</label>
                <input
                  type="text"
                  value={inputValues.nameDetail}
                  name="nameDetail"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="VD: Phiên bản màu đỏ..."
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Chiều rộng</label>
                <input
                  type="text"
                  value={inputValues.width}
                  name="width"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="VD: 10cm"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Chiều dài</label>
                <input
                  type="text"
                  value={inputValues.height}
                  name="height"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="VD: 20cm"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Giá gốc</label>
                <input
                  type="number"
                  value={inputValues.originalPrice}
                  name="originalPrice"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Giá bán ban đầu"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Giá khuyến mãi</label>
                <input
                  type="number"
                  value={inputValues.discountPrice}
                  name="discountPrice"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Giá sau khi giảm"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Khối lượng</label>
                <input
                  type="text"
                  value={inputValues.weight}
                  name="weight"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="VD: 500g"
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Kích thước</label>
                <select
                  value={inputValues.sizeId}
                  name="sizeId"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
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
            </div>

            <div className="ap-form-group mt-3">
              <label className="ap-label">Mô tả chi tiết</label>
              <textarea
                rows="4"
                value={inputValues.description}
                name="description"
                onChange={(event) => handleOnChange(event)}
                className="ap-textarea"
                placeholder="Nhập thông tin mô tả chi tiết..."
              ></textarea>
            </div>

            <div className="ap-form-group mt-3">
              <label className="ap-label">Chọn hình ảnh</label>
              <input
                type="file"
                id="previewImg"
                accept=".jpg,.png"
                hidden
                onChange={(event) => handleOnChangeImage(event)}
              />
              <div className="d-flex align-items-center gap-3">
                <label
                  className="ap-btn ap-btn-ghost"
                  htmlFor="previewImg"
                >
                  <i className="fas fa-upload me-2"></i> Tải ảnh
                </label>
                {inputValues.imageReview && (
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundImage: `url(${inputValues.imageReview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid var(--ap-border)',
                    }}
                    onClick={() => openPreviewImage()}
                  ></div>
                )}
              </div>
            </div>

            <div className="mt-4 text-end">
              <button
                onClick={() => handleSaveProductDetail()}
                type="button"
                className="ap-btn ap-btn-primary"
              >
                <i className="fas fa-save me-2"></i> Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
      {inputValues.isOpen === true && (
        <Lightbox
          mainSrc={inputValues.imageReview}
          onCloseRequest={() => setInputValues({ ...inputValues, ['isOpen']: false })}
        />
      )}
    </div>
  );
};
export default AddProductDetail;
