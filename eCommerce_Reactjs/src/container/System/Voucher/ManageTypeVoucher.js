import React, { useEffect, useState } from 'react';
import { deleteTypeVoucherService, getAllTypeVoucher } from '../../../services/userService';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, PageHeader } from '../AdminShared';

const ManageTypeVoucher = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllTypeVoucher({ limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa loại voucher này?')) return;
    const res = await deleteTypeVoucherService({ data: { id } });
    if (res?.errCode === 0) { toast.success('Xóa thành công'); fetchData(page * PAGINATION.pagerow); }
    else toast.error('Xóa thất bại');
  };

  const handleExport = async () => {
    const res = await getAllTypeVoucher({ limit: '', offset: '' });
    if (res?.errCode === 0) await CommonUtils.exportExcel(res.data, 'Danh sách loại voucher', 'ListTypeVoucher');
  };

  const fmtVal = (item) => item.typeVoucher === 'percent'
    ? <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{item.value}%</span>
    : <span style={{ color: '#fbbf24', fontWeight: 700 }}>{CommonUtils.formatter.format(item.value)}</span>;

  return (
    <div className="ap-page">
      <PageHeader title="🎫 Quản lý loại khuyến mãi" subtitle="Cấu hình các loại voucher giảm giá"
        actions={<>
          <button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>
          <Link to="/admin/add-typevoucher" className="ap-btn ap-btn-primary">+ Thêm loại KM</Link>
        </>}
      />
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>#</th><th>Loại voucher</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Giảm tối đa</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={6} /> : data.length === 0 ? <EmptyState icon="🎫" title="Không có loại khuyến mãi" /> :
                data.map((item, idx) => (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                    <td>
                      <span className={`ap-badge ${item.typeVoucher === 'percent' ? 'ap-badge-indigo' : 'ap-badge-amber'}`}>
                        {item.typeVoucherData?.value}
                      </span>
                    </td>
                    <td>{fmtVal(item)}</td>
                    <td style={{ fontSize: 13, color: 'var(--ap-text-muted)' }}>{CommonUtils.formatter.format(item.minValue)}</td>
                    <td style={{ fontSize: 13, color: 'var(--ap-text-muted)' }}>{CommonUtils.formatter.format(item.maxValue)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link to={`/admin/edit-typevoucher/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">✏️ Sửa</Link>
                        <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <AdminPagination count={count} onPageChange={({ selected }) => { setPage(selected); fetchData(selected * PAGINATION.pagerow); }} />
      </div>
    </div>
  );
};
export default ManageTypeVoucher;
