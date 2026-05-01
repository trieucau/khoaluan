import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, DeleteUserService } from '../../../services/userService';
import moment from 'moment';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import ReactPaginate from 'react-paginate';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';

const ROLE_BADGE = {
  R1: { label: 'Super Admin', cls: 'ap-badge-purple' },
  R2: { label: 'Người dùng', cls: 'ap-badge-gray' },
  R3: { label: 'Shipper', cls: 'ap-badge-cyan' },
  R4: { label: 'Nhân viên', cls: 'ap-badge-indigo' },
};

const SkeletonRows = () => (
  <>
    {[1,2,3,4,5].map(i => (
      <tr key={i}>
        {[...Array(7)].map((_, j) => (
          <td key={j} style={{ padding: '13px 14px' }}>
            <div className="ap-skeleton ap-skeleton-text" style={{ width: j === 1 ? '80%' : '60%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const ManageUser = () => {
  const [dataUser, setDataUser] = useState([]);
  const [count, setCount] = useState(0);
  const [numberPage, setNumberPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAllUser = async (kw = '', offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllUsers({ limit: PAGINATION.pagerow, offset, keyword: kw });
      if (res?.errCode === 0) { setDataUser(res.data); setCount(Math.ceil(res.count / PAGINATION.pagerow)); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAllUser('', 0); }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Xác nhận xóa người dùng này?')) return;
    const res = await DeleteUserService(id);
    if (res?.errCode === 0) { toast.success('Xóa thành công'); fetchAllUser(keyword, numberPage * PAGINATION.pagerow); }
    else toast.error('Xóa thất bại');
  };

  const handlePageChange = ({ selected }) => {
    setNumberPage(selected);
    fetchAllUser(keyword, selected * PAGINATION.pagerow);
  };

  const handleSearch = () => {
    setNumberPage(0);
    fetchAllUser(keyword, 0);
  };

  const handleClearSearch = () => {
    setKeyword('');
    setNumberPage(0);
    fetchAllUser('', 0);
  };

  const handleExport = async () => {
    const res = await getAllUsers({ limit: '', offset: '', keyword: '' });
    if (res?.errCode === 0) await CommonUtils.exportExcel(res.data, 'Danh sách người dùng', 'ListUser');
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">👥 Quản lý người dùng</div>
            <div className="ap-page-subtitle">Danh sách tài khoản trong hệ thống</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ap-btn ap-btn-success" onClick={handleExport}>📊 Xuất Excel</button>
            <Link to="/admin/add-user" className="ap-btn ap-btn-primary">+ Thêm mới</Link>
          </div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-toolbar">
          <div className="ap-search-bar">
            <span style={{ color: 'var(--ap-text-dim)' }}>🔍</span>
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm theo SĐT, email..."
            />
            {keyword && <button onClick={handleClearSearch} style={{ background: 'none', border: 'none', color: 'var(--ap-text-dim)', cursor: 'pointer', fontSize: 16 }}>×</button>}
          </div>
          <button className="ap-btn ap-btn-primary ap-btn-sm" onClick={handleSearch}>Tìm kiếm</button>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th><th>Người dùng</th><th>Email</th><th>SĐT</th>
                <th>Ngày sinh</th><th>Vai trò</th><th style={{ textAlign:'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : dataUser.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:0, border:'none' }}>
                  <div className="ap-empty">
                    <div className="ap-empty-icon">👤</div>
                    <div className="ap-empty-title">Không tìm thấy người dùng</div>
                  </div>
                </td></tr>
              ) : dataUser.map((item, idx) => {
                const role = ROLE_BADGE[item.roleId] || { label: item.roleData?.value, cls: 'ap-badge-gray' };
                const initials = `${item.firstName?.[0]||''}${item.lastName?.[0]||''}`.toUpperCase() || '?';
                return (
                  <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx*30}ms` }}>
                    <td style={{ color:'var(--ap-text-dim)', fontWeight:600, fontSize:13 }}>{idx+1}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="ap-avatar" style={{ width:32, height:32, fontSize:11, flexShrink:0 }}>
                          {item.image ? (
                            <img src={item.image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{item.firstName} {item.lastName}</div>
                          <div style={{ fontSize:11, color:'var(--ap-text-dim)' }}>{item.genderData?.value}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:13, color:'var(--ap-text-muted)' }}>{item.email}</td>
                    <td style={{ fontSize:13 }}>{item.phonenumber}</td>
                    <td style={{ fontSize:12, color:'var(--ap-text-muted)' }}>
                      {item.dob ? moment.unix(item.dob/1000).format('DD/MM/YYYY') : '—'}
                    </td>
                    <td><span className={`ap-badge ${role.cls}`}>{role.label}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        <Link to={`/admin/edit-user/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">✏️ Sửa</Link>
                        <button className="ap-btn ap-btn-danger ap-btn-sm" onClick={e => handleDelete(e, item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && count > 1 && (
          <div style={{ padding:'14px 20px', borderTop:'1px solid var(--ap-border)', display:'flex', justifyContent:'center' }}>
            <ReactPaginate
              previousLabel="← Trước" nextLabel="Sau →" breakLabel="..."
              pageCount={count} marginPagesDisplayed={2} forcePage={numberPage}
              containerClassName="ap-pagination" pageClassName="ap-page-item" pageLinkClassName="ap-page-link"
              previousClassName="ap-page-item" previousLinkClassName="ap-page-link"
              nextClassName="ap-page-item" nextLinkClassName="ap-page-link"
              breakClassName="ap-page-item" breakLinkClassName="ap-page-link"
              activeClassName="ap-page-active" onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUser;
