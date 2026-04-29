import React, { useEffect, useState } from 'react';
import { getAllProductDetailByIdService, DeleteProductDetailService } from '../../../../services/userService';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../../utils/constant';
import CommonUtils from '../../../../utils/CommonUtils';
import { Link, useParams } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, PageHeader } from '../../AdminShared';

const ManageProductDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllProductDetailByIdService({ id, limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (detailId) => {
    if (!window.confirm('Xóa chi tiết sản phẩm này?')) return;
    const res = await DeleteProductDetailService({ data: { id: detailId } });
    if (res?.errCode === 0) { toast.success('Xóa thành công'); loadData(page * PAGINATION.pagerow); }
    else toast.error('Xóa thất bại');
  };

  const discount = (orig, disc) => {
    const pct = Math.round((1 - disc / orig) * 100);
    return pct > 0 ? <span className="ap-badge ap-badge-green" style={{ marginLeft: 6 }}>-{pct}%</span> : null;
  };

  return (
    <div className="ap-page">
      <PageHeader
        title="🧩 Chi tiết sản phẩm"
        subtitle={`Quản lý các loại phân loại cho sản phẩm #${id}`}
        actions={<Link to={`/admin/add-product-detail/${id}`} className="ap-btn ap-btn-primary">+ Thêm phân loại</Link>}
      />
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>#</th><th>Tên loại</th><th>Giá gốc</th><th>Giá khuyến mãi</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={5} /> : data.length === 0 ? <EmptyState icon="🧩" title="Chưa có phân loại nào" desc="Nhấn '+ Thêm phân loại' để bắt đầu" /> :
                data.map((item, idx) => (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.nameDetail}</td>
                    <td style={{ color: 'var(--ap-text-muted)', fontSize: 13 }}>{CommonUtils.formatter.format(item.originalPrice)}</td>
                    <td>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>{CommonUtils.formatter.format(item.discountPrice)}</span>
                      {discount(item.originalPrice, item.discountPrice)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link to={`/admin/list-product-detail-image/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">🖼️ Ảnh</Link>
                        <Link to={`/admin/update-product-detail/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">✏️</Link>
                        <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <AdminPagination count={count} onPageChange={({ selected }) => { setPage(selected); loadData(selected * PAGINATION.pagerow); }} />
      </div>
    </div>
  );
};
export default ManageProductDetail;
