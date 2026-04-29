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

  const loadData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getStatisticStockProduct({ limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = async () => {
    const res = await getStatisticStockProduct({ limit: '', offset: '' });
    if (res?.errCode === 0) await CommonUtils.exportExcel(res.data, 'Sản phẩm tồn kho', 'ListStock');
  };

  const stockBadge = (qty) => {
    if (qty === 0) return <span className="ap-badge ap-badge-red">Hết hàng</span>;
    if (qty < 10) return <span className="ap-badge ap-badge-amber">Sắp hết ({qty})</span>;
    return <span className="ap-badge ap-badge-green">{qty}</span>;
  };

  return (
    <div className="ap-page">
      <PageHeader title="📦 Tồn kho sản phẩm" subtitle="Theo dõi số lượng hàng tồn theo từng size"
        actions={<button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>}
      />
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>#</th><th>Sản phẩm — Phân loại — Size</th><th>Danh mục</th><th>Nhãn hàng</th><th>Chất liệu</th><th style={{ textAlign: 'center' }}>Tồn kho</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={6} /> : data.length === 0 ? <EmptyState icon="📦" title="Không có dữ liệu tồn kho" /> :
                data.map((item, idx) => {
                  const name = `${item.productdData?.name} — ${item.productDetaildData?.nameDetail} — ${item.sizeData?.value}`;
                  return (
                    <tr key={idx} className="ap-row-enter" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productdData?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ap-text-muted)' }}>{item.productDetaildData?.nameDetail} · {item.sizeData?.value}</div>
                      </td>
                      <td><span className="ap-badge ap-badge-cyan">{item.productdData?.categoryData?.value}</span></td>
                      <td><span className="ap-badge ap-badge-indigo">{item.productdData?.brandData?.value}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>{item.productdData?.material}</td>
                      <td style={{ textAlign: 'center' }}>{stockBadge(item.stock)}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
        <AdminPagination count={count} onPageChange={({ selected }) => { setPage(selected); loadData(selected * PAGINATION.pagerow); }} />
      </div>
    </div>
  );
};
export default StockProduct;
