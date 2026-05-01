import React from 'react';
import { useEffect, useState } from 'react';
import {
  getAllProductAdmin,
  getDetailReceiptByIdService,
  createNewReceiptDetailService,
} from '../../../services/userService';

import { toast } from 'react-toastify';
import { Link, useParams, useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import CommonUtils from '../../../utils/CommonUtils';
import moment from 'moment';

const DetailReceipt = (props) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataProduct, setdataProduct] = useState([]);
  const [dataProductDetail, setdataProductDetail] = useState([]);
  const [dataProductDetailSize, setdataProductDetailSize] = useState([]);
  const [productDetailSizeId, setproductDetailSizeId] = useState('');
  const [dataReceiptDetail, setdataReceiptDetail] = useState({});
  const [inputValues, setInputValues] = useState({
    quantity: '',
    price: '',
    productId: '',
  });

  if (dataProduct && dataProduct.length > 0 && inputValues.productId === '') {
    setInputValues({ ...inputValues, ['productId']: dataProduct[0].id });
    setproductDetailSizeId(dataProduct[0].productDetail[0].productDetailSize[0].id);
    setdataProductDetail(dataProduct[0].productDetail);
    setdataProductDetailSize(dataProduct[0].productDetail[0].productDetailSize);
  }

  useEffect(() => {
    loadProduct();
    loadReceiptDetail(id);
  }, []);

  let loadReceiptDetail = async (id) => {
    let res = await getDetailReceiptByIdService(id);
    if (res && res.errCode == 0) {
      setdataReceiptDetail(res.data.receiptDetail);
    }
  };

  let loadProduct = async () => {
    let arrData = await getAllProductAdmin({
      sortName: '',
      sortPrice: '',
      categoryId: 'ALL',
      brandId: 'ALL',
      limit: '',
      offset: '',
      keyword: '',
    });
    if (arrData && arrData.errCode === 0) {
      setdataProduct(arrData.data);
    }
  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
  };

  const handleOnChangeProduct = (event) => {
    const { name, value } = event.target;
    setInputValues({ ...inputValues, [name]: value });
    for (let i = 0; i < dataProduct.length; i++) {
      if (dataProduct[i].id == value) {
        setdataProductDetail(dataProduct[i].productDetail);
        setdataProductDetailSize(dataProduct[i].productDetail[0].productDetailSize);
        setproductDetailSizeId(dataProduct[i].productDetail[0].productDetailSize[0].id);
      }
    }
  };

  let handleOnChangeProductDetail = (event) => {
    const { name, value } = event.target;
    for (let i = 0; i < dataProductDetail.length; i++) {
      if (dataProductDetail[i].id == value) {
        setdataProductDetailSize(dataProductDetail[i].productDetailSize);
        setproductDetailSizeId(dataProductDetail[i].productDetailSize[0].id);
      }
    }
  };

  let handleSaveReceiptDetail = async () => {
    let res = await createNewReceiptDetailService({
      receiptId: id,
      productDetailSizeId: productDetailSizeId,
      quantity: inputValues.quantity,
      price: inputValues.price,
    });
    if (res && res.errCode === 0) {
      toast.success('Thêm chi tiết nhập hàng thành công');
      setInputValues({
        ...inputValues,
        ['quantity']: '',
        ['price']: '',
      });
      loadReceiptDetail(id);
    } else if (res && res.errCode === 2) {
      toast.error(res.errMessage);
    } else {
      toast.error('Thêm nhập hàng thất bại');
    }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <h1 className="ap-page-title">Quản lý chi tiết nhập hàng</h1>
            <div className="ap-page-subtitle">Thêm và xem chi tiết phiếu nhập #{id}</div>
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
            <i className="fas fa-plus-circle me-2" /> Thêm mới sản phẩm nhập
          </div>
        </div>
        <div className="ap-card-body">
          <form>
            <div className="ap-form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="ap-form-group">
                <label className="ap-label">Sản phẩm</label>
                <select
                  value={inputValues.productId}
                  name="productId"
                  onChange={(event) => handleOnChangeProduct(event)}
                  className="ap-select-input"
                >
                  {dataProduct &&
                    dataProduct.length > 0 &&
                    dataProduct.map((item, index) => {
                      return (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Loại sản phẩm (Màu sắc)</label>
                <select
                  onChange={(event) => handleOnChangeProductDetail(event)}
                  className="ap-select-input"
                >
                  {dataProductDetail &&
                    dataProductDetail.length > 0 &&
                    dataProductDetail.map((item, index) => {
                      return (
                        <option key={index} value={item.id}>
                          {item.nameDetail}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Size sản phẩm</label>
                <select
                  value={productDetailSizeId}
                  name="productDetailSizeId"
                  onChange={(event) => setproductDetailSizeId(event.target.value)}
                  className="ap-select-input"
                >
                  {dataProductDetailSize &&
                    dataProductDetailSize.length > 0 &&
                    dataProductDetailSize.map((item, index) => {
                      return (
                        <option key={index} value={item.id}>
                          {item.sizeId}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            <div className="ap-form-row mt-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="ap-form-group">
                <label className="ap-label">Số lượng nhập</label>
                <input
                  type="number"
                  value={inputValues.quantity}
                  name="quantity"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Nhập số lượng..."
                />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Đơn giá nhập (VNĐ)</label>
                <input
                  type="number"
                  value={inputValues.price}
                  name="price"
                  onChange={(event) => handleOnChange(event)}
                  className="ap-input"
                  placeholder="Nhập đơn giá..."
                />
              </div>
            </div>

            <div className="mt-3 text-end">
              <button
                type="button"
                onClick={() => handleSaveReceiptDetail()}
                className="ap-btn ap-btn-primary"
              >
                <i className="fas fa-plus"></i> Thêm vào phiếu
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <div className="ap-card-title">
            <i className="fas fa-list me-2" /> Danh sách chi tiết đã nhập
          </div>
        </div>
        <div className="ap-card-body p-0">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã phiếu</th>
                  <th>Tên sản phẩm - Phân loại - Size</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {dataReceiptDetail && dataReceiptDetail.length > 0 ? (
                  dataReceiptDetail.map((item, index) => {
                    let name = `${item.productData.name} - ${item.productDetailData.nameDetail} - ${item.productDetailSizeData.sizeData.value}`;
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td><span className="ap-badge ap-badge-indigo">#{item.receiptId}</span></td>
                        <td className="fw-bold">{name}</td>
                        <td>{item.quantity}</td>
                        <td>{CommonUtils.formatter.format(item.price)}</td>
                        <td className="text-warning fw-bold">{CommonUtils.formatter.format(item.price * item.quantity)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="ap-empty">
                        <i className="fas fa-box-open ap-empty-icon"></i>
                        <div className="ap-empty-title">Chưa có sản phẩm nào</div>
                        <div className="ap-empty-desc">Phiếu nhập này hiện đang trống.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DetailReceipt;
