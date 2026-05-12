import React, { useEffect, useState } from 'react';
import { getStatisticStockProduct } from '../../../services/userService';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { SkeletonRows, EmptyState, AdminPagination, PageHeader } from '../AdminShared';

const StockProduct = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalItems: 0, outOfStock: 0, lowStock: 0 });

  const loadData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getStatisticStockProduct({ limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) {
        setData(res.data);
        setCount(Math.ceil(res.count / PAGINATION.pagerow));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      const res = await getStatisticStockProduct({ limit: '', offset: '' });
      if (res?.errCode === 0) {
        let totalItems = res.data.length;
        let outOfStock = 0,
          lowStock = 0;
        res.data.forEach((item) => {
          if (item.stock === 0) outOfStock++;
          else if (item.stock < 10) lowStock++;
        });
        setStats({ totalItems, outOfStock, lowStock });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    loadGlobalStats();
  }, []);

  const handleExport = async () => {
    const res = await getStatisticStockProduct({ limit: '', offset: '' });
    if (res?.errCode === 0)
      await CommonUtils.exportExcel(res.data, 'Sản phẩm tồn kho', 'ListStock');
  };

  const stockBadge = (qty) => {
    if (qty === 0)
      return (
        <span className="ap-badge ap-badge-red" style={{ fontWeight: 700 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }}></i>Hết hàng
        </span>
      );
    if (qty < 10)
      return (
        <span className="ap-badge ap-badge-amber" style={{ fontWeight: 700 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>Sắp hết (
          {qty})
        </span>
      );
    return (
      <span className="ap-badge ap-badge-green">
        <i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>
        {qty}
      </span>
    );
  };

  return (
    <div className="ap-page">
      <PageHeader
        title={
          <>
            <i className="fa-solid fa-box" style={{ marginRight: 8 }}></i>Tồn kho sản phẩm
          </>
        }
        subtitle="Theo dõi số lượng hàng tồn theo từng size"
        actions={
          <button className="ap-btn ap-btn-success" onClick={handleExport}>
            <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Xuất Excel
          </button>
        }
      />

      {/* Alert Note */}
      <div
        style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
        </span>
        <span>
          <strong>Cảnh báo:</strong> Hãy ưu tiên kiểm tra và nhập thêm hàng cho các mặt hàng đang
          trong tình trạng Đứt hàng hoặc Sắp hết.
        </span>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Tổng Phân Loại (SKU)',
            value: stats.totalItems || (count ? count * PAGINATION.pagerow : 0),
            icon: (
              <>
                <i className="fa-solid fa-box" style={{ marginRight: 8 }}></i>
              </>
            ),
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.15)',
          },
          {
            label: 'Cảnh Báo Sắp Hết (<10)',
            value: stats.lowStock,
            icon: <i className="fa-solid fa-triangle-exclamation"></i>,
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.15)',
          },
          {
            label: 'Cảnh Báo Đứt Hàng (0)',
            value: stats.outOfStock,
            icon: <i className="fa-solid fa-circle-exclamation"></i>,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.15)',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="ap-card"
            style={{
              margin: 0,
              border: `1px solid ${s.color}40`,
              background: 'var(--ap-surface)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: s.bg,
                filter: 'blur(24px)',
              }}
            />

            <div
              className="ap-card-body"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                  border: `1px solid ${s.color}40`,
                }}
              >
                {s.icon}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ap-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    color: s.color,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ap-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ap-table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Sản phẩm — Phân loại — Size</th>
                <th>Danh mục</th>
                <th>Nhãn hàng</th>
                <th>Chất liệu</th>
                <th style={{ textAlign: 'center' }}>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} />
              ) : data.length === 0 ? (
                <EmptyState
                  icon={
                    <>
                      <i className="fa-solid fa-box" style={{ marginRight: 8 }}></i>
                    </>
                  }
                  title="Không có dữ liệu tồn kho"
                />
              ) : (
                data.map((item, idx) => {
                  const name = `${item.productdData?.name} — ${item.productDetaildData?.nameDetail} — ${item.sizeData?.value}`;
                  return (
                    <tr
                      key={idx}
                      className="ap-row-enter"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {item.productdData?.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ap-text-muted)' }}>
                          {item.productDetaildData?.nameDetail} · {item.sizeData?.value}
                        </div>
                      </td>
                      <td>
                        <span className="ap-badge ap-badge-cyan">
                          {item.productdData?.categoryData?.value}
                        </span>
                      </td>
                      <td>
                        <span className="ap-badge ap-badge-indigo">
                          {item.productdData?.brandData?.value}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>
                        {item.productdData?.material}
                      </td>
                      <td style={{ textAlign: 'center' }}>{stockBadge(item.stock)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          count={count}
          onPageChange={({ selected }) => {
            setPage(selected);
            loadData(selected * PAGINATION.pagerow);
          }}
        />
      </div>
    </div>
  );
};
export default StockProduct;
