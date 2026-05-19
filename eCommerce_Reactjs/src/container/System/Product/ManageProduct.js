import React, { useEffect, useState } from 'react';
import {
  getAllProductAdmin,
  handleBanProductService,
  handleActiveProductService,
} from '../../../services/userService';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import ReactPaginate from 'react-paginate';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';

const STATUS_CFG = {
  S1: { label: 'Đang bán', cls: 'ap-badge-green' },
  S2: { label: 'Đã ẩn', cls: 'ap-badge-red' },
};

const SkeletonRows = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i}>
        {[...Array(8)].map((_, j) => (
          <td key={j} style={{ padding: '13px 14px' }}>
            <div
              className="ap-skeleton ap-skeleton-text"
              style={{ width: j === 1 ? '80%' : '55%' }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const ManageProduct = () => {
  const [dataProduct, setDataProduct] = useState([]);
  const [count, setCount] = useState(0);
  const [numberPage, setNumberPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProduct = async (kw = '', offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllProductAdmin({
        sortName: '',
        sortPrice: '',
        categoryId: 'ALL',
        brandId: 'ALL',
        limit: PAGINATION.pagerow,
        offset,
        keyword: kw,
      });
      if (res?.errCode === 0) {
        setDataProduct(res.data);
        setCount(Math.ceil(res.count / PAGINATION.pagerow));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, []);

  const handleBan = async (id) => {
    const res = await handleBanProductService({ id });
    if (res?.errCode === 0) {
      toast.success('Đã ẩn sản phẩm');
      loadProduct(keyword, numberPage * PAGINATION.pagerow);
    } else toast.error('Thao tác thất bại');
  };

  const handleActive = async (id) => {
    const res = await handleActiveProductService({ id });
    if (res?.errCode === 0) {
      toast.success('Đã hiện sản phẩm');
      loadProduct(keyword, numberPage * PAGINATION.pagerow);
    } else toast.error('Thao tác thất bại');
  };

  const handlePageChange = ({ selected }) => {
    setNumberPage(selected);
    loadProduct(keyword, selected * PAGINATION.pagerow);
  };

  const handleExport = async () => {
    const res = await getAllProductAdmin({
      sortName: '',
      sortPrice: '',
      categoryId: 'ALL',
      brandId: 'ALL',
      keyword: '',
      limit: '',
      offset: '',
    });
    if (res?.errCode === 0)
      await CommonUtils.exportExcel(res.data, 'Danh sách sản phẩm', 'ListProduct');
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              <i className="fa-solid fa-bag-shopping" style={{ marginRight: 8 }}></i>Quản lý sản
              phẩm
            </div>
            <div className="ap-page-subtitle">Danh sách toàn bộ sản phẩm trong hệ thống</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ap-btn ap-btn-success" onClick={handleExport}>
              <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Xuất Excel
            </button>
            <Link to="/admin/add-product" className="ap-btn ap-btn-primary">
              + Thêm sản phẩm
            </Link>
          </div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-toolbar">
          <div className="ap-search-bar">
            <span style={{ color: 'var(--ap-text-dim)' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setNumberPage(0);
                  loadProduct(keyword, 0);
                }
              }}
              placeholder="Tìm theo tên sản phẩm..."
            />
            {keyword && (
              <button
                onClick={() => {
                  setKeyword('');
                  setNumberPage(0);
                  loadProduct('', 0);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ap-text-dim)',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            )}
          </div>
          <button
            className="ap-btn ap-btn-primary ap-btn-sm"
            onClick={() => {
              setNumberPage(0);
              loadProduct(keyword, 0);
            }}
          >
            Tìm kiếm
          </button>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Nhãn hàng</th>
                <th>Chất liệu</th>
                <th>Lượt xem</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : dataProduct.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 0, border: 'none' }}>
                    <div className="ap-empty">
                      <div className="ap-empty-icon">
                        <i className="fa-solid fa-bag-shopping" style={{ marginRight: 8 }}></i>
                      </div>
                      <div className="ap-empty-title">Không tìm thấy sản phẩm</div>
                      <div className="ap-empty-desc">Thử thay đổi từ khóa tìm kiếm</div>
                    </div>
                  </td>
                </tr>
              ) : (
                dataProduct.map((item, idx) => {
                  const sc = STATUS_CFG[item.statusData?.code] || {
                    label: item.statusData?.value,
                    cls: 'ap-badge-gray',
                  };
                  const isActive = item.statusData?.code === 'S1';
                  return (
                    <tr
                      key={item.id}
                      className="ap-row-enter"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, fontSize: 13 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ap-text)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ap-text-dim)', marginTop: 2 }}>
                          ID: {item.id}
                        </div>
                      </td>
                      <td>
                        <span className="ap-badge ap-badge-indigo">{item.categoryData?.value}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ap-text-muted)' }}>
                        {item.brandData?.value}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>
                        {item.material || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{item.view || 0}</span>
                          <span style={{ fontSize: 11, color: 'var(--ap-text-dim)' }}>lượt</span>
                        </div>
                      </td>
                      <td>
                        <span className={`ap-badge ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: 5,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Link
                            to={`/admin/list-product-detail/${item.id}`}
                            className="ap-btn ap-btn-ghost ap-btn-sm"
                          >
                            <i className="fa-solid fa-list-check" style={{ marginRight: 8 }}></i>Chi
                            tiết
                          </Link>
                          <Link
                            to={`/admin/edit-product/${item.id}`}
                            className="ap-btn ap-btn-ghost ap-btn-sm"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </Link>
                          {isActive ? (
                            <button
                              className="ap-btn ap-btn-warning ap-btn-sm"
                              onClick={() => handleBan(item.id)}
                            >
                              Ẩn
                            </button>
                          ) : (
                            <button
                              className="ap-btn ap-btn-success ap-btn-sm"
                              onClick={() => handleActive(item.id)}
                            >
                              Hiện
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && count > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--ap-border)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ReactPaginate
              previousLabel="← Trước"
              nextLabel="Sau →"
              breakLabel="..."
              pageCount={count}
              forcePage={numberPage}
              marginPagesDisplayed={2}
              containerClassName="ap-pagination"
              pageClassName="ap-page-item"
              pageLinkClassName="ap-page-link"
              previousClassName="ap-page-item"
              previousLinkClassName="ap-page-link"
              nextClassName="ap-page-item"
              nextLinkClassName="ap-page-link"
              breakClassName="ap-page-item"
              breakLinkClassName="ap-page-link"
              activeClassName="ap-page-active"
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProduct;
