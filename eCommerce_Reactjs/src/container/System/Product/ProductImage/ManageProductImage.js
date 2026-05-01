import React from 'react';
import { useEffect, useState } from 'react';
import {
  getAllProductDetailImageByIdService,
  createNewProductImageService,
  UpdateProductDetailImageService,
  DeleteProductDetailImageService,
  getAllProductDetailSizeByIdService,
  createNewProductSizeService,
  UpdateProductDetailSizeService,
  DeleteProductDetailSizeService,
} from '../../../../services/userService';
import moment from 'moment';
import { toast } from 'react-toastify';
import './ManageProductImage.scss';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { PAGINATION } from '../../../../utils/constant';
import ReactPaginate from 'react-paginate';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useParams,
  useNavigate,
} from 'react-router-dom';
import AddImageModal from './AddImageModal';
import AddSizeModal from './AddSizeModal';
const ManageProductImage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataProductDetailImage, setdataProductDetailImage] = useState([]);
  const [dataProductDetailSize, setdataProductDetailSize] = useState([]);
  const [isOpen, setisOpen] = useState(false);
  const [isOpenModal, setisOpenModal] = useState(false);
  const [isOpenModalSize, setisOpenModalSize] = useState(false);
  const [imgPreview, setimgPreview] = useState('');
  const [productImageId, setproductImageId] = useState('');
  const [productSizeId, setproductSizeId] = useState('');
  const [count, setCount] = useState('');
  const [countSize, setcountSizes] = useState('');
  const [numberPage, setnumberPage] = useState('');
  useEffect(() => {
    let fetchProductDetailImage = async () => {
      await loadProductDetailImage();
    };
    let fetchProductSize = async () => {
      await loadProductDetailSize();
    };
    fetchProductDetailImage();
    fetchProductSize();
  }, []);
  let loadProductDetailImage = async () => {
    let arrData = await getAllProductDetailImageByIdService({
      id: id,
      limit: PAGINATION.pagerow,
      offset: 0,
    });
    if (arrData && arrData.errCode === 0) {
      setdataProductDetailImage(arrData.data);
      setCount(Math.ceil(arrData.count / PAGINATION.pagerow));
    }
  };
  let loadProductDetailSize = async () => {
    let arrSize = await getAllProductDetailSizeByIdService({
      id: id,
      limit: PAGINATION.pagerow,
      offset: 0,
    });
    if (arrSize && arrSize.errCode === 0) {
      setdataProductDetailSize(arrSize.data);
      setcountSizes(Math.ceil(arrSize.count / PAGINATION.pagerow));
    }
  };
  let openPreviewImage = (url) => {
    setimgPreview(url);
    setisOpen(true);
  };
  let closeModal = () => {
    setisOpenModal(false);
    setproductImageId('');
  };
  let handleOpenModal = () => {
    setisOpenModal(true);
  };
  let closeModalSize = () => {
    setisOpenModalSize(false);
    setproductSizeId('');
  };
  let handleOpenModalSize = () => {
    setisOpenModalSize(true);
  };
  let sendDataFromModal = async (data) => {
    if (data.isActionUpdate === false) {
      let response = await createNewProductImageService({
        caption: data.caption,
        image: data.image,
        id: id,
      });
      if (response && response.errCode === 0) {
        toast.success('Thêm hình ảnh thành công !');
        setisOpenModal(false);
        await loadProductDetailImage();
      } else {
        toast.error('Thêm hình ảnh thất bại !');
      }
    } else {
      let response = await UpdateProductDetailImageService({
        caption: data.caption,
        image: data.image,
        id: data.id,
      });
      if (response && response.errCode === 0) {
        setproductImageId('');
        toast.success('Cập nhật hình ảnh thành công !');
        setisOpenModal(false);
        await loadProductDetailImage();
      } else {
        toast.error('Cập nhật ảnh thất bại !');
      }
    }
  };
  let sendDataFromModalSize = async (data) => {
    if (data.isActionUpdate === false) {
      let response = await createNewProductSizeService({
        productdetailId: id,
        sizeId: data.sizeId,
        width: data.width,
        height: data.height,
        stock: data.stock,
        weight: data.weight,
      });
      if (response && response.errCode === 0) {
        toast.success('Thêm kích thước thành công !');
        setisOpenModalSize(false);
        await loadProductDetailSize();
      } else {
        toast.error('Thêm kích thước thất bại');
      }
    } else {
      let response = await UpdateProductDetailSizeService({
        sizeId: data.sizeId,
        width: data.width,
        height: data.height,
        stock: data.stock,
        id: data.id,
        weight: data.weight,
      });
      if (response && response.errCode === 0) {
        setproductSizeId('');
        toast.success('Cập nhật kích thước thành công !');
        setisOpenModalSize(false);
        await loadProductDetailSize();
      } else {
        toast.error('Cập nhật kích thước thất bại !');
      }
    }
  };
  let handleEditProductImage = (id) => {
    setproductImageId(id);
    setisOpenModal(true);
  };
  let handleEditProductSize = (id) => {
    setproductSizeId(id);
    setisOpenModalSize(true);
  };
  let handleDeleteProductImage = async (productdetailImageId) => {
    let response = await DeleteProductDetailImageService({
      data: {
        id: productdetailImageId,
      },
    });
    if (response && response.errCode === 0) {
      toast.success('Xóa hình ảnh thành công !');
      let arrData = await getAllProductDetailImageByIdService({
        id: id,
        limit: PAGINATION.pagerow,
        offset: numberPage * PAGINATION.pagerow,
      });
      if (arrData && arrData.errCode === 0) {
        setdataProductDetailImage(arrData.data);
        setCount(Math.ceil(arrData.count / PAGINATION.pagerow));
      }
    } else {
      toast.error('Xóa hình ảnh thất bại !');
    }
  };
  let handleDeleteProductSize = async (productdetailsizeId) => {
    let response = await DeleteProductDetailSizeService({
      data: {
        id: productdetailsizeId,
      },
    });
    if (response && response.errCode === 0) {
      toast.success('Xóa kích thước thành công !');
      let arrData = await getAllProductDetailSizeByIdService({
        id: id,
        limit: PAGINATION.pagerow,
        offset: numberPage * PAGINATION.pagerow,
      });
      if (arrData && arrData.errCode === 0) {
        setdataProductDetailSize(arrData.data);
        setcountSizes(Math.ceil(arrData.count / PAGINATION.pagerow));
      }
    } else {
      toast.error('Xóa hình ảnh thất bại !');
    }
  };
  let handleChangePage = async (number) => {
    setnumberPage(number.selected);
    let arrData = await getAllProductDetailImageByIdService({
      id: id,
      limit: PAGINATION.pagerow,
      offset: number.selected * PAGINATION.pagerow,
    });
    if (arrData && arrData.errCode === 0) {
      setdataProductDetailImage(arrData.data);
    }
  };
  let handleChangePageProductSize = async (number) => {
    setnumberPage(number.selected);
    let arrSize = await getAllProductDetailSizeByIdService({
      id: id,
      limit: PAGINATION.pagerow,
      offset: number.selected * PAGINATION.pagerow,
    });
    if (arrSize && arrSize.errCode === 0) {
      setdataProductDetailSize(arrSize.data);
    }
  };
  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <h1 className="ap-page-title">Thông tin chi tiết sản phẩm</h1>
            <div className="ap-page-subtitle">Quản lý hình ảnh và kích thước của sản phẩm</div>
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
            <i className="fas fa-image me-2" /> Danh sách hình ảnh
          </div>
          <button className="ap-btn ap-btn-primary ap-btn-sm" onClick={() => handleOpenModal()}>
            <i className="fas fa-plus"></i> Thêm hình ảnh
          </button>
        </div>
        <div className="ap-card-body p-0">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên hình ảnh</th>
                  <th>Hình ảnh</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dataProductDetailImage && dataProductDetailImage.length > 0 ? (
                  dataProductDetailImage.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.caption}</td>
                        <td>
                          <div
                            onClick={() => openPreviewImage(item.image)}
                            className="box-image shadow-sm"
                            style={{ backgroundImage: `url(${item.image})` }}
                            title="Nhấp để xem lớn"
                          ></div>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="ap-btn ap-btn-ghost ap-btn-sm"
                              onClick={() => handleEditProductImage(item.id)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="ap-btn ap-btn-ghost ap-btn-sm text-danger"
                              onClick={() => handleDeleteProductImage(item.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      <div className="ap-empty">
                        <i className="fas fa-images ap-empty-icon"></i>
                        <div className="ap-empty-title">Chưa có hình ảnh nào</div>
                        <div className="ap-empty-desc">Vui lòng thêm hình ảnh mới cho sản phẩm này</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {count > 1 && (
          <div className="card-footer bg-transparent border-0 d-flex justify-content-center py-3">
            <ReactPaginate
              previousLabel={'<'}
              nextLabel={'>'}
              breakLabel={'...'}
              pageCount={count}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              containerClassName={'ap-pagination'}
              pageClassName={'ap-page-item'}
              pageLinkClassName={''}
              previousClassName={'ap-page-item'}
              previousLinkClassName={''}
              nextClassName={'ap-page-item'}
              nextLinkClassName={''}
              breakClassName={'ap-page-item'}
              breakLinkClassName={''}
              activeClassName={'ap-page-active'}
              onPageChange={handleChangePage}
            />
          </div>
        )}
      </div>

      <div className="ap-card mb-4">
        <div className="ap-card-header">
          <div className="ap-card-title">
            <i className="fas fa-ruler-combined me-2" /> Danh sách kích thước
          </div>
          <button className="ap-btn ap-btn-primary ap-btn-sm" onClick={() => handleOpenModalSize()}>
            <i className="fas fa-plus"></i> Thêm kích thước
          </button>
        </div>
        <div className="ap-card-body p-0">
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Kích thước</th>
                  <th>Chiều rộng</th>
                  <th>Chiều dài</th>
                  <th>Khối lượng</th>
                  <th>Số lượng tồn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dataProductDetailSize && dataProductDetailSize.length > 0 ? (
                  dataProductDetailSize.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td><span className="ap-badge ap-badge-indigo">{item.sizeData.value}</span></td>
                        <td>{item.width}</td>
                        <td>{item.height}</td>
                        <td>{item.weight}</td>
                        <td><span className={item.stock > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{item.stock}</span></td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="ap-btn ap-btn-ghost ap-btn-sm"
                              onClick={() => handleEditProductSize(item.id)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="ap-btn ap-btn-ghost ap-btn-sm text-danger"
                              onClick={() => handleDeleteProductSize(item.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="ap-empty">
                        <i className="fas fa-box-open ap-empty-icon"></i>
                        <div className="ap-empty-title">Chưa có kích thước nào</div>
                        <div className="ap-empty-desc">Vui lòng thêm kích thước mới cho sản phẩm này</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {countSize > 1 && (
          <div className="card-footer bg-transparent border-0 d-flex justify-content-center py-3">
            <ReactPaginate
              previousLabel={'<'}
              nextLabel={'>'}
              breakLabel={'...'}
              pageCount={countSize}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              containerClassName={'ap-pagination'}
              pageClassName={'ap-page-item'}
              pageLinkClassName={''}
              previousClassName={'ap-page-item'}
              previousLinkClassName={''}
              nextClassName={'ap-page-item'}
              nextLinkClassName={''}
              breakClassName={'ap-page-item'}
              breakLinkClassName={''}
              activeClassName={'ap-page-active'}
              onPageChange={handleChangePageProductSize}
            />
          </div>
        )}
      </div>

      <AddImageModal
        isOpenModal={isOpenModal}
        closeModal={closeModal}
        sendDataFromModal={sendDataFromModal}
        productImageId={productImageId}
      />
      <AddSizeModal
        isOpenModal={isOpenModalSize}
        closeModal={closeModalSize}
        sendDataFromModalSize={sendDataFromModalSize}
        productSizeId={productSizeId}
      />

      {isOpen === true && (
        <Lightbox mainSrc={imgPreview} onCloseRequest={() => setisOpen(false)} />
      )}
    </div>
  );
};
export default ManageProductImage;
