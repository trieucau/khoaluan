import React, { useEffect, useState, useCallback } from 'react';
import { getAllOrder } from '../../../services/userService';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { PAGINATION } from '../../../utils/constant';
import ReactPaginate from 'react-paginate';
import { useFetchAllcode } from '../../customize/fetch';
import CommonUtils from '../../../utils/CommonUtils';

const STATUS_BADGE = {
  S1: 'ap-badge-gray',
  S2: 'ap-badge-amber',
  S3: 'ap-badge-cyan',
  S4: 'ap-badge-indigo',
  S5: 'ap-badge-blue',
  S6: 'ap-badge-green',
  S7: 'ap-badge-red',
  S8: 'ap-badge-red',
};
const PAYMENT_BADGE = {
  0: { label: 'Tiền mặt', cls: 'ap-badge-gray' },
  1: { label: 'Online', cls: 'ap-badge-green' },
};

const SkeletonRows = ({ cols = 9 }) => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i}>
        {Array(cols)
          .fill(0)
          .map((_, j) => (
            <td key={j} style={{ padding: '13px 14px' }}>
              <div
                className="ap-skeleton ap-skeleton-text"
                style={{ width: j === 0 ? '50%' : '70%' }}
              />
            </td>
          ))}
      </tr>
    ))}
  </>
);

const Pagination = ({ count, onPageChange, forcePage }) => (
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
      marginPagesDisplayed={2}
      forcePage={forcePage}
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
      onPageChange={onPageChange}
    />
  </div>
);

const ManageOrder = () => {
  const [dataOrder, setDataOrder] = useState([]);
  const [count, setCount] = useState(0);
  const [numberPage, setNumberPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusId, setStatusId] = useState('ALL');
  const [search, setSearch] = useState('');
  const { data: dataStatusOrder } = useFetchAllcode('STATUS-ORDER');
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    if (dataStatusOrder && dataStatusOrder.length > 0) {
      const fetchCounts = async () => {
        const counts = {};
        const statuses = ['ALL', ...dataStatusOrder.map((s) => s.code)];
        await Promise.all(
          statuses.map(async (sid) => {
            try {
              const res = await getAllOrder({ limit: 1, offset: 0, statusId: sid });
              if (res?.errCode === 0) counts[sid] = res.count;
            } catch (e) {}
          })
        );
        setStatusCounts(counts);
      };
      fetchCounts();
    }
  }, [dataStatusOrder]);

  const loadOrderData = useCallback(
    async (sid = statusId, offset = 0) => {
      setLoading(true);
      try {
        const res = await getAllOrder({ limit: PAGINATION.pagerow, offset, statusId: sid });
        if (res?.errCode === 0) {
          setDataOrder(res.data);
          setCount(Math.ceil(res.count / PAGINATION.pagerow));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [statusId]
  );

  useEffect(() => {
    loadOrderData('ALL');
  }, []);

  const handleStatusChange = (sid) => {
    setStatusId(sid);
    setNumberPage(0);
    loadOrderData(sid, 0);
  };

  const handlePageChange = ({ selected }) => {
    setNumberPage(selected);
    loadOrderData(statusId, selected * PAGINATION.pagerow);
  };
  const handleExport = async () => {
    const res = await getAllOrder({ limit: '', offset: '', statusId: 'ALL' });
    if (res?.errCode === 0)
      await CommonUtils.exportExcel(res.data, 'Danh sách đơn hàng', 'ListOrder');
  };

  const filtered = search
    ? dataOrder.filter(
        (o) =>
          String(o.id).includes(search) ||
          o.userData?.email?.toLowerCase().includes(search.toLowerCase()) ||
          o.userData?.phonenumber?.includes(search)
      )
    : dataOrder;

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              <i className="fa-solid fa-box" style={{ marginRight: 8 }}></i>Quản lý đơn hàng
            </div>
            <div className="ap-page-subtitle">Theo dõi và quản lý tất cả đơn đặt hàng</div>
          </div>
          <button className="ap-btn ap-btn-success" onClick={handleExport}>
            <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Xuất Excel
          </button>
        </div>
      </div>

      <div className="ap-card">
        {/* Toolbar */}
        <div className="ap-toolbar">
          <div className="ap-search-bar">
            <span style={{ color: 'var(--ap-text-dim)' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, email, SĐT..."
            />
            {search && (
              <button
                onClick={() => setSearch('')}
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
          <div className="ap-tabs" style={{ flexWrap: 'wrap' }}>
            <button
              className={`ap-tab${statusId === 'ALL' ? ' active' : ''}`}
              onClick={() => handleStatusChange('ALL')}
            >
              Tất cả{' '}
              {statusCounts['ALL'] !== undefined && (
                <span
                  style={{
                    marginLeft: 6,
                    background:
                      statusId === 'ALL' ? 'rgba(255,255,255,0.2)' : 'rgba(120,120,130,0.2)',
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                >
                  {statusCounts['ALL']}
                </span>
              )}
            </button>
            {dataStatusOrder?.map((s) => (
              <button
                key={s.code}
                className={`ap-tab${statusId === s.code ? ' active' : ''}`}
                onClick={() => handleStatusChange(s.code)}
              >
                {s.value}{' '}
                {statusCounts[s.code] !== undefined && (
                  <span
                    style={{
                      marginLeft: 6,
                      background:
                        statusId === s.code ? 'rgba(255,255,255,0.2)' : 'rgba(120,120,130,0.2)',
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontSize: 11,
                    }}
                  >
                    {statusCounts[s.code]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Ngày đặt</th>
                <th>Loại ship</th>
                <th>Voucher</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Shipper</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={10} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 0, border: 'none' }}>
                    <div className="ap-empty">
                      <div className="ap-empty-icon">📭</div>
                      <div className="ap-empty-title">Không có đơn hàng</div>
                      <div className="ap-empty-desc">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const pay = PAYMENT_BADGE[item.isPaymentOnlien] || {
                    label: '—',
                    cls: 'ap-badge-gray',
                  };
                  return (
                    <tr
                      key={item.id}
                      className="ap-row-enter"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td>
                        <span className="ap-badge ap-badge-indigo">#{item.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            className="ap-avatar"
                            style={{
                              width: 28,
                              height: 28,
                              fontSize: 11,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {item.userData?.image ? (
                              <img
                                src={item.userData.image}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              (item.userData?.firstName?.[0] || '?').toUpperCase()
                            )}
                          </div>
                          <span style={{ fontSize: 13 }}>{item.userData?.email}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ap-text-muted)', fontSize: 13 }}>
                        {item.userData?.phonenumber}
                      </td>
                      <td
                        style={{
                          fontSize: 12,
                          color: 'var(--ap-text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {moment.utc(item.createdAt).local().format('DD/MM/YY HH:mm')}
                      </td>
                      <td style={{ fontSize: 12 }}>{item.typeShipData?.type}</td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>
                        {item.voucherData?.codeVoucher || '—'}
                      </td>
                      <td>
                        <span className={`ap-badge ${pay.cls}`}>{pay.label}</span>
                      </td>
                      <td>
                        <span
                          className={`ap-badge ${STATUS_BADGE[item.statusId] || 'ap-badge-gray'}`}
                        >
                          {item.statusOrderData?.value}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>
                        {item.shipperData ? (
                          `${item.shipperData.firstName} ${item.shipperData.lastName}`
                        ) : (
                          <span style={{ color: 'var(--ap-text-dim)' }}>Chưa có</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          to={`/admin/order-detail/${item.id}`}
                          className="ap-btn ap-btn-ghost ap-btn-sm"
                        >
                          <i className="fa-solid fa-magnifying-glass"></i>Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && count > 1 && (
          <Pagination count={count} onPageChange={handlePageChange} forcePage={numberPage} />
        )}
      </div>
    </div>
  );
};

export default ManageOrder;
