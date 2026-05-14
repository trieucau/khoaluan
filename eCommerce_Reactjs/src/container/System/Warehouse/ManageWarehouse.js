import React, { useEffect, useState } from 'react';
import {
  getAllWarehouses,
  createNewWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../../../services/userService';
import { toast } from 'react-toastify';
import { PageHeader, SkeletonRows, EmptyState } from '../AdminShared';

const ManageWarehouse = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phonenumber: '',
    address: '',
    lat: '',
    lng: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllWarehouses();
      if (res?.errCode === 0) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (isEditing = false, item = null) => {
    setIsEdit(isEditing);
    if (isEditing && item) {
      setFormData({
        id: item.id,
        name: item.name,
        phonenumber: item.phonenumber || '',
        address: item.address,
        lat: item.lat,
        lng: item.lng,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        phonenumber: '',
        address: '',
        lat: '',
        lng: '',
      });
    }
    setIsOpenModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.lat || !formData.lng) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }

    try {
      if (isEdit) {
        const res = await updateWarehouse(formData);
        if (res?.errCode === 0) {
          toast.success('Cập nhật kho thành công');
          setIsOpenModal(false);
          fetchData();
        } else {
          toast.error(res?.errMessage || 'Lỗi cập nhật');
        }
      } else {
        const res = await createNewWarehouse(formData);
        if (res?.errCode === 0) {
          toast.success('Thêm kho thành công');
          setIsOpenModal(false);
          fetchData();
        } else {
          toast.error(res?.errMessage || 'Lỗi thêm mới');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) return;
    try {
      const res = await deleteWarehouse(id);
      if (res?.errCode === 0) {
        toast.success('Xóa kho thành công');
        fetchData();
      } else {
        toast.error(res?.errMessage || 'Lỗi xóa kho');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="ap-page">
      <PageHeader
        title={
          <>
            <i className="fa-solid fa-warehouse" style={{ marginRight: 8 }}></i> Quản lý Kho hàng
          </>
        }
        subtitle="Quản lý danh sách các kho hàng phục vụ cho việc lấy hàng"
        actions={
          <button className="ap-btn ap-btn-primary" onClick={() => handleOpenModal(false)}>
            + Thêm kho mới
          </button>
        }
      />

      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên kho</th>
                <th>Số điện thoại</th>
                <th>Địa chỉ</th>
                <th>Tọa độ (Lat/Lng)</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} />
              ) : data.length === 0 ? (
                <EmptyState
                  icon={<i className="fa-solid fa-warehouse" style={{ marginRight: 8 }}></i>}
                  title="Không có dữ liệu kho"
                />
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="ap-row-enter"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td style={{ color: 'var(--ap-text-dim)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.phonenumber}</td>
                    <td
                      style={{
                        maxWidth: '300px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.address}
                    >
                      {item.address}
                    </td>
                    <td>
                      {item.lat}, {item.lng}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="ap-btn ap-btn-ghost ap-btn-sm"
                          onClick={() => handleOpenModal(true, item)}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>Sửa
                        </button>
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
      </div>

      {isOpenModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="ap-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              margin: 0,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              className="ap-card-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span className="ap-card-title">
                {isEdit ? (
                  <>
                    <i className="fa-solid fa-pen-to-square" style={{ marginRight: 8 }}></i>Cập nhật
                    kho hàng
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>Thêm kho hàng mới
                  </>
                )}
              </span>
              <button
                className="ap-btn ap-btn-ghost ap-btn-sm"
                onClick={() => setIsOpenModal(false)}
                style={{ padding: '4px 8px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="ap-card-body">
              <div className="ap-form-row">
                <div className="ap-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="ap-label">
                    Tên kho <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="ap-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập tên kho hàng"
                  />
                </div>
                <div className="ap-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="ap-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="ap-input"
                    name="phonenumber"
                    value={formData.phonenumber}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="ap-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="ap-label">
                    Địa chỉ <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="ap-input"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ đầy đủ"
                  />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">
                    Vĩ độ (Lat) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="ap-input"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="VD: 21.028511"
                  />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">
                    Kinh độ (Lng) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="ap-input"
                    name="lng"
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="VD: 105.804817"
                  />
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                }}
              >
                <button className="ap-btn ap-btn-ghost" onClick={() => setIsOpenModal(false)}>
                  Hủy
                </button>
                <button className="ap-btn ap-btn-primary" onClick={handleSave}>
                  Lưu thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWarehouse;
