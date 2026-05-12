import React, { useEffect, useState } from 'react';
import { deleteSupplierService, getAllSupplier } from '../../../services/userService';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../../utils/constant';
import CommonUtils from '../../../utils/CommonUtils';
import { Link } from 'react-router-dom';
import { SkeletonRows, EmptyState, AdminPagination, SearchBar, PageHeader } from '../AdminShared';

const ManageSupplier = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async (kw = '', offset = 0) => {
    setLoading(true);
    try {
      const res = await getAllSupplier({ limit: PAGINATION.pagerow, offset, keyword: kw });
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

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!window.confirm('Xóa nhà cung cấp này?')) return;
    const res = await deleteSupplierService({ data: { id } });
    if (res?.errCode === 0) {
      toast.success('Xóa thành công');
      fetchData(keyword, page * PAGINATION.pagerow);
    } else toast.error('Xóa thất bại');
  };

  const handleExport = async () => {
    const res = await getAllSupplier({ limit: '', offset: '', keyword: '' });
    if (res?.errCode === 0)
      await CommonUtils.exportExcel(res.data, 'Danh sách NCC', 'ListSupplier');
  };

  return (
    <div className="ap-page">
      <PageHeader
        title={
          <>
            <i className="fa-solid fa-industry" style={{ marginRight: 8 }}></i>Quản lý nhà cung cấp
          </>
        }
        subtitle="Danh sách nhà cung cấp sản phẩm"
        actions={
          <>
            <button className="ap-btn ap-btn-success" onClick={handleExport}>
              <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Xuất Excel
            </button>
            <Link to="/admin/add-supplier" className="ap-btn ap-btn-primary">
              + Thêm NCC
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
          placeholder="Tìm theo tên nhà cung cấp..."
        />
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên NCC</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} />
              ) : data.length === 0 ? (
                <EmptyState
                  icon={
                    <>
                      <i className="fa-solid fa-industry" style={{ marginRight: 8 }}></i>
                    </>
                  }
                  title="Không có nhà cung cấp nào"
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {item.name?.[0]?.toUpperCase() || 'N'}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{item.phonenumber}</td>
                    <td style={{ fontSize: 13, color: 'var(--ap-text-muted)' }}>{item.email}</td>
                    <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>{item.address}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <Link
                          to={`/admin/edit-supplier/${item.id}`}
                          className="ap-btn ap-btn-ghost ap-btn-sm"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>Sửa
                        </Link>
                        <button
                          className="ap-btn ap-btn-danger ap-btn-sm"
                          onClick={(e) => handleDelete(e, item.id)}
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
    </div>
  );
};
export default ManageSupplier;
