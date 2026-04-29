import React, { useEffect, useState } from 'react';
import { getAllBanner, deleteBannerService } from '../../../services/userService';
import { toast } from 'react-toastify';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, SearchBar, PageHeader } from '../AdminShared';

const ManageBanner = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchData = async (kw = '', offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllBanner({ limit: PAGINATION.pagerow, offset, keyword: kw });
      if (res?.errCode === 0) { setData(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa banner này?')) return;
    const res = await deleteBannerService({ data: { id } });
    if (res?.errCode === 0) { toast.success('Xóa banner thành công'); fetchData(keyword, page * PAGINATION.pagerow); }
    else toast.error('Xóa banner thất bại');
  };

  const handleExport = async () => {
    const res = await getAllBanner({ limit: '', offset: '', keyword: '' });
    if (res?.errCode === 0) {
      res.data.forEach(el => { el.image = ''; });
      await CommonUtils.exportExcel(res.data, 'Danh sách banner', 'ListBanner');
    }
  };

  return (
    <div className="ap-page">
      <PageHeader title="🖼️ Quản lý Banner" subtitle="Danh sách hình ảnh quảng cáo trang chủ"
        actions={<>
          <button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>
          <Link to="/admin/add-banner" className="ap-btn ap-btn-primary">+ Thêm banner</Link>
        </>}
      />
      <div className="ap-card">
        <SearchBar value={keyword} onChange={setKeyword} onSearch={(kw) => { setKeyword(kw); fetchData(kw); }} placeholder="Tìm theo tên banner..." />
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead><tr><th>#</th><th>Tên banner</th><th>Hình ảnh preview</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {loading ? <SkeletonRows cols={4} /> : data.length === 0 ? <EmptyState icon="🖼️" title="Không có banner nào" /> :
                data.map((item, idx) => (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      {item.image && (
                        <img
                          src={item.image} alt={item.name}
                          onClick={() => { setLightboxImg(item.image); setLightboxOpen(true); }}
                          style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid var(--ap-border)', transition: 'transform 0.2s' }}
                          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link to={`/admin/edit-banner/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">✏️ Sửa</Link>
                        <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
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
      {lightboxOpen && <Lightbox slides={[{ src: lightboxImg }]} open={lightboxOpen} close={() => setLightboxOpen(false)} />}
    </div>
  );
};
export default ManageBanner;
