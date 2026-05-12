import React, { useEffect, useState } from 'react';
import { getAllBlog, deleteBlogService } from '../../../services/userService';
import { toast } from 'react-toastify';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, SearchBar, PageHeader } from '../AdminShared';

const ManageBlog = () => {
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
      const res = await getAllBlog({
        subjectId: '',
        limit: PAGINATION.pagerow,
        offset,
        keyword: kw,
      });
      if (res?.errCode === 0) {
        setData(res.data);
        setCount(Math.ceil(res.count / PAGINATION.pagerow));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài đăng này?')) return;
    const res = await deleteBlogService({ data: { id } });
    if (res?.errCode === 0) {
      toast.success('Xóa thành công');
      fetchData(keyword, page * PAGINATION.pagerow);
    } else toast.error('Xóa thất bại');
  };

  const handleExport = async () => {
    const res = await getAllBlog({ subjectId: '', limit: '', offset: '', keyword: '' });
    if (res?.errCode === 0) {
      res.data.forEach((el) => {
        el.image = '';
      });
      await CommonUtils.exportExcel(res.data, 'Danh sách bài viết', 'ListBlog');
    }
  };

  return (
    <div className="ap-page">
      <PageHeader
        title={
          <>
            <i className="fa-solid fa-pen-nib" style={{ marginRight: 8 }}></i>Quản lý bài đăng
          </>
        }
        subtitle="Danh sách bài viết blog"
        actions={
          <>
            <button className="ap-btn ap-btn-success" onClick={handleExport}>
              <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Xuất Excel
            </button>
            <Link to="/admin/add-blog" className="ap-btn ap-btn-primary">
              + Thêm bài đăng
            </Link>
          </>
        }
      />
      <div className="ap-card">
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSearch={(kw) => {
            setKeyword(kw);
            fetchData(kw);
          }}
          placeholder="Tìm theo tiêu đề bài đăng..."
        />
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tiêu đề bài viết</th>
                <th>Chủ đề</th>
                <th>Hình ảnh</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={5} />
              ) : data.length === 0 ? (
                <EmptyState
                  icon={
                    <>
                      <i className="fa-solid fa-pen-nib" style={{ marginRight: 8 }}></i>
                    </>
                  }
                  title="Không có bài đăng nào"
                />
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="ap-row-enter"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600, width: 50 }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, maxWidth: 280 }}>
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                    </td>
                    <td>
                      <span className="ap-badge ap-badge-cyan">{item.subjectData?.value}</span>
                    </td>
                    <td>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          onClick={() => {
                            setLightboxImg(item.image);
                            setLightboxOpen(true);
                          }}
                          style={{
                            width: 64,
                            height: 48,
                            objectFit: 'cover',
                            borderRadius: 6,
                            cursor: 'pointer',
                            border: '1px solid var(--ap-border)',
                            transition: 'transform 0.2s',
                          }}
                          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.08)')}
                          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link
                          to={`/admin/edit-blog/${item.id}`}
                          className="ap-btn ap-btn-ghost ap-btn-sm"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>Sửa
                        </Link>
                        <button
                          className="ap-btn ap-btn-danger ap-btn-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          count={count}
          onPageChange={({ selected }) => {
            setPage(selected);
            fetchData(keyword, selected * PAGINATION.pagerow);
          }}
        />
      </div>
      {lightboxOpen && (
        <Lightbox
          slides={[{ src: lightboxImg }]}
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
export default ManageBlog;
