import React, { useEffect, useState } from 'react';
import { deleteVoucherService, getAllVoucher } from '../../../services/userService';
import moment from 'moment';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, PageHeader } from '../AdminShared';

const ManageVoucher = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllVoucher({ limit: PAGINATION.pagerow, offset });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mã voucher này?')) return;
    const res = await deleteVoucherService({ data: { id } });
    if (res?.errCode === 0) { toast.success('Xóa voucher thành công'); fetchData(page * PAGINATION.pagerow); }
    else toast.error('Xóa voucher thất bại');
  };

  const handleExport = async () => {
    const res = await getAllVoucher({ limit: '', offset: '' });
    if (res?.errCode === 0) {
      res.data.forEach(item => {
        item.fromDate = moment.unix(item.fromDate / 1000).format('DD/MM/YYYY');
        item.toDate = moment.unix(item.toDate / 1000).format('DD/MM/YYYY');
      });
      await CommonUtils.exportExcel(res.data, 'Danh sách voucher', 'ListVoucher');
    }
  };

  const isExpired = (toDate) => moment.unix(toDate / 1000).isBefore(moment());

  return (
    <div className="ap-page">
      <PageHeader title={<><i className="fa-solid fa-tags" style={{marginRight: 8}}></i>Quản lý mã Voucher</>} subtitle="Danh sách mã giảm giá và khuyến mãi"
        actions={<>
          <button className="ap-btn ap-btn-success" onClick={handleExport}><i className="fa-solid fa-file-excel" style={{marginRight: 6}}></i>Xuất Excel</button>
          <Link to="/admin/add-voucher" className="ap-btn ap-btn-primary">+ Thêm voucher</Link>
        </>}
      />
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th><th>Mã Voucher</th><th>Loại khuyến mãi</th>
                <th>Số lượng</th><th>Đã dùng</th><th>Từ ngày</th><th>Đến ngày</th><th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={9} /> : data.length === 0 ? <EmptyState icon={<><i className="fa-solid fa-tags" style={{marginRight: 8}}></i></>} title="Không có voucher nào" /> :
                data.map((item, idx) => {
                  const expired = isExpired(item.toDate);
                  const used = item.usedAmount >= item.amount;
                  const status = expired ? { label: 'Hết hạn', cls: 'ap-badge-red' } : used ? { label: 'Hết lượt', cls: 'ap-badge-amber' } : { label: 'Đang dùng', cls: 'ap-badge-green' };
                  return (
                    <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                      <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a5b4fc', fontSize: 13, background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: 5 }}>
                          {item.codeVoucher}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{item.typeVoucherOfVoucherData?.value} {item.typeVoucherOfVoucherData?.typeVoucherData?.value}</td>
                      <td style={{ fontWeight: 600 }}>{item.amount}</td>
                      <td>
                        <span style={{ color: item.usedAmount >= item.amount ? '#fca5a5' : '#6ee7b7', fontWeight: 600 }}>{item.usedAmount}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>{moment.unix(item.fromDate / 1000).format('DD/MM/YYYY')}</td>
                      <td style={{ fontSize: 12, color: expired ? '#fca5a5' : 'var(--ap-text-muted)' }}>{moment.unix(item.toDate / 1000).format('DD/MM/YYYY')}</td>
                      <td><span className={`ap-badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <Link to={`/admin/edit-voucher/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm"><i className="fa-solid fa-pen-to-square"></i>Sửa</Link>
                          <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={() => handleDelete(item.id)}><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
        <AdminPagination count={count} onPageChange={({ selected }) => { setPage(selected); fetchData(selected * PAGINATION.pagerow); }} />
      </div>
    </div>
  );
};
export default ManageVoucher;
