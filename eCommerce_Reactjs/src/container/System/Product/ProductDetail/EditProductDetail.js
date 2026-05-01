import React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import CommonUtils from '../../../../utils/CommonUtils';
import '../AddProduct.scss';
import {
  getProductDetailByIdService,
  UpdateProductDetailService,
} from '../../../../services/userService';

const EditProductDetail = (props) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inputValues, setInputValues] = useState({
    originalPrice: '',
    discountPrice: '',
    image: '',
    imageReview: '',
    isOpen: false,
    nameDetail: '',
    description: '',
  });

  useEffect(() => {
    let fetchProductDetail = async () => {
      let res = await getProductDetailByIdService(id);
      if (res && res.errCode === 0) {
        setStateProductdetail(res.data);
      }
    };
    fetchProductDetail();
  }, []);

  let setStateProductdetail = (data) => {
    setInputValues({
      ...inputValues,
      ['originalPrice']: data.originalPrice,
      ['stock']: data.stock,
      ['discountPrice']: data.discountPrice,
      ['nameDetail']: data.nameDetail,
      ['description']: data.description,
    });
  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
  };

  let handleSaveProductDetail = async () => {
    let res = await UpdateProductDetailService({
      id: id,
      description: inputValues.description,
      originalPrice: inputValues.originalPrice,
      discountPrice: inputValues.discountPrice,
      nameDetail: inputValues.nameDetail,
    });
    if (res && res.errCode === 0) {
      toast.success('Cập nhật loại sản phẩm thành công!');
    } else {
      toast.error(res.errMessage);
    }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <h1 className="ap-page-title">Cập nhật chi tiết sản phẩm</h1>
            <div className="ap-page-subtitle">Chỉnh sửa thông tin phân loại sản phẩm</div>
          </div>
          <div>
            <button className="ap-btn ap-btn-ghost" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left me-1"></i> Quay lại
            </button>
          </div>
        </div>
      </div>

      <div className="ap-card mb-4">
        <div className="ap-card-header">
          <div className="ap-card-title">
            <i className="fas fa-edit me-2" /> Thông tin phân loại
          </div>
        </div>
        <div className="ap-card-body">
          <form>
            <div className="ap-form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="ap-form-group">
                <label className="ap-label">Tên loại sản phẩm</label>
                <input
                  type="text"
                  value={inputValues.nameDetail}
                  name="nameDetail"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Nhập tên phân loại..."
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Giá gốc (VNĐ)</label>
                <input
                  type="number"
                  value={inputValues.originalPrice}
                  name="originalPrice"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Nhập giá gốc..."
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Giá khuyến mãi (VNĐ)</label>
                <input
                  type="number"
                  value={inputValues.discountPrice}
                  name="discountPrice"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Nhập giá khuyến mãi..."
                />
              </div>
            </div>
            
            <div className="ap-form-group mt-2">
              <label className="ap-label">Mô tả chi tiết</label>
              <textarea
                rows="4"
                value={inputValues.description}
                name="description"
                onChange={(event) => handleOnChange(event)}
                className="ap-textarea"
                placeholder="Nhập mô tả chi tiết cho loại sản phẩm này..."
              ></textarea>
            </div>

            <div className="mt-4 text-end">
              <button
                onClick={() => handleSaveProductDetail()}
                type="button"
                className="ap-btn ap-btn-primary"
              >
                <i className="fas fa-save"></i> Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default EditProductDetail;
