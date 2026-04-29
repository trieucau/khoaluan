import React, { useEffect, useState } from 'react';
import { DeleteAllcodeService, getListAllCodeService } from '../../../services/userService';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, SearchBar, PageHeader } from '../AdminShared';

const ManageSubject = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async (kw = '', offset = 0) => {
    setLoading(true);
    try {
      const res = await getListAllCodeService({ type: 'SUBJECT', limit: PAGINATION.pagerow, offset, keyword: kw });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Xóa chủ đề này?')) return;
    const res = await DeleteAllcodeService(id);
    if (res?.errCode === 0) { toast.success('Xóa thành công'); fetchData(keyword, page * PAGINATION.pagerow); }
    else toast.error('Xóa thất bại');
  };

  const handleExport = async () => {
    const res = await getListAllCodeService({ type: 'SUBJECT', limit: '', offset: '', keyword: '' });
    if (res?.errCode === 0) await CommonUtils.exportExcel(res.data, 'Danh sách chủ đề', 'ListSubject');
  };

  return (
    <div className="ap-page">
      <PageHeader title="📚 Quản lý chủ đề" subtitle="Danh sách chủ đề bài đăng blog"
        actions={<>
          <button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>
          <Link to="/admin/add-subject" className="ap-btn ap-btn-primary">+ Thêm chủ đề</Link>
        </>}
      />
      <div className="ap-card">
        <SearchBar value={keyword} onChange={setKeyword} onSearch={(kw) => { setKeyword(kw); fetchData(kw); }} placeholder="Tìm theo tên chủ đề..." />
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>#</th><th>Tên chủ đề</th><th>Mã code</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {loading ? <SkeletonRows cols={4} /> : data.length === 0 ? <EmptyState icon="📚" title="Không có chủ đề nào" /> :
                data.map((item, idx) => (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.value}</td>
                    <td><span className="ap-badge ap-badge-cyan">{item.code}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link to={`/admin/edit-subject/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">✏️ Sửa</Link>
                        <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={e => handleDelete(e, item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <AdminPagination count={count} onPageChange={({ selected }) => { setPage(selected); fetchData(keyword, selected * PAGINATION.pagerow); }} />
      </div>
    </div>
  );
};
export default ManageSubject;
