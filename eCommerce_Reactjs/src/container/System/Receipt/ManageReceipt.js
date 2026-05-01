import React, { useEffect, useState } from 'react';
import { getAllReceipt } from '../../../services/userService';
import moment from 'moment';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, PageHeader } from '../AdminShared';

const ManageReceipt = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllReceipt({ limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExport = async () => {
    const res = await getAllReceipt({ limit: '', offset: '' });
    if (res?.errCode === 0) await CommonUtils.exportExcel(res.data, 'Danh sách nhập hàng', 'ListReceipt');
  };

  return (
    <div className="ap-page">
      <PageHeader title="📦 Quản lý nhập hàng" subtitle="Lịch sử phiếu nhập hàng từ nhà cung cấp"
        actions={<>
          <button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>
          <Link to="/admin/add-receipt" className="ap-btn ap-btn-primary">+ Tạo phiếu nhập</Link>
        </>}
      />
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>#</th><th>Ngày nhập</th><th>Nhà cung cấp</th><th>SĐT NCC</th><th>Nhân viên</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={6} /> : data.length === 0 ? <EmptyState icon="📦" title="Không có phiếu nhập nào" /> :
                data.map((item, idx) => (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                    <td style={{ fontSize: 12, color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>
                      {moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.supplierData?.name}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{item.supplierData?.phonenumber}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="ap-avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0, overflow: 'hidden' }}>
                          {item.userData?.image ? (
                            <img src={item.userData.image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            item.userData?.firstName?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <span style={{ fontSize: 13 }}>{item.userData?.firstName} {item.userData?.lastName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link to={`/admin/detail-receipt/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">🔍 Xem chi tiết</Link>
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
export default ManageReceipt;
